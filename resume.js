/* 接續上次看到的地方（2026-10-23）
   各題庫站共用這一份。只用 localStorage，資料只留在這台裝置的這個瀏覽器，不用登入、不上傳。
   讀不到或寫不進去（無痕視窗、瀏覽器擋掉儲存）時，所有函式都安靜地什麼也不做，頁面照常運作。
   儲存格式：鍵 scResumeV1 → {"v":1,"s":{"<站代號>":{"l":"100 年第 16 題","h":"#set-G100_16_1","t":毫秒時間}}}
   網址一律由下面 SITES 的路徑加上存下的 hash 組成，不使用儲存內容裡的任何路徑。 */
(function () {
  'use strict';
  var KEY = 'scResumeV1';
  var SITES = {
    'gsat-cloze':      { name: '學測克漏字', path: '/grammar-cloze-test/' },
    'zhikao-cloze':    { name: '指考克漏字', path: '/zhikao-cloze-test/' },
    'passage':         { name: '文意選填',   path: '/passage-completion/' },
    'discourse':       { name: '篇章結構',   path: '/discourse-structure/' },
    'reading':         { name: '閱讀測驗',   path: '/reading-comprehension/' },
    'mixed':           { name: '混合題',     path: '/mixed-format/' },
    'essay':           { name: '作文',       path: '/essay-prompts/' },
    'vocab-gsat':      { name: '學測詞彙',   path: '/JCEE-vocab-questions/gsat/' },
    'vocab-zhikao':    { name: '指考詞彙',   path: '/JCEE-vocab-questions/zhikao/' },
    'vocab-translate': { name: '中譯英',     path: '/JCEE-vocab-questions/translate/' }
  };
  var MAX_OTHERS = 2;

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : null;
      if (o && o.v === 1 && o.s && typeof o.s === 'object') return o;
    } catch (e) {}
    return { v: 1, s: {} };
  }
  function store(o) {
    try { window.localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
  }
  function okHash(h) { return typeof h === 'string' && h.length < 400 && (h === '' || h.charAt(0) === '#'); }

  function save(site, label, hash) {
    try {
      if (!SITES[site] || typeof label !== 'string' || !label || label.length > 80 || !okHash(hash)) return;
      var o = load(), cur = o.s[site];
      if (cur && cur.l === label && cur.h === hash) {
        /* 同一處：一小時內不重寫，避免頻繁寫入；超過才更新時間 */
        if (Date.now() - cur.t < 3600000) return;
      }
      o.s[site] = { l: label, h: hash, t: Date.now() };
      store(o);
    } catch (e) {}
  }

  function entries() {
    var o = load(), out = [];
    Object.keys(SITES).forEach(function (k) {
      var e = o.s[k];
      if (!e || typeof e.l !== 'string' || !e.l || !okHash(e.h) || typeof e.t !== 'number') return;
      out.push({ key: k, name: SITES[k].name, path: SITES[k].path, label: e.l, hash: e.h, t: e.t });
    });
    out.sort(function (a, b) { return b.t - a.t; });
    return out;
  }

  function clear(site) {
    try {
      var o = load();
      if (site) delete o.s[site]; else o.s = {};
      store(o);
    } catch (e) {}
  }

  function ago(t) {
    var d = Math.floor((Date.now() - t) / 86400000);
    if (d <= 0) return '今天';
    if (d === 1) return '昨天';
    if (d < 30) return d + ' 天前';
    return '一個月以前';
  }

  /* 站內同一頁（例如已在該站首頁）時，只改 hash 不會重跑各站的啟動程式，所以改 hash 後重新載入 */
  function go(e, ent) {
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1)) return;
    var p = location.pathname.replace(/index\.html$/, '');
    if (p === ent.path) {
      e.preventDefault();
      try { location.hash = ent.hash; location.reload(); } catch (x) { location.href = ent.path + ent.hash; }
    }
  }

  function css() {
    if (document.getElementById('scr-style')) return;
    var s = document.createElement('style');
    s.id = 'scr-style';
    s.textContent =
      '.scr-card,.scr-strip{box-sizing:border-box;font-family:inherit;line-height:1.5;color:#221F1A;background:#FFF3D1;border:1px solid #A9812E;border-left-width:6px;border-radius:6px;margin:0 0 14px;padding:12px 14px;}' +
      '.scr-card *,.scr-strip *{box-sizing:border-box;}' +
      '.scr-eyebrow{font-size:12px;letter-spacing:.08em;font-weight:700;color:#7A5A12;margin:0 0 4px;}' +
      '.scr-main{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;}' +
      '.scr-title{flex:1 1 12em;min-width:0;font-size:17px;line-height:1.45;font-weight:700;margin:0;word-break:break-word;}' +
      '.scr-title small{display:block;font-size:12px;font-weight:400;color:#5B5648;margin-top:2px;}' +
      '.scr-go{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 22px;border-radius:22px;background:#AE3626;color:#fff !important;text-decoration:none !important;font-weight:700;font-size:15px;white-space:nowrap;}' +
      '.scr-go:hover{background:#8F2A1D;}' +
      '.scr-clear{appearance:none;background:none;border:0;padding:6px 4px;margin:0;font:inherit;font-size:12px;color:#5B5648;text-decoration:underline;cursor:pointer;min-height:32px;}' +
      '.scr-note{font-size:12px;line-height:1.6;color:#5B5648;margin:6px 0 0;}' +
      '.scr-others{margin:8px 0 0;padding:6px 0 0;border-top:1px dashed #C9A85A;font-size:12.5px;color:#5B5648;}' +
      '.scr-others a{display:inline-block;margin:4px 6px 0 0;padding:2px 9px;font-size:12.5px;border:1px solid #A9812E;border-radius:14px;color:#221F1A !important;text-decoration:none !important;background:rgba(255,255,255,.55);}' +
      '.scr-strip{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;padding:8px 12px;font-size:14px;}' +
      '.scr-strip .scr-lab{font-weight:700;color:#7A5A12;}' +
      '.scr-strip a.scr-link{color:#8F2A1D !important;font-weight:700;text-decoration:underline;min-height:32px;display:inline-flex;align-items:center;}' +
      '.scr-strip .scr-clear{margin-left:auto;}' +
      '@media (prefers-color-scheme: dark){' +
      '.scr-card,.scr-strip{color:#F2EEE4;background:#2E2A1E;border-color:#B8913A;}' +
      '.scr-eyebrow,.scr-strip .scr-lab{color:#E6CB8A;}' +
      '.scr-title small,.scr-note,.scr-others,.scr-clear{color:#CFC8B8;}' +
      '.scr-go{background:#B8402F;color:#fff !important;}.scr-go:hover{background:#CC4C3A;}' +
      '.scr-others{border-top-color:#6B5A2E;}' +
      '.scr-others a{color:#F2EEE4 !important;background:rgba(255,255,255,.08);border-color:#8C7230;}' +
      '.scr-strip a.scr-link{color:#F0B7AA !important;}' +
      '}' +
      '@media print{.scr-card,.scr-strip{display:none !important;}}';
    (document.head || document.documentElement).appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* 各題庫站首頁：一條細長的「接續上次」。沒有紀錄就不放任何東西。 */
  function mountStrip(host, site) {
    try {
      if (!host || !SITES[site]) return;
      css();
      var old = host.querySelector('.scr-strip'); if (old) old.remove();
      var e = entries().filter(function (x) { return x.key === site; })[0];
      if (!e) return;
      var box = el('div', 'scr-strip');
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', '接續上次看到的地方');
      box.appendChild(el('span', 'scr-lab', '接續上次'));
      var a = el('a', 'scr-link', e.label + ' →');
      a.href = e.path + e.hash;
      a.addEventListener('click', function (ev) { go(ev, e); });
      box.appendChild(a);
      var b = el('button', 'scr-clear', '清除');
      b.type = 'button';
      b.setAttribute('aria-label', '清除這一站的接續紀錄');
      b.addEventListener('click', function () { clear(site); box.remove(); });
      box.appendChild(b);
      host.insertBefore(box, host.firstChild);
    } catch (x) {}
  }

  /* 總站首頁最上面：醒目的大卡片。沒有紀錄就不放。 */
  function mountHome(host) {
    try {
      if (!host) return;
      css();
      var old = host.querySelector('.scr-card'); if (old) old.remove();
      var list = entries();
      if (!list.length) return;
      var e = list[0], rest = list.slice(1, 1 + MAX_OTHERS);
      var box = el('section', 'scr-card');
      box.setAttribute('aria-label', '接續上次看到的地方');
      box.appendChild(el('p', 'scr-eyebrow', '接續上次看到的地方'));
      var main = el('div', 'scr-main');
      var t = el('p', 'scr-title', e.name + '　' + e.label);
      t.appendChild(el('small', null, '上次看是' + ago(e.t)));
      main.appendChild(t);
      var a = el('a', 'scr-go', '繼續 →');
      a.href = e.path + e.hash;
      a.addEventListener('click', function (ev) { go(ev, e); });
      main.appendChild(a);
      box.appendChild(main);
      if (rest.length) {
        var o = el('div', 'scr-others');
        o.appendChild(document.createTextNode('其他題庫：'));
        rest.forEach(function (r) {
          var l = el('a', null, r.name + '　' + r.label);
          l.href = r.path + r.hash;
          l.addEventListener('click', function (ev) { go(ev, r); });
          o.appendChild(l);
        });
        box.appendChild(o);
      }
      var n = el('p', 'scr-note', '不用登入，只記在這台裝置的這個瀏覽器。');
      var c = el('button', 'scr-clear', '清除紀錄');
      c.type = 'button';
      c.setAttribute('aria-label', '清除所有題庫的接續紀錄');
      c.addEventListener('click', function () { clear(); box.remove(); });
      n.appendChild(document.createTextNode('　'));
      n.appendChild(c);
      box.appendChild(n);
      host.insertBefore(box, host.firstChild);
    } catch (x) {}
  }

  window.SCResume = { save: save, entries: entries, clear: clear, mountStrip: mountStrip, mountHome: mountHome, sites: SITES };
})();
