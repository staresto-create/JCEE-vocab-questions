/* 自己安排的練習：番茄鐘＋願望（樣本，尚未上站）
   學生自己寫一個願望、選今天要種什麼、自己定要完成幾顆；做完就可以去兌現。
   只用 localStorage，資料只留在這台裝置的這個瀏覽器，不用登入、不上傳。
   讀不到或寫不進去（無痕視窗、瀏覽器擋掉儲存）時，仍可在這次開啟的頁面中使用，只是重新整理後不會保留。
   不做連續天數、排行榜、徽章、稀有度；沒做也不扣什麼。站上無法確認學生是否專心，一顆算不算由學生自己決定。
   計時用「結束時間」與現在時間相減，手機螢幕鎖定或切換分頁再回來，時間也不會算錯。
   儲存格式：鍵 scFocusV1 → {v,wish,goal,len,done,phase,endsAt,plant,grown}；鍵 scFocusSound（'0' 為關）、scFocusOpen（'1' 為展開）
   phase：idle（還沒開始）、work（專心中）、workDone（時間到，等學生確認）、break（休息中）、achieved（目標完成）
   plant：要種的東西（表情符號）或 'random'；grown：選 random 時，已經長出來的每一顆是什麼 */
(function () {
  'use strict';
  var KEY = 'scFocusV1';
  var OPENKEY = 'scFocusOpen';
  var SNDKEY = 'scFocusSound';
  var MAXWISH = 40;
  /* 每一種都是真的植物，小知識逐則查過出處（見交件說明）。PICK 是固定放在選擇列的，其餘只會在「隨機」裡長出來 */
  var PICK = ['🍅', '🪻', '🍊', '🥬', '💮', '🌻'];
  var PLANTS = PICK.concat(['🌿', '🍃', '🪴']);
  var INFO = {
    '🍅': ['番茄', 'tomato', '番茄鐘的名字來自義大利文 pomodoro（番茄）。1980 年代，還是大學生的 Francesco Cirillo 用一個番茄形的廚房計時器管理讀書時間，這個方法就以它命名。'],
    '🪻': ['番茉莉', 'yesterday-today-and-tomorrow', '花剛開時是紫色或淡紫色，幾天內慢慢褪成白色，所以英文俗名叫「昨天、今天和明天」。全株有毒，只看就好，不要摘，也不要吃。'],
    '🍊': ['橘子', 'tangerine', '「橘」和「吉」音近，所以習俗上把橘子當成象徵「大吉大利」的吉祥水果。'],
    '🥬': ['空心菜', 'water spinach', '它能長在水裡，莖是空心的。花是漏斗形，顏色從白色到淡紫色，和牽牛花長得很像。'],
    '💮': ['芭樂', 'guava', '花是白色的，有很多雄蕊。芭樂一年四季都能開花結果，果農還會用修剪調整產期，所以市場上整年都買得到。'],
    '🌻': ['向日葵', 'sunflower', '還在長的向日葵，白天會跟著太陽轉，開花成熟後就固定朝東。研究發現，朝東的花早上升溫比較快，來訪的授粉昆蟲數量大約是朝西的花的五倍。'],
    '🌿': ['牛蒡', 'burdock', '1941 年，瑞士工程師梅斯特拉爾帶狗上山，發現牛蒡的刺果黏在褲子和狗毛上。他用顯微鏡一看，上面有好幾百個小鉤子，後來就發明了魔鬼氈。'],
    '🍃': ['含羞草', 'sensitive plant', '一碰，葉子在幾秒內就會合起來，過一陣子（幾分鐘到半小時左右）又會慢慢打開。2022 年日本埼玉大學的研究發現，這個動作能讓它少被蚱蜢等昆蟲啃食。'],
    '🪴': ['捕蠅草', 'Venus flytrap', '葉子上的感應毛要在大約 20 到 30 秒內被碰到兩次，葉子才會合上，合上只要大約十分之一秒。']
  };
  /* 較新的表情符號（2020 年以後）在舊手機或舊電腦會變成方框；偵測到顯示不出來，就換成舊版也有的圖案。名稱與小知識不受影響 */
  var FALLBACK = { '🪻': '🌷', '🪴': '🍀', '🧋': '🥤' };
  var okCache = {};
  /* 回傳 'color'（彩色，正常）、'gray'（只有灰黑，像方框）、'blank'（什麼都沒畫出來）；畫布不能用時回傳 'na' */
  function probe(e) {
    try {
      var c = document.createElement('canvas'); c.width = 40; c.height = 40;
      var x = c.getContext && c.getContext('2d');
      if (!x || !x.getImageData) return 'na';
      x.textBaseline = 'top'; x.font = '28px sans-serif'; x.fillText(e, 0, 0);
      var d = x.getImageData(0, 0, 40, 40).data, seen = false;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 0) { seen = true; if (d[i] !== d[i + 1] || d[i + 1] !== d[i + 2]) return 'color'; }
      }
      return seen ? 'gray' : 'blank';
    } catch (err) { return 'na'; }
  }
  function renders(e) {
    if (okCache.hasOwnProperty(e)) return okCache[e];
    /* 先用一個一定看得到的舊表情符號校正：連它都不是彩色，就是畫布被瀏覽器的隱私保護改過，不可信，一律不替換 */
    var ok = !(probe(e) === 'gray' && probe('😀') === 'color');
    okCache[e] = ok;
    return ok;
  }
  function show(e) { return (FALLBACK.hasOwnProperty(e) && !renders(e)) ? FALLBACK[e] : e; }
  var mem = null;      /* 儲存被擋時，願望與進度暫存在這次開啟的頁面裡 */
  var sndMem = null;   /* 只在提示音設定寫不進去時才使用 */
  var actx = null;
  var baseTitle = '';
  var current = null;  /* 目前這一份，重複 mount 時先收掉舊的 */

  /* 以「看得到的一個字」為單位切字，表情符號不會被切一半 */
  function units(s) {
    s = String(s || '');
    try {
      if (window.Intl && Intl.Segmenter) {
        return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)).map(function (x) { return x.segment; });
      }
    } catch (e) {}
    return Array.from(s);
  }
  function clip(s) { return units(s).slice(0, MAXWISH).join('').replace(/\u200d+$/, ''); } /* 沒有 Intl.Segmenter 的舊瀏覽器可能切在組合表情中間，結尾落單的連接符號拿掉 */
  function defaults() { return { v: 1, wish: '', goal: 3, len: 25, done: 0, phase: 'idle', endsAt: 0, plant: '🍅', grown: [] }; }
  function sane(o) {
    var d = defaults();
    if (!o || typeof o !== 'object' || o.v !== 1) return d;
    d.wish = typeof o.wish === 'string' ? clip(o.wish) : '';
    d.goal = Math.min(12, Math.max(1, parseInt(o.goal, 10) || 3));
    d.len = o.len === 50 ? 50 : 25;
    d.done = Math.min(d.goal, Math.max(0, parseInt(o.done, 10) || 0));
    d.phase = ['idle', 'work', 'workDone', 'break', 'achieved'].indexOf(o.phase) >= 0 ? o.phase : 'idle';
    d.endsAt = typeof o.endsAt === 'number' && isFinite(o.endsAt) ? o.endsAt : 0;
    d.plant = (o.plant === 'random' || PLANTS.indexOf(o.plant) >= 0) ? o.plant : '🍅';
    if (d.phase === 'idle' && d.done >= d.goal) d.phase = 'achieved'; /* 資料不合理時，直接當作已完成 */
    d.grown = Array.isArray(o.grown) ? o.grown.filter(function (g) { return PLANTS.indexOf(g) >= 0; }).slice(0, d.done) : [];
    return d;
  }
  /* mem 只在儲存寫不進去時才有值；儲存正常時，鍵被別的分頁清掉就是真的清掉了 */
  function load() {
    if (mem) return sane(mem); /* 寫不進去的時候，以暫存的為準，不讓儲存裡的舊資料蓋回來 */
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) return sane(JSON.parse(raw));
    } catch (e) {}
    return defaults();
  }
  function save(s) {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); mem = null; }
    catch (e) {
      mem = JSON.parse(JSON.stringify(s));
      /* 舊值刪掉後通常就放得下：成功就不必靠暫存，別的分頁也收得到新進度 */
      try { window.localStorage.removeItem(KEY); window.localStorage.setItem(KEY, JSON.stringify(s)); mem = null; } catch (x) {}
    }
  }
  function wipe() {
    mem = null;
    try { window.localStorage.removeItem(KEY); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function mmss(ms) {
    var t = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(t / 60), s = t % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function longBreak(len) { return len === 50 ? 30 : 15; }
  function shortBreak(len) { return len === 50 ? 10 : 5; }

  /* ---- 提示音：關掉就真的不出聲 ---- */
  function soundOn() {
    if (sndMem !== null) return sndMem;
    try { return window.localStorage.getItem(SNDKEY) !== '0'; } catch (e) { return true; }
  }
  function setSound(on) {
    try { window.localStorage.setItem(SNDKEY, on ? '1' : '0'); sndMem = null; }
    catch (e) { sndMem = !!on; }
  }
  function prepAudio() { /* 要在學生碰觸頁面的當下建立，瀏覽器才允許之後出聲 */
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) { actx = new AC(); actx.onstatechange = function () { if (current && current.sync) current.sync(); }; }
      if (actx.state !== 'running') {
        var p = actx.resume();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
  }
  function chime() { /* 兩個柔和的短音，約 1 秒，自己會停；聲音若被系統暫停，要等恢復後才排，恢復不了就放棄，不會之後突然響 */
    try {
      if (!actx) return;
      var play = function () {
        [0, 0.45].forEach(function (d, i) {
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = 'sine'; o.frequency.value = i ? 784 : 659;
          var t0 = actx.currentTime + d;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
          o.connect(g); g.connect(actx.destination);
          o.start(t0); o.stop(t0 + 0.45);
        });
      };
      if (actx.state === 'running') { play(); return; }
      var asked = Date.now(), rp = actx.resume();
      if (rp && rp.then) rp.then(function () { if (actx.state === 'running' && Date.now() - asked < 1500) play(); }, function () {}); /* 拖太久才恢復就不響，免得學生之後碰螢幕時突然叮一聲 */
    } catch (e) {}
  }
  function alertUser(label) {
    try { if (soundOn()) chime(); } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
    try {
      if (!baseTitle) baseTitle = document.title;
      if (document.hidden) document.title = '⏰ ' + label + '｜' + baseTitle;
    } catch (e) {}
  }
  function restoreTitle() {
    try { if (baseTitle) { document.title = baseTitle; baseTitle = ''; } } catch (e) {}
  }

  function css() {
    if (document.getElementById('scf-style')) return;
    var s = document.createElement('style');
    s.id = 'scf-style';
    s.textContent =
      '.scf{--f-bg:#F2F7F1;--f-ink:#221F1A;--f-soft:#5B5648;--f-rule:#DCD3BB;--f-ctl:#7E7966;--f-sage:#3E6E52;--f-warm:#8A5A00;--f-field:#FFFFFF;--f-mark:#FFC98A;--f-on:#B8D9BD;' +
      'position:relative;overflow:hidden;box-sizing:border-box;text-align:left;margin:16px 0;padding:0;background:var(--f-bg);border:1px solid var(--f-rule);border-left:4px solid var(--f-sage);border-radius:4px;color:var(--f-ink);line-height:1.7;font-family:inherit;}' +
      '.scf[data-p="work"]{--f-bg:#E8F3E8;}.scf[data-p="break"]{--f-bg:#FFF6DC;}.scf[data-p="achieved"]{--f-bg:#FFEFD6;}' +
      '@media (prefers-color-scheme:dark){.scf{--f-bg:#1F2E26;--f-ink:#EDE7D8;--f-soft:#B8B0A0;--f-rule:#4A4538;--f-ctl:#8F9A90;--f-sage:#6FAE86;--f-warm:#F0C070;--f-field:#17211B;--f-mark:rgba(255,190,100,.35);--f-on:#35603F;}' +
      '.scf[data-p="work"]{--f-bg:#1A3325;}.scf[data-p="break"]{--f-bg:#2E2B1B;}.scf[data-p="achieved"]{--f-bg:#352A1A;}}' +
      '.scf summary{list-style:none;cursor:pointer;padding:12px 16px;display:block;min-height:44px;box-sizing:border-box;}' +
      '.scf summary::-webkit-details-marker{display:none;}' +
      '.scf .scf-sh{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:0 10px;}' +
      '.scf h2{font-family:"Noto Serif TC",serif;font-size:18px;margin:0;text-align:left;color:var(--f-ink);white-space:nowrap;}' +
      '.scf .scf-tg{font-size:13px;font-weight:700;color:var(--f-sage);white-space:nowrap;}' +
      '.scf[data-p="break"] .scf-tg,.scf[data-p="achieved"] .scf-tg{color:var(--f-warm);}' +
      '.scf .scf-pname{color:var(--f-sage);}' +
      '.scf .scf-tg::after{content:" ▾";}.scf[open] .scf-tg::after{content:" ▴";}' +
      '.scf .scf-in{padding:0 16px 14px;}' +
      '.scf [tabindex="-1"]{outline:none;}' +
      '.scf p{margin:0 0 10px;font-size:14px;text-align:left;}' +
      '.scf .scf-soft{font-size:12px;line-height:1.8;color:var(--f-soft);}' +
      '.scf .scf-nw{white-space:nowrap;}' +
      '.scf label{display:block;font-size:13px;font-weight:700;margin:10px 0 4px;}' +
      '.scf input[type=text],.scf select{box-sizing:border-box;width:100%;min-height:44px;padding:8px 10px;font:inherit;font-size:16px;color:var(--f-ink);background:var(--f-field);border:1px solid var(--f-ctl);border-radius:4px;}' +
      '.scf .scf-row{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;}' +
      '.scf button{appearance:none;font:inherit;font-size:15px;min-height:44px;padding:8px 16px;border-radius:4px;cursor:pointer;margin:0;}' +
      '.scf .scf-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;}' +
      '.scf .scf-go{background:var(--f-sage);color:#fff;border:1px solid var(--f-sage);font-weight:700;}' +
      '@media (prefers-color-scheme:dark){.scf .scf-go{color:#102018;}}' +
      '.scf .scf-alt{background:transparent;color:var(--f-ink);border:1px solid var(--f-ctl);}' +
      '.scf .scf-link{background:none;border:0;padding:8px 0;min-height:44px;font-size:13px;color:var(--f-soft);text-decoration:underline;}' +
      '.scf .scf-clock{font-size:48px;font-weight:700;letter-spacing:.04em;margin:2px 0 4px;font-variant-numeric:tabular-nums;color:var(--f-sage);}' +
      '.scf[data-p="break"] .scf-clock{color:var(--f-warm);}' +
      '.scf .scf-pill{display:inline-block;font-size:13px;font-weight:700;padding:0 10px;border-radius:99px;background:var(--f-warm);color:#fff;margin:0 0 4px;}' +
      '@media (prefers-color-scheme:dark){.scf .scf-pill{color:#2E2B1B;}}' +
      '.scf label.scf-snd{display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px;font-weight:400;margin:6px 0 0;cursor:pointer;}' +
      '.scf label.scf-snd input{width:20px;height:20px;margin:0;accent-color:var(--f-sage);}' +
      '.scf .scf-chips{display:grid;grid-template-columns:repeat(4,minmax(44px,56px));gap:8px;margin:8px 0 4px;}' +
      '.scf button.scf-chip{min-width:44px;padding:4px;font-size:22px;line-height:1;background:var(--f-field);border:1px solid var(--f-ctl);}' +
      '.scf button.scf-chip[aria-pressed="true"]{background:var(--f-on);border:2px solid var(--f-sage);}' +
      '.scf .scf-info{background:var(--f-field);border:1px solid var(--f-rule);border-radius:4px;padding:8px 12px 0;margin:10px 0;}' +
      '.scf .scf-iname{font-weight:700;margin:0 0 4px;}' +
      '.scf .scf-en{font-weight:400;color:var(--f-soft);font-size:13px;}' +
      '.scf .scf-dots{display:grid;gap:4px;margin:2px 0 8px;}' +
      '.scf .scf-slot{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;font-size:24px;line-height:1;}' +
      '.scf .scf-slot.empty::before{content:"";width:18px;height:18px;border-radius:50%;border:2px dashed var(--f-ctl);box-sizing:border-box;}' +
      '.scf .scf-slot.grow{animation:scf-sway 2.4s ease-in-out 3;transform-origin:50% 85%;}' +
      '.scf .scf-slot.pop{animation:scf-pop .5s ease-out;}' +
      '.scf .scf-wish{font-weight:700;background:linear-gradient(transparent 55%,var(--f-mark) 55%);}' +
      '.scf .scf-big{font-family:"Noto Serif TC",serif;font-size:18px;font-weight:700;margin:2px 0 8px;}' +
      '.scf-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}' +
      '.scf .scf-confetti{position:absolute;left:0;right:0;top:0;height:100%;pointer-events:none;overflow:hidden;}' +
      '.scf .scf-confetti span{position:absolute;top:-24px;font-size:22px;animation:scf-fall 2s ease-in forwards;}' +
      '@keyframes scf-fall{from{transform:translateY(0) rotate(0);opacity:1;}to{transform:translateY(360px) rotate(300deg);opacity:0;}}' +
      '@keyframes scf-pop{0%{transform:scale(.4);}60%{transform:scale(1.35);}100%{transform:scale(1);}}' +
      '@keyframes scf-sway{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg);}}' +
      '@media (prefers-reduced-motion:reduce){.scf *{animation:none !important;}.scf .scf-confetti{display:none;}}' +
      '@media (max-width:280px){.scf h2{white-space:normal;}}' +
      '@media (max-width:300px){.scf .scf-dots{grid-template-columns:repeat(auto-fill,32px) !important;}.scf .scf-chips{grid-template-columns:repeat(auto-fill,minmax(44px,1fr));}.scf .scf-row{grid-template-columns:1fr;}}' +
      '@media print{.scf,.scf-sr{display:none !important;}}';
    (document.head || document.documentElement).appendChild(s);
  }

  function mount(host, opts) {
    try {
      if (!host) return;
      if (current) { current.destroy(); current = null; }
      opts = opts || {};
      var MS_PER_MIN = opts.msPerMin > 0 ? opts.msPerMin : 60000; /* 只給測試用，正式頁面不設 */
      css();
      host.textContent = '';
      var box = el('details', 'scf');
      box.setAttribute('aria-label', '自己安排的練習：番茄鐘加願望');
      var smy = el('summary');
      var sh = el('div', 'scf-sh');
      var h2 = el('h2', null, '🍅 ');
      h2.appendChild(el('span', 'scf-nw', '自己安排'));
      h2.appendChild(el('span', 'scf-nw', '的練習'));
      sh.appendChild(h2);
      var tg = el('span', 'scf-tg');
      sh.appendChild(tg);
      smy.appendChild(sh);
      var sub = el('p', 'scf-soft', '用番茄鐘專心練習，完成目標就去兌現自己訂的願望。');
      sub.style.margin = '2px 0 0';
      smy.appendChild(sub);
      box.appendChild(smy);
      var body = el('div', 'scf-in');
      box.appendChild(body);
      /* 給螢幕閱讀器的提示放在收合區塊外面，收合時也唸得到 */
      var sr = el('p', 'scf-sr');
      sr.setAttribute('role', 'status');
      host.appendChild(box);
      host.appendChild(sr);

      var pref = null;
      try { pref = window.localStorage.getItem(OPENKEY); } catch (e) {}
      box.open = pref === '1';
      box.addEventListener('toggle', function () {
        try { window.localStorage.setItem(OPENKEY, box.open ? '1' : '0'); } catch (e) {}
      });

      var st = load();
      var idleRefs = null, timer = null, clockEl = null, shown = '', lockUntil = 0, lastView = '', popIdx = -1, celebrate = false;

      /* 重新整理後，學生在頁面上的第一次碰觸（不一定在這個元件內）就把提示音準備好 */
      var UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
      var unlockOn = false;
      function dropUnlock() { UNLOCK_EVENTS.forEach(function (n) { document.removeEventListener(n, unlock, true); }); unlockOn = false; }
      function unlock() {
        if (soundOn()) prepAudio();
        if (actx && actx.state === 'running') dropUnlock(); /* 觸控要到放開手指才算使用者操作，所以等真的啟動了才收掉 */
      }
      /* 只有「專心中、休息中」而且提示音開著、聲音還沒準備好時才需要等第一次碰觸；其他時候不碰音訊 */
      function syncUnlock() {
        var need = soundOn() && (st.phase === 'work' || st.phase === 'break') && !(actx && actx.state === 'running');
        if (need && !unlockOn) { UNLOCK_EVENTS.forEach(function (n) { document.addEventListener(n, unlock, true); }); unlockOn = true; }
        else if (!need && unlockOn) dropUnlock();
      }

      /* 換畫面後 0.5 秒內，卡片裡的按鈕與勾選一律不理，避免連點誤觸（包含提示音勾選框） */
      function guard(ev) {
        if (Date.now() < lockUntil && body.contains(ev.target)) { ev.preventDefault(); ev.stopPropagation(); }
      }
      box.addEventListener('click', guard, true);

      function say(t) { sr.textContent = ''; setTimeout(function () { sr.textContent = t; }, 50); }
      function breakOver() { return st.phase === 'break' && Date.now() >= st.endsAt; }
      function view() { return breakOver() ? 'breakOver' : st.phase; }
      function vk() { return JSON.stringify(st) + '|' + (breakOver() ? 1 : 0); }
      function settle() {
        /* 重新打開頁面時，把已經過了的階段推進到正確位置 */
        if (st.phase === 'work' && Date.now() >= st.endsAt) { st.phase = 'workDone'; save(st); }
      }
      function clamp() {
        /* 系統時間被往回調時，倒數不會超過一顆的長度 */
        var now = Date.now(), max = 0;
        if (st.phase === 'work') max = st.len * MS_PER_MIN;
        else if (st.phase === 'break') max = (st.done % 4 === 0 ? longBreak(st.len) : shortBreak(st.len)) * MS_PER_MIN;
        if (max && st.endsAt - now > max + 1000) { st.endsAt = now + max; save(st); }
      }
      /* 只在「還沒開始、一顆都沒做」時可以改願望、數量、時間、種類。先讀最新的再改，不會蓋掉別的分頁的進度 */
      function mutate(fn) {
        var cur = load();
        if (cur.phase !== 'idle' || cur.done !== 0) { st = cur; render(false); return false; }
        fn(cur);
        st = cur; save(st); shown = vk();
        return true;
      }
      function stopTick() { if (timer) { clearInterval(timer); timer = null; } }
      function tick() {
        try {
          clamp();
          var now = Date.now();
          if (st.phase === 'work') {
            if (now >= st.endsAt) {
              st.phase = 'workDone'; save(st); render(false);
              alertUser('時間到'); say('時間到');
              return;
            }
            if (clockEl) clockEl.textContent = mmss(st.endsAt - now);
          } else if (st.phase === 'break') {
            if (now >= st.endsAt) { render(false); alertUser('休息結束'); say('休息結束'); return; }
            if (clockEl) clockEl.textContent = mmss(st.endsAt - now);
          }
        } catch (e) { if (window.console) console.error(e); }
      }
      function startTick() { stopTick(); timer = setInterval(tick, 1000); }

      function emojiOf(i) {
        if (st.plant === 'random') return st.grown[i] || '🍅';
        return st.plant;
      }
      function dots() {
        var wrap = el('div', 'scf-dots');
        wrap.style.gridTemplateColumns = 'repeat(' + Math.min(st.goal, 6) + ',32px)';
        wrap.setAttribute('role', 'img');
        wrap.setAttribute('aria-label', '已完成 ' + st.done + ' 顆，目標 ' + st.goal + ' 顆');
        for (var i = 0; i < st.goal; i++) {
          var s = el('span', 'scf-slot');
          if (i < st.done) { s.textContent = show(emojiOf(i)); if (i === popIdx) s.className += ' pop'; }
          else if (i === st.done && (st.phase === 'work' || st.phase === 'workDone')) { s.textContent = '🌱'; s.className += ' grow'; }
          else s.className += ' empty';
          wrap.appendChild(s);
        }
        return wrap;
      }
      function infoCard(emoji) {
        var d = INFO[emoji];
        var c = el('div', 'scf-info');
        if (!d) return c;
        var h = el('p', 'scf-iname');
        h.appendChild(document.createTextNode(show(emoji) + ' ' + d[0] + '　'));
        h.appendChild(el('span', 'scf-en', d[1]));
        c.appendChild(h);
        c.appendChild(el('p', null, d[2]));
        return c;
      }
      function note(txt) { return el('p', 'scf-soft', txt); }
      /* 別的分頁若已經改了進度（storage 事件沒及時送到），這次按鈕不照舊畫面做，改成先更新畫面 */
      function syncGuard(fn) {
        var cur = load();
        if (JSON.stringify(cur) !== JSON.stringify(sane(st))) { st = cur; settle(); render(false); return; }
        fn();
      }
      function btn(label, cls, fn) {
        var b = el('button', cls, label);
        b.type = 'button';
        b.addEventListener('click', function () {
          if (Date.now() < lockUntil) return;
          try { if (soundOn()) prepAudio(); restoreTitle(); syncGuard(fn); }
          catch (e) { if (window.console) console.error(e); }
        });
        return b;
      }
      function wishSpan(prefix) {
        var p = el('p');
        p.appendChild(document.createTextNode(prefix));
        p.appendChild(el('span', 'scf-wish', st.wish));
        return p;
      }
      function footer() {
        var f = el('div');
        var lab = el('label', 'scf-snd');
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = soundOn();
        cb.addEventListener('change', function () { setSound(cb.checked); if (cb.checked) { prepAudio(); chime(); } syncUnlock(); });
        lab.appendChild(cb);
        var lt = el('span', null, '專心或休息時間結束時，');
        lt.appendChild(el('span', 'scf-nw', '播放提示音'));
        lab.appendChild(lt);
        f.appendChild(lab);
        f.appendChild(note('不用登入，願望和進度只存在這台裝置的這個瀏覽器；清除瀏覽資料、換裝置或用無痕視窗，就會從零開始。站上無法確認你是否專心，一顆算不算，由你自己決定。'));
        f.appendChild(btn('清除願望與進度', 'scf-link', function () {
          if (window.confirm('確定要清除願望和進度嗎？清除後無法復原。')) { wipe(); st = defaults(); render(true); }
        }));
        return f;
      }
      function confetti() {
        var layer = el('div', 'scf-confetti');
        layer.setAttribute('aria-hidden', 'true');
        var picks = st.plant === 'random' ? st.grown.slice() : [st.plant];
        picks.push('🎉');
        try { var m = st.wish.match(new RegExp('\\p{Extended_Pictographic}', 'gu')); if (m) picks = picks.concat(m.slice(0, 3)); } catch (e) {}
        for (var i = 0; i < 10; i++) {
          var s = el('span', null, show(picks[i % picks.length]));
          s.style.left = (50 + Math.random() * 45) + '%';
          s.style.animationDelay = (Math.random() * 0.6) + 's';
          s.style.animationDuration = (1.6 + Math.random() * 0.8) + 's';
          layer.appendChild(s);
        }
        box.appendChild(layer);
        setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 3200);
      }
      function tagText() {
        if (st.phase === 'work') return '專心中';
        if (st.phase === 'workDone') return '時間到';
        if (st.phase === 'achieved') return '目標完成';
        if (st.phase === 'break') return breakOver() ? '休息結束' : '休息中';
        if (st.done === 0) return '';
        return st.done + '／' + st.goal + ' 顆';
      }
      function focusKey(ae) {
        if (!ae) return null;
        if (ae.tabIndex === -1 && ae.parentNode === body) return 'first';
        if (ae.id) return '#' + ae.id;
        if (ae.type === 'checkbox') return 'snd';
        if (ae.tagName === 'BUTTON') return 'b:' + ae.textContent;
        return null;
      }
      function findKey(k) {
        if (k === 'first') return null; /* 上一個畫面的開頭已經換掉，交給新畫面的開頭 */
        if (k.charAt(0) === '#') return document.getElementById(k.slice(1));
        var all = body.querySelectorAll(k === 'snd' ? 'input[type=checkbox]' : 'button');
        for (var i = 0; i < all.length; i++) { if (k === 'snd' || 'b:' + all[i].textContent === k) return all[i]; }
        return null;
      }

      function render(userMove) {
        stopTick();
        settle();
        clamp();
        var old = box.querySelector('.scf-confetti');
        if (old) old.parentNode.removeChild(old);
        var keep = (!userMove && body.contains(document.activeElement)) ? focusKey(document.activeElement) : null;
        body.textContent = '';
        clockEl = null;
        idleRefs = null;
        var phase = st.phase;
        box.setAttribute('data-p', breakOver() ? 'idle' : phase === 'workDone' ? 'work' : phase);
        tg.textContent = tagText();
        if (view() !== lastView) { if (lastView) lockUntil = Date.now() + 500; lastView = view(); }

        if (phase === 'idle' || breakOver()) {
          if (breakOver()) {
            body.appendChild(el('p', 'scf-big', '休息結束，要繼續下一顆嗎？'));
          }
          var idleNote = null, goBtn = null, previewHost = null;
          var refreshIdle = function () {
            if (idleNote) idleNote.textContent = '一顆是 ' + st.len + ' 分鐘專心練習，加 ' + shortBreak(st.len) + ' 分鐘休息；每做完 4 顆，休息會拉長到 ' + longBreak(st.len) + ' 分鐘。可以用站上的題庫，也可以印出來寫。' + (st.len === 50 ? '（原始的番茄工作法一顆是 25 分鐘，50 分鐘是加長版。）' : '');
            if (goBtn) { goBtn.textContent = '開始第 ' + (st.done + 1) + ' 顆'; goBtn.appendChild(el('span', 'scf-nw', '（' + st.len + ' 分鐘）')); }
          };
          if (!breakOver() && st.done === 0) {
            idleNote = el('p');
            body.appendChild(idleNote);
            var lw = el('label', null, '我的願望（自己寫，只有你看得到）');
            lw.setAttribute('for', 'scf-wish');
            body.appendChild(lw);
            var iw = el('input'); iw.type = 'text'; iw.id = 'scf-wish'; iw.value = st.wish;
            iw.placeholder = '寫下你的願望';
            iw.setAttribute('autocomplete', 'off');
            var prevVal = iw.value;
            var onWish = function (e) {
              if (e && e.isComposing) return; /* 注音選字中，先不截字也不存 */
              var c = clip(iw.value);
              if (c !== iw.value) {
                var diff = iw.value.length - prevVal.length, pos = iw.selectionStart;
                if (pos < iw.value.length) {
                  /* 在句中補字超過上限：不收這次輸入，句尾不會被悄悄刪掉；在句尾補字則收到上限為止 */
                  iw.value = prevVal;
                  try { var back = Math.min(prevVal.length, Math.max(0, pos - diff)); iw.setSelectionRange(back, back); } catch (x) {}
                  return;
                }
                iw.value = c; /* 貼上一大段才從尾巴截 */
              }
              prevVal = iw.value;
              mutate(function (cur) { cur.wish = c; });
            };
            iw.addEventListener('input', onWish);
            iw.addEventListener('compositionend', function () { onWish(null); });
            body.appendChild(iw);
            var chips = el('div', 'scf-chips');
            [['🧋', '手搖飲'], ['🍜', '美食'], ['🏀', '運動'], ['🎧', '聽歌'], ['🎨', '畫畫'], ['🚶', '散步'], ['😴', '睡覺'], ['📚', '買書']].forEach(function (e) {
              var c = el('button', 'scf-chip', show(e[0]));
              c.type = 'button';
              c.setAttribute('aria-label', '加上 ' + e[1]);
              c.addEventListener('click', function () {
                var next = iw.value + show(e[0]);
                if (units(next).length <= MAXWISH) { iw.value = next; prevVal = next; mutate(function (cur) { cur.wish = next; }); }
                iw.focus();
              });
              chips.appendChild(c);
            });
            body.appendChild(chips);

            var plabel = el('label', null, '今天要種什麼');
            body.appendChild(plabel);
            var pg = el('div', 'scf-chips');
            pg.setAttribute('role', 'group');
            pg.setAttribute('aria-label', '今天要種什麼');
            var pbtns = [];
            PICK.concat(['random']).forEach(function (pl) {
              var c = el('button', 'scf-chip', pl === 'random' ? '🎲' : show(pl));
              c.type = 'button';
              c.setAttribute('aria-label', pl === 'random' ? '隨機，做完才知道長出什麼' : '種' + INFO[pl][0]);
              c.setAttribute('aria-pressed', st.plant === pl ? 'true' : 'false');
              c.addEventListener('click', function () {
                if (mutate(function (cur) { cur.plant = pl; })) {
                  pbtns.forEach(function (b) { b.btn.setAttribute('aria-pressed', b.pl === st.plant ? 'true' : 'false'); });
                  showPreview();
                }
              });
              pbtns.push({ btn: c, pl: pl });
              pg.appendChild(c);
            });
            body.appendChild(pg);
            var preview = el('div');
            previewHost = preview;
            var showPreview = function () {
              preview.textContent = '';
              plabel.textContent = '今天要種什麼';
              plabel.appendChild(document.createTextNode('：'));
              plabel.appendChild(el('span', 'scf-pname', st.plant === 'random' ? '🎲 隨機' : show(st.plant) + ' ' + INFO[st.plant][0]));
              if (st.plant === 'random') preview.appendChild(note('🎲 做完一顆才知道長出什麼。'));
              else preview.appendChild(infoCard(st.plant));
            };
            showPreview();

            var row = el('div', 'scf-row');
            var c1 = el('div'), c2 = el('div');
            var lg = el('label', null, '要完成幾顆'); lg.setAttribute('for', 'scf-goal');
            var sg = el('select'); sg.id = 'scf-goal';
            for (var g = 1; g <= 12; g++) { var og = el('option', null, g + ' 顆'); og.value = String(g); if (g === st.goal) og.selected = true; sg.appendChild(og); }
            sg.addEventListener('change', function () {
              var v = Math.min(12, Math.max(1, parseInt(sg.value, 10) || 3));
              if (mutate(function (cur) { cur.goal = v; })) tg.textContent = tagText();
            });
            c1.appendChild(lg); c1.appendChild(sg);
            var ll = el('label', null, '一顆多久'); ll.setAttribute('for', 'scf-len');
            var sl = el('select'); sl.id = 'scf-len';
            [25, 50].forEach(function (m) { var o = el('option', null, m + ' 分鐘'); o.value = String(m); if (m === st.len) o.selected = true; sl.appendChild(o); });
            sl.addEventListener('change', function () {
              var v = parseInt(sl.value, 10) === 50 ? 50 : 25;
              if (mutate(function (cur) { cur.len = v; })) refreshIdle();
            });
            c2.appendChild(ll); c2.appendChild(sl);
            row.appendChild(c1); row.appendChild(c2);
            body.appendChild(row);
            idleRefs = { sg: sg, sl: sl, pbtns: pbtns, refresh: refreshIdle, preview: showPreview };
          } else {
            body.appendChild(dots());
            if (st.wish) body.appendChild(wishSpan('我的願望：'));
          }
          var bars = el('div', 'scf-btns');
          goBtn = btn('', 'scf-go', function () {
            st.phase = 'work'; st.endsAt = Date.now() + st.len * MS_PER_MIN; save(st); render(true);
          });
          bars.appendChild(goBtn);
          body.appendChild(bars);
          if (previewHost) body.appendChild(previewHost);
          refreshIdle();
          body.appendChild(footer());
        } else if (phase === 'work') {
          body.appendChild(dots());
          clockEl = el('div', 'scf-clock', mmss(st.endsAt - Date.now()));
          clockEl.setAttribute('role', 'timer');
          body.appendChild(clockEl);
          body.appendChild(note('專心練習這一顆。想停就可以停，這一顆不會計入，也不會有任何懲罰。手機螢幕鎖定時不會響，回到這個頁面會顯示「時間到」；你也可以另外用手機內建的計時器。'));
          var b1 = el('div', 'scf-btns');
          b1.appendChild(btn('先停下來', 'scf-alt', function () { st.phase = 'idle'; st.endsAt = 0; save(st); render(true); }));
          body.appendChild(b1);
          body.appendChild(footer());
          startTick();
        } else if (phase === 'workDone') {
          body.appendChild(el('p', 'scf-big', '時間到。'));
          body.appendChild(dots());
          body.appendChild(el('p', null, '這 ' + st.len + ' 分鐘，你有專心練習嗎？有的話，按「記下這一顆」。'));
          var b2 = el('div', 'scf-btns');
          b2.appendChild(btn('記下這一顆', 'scf-go', function () {
            popIdx = st.done;
            if (st.plant === 'random') {
              st.grown = st.grown.slice(0, st.done);
              st.grown.push(PLANTS[Math.floor(Math.random() * PLANTS.length)]);
            }
            st.done = Math.min(st.goal, st.done + 1);
            if (st.done >= st.goal) { st.phase = 'achieved'; st.endsAt = 0; celebrate = true; }
            else {
              var mins = st.done % 4 === 0 ? longBreak(st.len) : shortBreak(st.len);
              st.phase = 'break'; st.endsAt = Date.now() + mins * MS_PER_MIN;
            }
            save(st); render(true);
          }));
          b2.appendChild(btn('這一顆不算', 'scf-alt', function () { st.phase = 'idle'; st.endsAt = 0; save(st); render(true); }));
          body.appendChild(b2);
          body.appendChild(footer());
        } else if (phase === 'break') {
          body.appendChild(el('span', 'scf-pill', '休息中'));
          body.appendChild(dots());
          clockEl = el('div', 'scf-clock', mmss(st.endsAt - Date.now()));
          clockEl.setAttribute('role', 'timer');
          body.appendChild(clockEl);
          if (st.plant === 'random' && st.grown[st.done - 1]) body.appendChild(infoCard(st.grown[st.done - 1]));
          else if (st.plant !== 'random' && st.done === 1) body.appendChild(infoCard(st.plant));
          var rp = el('p', null, '休息時間可以離開螢幕，站起來走走、');
          rp.appendChild(el('span', 'scf-nw', '喝點水。'));
          body.appendChild(rp);
          var b3 = el('div', 'scf-btns');
          b3.appendChild(btn('提早開始下一顆', 'scf-link', function () {
            st.phase = 'work'; st.endsAt = Date.now() + st.len * MS_PER_MIN; save(st); render(true);
          }));
          body.appendChild(b3);
          body.appendChild(footer());
          startTick();
        } else if (phase === 'achieved') {
          body.appendChild(el('p', 'scf-big', '目標完成，你做了 ' + st.goal + ' 顆。'));
          body.appendChild(dots());
          if (st.plant === 'random') {
            var names = [];
            st.grown.forEach(function (g) { var t = INFO[g] ? show(g) + ' ' + INFO[g][0] : ''; if (t && names.indexOf(t) < 0) names.push(t); });
            if (names.length) body.appendChild(note('這次長出來的有：' + names.join('、') + '。'));
            if (st.grown.length) body.appendChild(infoCard(st.grown[st.grown.length - 1]));
          } else body.appendChild(infoCard(st.plant));
          if (st.wish) body.appendChild(wishSpan('可以去兌現你的願望了：'));
          var b4 = el('div', 'scf-btns');
          b4.appendChild(btn('兌現了，訂新的目標', 'scf-go', function () {
            st.phase = 'idle'; st.done = 0; st.endsAt = 0; st.wish = ''; st.grown = []; save(st); render(true);
          }));
          body.appendChild(b4);
          body.appendChild(footer());
          if (celebrate) { celebrate = false; confetti(); }
        }

        popIdx = -1;
        shown = vk();
        syncUnlock();
        var first = body.firstChild;
        if (userMove) {
          if (first) { first.tabIndex = -1; try { first.focus({ preventScroll: true }); } catch (e) {} }
        } else if (keep) {
          var back = findKey(keep);
          if (!back && first) { back = first; first.tabIndex = -1; } /* 原本的控制項已經不在了，把焦點交給新畫面的開頭 */
          if (back) { try { back.focus({ preventScroll: true }); } catch (e) {} }
        }
      }

      /* 別的分頁改了進度，或這個分頁從背景回來：重新讀取，只有畫面真的不同才重畫 */
      function resync() {
        try {
          var prev = { phase: st.phase, endsAt: st.endsAt };
          st = load();
          settle();
          if (vk() !== shown) render(false);
          /* 別的分頁先處理了「時間到」，這個分頁也要響：兩邊都響，總比兩邊都不響好 */
          if (prev.phase === 'work' && st.phase === 'workDone' && st.endsAt === prev.endsAt && Date.now() - st.endsAt < 5000) {
            alertUser('時間到'); say('時間到');
          }
        } catch (e) { if (window.console) console.error(e); }
      }
      function onVisible() { if (!document.hidden) { restoreTitle(); resync(); syncUnlock(); } }
      function onStorage(e) {
        if (e.key === SNDKEY || e.key === null) {
          var cb = body.querySelector('.scf-snd input');
          if (cb) cb.checked = soundOn();
          syncUnlock();
          if (e.key === SNDKEY) return;
        }
        if (e.key !== KEY && e.key !== null) return;
        var ae = document.activeElement;
        if (ae && ae.id === 'scf-wish') {
          /* 正在打字：如果別的分頁還沒開始，只同步其他欄位，不打斷輸入；否則進度已變，直接更新畫面 */
          var n = load();
          if (n.phase === 'idle' && n.done === 0) {
            n.wish = st.wish; st = n; shown = vk();
            if (idleRefs) {
              idleRefs.sg.value = String(st.goal); idleRefs.sl.value = String(st.len);
              idleRefs.pbtns.forEach(function (b) { b.btn.setAttribute('aria-pressed', b.pl === st.plant ? 'true' : 'false'); });
              idleRefs.refresh(); idleRefs.preview(); tg.textContent = tagText();
            }
            return;
          }
        }
        resync();
      }
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('storage', onStorage);

      current = {
        sync: function () { try { syncUnlock(); } catch (e) {} },
        destroy: function () {
          stopTick();
          document.removeEventListener('visibilitychange', onVisible);
          window.removeEventListener('storage', onStorage);
          dropUnlock();
          if (box.parentNode) box.parentNode.removeChild(box);
          if (sr.parentNode) sr.parentNode.removeChild(sr);
        }
      };
      render(false);
    } catch (x) {
      if (window.console) console.error(x);
      try { if (host) host.textContent = '這個工具暫時無法使用。'; } catch (e) {}
    }
  }

  window.SCFocus = { mount: mount };
})();
