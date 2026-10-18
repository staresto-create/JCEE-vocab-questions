/* 全站共用的「聽發音」喇叭。
 * 用法：頁面 <head> 內先載入本檔，再用 SPK.html(單字) 取得按鈕的 HTML 字串，
 * 或用 SPK.el(單字) 取得按鈕元素；回傳空字串／null 代表這個字不放喇叭。
 * 發音由瀏覽器內建語音負責；裝置沒有英文語音時，喇叭整個隱藏。
 * 不放喇叭的字集中寫在下面的 NOSPK，只改這一個檔案，全站同步。
 */
(function () {
  'use strict';

  /* 不放喇叭的字：瀏覽器語音只唸單字本身，無法指定詞性或意思，
   * 這些字會因詞性或意思不同而唸法不同，放了可能唸成學生不要的那個。 */
  var NOSPK = [
    /* 名詞與動詞（或形容詞）唸法不同 */
    "abuse", "addict", "address", "advocate", "affiliate", "appropriate", "associate", "attribute",
    "combine", "complement", "complex", "compliment", "conduct", "conflict", "console", "content",
    "contest", "contract", "contrast", "converse", "convict", "decrease", "defect", "delegate",
    "desert", "digest", "discount", "document", "elaborate", "excuse", "experiment", "exploit",
    "export", "extract", "impact", "implement", "import", "incline", "increase", "insult", "object",
    "outright", "overflow", "overlap", "perfect", "precedent", "present", "produce", "progress",
    "project", "protest", "rebel", "record", "refund", "refuse", "reject", "research", "resume",
    "subject", "supplement", "survey", "suspect", "torment", "transfer", "transplant", "transport",
    "ally",
    /* 同拼法、因詞性或意思而有不同唸法（2026-10-18 逐字對照 Merriam-Webster 查證） */
    "abstract", "accent", "alternate", "approximate", "arithmetic", "bass", "bow", "buffet",
    "close", "combat", "compact", "compound", "concert", "concrete", "construct", "contrary",
    "convert", "coordinate", "deliberate", "discard", "dove", "entrance", "escort", "estimate",
    "frequent", "graduate", "house", "insert", "intimate", "invite", "lead", "learned", "live",
    "lower", "minute", "moderate", "ornament", "permit", "polish", "read", "row", "sake",
    "segment", "separate", "sow", "tear", "update", "upset", "use", "used", "wind", "wound"
  ];

  var NO = {};
  NOSPK.forEach(function (w) { NO[w] = 1; });

  var SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';

  /* 這個字能不能放喇叭：只收英文字母、空格、連字號、撇號；
   * 名單裡的字連同它的複數（-s、-es）、複合字的每一段也一併排除 */
  function ok(word) {
    var w = String(word == null ? '' : word).trim().toLowerCase();
    if (!w || w.length > 40 || !/^[a-z][a-z' -]*$/.test(w)) return false;
    if (NO[w]) return false;
    var parts = w.split(/[ -]/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (NO[p]) return false;
      if (p.length > 2 && p.slice(-1) === 's' && NO[p.slice(0, -1)]) return false;
      if (p.length > 3 && p.slice(-2) === 'es' && NO[p.slice(0, -2)]) return false;
    }
    return true;
  }

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function html(word) {
    if (!ok(word)) return '';
    var w = esc(String(word).trim());
    return '<button class="spk" type="button" data-w="' + w + '" aria-label="聽 ' + w + ' 的發音" title="聽發音">' + SVG + '</button>';
  }

  function el(word) {
    if (!ok(word)) return null;
    var b = document.createElement('button');
    b.className = 'spk'; b.type = 'button';
    b.setAttribute('data-w', String(word).trim());
    b.setAttribute('aria-label', '聽 ' + word + ' 的發音');
    b.title = '聽發音';
    b.innerHTML = SVG;
    return b;
  }

  /* 樣式：顏色沿用各頁自己的色票變數，沒有就用備用色 */
  var css = '.spk{display:none;font:inherit;vertical-align:middle;align-self:center;margin-left:.45rem;padding:.12rem .38rem;line-height:1;' +
    'background:var(--paper-card,#fff);color:var(--crimson,#AE3626);border:1px solid var(--rule,#d9d0bf);border-radius:3px;cursor:pointer}' +
    '.tts .spk{display:inline-block}' +
    '.spk:hover,.spk.playing{border-color:var(--crimson,#AE3626);background:var(--crimson,#AE3626);color:var(--paper-card,#fff)}' +
    '.spk svg{width:1em;height:1em;display:block;fill:currentColor}';
  var st = document.createElement('style');
  st.setAttribute('data-spk', '1');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* 挑英文語音：優先 en-US，其次其他英文 */
  var voice = null, playing = null;
  function pickVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [], best = null;
      for (var i = 0; i < vs.length; i++) {
        var l = (vs[i].lang || '').replace('_', '-');
        if (l === 'en-US') { best = vs[i]; break; }
        if (!best && l.indexOf('en') === 0) best = vs[i];
      }
      voice = best;
      if (document.body) document.body.classList.toggle('tts', !!best);
    } catch (err) {}
  }
  function init() {
    if (!('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)) return;
    pickVoice();
    try { window.speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (err) {}
    setTimeout(pickVoice, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.spk');
    if (!b || !voice) return;
    ev.stopPropagation();
    try {
      var ss = window.speechSynthesis; ss.cancel();
      if (playing) playing.classList.remove('playing');
      var u = new SpeechSynthesisUtterance(b.getAttribute('data-w'));
      u.voice = voice; u.lang = voice.lang || 'en-US'; u.rate = .85;
      playing = b; b.classList.add('playing');
      u.onend = u.onerror = function () { b.classList.remove('playing'); };
      ss.speak(u);
    } catch (err) {}
  });

  window.SPK = { ok: ok, html: html, el: el, nospk: NOSPK.slice() };
})();
