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
    /* 同拼法、因詞性或意思而有不同唸法（2026-10-18 逐字對照 Merriam-Webster 查證，兩輪獨立複核）。
     * 放喇叭的條件：所有詞性共用同一組唸法，或每個唸法對每個詞性都收，
     * 或另一個唸法只是標 also／especially 的少見變體；其餘一律排除，寧可少放。 */
    "abstract", "accent", "alternate", "approximate", "arithmetic", "bass", "blessed", "bow",
    "buffet", "close", "combat", "compact", "compound", "concert", "construct", "contrary",
    "convert", "coordinate", "deliberate", "discard", "dove", "entrance", "escort", "estimate",
    "frequent", "graduate", "house", "insert", "intimate", "invite", "lead", "learned", "live",
    "lower", "minute", "moderate", "ornament", "permit", "polish", "read", "row", "sake",
    "segment", "separate", "sow", "tear", "underline", "update", "upgrade", "upset", "use", "used",
    "wind", "wound"
  ];

  var NO = {};
  NOSPK.forEach(function (w) { NO[w] = 1; });

  /* 唸法會因詞性或意思而不同的字：每一種唸法各放一個喇叭，按鈕上直接寫出要唸的短語
   * （例如 a contest／to contest），語音引擎會依前後文選唸法。
   * 只有頁面用 SPK.html(字, true) 才會出現；其他頁面照舊不放喇叭。
   * 資料由查證結果產生，欄位：lab 詞性、say 唸的短語、kk 該唸法的音標。
   * HET_SPK 設 false 時只顯示短語與音標，不放喇叭（例如試聽發現某裝置唸錯時）。 */
  var HET_SPK = true;
  var HET = {};
  /*HET-BEGIN*/
  HET["entrance"] = [{lab:"n.",say:"an entrance",kk:"ˈɛntrəns"},{lab:"v.",say:"to entrance",kk:"ɪnˈtræns"}];
  HET["frequent"] = [{lab:"adj.",say:"very frequent",kk:"ˈfrikwənt"},{lab:"v.",say:"to frequent",kk:"friˈkwɛnt"}];
  HET["contrary"] = [{lab:"adj./n.",say:"on the contrary",kk:"ˈkɑnˌtrɛri"},{lab:"adj.（倔強）",say:"a contrary child",kk:"kənˈtrɛri"}];
  HET["accent"] = [{lab:"n.",say:"an accent",kk:"ˈæksˌɛnt"}];
  HET["affiliate"] = [{lab:"v.",say:"to affiliate",kk:"əˈfɪliˌeɪt"},{lab:"n.",say:"an affiliate",kk:"əˈfɪliɪt"}];
  HET["ally"] = [{lab:"n.",say:"an ally",kk:"ˈæˌlaɪ"},{lab:"v.",say:"to ally",kk:"əˈlaɪ"}];
  HET["appropriate"] = [{lab:"adj.",say:"very appropriate",kk:"əˈproʊpriət"},{lab:"v.",say:"to appropriate",kk:"əˈproʊpriˌeɪt"}];
  HET["approximate"] = [{lab:"adj.",say:"very approximate",kk:"əˈprɑksəmɪt"},{lab:"v.",say:"to approximate",kk:"əˈprɑksəˌmeɪt"}];
  HET["associate"] = [{lab:"v.",say:"to associate",kk:"əˈsoʊʃiˌeɪt"},{lab:"n.",say:"an associate",kk:"əˈsoʊʃiɪt"}];
  HET["attribute"] = [{lab:"v.",say:"to attribute",kk:"əˈtrɪbjut"},{lab:"n.",say:"an attribute",kk:"ˈætrəˌbjut"}];
  HET["supplement"] = [{lab:"n.",say:"a supplement",kk:"ˈsʌpləmənt"},{lab:"v.",say:"to supplement",kk:"ˈsʌpləˌmɛnt"}];
  HET["abstract"] = [{lab:"adj./n.",say:"abstract art",kk:"ˈæbˌstrækt"}];
  HET["addict"] = [{lab:"n.",say:"an addict",kk:"ˈædɪkt"},{lab:"v.",say:"to addict",kk:"əˈdɪkt"}];
  HET["compact"] = [{lab:"adj.",say:"very compact",kk:"kəmˈpækt"},{lab:"n.",say:"a compact",kk:"ˈkɑmˌpækt"}];
  HET["construct"] = [{lab:"v.",say:"to construct",kk:"kənˈstrʌkt"},{lab:"n.",say:"a construct",kk:"ˈkɑnˌstrʌkt"}];
  HET["content"] = [{lab:"n.",say:"the content",kk:"ˈkɑnˌtɛnt"},{lab:"adj.",say:"I am content",kk:"kənˈtɛnt"}];
  HET["contest"] = [{lab:"n.",say:"a contest",kk:"ˈkɑnˌtɛst"},{lab:"v.",say:"to contest",kk:"kənˈtɛst"}];
  HET["contract"] = [{lab:"n.",say:"a contract",kk:"ˈkɑnˌtrækt"},{lab:"v.",say:"to contract",kk:"kənˈtrækt"}];
  HET["contrast"] = [{lab:"n.",say:"a contrast",kk:"ˈkɑnˌtræst"},{lab:"v.",say:"to contrast",kk:"kənˈtræst"}];
  HET["convert"] = [{lab:"v.",say:"to convert",kk:"kənˈvɝt"},{lab:"n.",say:"a convert",kk:"ˈkɑnˌvɝt"}];
  HET["delegate"] = [{lab:"n.",say:"a delegate",kk:"ˈdɛləgɪt"},{lab:"v.",say:"to delegate",kk:"ˈdɛləˌgeɪt"}];
  HET["deliberate"] = [{lab:"adj.",say:"very deliberate",kk:"dɪˈlɪbərət"},{lab:"v.",say:"to deliberate",kk:"dɪˈlɪbəˌreɪt"}];
  HET["estimate"] = [{lab:"v.",say:"to estimate",kk:"ˈɛstəˌmeɪt"},{lab:"n.",say:"an estimate",kk:"ˈɛstəmɪt"}];
  HET["extract"] = [{lab:"v.",say:"to extract",kk:"ɪkˈstrækt"},{lab:"n.",say:"an extract",kk:"ˈɛkˌstrækt"}];
  HET["insert"] = [{lab:"v.",say:"to insert",kk:"ɪnˈsɝt"},{lab:"n.",say:"an insert",kk:"ˈɪnˌsɝt"}];
  HET["intimate"] = [{lab:"adj.",say:"very intimate",kk:"ˈɪntəmət"},{lab:"v.",say:"to intimate",kk:"ˈɪntəˌmeɪt"}];
  HET["moderate"] = [{lab:"adj.",say:"very moderate",kk:"ˈmɑdərət"},{lab:"v.",say:"to moderate",kk:"ˈmɑdəˌreɪt"}];
  HET["object"] = [{lab:"n.",say:"an object",kk:"ˈɑbʤɪkt"},{lab:"v.",say:"to object",kk:"əbˈʤɛkt"}];
  HET["produce"] = [{lab:"v.",say:"to produce",kk:"prəˈdus"},{lab:"n.",say:"fresh produce",kk:"ˈproʊdus"}];
  HET["project"] = [{lab:"n.",say:"a project",kk:"ˈprɑˌʤɛkt"},{lab:"v.",say:"to project",kk:"prəˈʤɛkt"}];
  HET["rebel"] = [{lab:"v.",say:"to rebel",kk:"rɪˈbɛl"},{lab:"n.",say:"a rebel",kk:"ˈrɛbəl"}];
  HET["reject"] = [{lab:"v.",say:"to reject",kk:"rɪˈʤɛkt"},{lab:"n.",say:"a reject",kk:"ˈriˌʤɛkt"}];
  HET["separate"] = [{lab:"adj.",say:"two separate",kk:"ˈsɛpərət"},{lab:"v.",say:"to separate",kk:"ˈsɛpəˌreɪt"}];
  HET["subject"] = [{lab:"n./adj.",say:"a subject",kk:"ˈsʌbʤɪkt"},{lab:"v.",say:"to subject",kk:"səbˈʤɛkt"}];
  HET["suspect"] = [{lab:"v.",say:"to suspect",kk:"səˈspɛkt"},{lab:"n./adj.",say:"a suspect",kk:"ˈsʌˌspɛkt"}];
  HET["transfer"] = [{lab:"v.",say:"to transfer",kk:"trænsˈfɝ"},{lab:"n.",say:"a transfer",kk:"ˈtrænsfɚ"}];
  /*HET-END*/
  function normw(word) { return String(word == null ? '' : word).trim().toLowerCase(); }
  function het(word) { var v = HET[normw(word)]; return v ? v.slice() : null; }

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

  function hetHtml(word) {
    var v = HET[normw(word)];
    if (!v || !HET_SPK) return '';
    return '<span class="spkset">' + v.map(function (x) {
      var say = esc(x.say);
      return '<button class="spk spkv" type="button" data-w="' + say + '" aria-label="聽 ' + say + ' 的發音" title="聽發音">' +
        SVG + '<span class="spkt">' + say + '</span></button>';
    }).join('') + '</span>';
  }

  function html(word, withHet) {
    if (withHet && HET[normw(word)]) return hetHtml(word);
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
    '.tts .spk{display:inline-flex;align-items:center;justify-content:center}' +
    '.spk:hover,.spk.playing{border-color:var(--crimson,#AE3626);background:var(--crimson,#AE3626);color:var(--paper-card,#fff)}' +
    '.spk svg{width:1em;height:1em;display:block;fill:currentColor;margin:0;flex:none}' +
    '.spkset{display:none;flex-wrap:wrap;gap:.3rem .4rem;margin:.2rem 0 0 .45rem;vertical-align:middle}' +
    '.tts .spkset{display:inline-flex}' +
    '.spkv{display:none;margin-left:0;font-size:.82rem;white-space:nowrap}' +
    '.tts .spkv{display:inline-flex;align-items:center;gap:.35rem}' +
    '.spkv .spkt{line-height:1.2;font-family:system-ui,-apple-system,"Noto Sans TC","Segoe UI",sans-serif;font-weight:500}';
  var st = document.createElement('style');
  st.setAttribute('data-spk', '1');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* 挑英文語音：名稱不含 Multilingual 的 en-US 最優先，其次其他英文語音，
   * 多語語音（Multilingual）只在沒有別的選擇時才用。
   * 原因：多語語音會自己判斷文字屬於哪一國語言，participation、nation 這類
   * 英法拼法相同的字，可能被唸成法文。 */
  var voice = null, playing = null;
  function pickVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [], best = null, bestScore = 0;
      for (var i = 0; i < vs.length; i++) {
        var l = (vs[i].lang || '').replace('_', '-');
        if (l.toLowerCase().indexOf('en') !== 0) continue;
        var multi = /multilingual/i.test(vs[i].name || '');
        var sc = (l === 'en-US' ? 2 : 1) + (multi ? 0 : 2);
        if (sc > bestScore) { best = vs[i]; bestScore = sc; }
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
      muteHint();
    } catch (err) {}
  });

  /* iPhone 的靜音開關打開時，瀏覽器的語音朗讀沒有聲音（喇叭按了也只是安靜）。
   * 網頁偵測不到開關狀態，所以只在 iPhone／iPad 上，每個頁面第一次按喇叭時，
   * 在畫面下方跳出一行提示，幾秒後自動消失；列印時不印。 */
  var hinted = false, hintTimer = 0;
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function muteHint() {
    if (hinted || !isIOS()) return;
    hinted = true;
    try {
      var h = document.createElement('div');
      h.setAttribute('role', 'status');
      h.setAttribute('data-spk-hint', '1');
      h.textContent = '聽不到聲音？請確認手機或平板沒有開啟靜音模式，並把音量調大，再按一次喇叭。';
      h.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483001;box-sizing:border-box;max-width:min(92vw,26em);' +
        'padding:9px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.4);background:#221F1A;color:#fff;' +
        'font:13px/1.6 "Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.35)';
      var ps = document.createElement('style');
      ps.textContent = '@media print{[data-spk-hint]{display:none !important}}';
      h.appendChild(ps);
      document.body.appendChild(h);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 7000);
    } catch (err) {}
  }

  /* 靜態頁面用：對符合選擇器的每個元素，取開頭那段文字當單字，在它後面插入喇叭 */
  function attach(selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i].firstChild;
      if (!t || t.nodeType !== 3 || nodes[i].querySelector('.spk')) continue;
      var b = el(t.nodeValue);
      if (b) nodes[i].insertBefore(b, t.nextSibling);
    }
  }

  window.SPK = { ok: ok, html: html, el: el, attach: attach, het: het, nospk: NOSPK.slice() };
})();
