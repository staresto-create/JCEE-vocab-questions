/* 文章生字表（共用）：把一段英文文章依詞彙表覆蓋清單分級，產生「這一篇的生字表」。
 * 字形還原、分級與中文意思的做法和 cards/mark.html（貼上文章、標出生字）相同；
 * 詞彙表以外的字、詞彙表裡還沒有中文的字，中文放在 lexicon/passage_gloss.json。資料在使用時才下載。
 * 用法：PV.html(文章字串或字串陣列, {th:4}) 回傳 Promise，內容是 <details> 的 HTML。
 * cards/mark.html（貼上文章、標出生字）也用同一套：PV.load() 讀完資料後，PV.analyze(文章)、PV.glossOf(字)、PV.ctx()。
 * 中文：一字多義 → 共用字表 → 詞彙表考過的釋義 → lexicon/passage_gloss.json；音標：全站 kk_data.json（kk.js）。 */
(function(){
'use strict';
var BASE=(function(){var s=document.currentScript&&document.currentScript.src;return s?s.slice(0,s.lastIndexOf('/')+1):'';})();
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
var D=null, IDX={}, ROWS=[], GROUP={}, POLY={}, LEX={}, EX={}, loading=null;
/* 不規則變化 */
var IRR={was:'be',were:'be',been:'be',being:'be',am:'be',is:'be',are:'be',had:'have',has:'have',having:'have',did:'do',done:'do',does:'do',doing:'do',went:'go',gone:'go',goes:'go',going:'go',made:'make',said:'say',took:'take',taken:'take',came:'come',saw:'see',seen:'see',got:'get',gotten:'get',gave:'give',given:'give',knew:'know',known:'know',thought:'think',found:'find',told:'tell',felt:'feel',left:'leave',kept:'keep',began:'begin',begun:'begin',brought:'bring',bought:'buy',built:'build',caught:'catch',chose:'choose',chosen:'choose',drew:'draw',drawn:'draw',drove:'drive',driven:'drive',ate:'eat',eaten:'eat',fell:'fall',fallen:'fall',flew:'fly',flown:'fly',forgot:'forget',forgotten:'forget',grew:'grow',grown:'grow',heard:'hear',held:'hold',lay:'lie',lain:'lie',led:'lead',lost:'lose',meant:'mean',met:'meet',paid:'pay',ran:'run',rode:'ride',ridden:'ride',rose:'rise',risen:'rise',sang:'sing',sung:'sing',sat:'sit',slept:'sleep',spoke:'speak',spoken:'speak',spent:'spend',stood:'stand',swam:'swim',swum:'swim',taught:'teach',threw:'throw',thrown:'throw',understood:'understand',woke:'wake',woken:'wake',wore:'wear',worn:'wear',wrote:'write',written:'write',broke:'break',broken:'break',hid:'hide',hidden:'hide',shook:'shake',shaken:'shake',stole:'steal',stolen:'steal',sold:'sell',sent:'send',shot:'shoot',sought:'seek',lent:'lend',bent:'bend',dealt:'deal',dug:'dig',fed:'feed',fought:'fight',hung:'hang',laid:'lay',lit:'light',won:'win',wound:'wind',men:'man',women:'woman',children:'child',people:'person',feet:'foot',teeth:'tooth',mice:'mouse',geese:'goose',better:'good',best:'good',worse:'bad',worst:'bad',more:'much',most:'much',less:'little',least:'little',farther:'far',further:'far',elder:'old',eldest:'old',lives:'life',wives:'wife',knives:'knife',wolves:'wolf',leaves:'leaf',halves:'half',shelves:'shelf',thieves:'thief',loaves:'loaf',selves:'self',analyses:'analysis',crises:'crisis',phenomena:'phenomenon',criteria:'criterion',data:'datum',bacteria:'bacterium',became:'become',bred:'breed',blown:'blow',blew:'blow',drank:'drink',drunk:'drink',shown:'show',torn:'tear',tore:'tear',sprung:'spring',sprang:'spring',struck:'strike',undone:'undo',undid:'undo',frozen:'freeze',froze:'freeze',withdrawn:'withdraw',withdrew:'withdraw',cannot:'can',sped:'speed',strung:'string',overthrew:'overthrow',burnt:'burn',arose:'arise',arisen:'arise',bitten:'bite',borne:'bear',born:'bear',bled:'bleed',burst:'burst',clung:'cling',crept:'creep',dwelt:'dwell',fled:'flee',flung:'fling',forbade:'forbid',forbidden:'forbid',foresaw:'foresee',foreseen:'foresee',forgave:'forgive',forgiven:'forgive',knelt:'kneel',leapt:'leap',overcame:'overcome',rang:'ring',rebuilt:'rebuild',retold:'retell',rewrote:'rewrite',rewritten:'rewrite',sank:'sink',sunk:'sink',shone:'shine',shrank:'shrink',shrunk:'shrink',slid:'slide',stuck:'stick',stung:'sting',swept:'sweep',swore:'swear',sworn:'swear',swung:'swing',undertook:'undertake',undertaken:'undertake',wove:'weave',woven:'weave',wept:'weep',wrung:'wring',overtook:'overtake',overtaken:'overtake',awoke:'awake',awoken:'awake',strove:'strive',strode:'stride'};
var PLACE={};'taiwan taiwanese france paris germany berlin italy rome spain madrid portugal britain england english london scotland ireland wales netherlands dutch belgium switzerland swiss austria vienna sweden swedish norway norwegian denmark danish finland finnish iceland russia russian moscow ukraine ukrainian poland polish greece greek turkey turkish egypt egyptian israel iran iraq syria lebanon india indian pakistan bangladesh nepal tibet china chinese beijing shanghai taipei taichung kaohsiung tainan hsinchu taoyuan keelung hualien taitung penghu kinmen matsu hongkong macau japan japanese tokyo osaka kyoto korea korean seoul vietnam vietnamese thailand thai bangkok singapore malaysia malaysian indonesia indonesian jakarta philippines filipino manila cambodia laos myanmar mongolia mongolian asia asian europe european africa african america american canada canadian toronto vancouver mexico mexican brazil brazilian argentina chile peru colombia cuba australia australian sydney melbourne oceania zealand antarctica arctic pacific atlantic mediterranean nigeria kenya ethiopia morocco ghana california texas florida hawaii alaska york chicago boston seattle washington francisco angeles vegas'.split(' ').forEach(function(x){PLACE[x]=1;});
var BASIC={};'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety fourth fifth sixth seventh eighth ninth tenth could might should would ought does did monday tuesday wednesday thursday friday saturday sunday january february april june july august september october november december mr mrs ms dr ok oh hi bye ones tens hundreds thousands cm kg km mm ml co non anti pre pro th st nd rd'.split(' ').forEach(function(w){BASIC[w]=1;});
var SKIP={};
var DBL=/([b-df-hj-np-tv-z])\1$/;
function setup(rows){
  ROWS=rows;
  var i,r,k;
  for(i=0;i<rows.length;i++){
    r=rows[i]; k=r[6]||r[0];
    var g=GROUP[k]||(GROUP[k]={st:2,tested:[],gloss:'',pos:r[2]});
    if(r[3]<g.st)g.st=r[3];
    if(r[4]&&r[4].length)g.tested=g.tested.concat(r[4]);
    if(!g.gloss&&r[5])g.gloss=r[5];
    var f=r[0].toLowerCase();
    if(!IDX[f]||r[1]<rows[IDX[f]-1][1])IDX[f]=i+1;
  }
}
function look(f){var i=IDX[f];return i?ROWS[i-1]:null;}
function cands(t){
  var c=[],n=t.length;
  if(IRR[t])c.push(IRR[t]);
  if(n>3&&/ies$/.test(t))c.push(t.slice(0,-3)+'y');
  if(n>2&&/(s|x|z|ch|sh)es$/.test(t))c.push(t.slice(0,-2));
  if(n>4&&/oes$/.test(t))c.push(t.slice(0,-2));
  if(n>2&&/s$/.test(t))c.push(t.slice(0,-1));
  if(n>3&&/ied$/.test(t))c.push(t.slice(0,-3)+'y');
  if(n>2&&/ed$/.test(t)){var b=t.slice(0,-2);c.push(b);c.push(b+'e');if(DBL.test(b))c.push(b.slice(0,-1));}
  if(n>4&&/ing$/.test(t)){var s=t.slice(0,-3);c.push(s);c.push(s+'e');if(DBL.test(s))c.push(s.slice(0,-1));if(/ying$/.test(t))c.push(t.slice(0,-4)+'ie');}
  if(n>3&&/ier$/.test(t))c.push(t.slice(0,-3)+'y');
  if(n>3&&/iest$/.test(t))c.push(t.slice(0,-4)+'y');
  if(n>3&&/er$/.test(t)){var e=t.slice(0,-2);c.push(e);c.push(e+'e');if(DBL.test(e))c.push(e.slice(0,-1));}
  if(n>4&&/est$/.test(t)){var e2=t.slice(0,-3);c.push(e2);c.push(e2+'e');if(DBL.test(e2))c.push(e2.slice(0,-1));}
  if(n>4&&/ily$/.test(t))c.push(t.slice(0,-3)+'y');
  if(n>5&&/ically$/.test(t)){c.push(t.slice(0,-4));c.push(t.slice(0,-2));}
  if(n>4&&/ably$|ibly$/.test(t))c.push(t.slice(0,-1)+'e');
  if(n>4&&/lly$/.test(t))c.push(t.slice(0,-1));
  if(n>3&&/ly$/.test(t)){c.push(t.slice(0,-2));c.push(t.slice(0,-2)+'le');}
  if(n>6&&/iness$/.test(t))c.push(t.slice(0,-5)+'y');
  if(n>5&&/ness$/.test(t))c.push(t.slice(0,-4));
  return c;
}
function lemma0(t){
  if(look(t))return t;
  var c=cands(t);
  for(var i=0;i<c.length;i++)if(c[i].length>1&&look(c[i]))return c[i];
  return null;
}
function lemma(t){
  if(look(t))return t;
  var c=cands(t);
  for(var i=0;i<c.length;i++)if(c[i].length>1&&look(c[i]))return c[i];
  /* 否定字首：依詞彙表〈編輯原則〉算回原字；un-、in-、im-、il-、ir-、non- 只接形容詞或副詞，dis- 不限詞性 */
  var P=['un','in','im','il','ir','non','dis'];
  for(var j=0;j<P.length;j++){
    var p=P[j];
    if(t.indexOf(p)!==0||t.length-p.length<4)continue;
    var rest=t.slice(p.length),rl=lemma0(rest);
    if(!rl)continue;
    var rr=look(rl);
    if(p==='dis'||/adj|adv/.test(rr[2]))return rl;
  }
  return null;
}

function analyze(text){
  var raw=text;
  text=text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:https?:\/\/|www\.)[^\s)]+/g,function(x){return x.replace(/./g,' ');});
  var re=/T-shirt|[A-Za-z\u00C0-\u024F]+/g, m, toks=[], props={};
  function atStart(pos){
    var j=pos-1;
    while(j>=0&&/[\s"'“”‘’(\[\-—]/.test(text.charAt(j)))j--;
    return j<0||/[.!?:;…\n]/.test(text.charAt(j))||/\n/.test(text.slice(j+1,pos));
  }
  while((m=re.exec(text))){
    var w=m[0], p=m.index, prev=text.charAt(p-1), nx=text.slice(p+w.length,p+w.length+2);
    var o={w:w,p:p,len:w.length,kind:'skip'};
    var apos=/['’]/;
    if(apos.test(prev)&&/^(s|t|re|ve|ll|d|m)$/i.test(w)){toks.push(o);continue;}
    if(apos.test(nx.charAt(0))&&/^t/i.test(nx.charAt(1))&&/n$/i.test(w)){toks.push(o);continue;}
    var low=w.toLowerCase();
    if(w==='I'||w.length<2){toks.push(o);continue;}
    if(/[0-9]/.test(prev)){toks.push(o);continue;}
    if(/[^\x00-\x7F]/.test(w)||SKIP[low]){o.kind='prop';toks.push(o);continue;}
    var lm=lemma(low);
    if(EX[low]&&EX[low].x){var bb=EX[low].b,lb=bb&&lemma(bb);if(lb){o.kind='list';o.lm=lb;}else{o.kind='out';o.cap=false;}toks.push(o);continue;}
    var cap=/^[A-Z]/.test(w), allcap=(w===w.toUpperCase());
    if(lm){o.kind='list';o.lm=lm;}
    else if(BASIC[low]){o.kind='skip';}
    else if(PLACE[low]){o.kind='prop';}
    else if(allcap){o.kind='skip';}
    else if(cap&&!atStart(p)){o.kind='prop';props[low]=1;}
    else{o.kind='out';o.cap=cap;}
    toks.push(o);
  }
  var i,o2;
  for(i=0;i<toks.length;i++){o2=toks[i];if(o2.kind==='out'&&o2.cap&&props[o2.w.toLowerCase()])o2.kind='prop';}
  /* 句首的字不在詞彙表、後面緊接著另一個大寫開頭的字（French President、Emmanuel Macron），當成專有名詞 */
  for(i=0;i<toks.length-1;i++){
    o2=toks[i];var nx2=toks[i+1];
    if(o2.kind==='out'&&o2.cap&&/^[A-Z]/.test(nx2.w)&&/^[ \t]+$/.test(text.slice(o2.p+o2.len,nx2.p)))o2.kind='prop';
  }
  /* 彙整 */
  var by={},order=[];
  for(i=0;i<toks.length;i++){
    o2=toks[i]; if(o2.kind!=='list'&&o2.kind!=='out')continue;
    var key=o2.kind==='list'?o2.lm:((EX[o2.w.toLowerCase()]&&EX[o2.w.toLowerCase()].b)||o2.w.toLowerCase());
    var e=by[key];
    if(!e){
      e={key:key,out:o2.kind==='out',n:0,forms:{},first:i};
      if(!e.out){var r=look(key);e.lv=r[1];e.pos=r[2];e.row=r;e.grp=GROUP[r[6]||r[0]];}
      by[key]=e;order.push(e);
    }
    e.n++; e.forms[o2.w.toLowerCase()]=1; o2.e=e; o2.fi=i;
  }
  var cnt=0;for(i=0;i<toks.length;i++)if(toks[i].kind!=='skip')cnt++;
  return {text:text,raw:raw,toks:toks,by:by,order:order,total:cnt};
}

function plain(g){return String(g).replace(/(^|；)\s*((?:[a-z]+\.(?:\/[a-z]+\.)*\s*)?)[^；→]*→/g,'$1$2');}
function exOf(e){var x=EX[e.key];if(x)return x;var k=Object.keys(e.forms);for(var i=0;i<k.length;i++)if(EX[k[i]])return EX[k[i]];return null;}
function exGloss(x){return x&&x.z?((x.p&&!/^[a-z.\/]+\.\s/.test(x.z))?x.p+' ':'')+x.z:'';}
function glossOf(e){
  if(e.out)return (LEX[e.key]&&LEX[e.key].g)?plain(LEX[e.key].g):exGloss(exOf(e));
  var p=POLY[e.key]; if(p)return p.fam&&p.test?p.fam+'；'+p.test:(p.fam||p.test||'');
  if(LEX[e.key]&&LEX[e.key].g)return plain(LEX[e.key].g);
  if(e.grp&&e.grp.gloss)return plain(e.grp.gloss);
  return exGloss(EX[e.key]);
}
function camUrl(w){return 'https://dictionary.cambridge.org/us/search/direct/?datasetsearch=english-chinese-traditional&q='+encodeURIComponent(w);}
function jget(u){return fetch(BASE+u).then(function(r){if(!r.ok)throw new Error(u+' '+r.status);return r.json();});}
function load(){
  if(!loading)loading=Promise.all([jget('cards/reverse_data.json'),jget('cards/polysemy_data.json').catch(function(){return null;}),jget('lexicon/lexicon_data.json').catch(function(){return null;}),jget('lexicon/passage_gloss.json').catch(function(){return null;}),(window.KK&&KK.ready)||null]).then(function(r){
    D=r[0];setup(D.rows);
    if(r[1])r[1].w.forEach(function(x){POLY[String(x.w).toLowerCase()]=x;});
    if(r[2]){var W=r[2].words;Object.keys(W).forEach(function(k){LEX[k.toLowerCase()]=W[k];});}
    if(r[3]){var G=r[3].words||{};Object.keys(G).forEach(function(k){EX[k.toLowerCase()]=G[k];});(r[3].skip||[]).forEach(function(k){SKIP[String(k).toLowerCase()]=1;});}
  });
  return loading;
}
var css='.pvBox{margin:1rem 0;border:1px solid rgba(128,128,128,.35);border-left:4px solid var(--crimson,#9b2c1f);border-radius:.4rem;padding:.2rem .8rem;background:rgba(155,44,31,.05)}.pvBox summary{cursor:pointer;font-weight:700;padding:.5rem 0}.pvHint{display:block;font-weight:400;font-size:.82em;opacity:.8;margin-top:.15rem}'+
 '.pvNote{font-size:.85em;opacity:.8;margin:.2rem 0 .6rem;line-height:1.7}.pvList{list-style:none;margin:0 0 .8rem;padding:0}.pvList li{padding:.45rem 0;border-top:1px dashed rgba(128,128,128,.35);line-height:1.6}'+
 '.pvW{font-weight:700;margin-right:.3rem}.pvMeta{font-size:.82em;opacity:.75;margin-left:.4rem}.pvZh{display:block}.pvHd{font-size:.95em;margin:.8rem 0 .2rem}.pvHd small{font-weight:400;opacity:.75;margin-left:.4rem}.pvNo a{font-size:.85em}';
function addCss(){if(document.getElementById('pv-css'))return;var s=document.createElement('style');s.id='pv-css';s.textContent=css;document.head.appendChild(s);}
function li(e){
  var g=glossOf(e), f=Object.keys(e.forms).filter(function(x){return x!==e.key;}).join('、');
  var h='<li><span class="pvW" lang="en">'+esc(e.key)+'</span>'+(window.SPK?SPK.html(e.key,true):'')+(window.KK?KK.html(e.key):'');
  h+='<span class="pvMeta">'+(e.out?'':e.lv+' 級'+(/^[a-z.\/]+\.\s/.test(g)?'':'　'+esc(e.pos||'')))+(f?(e.out?'':'　')+'文中：<span lang="en">'+esc(f)+'</span>':'')+'</span>';
  h+=g?'<span class="pvZh">'+esc(g)+'</span>':'<span class="pvZh pvNo"><a href="'+camUrl(e.key)+'" target="_blank" rel="noopener">查劍橋英漢 →</a></span>';
  return h+'</li>';
}
function html(text,opt){
  var th=(opt&&opt.th)||4;
  if(Array.isArray(text))text=text.join('\n');
  return load().then(function(){
    addCss();
    var A=analyze(String(text));
    var ins=A.order.filter(function(e){return !e.out&&e.lv>=th;}).sort(function(a,b){return a.first-b.first;});
    var out=A.order.filter(function(e){return e.out;}).sort(function(a,b){return a.first-b.first;});
    var h='<details class="pvBox"><summary>這一篇的生字表 <small>（詞彙表第 '+th+' 級以上 '+ins.length+' 個'+(out.length?'、詞彙表以外 '+out.length+' 個':'')+'）</small><span class="pvHint">點開看：每個字都有發音、音標和中文</span></summary>'+
      '<div class="pvNote">依文章出現的順序排列。級數依大考中心《高中英文參考詞彙表》（111 學年度起適用），中文意思與音標和本題庫的單字記憶卡一致。複數、過去式這類變化，列的是原形；文中的寫法標在「文中」。</div>';
    h+=ins.length?'<ul class="pvList">'+ins.map(li).join('')+'</ul>':'<p class="pvNote">這一篇沒有第 '+th+' 級以上的字。</p>';
    if(out.length)h+='<h3 class="pvHd">詞彙表以外<small>不在大考中心詞彙表裡，所以沒有級數；中文意思與音標對照 Merriam-Webster</small></h3><ul class="pvList">'+out.map(li).join('')+'</ul>';
    return h+'</details>';
  });
}
window.PV={html:html,load:load,analyze:analyze,glossOf:glossOf,exOf:exOf,camUrl:camUrl,ctx:function(){return {D:D,POLY:POLY,LEX:LEX,EX:EX};}};
})();
