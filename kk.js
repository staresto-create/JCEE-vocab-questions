/* 各頁共用的音標（KK）。資料在同一資料夾的 kk_data.json，頁面只要載入本檔：
 *   KK.ready      讀完資料才會完成的 Promise（讀不到也會完成，只是沒有音標）
 *   KK.html(字)   回傳音標的 HTML 字串，查不到回傳空字串
 *   KK.el(字)     回傳音標的元素，查不到回傳 null
 * 名詞與動詞唸法不同的字，兩種都會列出，前面標詞性。
 */
(function () {
  'use strict';
  var cs = document.currentScript;
  var url = new URL('kk_data.json', cs ? cs.src : location.href).href;
  var MAP = {};

  var st = document.createElement('style');
  st.setAttribute('data-kk', '1');
  st.textContent = '.kkp{font-family:"IBM Plex Mono","Noto Sans TC",monospace;font-size:.8rem;color:var(--ink-soft,#6b6256);margin-left:.5rem}' +
    '.kkp i{font-style:normal;margin-left:.4rem}.kkp i:first-child{margin-left:0}';
  (document.head || document.documentElement).appendChild(st);

  var AB = { '名詞': 'n.', '動詞': 'v.', '形容詞': 'adj.' };
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inner(raw) {
    if (raw.indexOf('　') < 0) return '[' + esc(raw) + ']';
    return raw.split('　').map(function (x) {
      var m = /^（(.+?)）(.+)$/.exec(x);
      return '<i>' + (m ? (AB[m[1]] || esc(m[1])) + ' [' + esc(m[2]) + ']' : '[' + esc(x) + ']') + '</i>';
    }).join('');
  }
  function html(word) {
    var raw = MAP[String(word == null ? '' : word).trim().toLowerCase()];
    return raw ? '<span class="kkp">' + inner(raw) + '</span>' : '';
  }
  function el(word) {
    var h = html(word);
    if (!h) return null;
    var t = document.createElement('span');
    t.innerHTML = h;
    return t.firstChild;
  }

  var ready = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { MAP = d.kk || {}; }, function () {});

  window.KK = { ready: ready, html: html, el: el };
})();
