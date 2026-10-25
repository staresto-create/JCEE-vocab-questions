/* 「不知道從哪裡開始？」依最近一次英文級分，顯示建議的練習順序（2026-10-25）
   各題庫站共用這一份，四段路線的內容只在這裡寫一次。
   用法：頁面放 <div data-start-here></div>，再載入這支程式（defer）。
   選擇只存在這台裝置的這個瀏覽器（localStorage），不用登入、不上傳；讀不到或寫不進去時，頁面照常運作。
   網址帶 ?start=a、b、c、d 時，直接顯示對應那一段（供老師貼連結給學生），並記住這個選擇。 */
(function () {
  'use strict';
  var KEY = 'scStartTierV1';
  var BASE = 'https://staresto-create.github.io';
  var J = BASE + '/JCEE-vocab-questions/';

  var TIERS = [
    { k: 'a', label: '6 級分以下' },
    { k: 'b', label: '7 到 9 級分' },
    { k: 'c', label: '10 到 12 級分' },
    { k: 'd', label: '13 級分以上' }
  ];

  var ROUTES = {
    a: {
      h: '先把基本的字穩住',
      lead: '基本字會了，詞彙題、克漏字、文意選填都比較容易拿分。',
      items: [
        { t: '單字記憶卡：近十年、字級 1 到 3', u: J + 'cards/#y=106-115&lv=1-3', n: '每一張都是歷屆詞彙題的選項字。' },
        { t: '課本字彙', u: J + 'textbook/longteng.html', n: '龍騰、三民乙版、三民舊版都出現的字，先從這些背起。' },
        { t: '學測單字題目地圖：先看「易」的題', u: J + 'gsat/map/#t=easy', n: '答對率高於 75% 的題，從這裡開始做。' }
      ]
    },
    b: {
      h: '字級 4 加進來，開始練題型',
      lead: '字彙仍是主力，同時開始熟悉克漏字和閱讀測驗的作法。',
      items: [
        { t: '單字記憶卡：近十年、字級 1 到 4', u: J + 'cards/#y=106-115&lv=1-4' },
        { t: '學測克漏字', u: BASE + '/grammar-cloze-test/', n: '先做標為「易」的篇章，每題解析會說明誘答選項為什麼容易選錯。' },
        { t: '貼上文章查單字', u: J + 'cards/mark.html', n: '讀不懂的文章貼進來，看哪些字是第幾級、先查哪些。' }
      ]
    },
    c: {
      h: '補齊 4 到 6 級字，練難一點的題型',
      lead: '基本題型已經穩了，差距多半在高級字和需要讀懂上下文的題目。',
      items: [
        { t: '單字記憶卡：近十年、字級 4 到 6', u: J + 'cards/#y=106-115&lv=4-6' },
        { t: '文意選填', u: BASE + '/passage-completion/', n: '逐格解析會說明線索要往哪裡找。' },
        { t: '篇章結構', u: BASE + '/discourse-structure/', n: '多出來的那個選項，每一題都說明為什麼放不進去。' },
        { t: '學測單字題目地圖：「中」的題', u: J + 'gsat/map/#t=mid', n: '答對率 25% 到 75% 的題，是這一段最該拿下的。' }
      ]
    },
    d: {
      h: '難題、混合題與作文',
      lead: '基本題型不是問題，接下來要處理的是容易失分的細節。',
      items: [
        { t: '學測單字題目地圖：「難」的題', u: J + 'gsat/map/#t=hard', n: '答對率 25% 以下，不少是字詞搭配題。' },
        { t: '混合題', u: BASE + '/mixed-format/', n: '第 47 至 50 題，要自己寫出單字，並改字形。' },
        { t: '一字多義', u: J + 'cards/#deck=po', n: '熟悉的字，考題卻用另一個意思。' },
        { t: '歷屆作文範文', u: BASE + '/essay-prompts/', n: '進階級範文可以拿來對照自己的寫法。' }
      ]
    }
  };

  function load() {
    try { var v = window.localStorage.getItem(KEY); return /^[abcd]$/.test(v) ? v : null; } catch (e) { return null; }
  }
  function save(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }
  function fromUrl() {
    var m = /[?&]start=([abcd])(?:&|#|$)/.exec(window.location.search || '');
    return m ? m[1] : null;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function injectCss() {
    if (document.getElementById('sh-css')) return;
    var s = document.createElement('style');
    s.id = 'sh-css';
    s.textContent =
      '.sh{--sh-bg:#FFFDF7;--sh-bg2:#F6F1E4;--sh-fg:#221F1A;--sh-soft:#5B5648;--sh-rule:#D9D0B8;--sh-red:#9C2C1E;--sh-green:#3E6E52;--sh-sel:#E1EBE0;' +
      'margin:16px 0;border:1.5px solid color-mix(in srgb,var(--sh-green) 55%,transparent);border-radius:12px;background:color-mix(in srgb,var(--sh-green) 11%,var(--sh-bg));color:var(--sh-fg);font-family:"Noto Sans TC",system-ui,sans-serif;font-size:15px;line-height:1.8;text-align:left}' +
      '@media (prefers-color-scheme:dark){.sh{--sh-bg:#26231F;--sh-bg2:#1B1916;--sh-fg:#F2F0EE;--sh-soft:#C2BFBB;--sh-rule:#514A37;--sh-red:#E8BEB9;--sh-green:#CBDDD2;--sh-sel:#33463A}}' +
      '.sh{--sh-band:#3E6E52;overflow:hidden}' +
      '@media (prefers-color-scheme:dark){.sh{--sh-band:#2F5742}}' +
      '.sh>summary{list-style:none;cursor:pointer;padding:14px 16px;font-weight:700;font-size:18px;min-height:44px;background:var(--sh-band);color:#fff}' +
      '.sh>summary::-webkit-details-marker{display:none}' +
      '.sh-tag{display:inline-block;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:#fff;color:#9C2C1E;margin-bottom:4px}' +
      '.sh-main::after{content:" ▾";color:#fff}' +
      '.sh[open] .sh-main::after{content:" ▴"}' +
      '.sh-sub{display:block;font-weight:400;font-size:13.5px;color:rgba(255,255,255,.88)}' +
      '.sh-body{padding:14px 16px 14px}' +
      '.sh-q{margin:0 0 8px;font-size:14px;color:var(--sh-soft)}' +
      '.sh-tiers{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}' +
      '.sh-tiers button{font:inherit;font-size:15px;min-height:44px;padding:8px 6px;border:1px solid var(--sh-rule);border-radius:10px;background:var(--sh-bg2);color:var(--sh-fg);cursor:pointer}' +
      '.sh-tiers button[aria-pressed="true"]{border-color:var(--sh-green);background:var(--sh-sel);font-weight:700}' +
      '.sh-r h3{margin:4px 0 2px;font-size:16px;color:var(--sh-red)}' +
      '.sh-r p{margin:0 0 8px;font-size:14px;color:var(--sh-soft)}' +
      '.sh-r ol{margin:0;padding-left:1.4em}' +
      '.sh-r li{margin:0 0 8px}' +
      '.sh-r a{color:var(--sh-green);font-weight:700}' +
      '.sh-r li span{display:block;font-size:13px;color:var(--sh-soft)}' +
      '.sh-foot{margin:8px 0 0;font-size:12px;color:var(--sh-soft)}';
    document.head.appendChild(s);
  }

  function mount(host) {
    if (!host || host.getAttribute('data-sh-done')) return;
    host.setAttribute('data-sh-done', '1');
    injectCss();

    var urlTier = fromUrl();
    var cur = urlTier || load();
    if (urlTier) save(urlTier);

    var d = el('details', 'sh');
    if (urlTier || (!cur && host.getAttribute('data-open'))) d.open = true;
    var sum = el('summary');
    var tag = el('span', 'sh-tag', '從這裡開始');
    var main = el('span', 'sh-main', '不知道從哪裡開始？');
    var sub = el('span', 'sh-sub');
    var tl = el('div'); tl.appendChild(tag); sum.appendChild(tl); sum.appendChild(main); sum.appendChild(sub);
    d.appendChild(sum);

    var body = el('div', 'sh-body');
    body.appendChild(el('p', 'sh-q', '我最近一次模考或段考，英文大約是'));
    var grid = el('div', 'sh-tiers');
    var route = el('div', 'sh-r');
    route.setAttribute('aria-live', 'polite');
    var btns = {};

    function show(k) {
      TIERS.forEach(function (t) { btns[t.k].setAttribute('aria-pressed', t.k === k ? 'true' : 'false'); });
      var r = ROUTES[k];
      while (route.firstChild) route.removeChild(route.firstChild);
      route.appendChild(el('h3', '', r.h));
      route.appendChild(el('p', '', r.lead));
      var ol = el('ol');
      r.items.forEach(function (it) {
        var li = el('li');
        var a = el('a', '', it.t);
        a.href = it.u;
        li.appendChild(a);
        if (it.n) li.appendChild(el('span', '', it.n));
        ol.appendChild(li);
      });
      route.appendChild(ol);
      var label = TIERS.filter(function (t) { return t.k === k; })[0].label;
      main.textContent = '給 ' + label + ' 的練習順序';
      sub.textContent = '點開看建議的順序，也可以改選其他級分';
    }

    TIERS.forEach(function (t) {
      var b = el('button', '', t.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { save(t.k); show(t.k); });
      btns[t.k] = b;
      grid.appendChild(b);
    });
    body.appendChild(grid);
    body.appendChild(route);
    body.appendChild(el('p', 'sh-foot', '級分只是參考，每一類題型你都可以自己挑著練。這個選擇只留在你這台裝置的瀏覽器裡。'));
    d.appendChild(body);

    if (cur) show(cur); else sub.textContent = '選你最近的英文級分，看建議的練習順序';
    host.appendChild(d);
  }

  function init() {
    var hosts = document.querySelectorAll('[data-start-here]');
    for (var i = 0; i < hosts.length; i++) mount(hosts[i]);
  }
  window.StartHere = { mount: mount, TIERS: TIERS, ROUTES: ROUTES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
