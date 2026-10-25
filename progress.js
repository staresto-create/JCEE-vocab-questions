/* 完成度：記下學生在這台裝置上做過哪些題目（2026-10-25 樣本，先用在學測單字站）
   各題庫站共用這一份。只用 localStorage，資料只留在這台裝置的這個瀏覽器，不用登入、不上傳。
   讀不到或寫不進去（無痕視窗、瀏覽器擋掉儲存）時，所有函式都安靜地什麼也不做，頁面照常運作。
   儲存格式：鍵 scProgressV1 → {"v":1,"s":{"<站代號>":["V0001","V0002",...]}}
   「做過」的算法：作答（選了答案）就算一次，答對答錯都算，同一題只算一次。
   站代號沿用 resume.js 的 SITES（例如 vocab-gsat），這支程式不另存路徑。 */
(function () {
  'use strict';
  var KEY = 'scProgressV1';
  var MAX_IDS = 5000;

  function okSite(s) { return typeof s === 'string' && /^[a-z0-9-]{1,30}$/.test(s); }
  function okId(s) { return typeof s === 'string' && /^[A-Za-z0-9_.㐀-鿿-]{1,40}$/.test(s); }

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

  /* 記下一題。回傳 true 表示這一題是第一次做。 */
  function mark(site, id) {
    try {
      if (!okSite(site) || !okId(id)) return false;
      var o = load();
      var a = Array.isArray(o.s[site]) ? o.s[site] : [];
      if (a.indexOf(id) >= 0) return false;
      if (a.length >= MAX_IDS) return false;
      a.push(id);
      o.s[site] = a;
      return store(o);
    } catch (e) { return false; }
  }

  /* 一次記下多題（整篇型交卷用）。回傳這次新增了幾題。 */
  function markMany(site, ids) {
    try {
      if (!okSite(site) || !ids || !ids.length) return 0;
      var o = load();
      var a = Array.isArray(o.s[site]) ? o.s[site] : [];
      var seen = {}, added = 0;
      a.forEach(function (x) { seen[x] = 1; });
      ids.forEach(function (id) {
        if (okId(id) && !seen[id] && a.length < MAX_IDS) { seen[id] = 1; a.push(id); added++; }
      });
      if (added) { o.s[site] = a; store(o); }
      return added;
    } catch (e) { return 0; }
  }

  /* 做過的題目編號，回傳 {編號:1} 的物件，方便比對 */
  function doneMap(site) {
    var m = {};
    try {
      if (!okSite(site)) return m;
      var a = load().s[site];
      if (Array.isArray(a)) a.forEach(function (id) { if (okId(id)) m[id] = 1; });
    } catch (e) {}
    return m;
  }

  /* 目前題庫裡的這幾題之中，做過幾題（題庫改版後不存在的舊編號不算） */
  function countIn(site, ids) {
    var m = doneMap(site), n = 0;
    (ids || []).forEach(function (id) { if (m[id]) n++; });
    return n;
  }

  function clear(site) {
    try {
      var o = load();
      if (site) delete o.s[site]; else o.s = {};
      store(o);
    } catch (e) {}
  }

  function css() {
    if (document.getElementById('scp-style')) return;
    var s = document.createElement('style');
    s.id = 'scp-style';
    s.textContent =
      '.scp-card{box-sizing:border-box;font-family:inherit;line-height:1.6;color:var(--ink,#221F1A);background:var(--tint-sage,#F2F7F1);' +
      'border:1px solid var(--rule,#DCD3BB);border-left:4px solid var(--sage,#3E6E52);border-radius:4px;margin:14px 0 4px;padding:12px 14px;}' +
      '.scp-top{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 12px;}' +
      '.scp-lab{font-family:"IBM Plex Mono","Noto Sans TC",monospace;font-size:11px;letter-spacing:.12em;color:var(--sage,#3E6E52);font-weight:600;}' +
      '.scp-num{font-family:"Noto Serif TC",serif;font-weight:700;font-size:17px;}' +
      '.scp-num small{font-family:"Noto Sans TC",sans-serif;font-weight:400;font-size:13px;color:var(--ink-soft,#5B5648);margin-left:6px;}' +
      '.scp-track{height:10px;background:var(--rule,#DCD3BB);border-radius:5px;overflow:hidden;margin:8px 0 6px;}' +
      '.scp-fill{height:100%;background:var(--sage,#3E6E52);border-radius:5px;}' +
      '.scp-note{font-size:12px;line-height:1.7;color:var(--ink-soft,#5B5648);margin:0;}' +
      '.scp-clear{appearance:none;display:block;background:none;border:0;padding:6px 0;margin:2px 0 0;font:inherit;font-size:12px;color:var(--ink-soft,#5B5648);text-decoration:underline;cursor:pointer;min-height:32px;}' +
      '@media print{.scp-card{display:none !important;}}';
    (document.head || document.documentElement).appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function pctText(n, total) {
    if (!total) return '0%';
    if (n <= 0) return '0%';
    if (n >= total) return '100%';
    var p = Math.floor(n / total * 100);
    return p < 1 ? '不到 1%' : p + '%';
  }

  /* 在 host 裡畫出進度列。allIds 是目前題庫全部題目的編號。沒有 host 或沒有題目就不放任何東西。 */
  function mountBar(host, site, allIds) {
    try {
      if (!host || !okSite(site) || !allIds || !allIds.length) return;
      css();
      host.textContent = '';
      var total = allIds.length, n = countIn(site, allIds);
      var box = el('div', 'scp-card');
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', '你的練習進度');
      var top = el('div', 'scp-top');
      top.appendChild(el('span', 'scp-lab', '你的進度'));
      var num = el('span', 'scp-num', '已做 ' + n + '／' + total + ' 題');
      num.appendChild(el('small', null, pctText(n, total)));
      top.appendChild(num);
      box.appendChild(top);
      var track = el('div', 'scp-track');
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', String(total));
      track.setAttribute('aria-valuenow', String(n));
      track.setAttribute('aria-label', '已做 ' + n + ' 題，共 ' + total + ' 題');
      var fill = el('div', 'scp-fill');
      fill.style.width = (n > 0 ? Math.max(1.5, n / total * 100) : 0) + '%';
      track.appendChild(fill);
      box.appendChild(track);
      var note = el('p', 'scp-note',
        (n === 0 ? '寫完一題，這裡就會開始計算。' : '') +
        '每題只算一次，答錯也算做過。不用登入，紀錄只存在這台裝置的這個瀏覽器；換裝置或用無痕視窗，就會從零開始。');
      if (n > 0) {
        var b = el('button', 'scp-clear', '清除進度');
        b.type = 'button';
        b.setAttribute('aria-label', '清除這個題庫的進度紀錄');
        b.addEventListener('click', function () {
          try {
            if (window.confirm('確定要清除這個題庫的進度嗎？此動作無法復原（錯題本不會被清除）。')) {
              clear(site);
              mountBar(host, site, allIds);
            }
          } catch (e) {}
        });
        note.appendChild(b);
      }
      box.appendChild(note);
      host.appendChild(box);
    } catch (x) {}
  }

  window.SCProgress = { mark: mark, markMany: markMany, doneMap: doneMap, countIn: countIn, clear: clear, mountBar: mountBar };
})();
