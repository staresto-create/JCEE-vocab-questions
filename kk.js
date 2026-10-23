/* 各頁共用的音標（KK）。資料在同一資料夾的 kk_data.json，頁面只要載入本檔：
 *   KK.ready      讀完資料才會完成的 Promise（讀不到也會完成，只是沒有音標）
 *   KK.html(字)   回傳音標的 HTML 字串，查不到回傳空字串
 *   KK.el(字)     回傳音標的元素，查不到回傳 null
 *   KK.raw(字)    回傳音標的原始字串（兩種唸法用全形空白隔開），查不到回傳空字串
 *   KK.parts(字)  回傳 [{lab:'n.', kk:'音標'}, …]；只有一種唸法時 lab 為空字串，查不到回傳空陣列
 *                 （頁面要自己排版時用，例如字尾表要把字尾的音標加粗）
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
    '.kkp i{font-style:normal;margin-left:.4rem;white-space:nowrap;display:inline-block}.kkp i:first-child{margin-left:0}';
  (document.head || document.documentElement).appendChild(st);

  var AB = { '名詞': 'n.', '動詞': 'v.', '形容詞': 'adj.', '副詞': 'adv.' };
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inner(raw) {
    if (raw.indexOf('　') < 0) return '[' + esc(raw) + ']';
    return raw.split('　').map(function (x) {
      var m = /^（(.+?)）(.+)$/.exec(x);
      return '<i>' + (m ? m[1].split('、').map(function (z) { return AB[z] || esc(z); }).join('/') + ' [' + esc(m[2]) + ']' : '[' + esc(x) + ']') + '</i>';
    }).join('');
  }
  function parts(word) {
    var r = raw(word);
    if (!r) return [];
    return r.split('　').map(function (x) {
      var m = r.indexOf('　') >= 0 && /^（(.+?)）(.+)$/.exec(x);
      return m ? { lab: m[1].split('、').map(function (z) { return AB[z] || esc(z); }).join('/'), kk: m[2] } : { lab: '', kk: x };
    });
  }
  function html(word) {
    var raw = MAP[String(word == null ? '' : word).trim().toLowerCase()];
    return raw ? '<span class="kkp">' + inner(raw) + '</span>' : '';
  }
  function raw(word) {
    return MAP[String(word == null ? '' : word).trim().toLowerCase()] || '';
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

  window.KK = { ready: ready, html: html, el: el, raw: raw, parts: parts };
})();
