/* 全站共用：單字匯出（複製到 Quizlet、下載 Anki 匯入檔）。
 * 格式與單字總表相同：一個字一行，字和背面用 Tab 分開；背面是「[音標] 詞性 中文」。
 * 音標用全站 kk.js（沒有音標的字就不放，不會出現空的中括號）；沒有中文意思的字不放，並說明略過幾個。
 *
 * 用法一（程式自己算清單）：
 *   <div id="box"></div>
 *   VE.mount(document.getElementById('box'), function(){ return [{w:'memory', d:'n. 記憶'}, …]; }, {scope:'目前列出的全部字', file:'vocab'});
 * 用法二（清單就在頁面上）：在外層放 data-ve-root，每個字放 data-ve-w（單字）、data-ve-d（詞性加中文），
 *   再把 VE.bar({scope:'…'}) 回傳的 HTML 放進同一個外層，不必再綁事件。
 * VE.line(字, 詞性加中文, 是否附音標) 回傳一行文字，給自己有匯出介面的頁面（例如單字總表）用。
 */
(function () {
  'use strict';
  if (window.VE) return;
  /* 說明頁與本檔放在同一層；用本檔自己的網址推出來，各層資料夾的頁面都能連到 */
  var HELP = (function () { var c = document.currentScript; var u = c && c.src ? c.src.slice(0, c.src.lastIndexOf('/') + 1) : ''; return u ? u + 'quizlet-anki.html' : ''; })();

  var CSS = '.veBar{margin:.8rem 0;padding:.6rem .8rem;border:1px solid rgba(128,128,128,.35);border-radius:.4rem;font-size:.92rem;line-height:1.7}' +
    '.veBar .veT{font-weight:700;margin:0 0 .3rem}' +
    '.veRow{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;margin:.3rem 0}' +
    '.veB{font:inherit;font-size:.92rem;min-height:44px;padding:0 .9rem;border:1.5px solid currentColor;border-radius:4px;background:transparent;color:inherit;cursor:pointer}' +
    '.veB:disabled{opacity:.45;cursor:default}' +
    '.veCk{display:inline-flex;align-items:center;gap:.35rem;cursor:pointer;min-height:44px}' +
    '.veMsg{margin:.2rem 0 0;font-size:.88rem;opacity:.85}' +
    '.veHow{margin-top:.4rem;font-size:.88rem}.veHow summary{cursor:pointer}.veHow ul{margin:.3rem 0 0;padding-left:1.2rem}.veHow li{margin:.25rem 0}' +
    '.veBox{width:100%;min-height:6rem;font:inherit;font-size:.85rem;margin-top:.4rem}' +
    '@media print{.veBar{display:none!important}}';

  function addCss() {
    if (document.getElementById('ve-css')) return;
    var s = document.createElement('style');
    s.id = 've-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function clean(s) { return String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim(); }
  function N(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* 音標：名詞與動詞唸法不同的字，兩種都放，前面標詞性 */
  function kkText(w) {
    if (!window.KK || !KK.parts) return '';
    var p = KK.parts(w);
    if (!p || !p.length) return '';
    return p.map(function (x) { return (x.lab ? x.lab + ' ' : '') + '[' + x.kk + ']'; }).join(' ');
  }

  function line(w, d, withKk) {
    var k = withKk ? kkText(w) : '';
    return clean(w) + '\t' + (k ? k + ' ' : '') + clean(d);
  }

  /* 站上的釋義有時寫成「握在一起→包含」，卡片背面只要詞性加最後的意思 */
  function plain(g) { return String(g == null ? '' : g).replace(/(^|；)\s*((?:[a-z]+\.(?:\/[a-z]+\.)*\s*)?)[^；→]*→/g, '$1$2'); }

  /* 一字多義的寫法「book（名詞）書；book（動詞）預訂」，卡片背面改成「n. 書；v. 預訂」 */
  function pol(g) {
    var T = { '名詞': 'n.', '動詞': 'v.', '形容詞': 'adj.', '副詞': 'adv.' };
    return String(g == null ? '' : g).replace(/[A-Za-z][A-Za-z' -]*（(名詞|動詞|形容詞|副詞)）/g, function (m, p) { return T[p] + ' '; }).replace(/\s+/g, ' ').trim();
  }

  /* 大考中心詞彙表的字沒有自己的中文欄，中文取自單字總表用的字表（wordlevel-data.js，約 0.9 MB，用到才載入）。
   * 回傳 Promise，內容是一個函式：給它一個詞條（可能是 arrange(ment)、waiter/waitress 這種合併寫法），
   * 回傳 [{w, d}]，每個寫法各一筆；查不到中文的寫法不放。載入失敗時回傳 null。 */
  function zhLoader(base) {
    return new Promise(function (ok) {
      function make() {
        var Z = Object.assign({}, window.WL.zc || {}, window.WL.z || {});
        function has(k) { return Object.prototype.hasOwnProperty.call(Z, k); }
        return function (head) {
          var cands = [];
          String(head).split('/').forEach(function (part) {
            var m = /^(.+?)\((.+)\)$/.exec(part.trim());
            if (m) cands.push(m[1], m[1] + m[2], m[2]); else cands.push(part.trim());
          });
          var out = [], seen = {};
          cands.forEach(function (w) {
            var k = w.toLowerCase().replace(/[’‘]/g, "'");
            if (!w || seen[k] || !has(k)) return;
            seen[k] = 1;
            var z = Z[k];
            out.push({ w: w, d: (z[0] ? z[0] + ' ' : '') + z[1] });
          });
          return out;
        };
      }
      if (window.WL && window.WL.zc) { ok(make()); return; }
      var s = document.createElement('script');
      s.src = (base || '') + 'wordlevel-data.js';
      s.onload = function () { ok(window.WL ? make() : null); };
      s.onerror = function () { ok(null); };
      document.head.appendChild(s);
    });
  }

  function kkPref() { try { return localStorage.getItem('ve_kk') !== '0'; } catch (e) { return true; } }
  function setKkPref(on) { try { localStorage.setItem('ve_kk', on ? '1' : '0'); } catch (e) {} }

  function bar(opt) {
    opt = opt || {};
    var helpUrl = opt.help === undefined ? HELP : opt.help;
    var scope = opt.scope ? '匯出的是' + opt.scope + '。' : '';
    var help = helpUrl ? '<li>第一次用？請看 <a href="' + helpUrl + '">Quizlet、Anki 的使用說明</a>。</li>' : '';
    return '<div class="veBar" data-ve data-ve-file="' + (opt.file || 'vocab') + '">' +
      '<p class="veT">複製到 Quizlet、Anki 背單字</p>' +
      '<div class="veRow">' +
      '<button type="button" class="veB" data-ve-do="copy">複製（貼到 Quizlet）</button>' +
      '<button type="button" class="veB" data-ve-do="anki">下載 Anki 匯入檔</button>' +
      '<label class="veCk"><input type="checkbox" data-ve-kk' + (kkPref() ? ' checked' : '') + '> 附音標</label>' +
      '</div>' +
      '<p class="veMsg" data-ve-msg aria-live="polite"></p>' +
      '<textarea class="veBox" data-ve-box hidden readonly aria-label="已選好的單字清單，請複製"></textarea>' +
      '<details class="veHow"><summary>匯入 Quizlet、Anki 的方法</summary><ul>' +
      '<li><b>Quizlet</b>（要用網頁版，電腦或手機的瀏覽器都可以）：按「複製」，到 Quizlet 網站建立學習集，按「Import」，把內容貼進去。每個字一行，英文和後面的音標、詞性、中文之間用 Tab 分開。</li>' +
      '<li><b>Anki</b>：按「下載 Anki 匯入檔」，在電腦版 Anki 選匯入，選這個 .txt 檔。</li>' +
      '<li>' + scope + '沒有中文意思的字不會放進去。字太多時，先縮小範圍再匯出。</li>' + help +
      '</ul></details></div>';
  }

  function itemsFromDom(root) {
    var out = [];
    [].forEach.call(root.querySelectorAll('[data-ve-w]'), function (el) {
      out.push({ w: el.getAttribute('data-ve-w'), d: el.getAttribute('data-ve-d') || '' });
    });
    return out;
  }

  function download(name, text) {
    var b = new Blob([text], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function build(items, withKk) {
    var seen = {}, rows = [], skip = 0;
    items.forEach(function (it) {
      /* 拼字提醒（例如「（-y 接 -ial 時要變 -i）」）是給頁面上看的，放在卡片背面反而干擾，匯出時拿掉 */
      var w = clean(it.w), d = clean(String(it.d == null ? '' : it.d).replace(/（-[a-z]+\s?接[^）]*）/g, '')), key = w.toLowerCase();
      if (!w || seen[key]) return;
      seen[key] = 1;
      if (!d) { skip++; return; }
      rows.push(line(w, d, withKk));
    });
    return { rows: rows, skip: skip };
  }

  function act(bar_, what) {
    var msg = bar_.querySelector('[data-ve-msg]');
    var box = bar_.querySelector('[data-ve-box]');
    var withKk = bar_.querySelector('[data-ve-kk]').checked;
    function say(t) { msg.textContent = t; }
    var go = function () {
      var items;
      if (bar_.__veGet) items = bar_.__veGet();
      else { var root = bar_.closest('[data-ve-root]'); items = root ? itemsFromDom(root) : []; }
      var r = build(items, withKk);
      if (!r.rows.length) { say('目前沒有可匯出的字。'); return; }
      var tail = r.skip ? '（另有 ' + N(r.skip) + ' 字沒有中文意思，沒有放進去）' : '';
      var text = r.rows.join('\n');
      if (what === 'anki') {
        download((bar_.getAttribute('data-ve-file') || 'vocab') + '_anki.txt', '#separator:Tab\n#html:false\n' + text + '\n');
        say('已下載 ' + N(r.rows.length) + ' 字的 Anki 匯入檔' + tail + '。如果沒有跳出下載，請改用「複製」，或用 Safari、Chrome 開啟這一頁。');
        return;
      }
      function fb() {
        box.hidden = false; box.value = text; box.focus(); box.select();
        try {
          box.setSelectionRange(0, box.value.length);
          if (document.execCommand && document.execCommand('copy')) { say('已複製 ' + N(r.rows.length) + ' 字，請到 Quizlet 的匯入欄貼上。' + tail); return; }
        } catch (e) {}
        say('這個瀏覽器不能自動複製，內容已全部選取，請直接按手機或電腦的「複製」。' + tail);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('已複製 ' + N(r.rows.length) + ' 字，請到 Quizlet 的匯入欄貼上。' + tail); box.hidden = true; }, fb);
      } else fb();
    };
    if (window.KK && KK.ready) KK.ready.then(go, go); else go();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ve-do]');
    if (!b) return;
    var bar_ = b.closest('[data-ve]');
    if (bar_) act(bar_, b.getAttribute('data-ve-do'));
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ve-kk')) setKkPref(e.target.checked);
  });

  function mount(el, getItems, opt) {
    addCss();
    el.innerHTML = bar(opt);
    el.querySelector('[data-ve]').__veGet = getItems;
  }

  addCss();
  window.VE = { bar: bar, mount: mount, line: line, plain: plain, pol: pol, zhLoader: zhLoader, kkText: kkText, kkPref: kkPref, setKkPref: setKkPref };
})();
