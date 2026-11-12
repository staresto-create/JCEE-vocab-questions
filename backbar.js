/* 頁首導覽列：在頁面最上方放「← 上一頁」和「題庫首頁」兩個連結（2026-11-12）
   為什麼要有：從手機主畫面的圖示開啟時，沒有瀏覽器的上一頁鍵；清單很長的頁面，頁尾的連結又要滑很久才找得到。
   用法：頁面載入這支程式（defer）就好，不用另外寫標記。頁面已有導覽列、或不想要時，在 <body> 加 data-no-backbar。
   「上一頁」只在瀏覽紀錄裡有上一頁的時候才出現；列印時不印。 */
(function () {
  'use strict';
  if (document.body && document.body.hasAttribute('data-no-backbar')) return;
  if (document.querySelector('.pgnav')) return;
  var HOME = 'https://staresto-create.github.io/JCEE-vocab-questions/';
  var st = document.createElement('style');
  st.textContent =
    '.pgnav{display:flex;flex-wrap:wrap;gap:0 1.2rem;align-items:center;margin:0 0 .4rem;font-size:.9rem;line-height:1.4}' +
    '.pgnav a{display:inline-block;padding:.55rem 0;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;border:0;background:none;border-radius:0;font-family:inherit}' +
    '.pgnav a:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '@media print{.pgnav{display:none!important}}';
  document.head.appendChild(st);
  var bar = document.createElement('nav');
  bar.className = 'pgnav';
  bar.setAttribute('aria-label', '頁面導覽');
  var canBack = false;
  try {
    canBack = history.length > 1;
  } catch (e) {}
  if (canBack) {
    var b = document.createElement('a');
    b.href = HOME;
    b.textContent = '← 上一頁';
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      history.back();
    });
    bar.appendChild(b);
  }
  var h = document.createElement('a');
  h.href = HOME;
  h.textContent = '題庫首頁';
  bar.appendChild(h);
  var host = document.querySelector('.wrap') || document.querySelector('main') || document.body;
  if (host === document.body) bar.style.padding = '0 1rem';  /* 沒有 .wrap 的頁面，左右留白，避免貼邊 */
  host.insertBefore(bar, host.firstChild);
  /* 有些頁面（例如題目地圖）會在資料讀進來之後重畫整個 .wrap，導覽列被一起清掉，所以被拿掉時放回去 */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (!bar.isConnected) host.insertBefore(bar, host.firstChild);
    }).observe(host, { childList: true });
  }
})();
