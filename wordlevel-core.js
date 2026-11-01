/* wordlevel-core.js：單字對照兩頁共用（查級別、單字說明面板） */
(function(){
if(!window.WL||!window.WL.c||!window.WL.zc||!window.WL.ex){return}/* 資料檔沒載入完整：不建立 WLC，由各頁的內嵌程式顯示提示 */
var W=window.WL,C=W.c,G=W.g,IRT=W.ir,T=new Set(W.t),GN={1:'初級',2:'中級',3:'中高級'};
var EX=W.ex||{};
var has=Object.prototype.hasOwnProperty;
function hc(o,k){return has.call(o,k)?o[k]:0}
function bases(w){var c=[],s;
 function add(x){if(x.length>=2&&c.indexOf(x)<0)c.push(x)}
 [['ed','e'],['ing','e']].forEach(function(p){if(w.slice(-p[0].length)===p[0]){s=w.slice(0,-p[0].length);if(/[^aeiou][aeiouy][^aeiouwxy]$/.test(s)||s.length<=2)add(s+'e')}});
 var suf=[['ies','y'],['ied','y'],['es',''],['s',''],['d',''],['ed',''],['ing',''],['ing','e'],['ying','ie'],['ly',''],['ily','y'],['ness',''],['iness','y'],['less',''],['ment',''],['er',''],['est',''],['ier','y'],['iest','y'],['ves','f'],['ves','fe']];
 suf.forEach(function(p){var L=p[0].length;if(p[0]==='s'&&w.slice(-2)==='ss')return;if(w.length>L&&w.slice(-L)===p[0])add(w.slice(0,-L)+p[1])});
 ['ed','ing','er','est'].forEach(function(x){if(w.slice(-x.length)===x){s=w.slice(0,-x.length);if(s.length>=2&&s[s.length-1]===s[s.length-2])add(s.slice(0,-1))}});
 ['un','in','im','il','ir','non','re'].forEach(function(p){if(w.indexOf(p)===0&&w.length-p.length>=3)add(w.slice(p.length))});
 return c}
var LS=new Set(W.hi.concat(W.mid));
function look(w){
 if(LS.has(w)){var g0=hc(G,w);return {c:0,g:g0?GN[g0]:0,gn:g0||0,t:T.has(w)}}
 var cs=[w],b=hc(IRT,w),i,k,r={c:0,g:0,gn:0,t:false};
 if(b)cs.push(b);cs=cs.concat(bases(w));
 for(i=0;i<cs.length;i++){k=cs[i];if(!r.c&&hc(C,k))r.c=C[k];if(!r.g&&hc(G,k)){r.gn=G[k];r.g=GN[G[k]]}if(!r.t&&T.has(k))r.t=true}
 return r}
function hit(r){return r.c||r.g||r.t}
function lookW(w){var r=look(w),alt;
 if(!hit(r)&&/[- ]/.test(w)){alt=w.replace(/[- ]/g,'');var r2=look(alt);if(hit(r2))return r2;
  alt=w.indexOf(' ')>=0?w.replace(/ /g,'-'):w.replace(/-/g,' ');r2=look(alt);if(hit(r2))return r2}
 if(!hit(r)&&w.indexOf('-')>0){var rs=w.split('-').filter(Boolean).map(look);if(rs.length>1&&rs.every(function(x){return x.c}))r.c=Math.max.apply(null,rs.map(function(x){return x.c}))}
 return r}
/* 拼法相近的字（打錯字時的候選）：先找開頭相同，再找只差一兩個字母的字 */
var ALLW=null;
function allWords(){if(ALLW)return ALLW;var o=Object.create(null);[Object.keys(C),Object.keys(G),W.t,W.hi,W.mid,Object.keys(W.zc||{}),Object.keys(W.z||{})].forEach(function(a){a.forEach(function(w){if(/^[a-z]/.test(w))o[w]=1})});ALLW=Object.keys(o).sort();return ALLW}
function ed(a,b,max){/* 編輯距離（含相鄰字母對調），超過 max 就提早結束 */
 var la=a.length,lb=b.length;if(Math.abs(la-lb)>max)return max+1;var p2=null,p1=[],cur,i,j;for(j=0;j<=lb;j++)p1[j]=j;
 for(i=1;i<=la;i++){cur=[i];var mn=i;for(j=1;j<=lb;j++){var v=Math.min(p1[j]+1,cur[j-1]+1,p1[j-1]+(a[i-1]===b[j-1]?0:1));if(p2&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,p2[j-2]+1);cur[j]=v;if(v<mn)mn=v}if(mn>max)return max+1;p2=p1;p1=cur}return p1[lb]}
function similar(w,n){n=n||8;var A=allWords(),out=[],seen=Object.create(null);function add(x){if(!seen[x]&&x!==w){seen[x]=1;out.push(x)}}
 var cand=[];var max=w.length<=4?1:2;
 A.forEach(function(x){var d=ed(w,x,max);if(d<=max)cand.push([d,x])});
 cand.sort(function(a,b){return a[0]-b[0]||(a[1]<b[1]?-1:1)});cand.forEach(function(c){add(c[1])});
 for(var k=1;k<=3&&out.length<n&&w.length-k>=3;k++){var p=w.slice(0,-k);A.forEach(function(x){if(out.length<n*2&&x.indexOf(p)===0&&x.length<=w.length+3)add(x)})}
 return out.slice(0,n)}
var Z=Object.assign({},W.zc||{},W.z||{});
function lemma(w){if(hc(Z,w))return w;var cs=[hc(IRT,w)].concat(bases(w));for(var i=0;i<cs.length;i++)if(cs[i]&&hc(Z,cs[i]))return cs[i];
 if(/[- ]/.test(w)){var al=[w.replace(/[- ]/g,''),w.indexOf(' ')>=0?w.replace(/ /g,'-'):w.replace(/-/g,' ')];for(var j=0;j<al.length;j++)if(hc(Z,al[j]))return al[j]}
 return w}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var CP=new Set(W.cp);
function cl(c){return c===9?'附錄字':c+' 級'}

/* 級別標籤：英檢初級綠、中級金、中高級紅；大考灰；多益藍。顏色旁一律有文字。 */
function bd(cls,txt){return '<span class="bd '+cls+'">'+txt+'</span>'}
function badges(r,all,short){var h='';
 h+=r.c?bd('bd-c',r.c===9?'大考附錄字':'大考 '+r.c+' 級'):bd('bd-no',short?'不在大考':'不在大考詞彙表');
 if(r.gn)h+=bd('bd-g'+r.gn,'英檢'+GN[r.gn]);else if(all)h+=bd('bd-no','不在英檢字表');
 if(r.t)h+=bd('bd-t','多益補充字表');else if(all)h+=bd('bd-no','不在多益補充字表');
 return h}

var IRB=null;
function irForms(w){if(!IRB){IRB=Object.create(null);Object.keys(IRT).forEach(function(f){var b=IRT[f];(IRB[b]=IRB[b]||[]).push(f)})}return has.call(IRB,w)?IRB[w]:[]}
function hl(sentence,w){
 var out=hl1(sentence,w);if(out.indexOf('<b>')>=0)return out;
 var alts=[w.replace(/-/g,''),w.replace(/-/g,' ')].concat(irForms(w));
 for(var i=0;i<alts.length;i++){if(alts[i]===w)continue;out=hl1(sentence,alts[i],true);if(out.indexOf('<b>')>=0)return out}
 return out}
function hl1(sentence,w,exact){
 var stem=!exact&&w.length>4?w.replace(/e$/,''):w,alts=[stem];
 if(/y$/.test(w)&&w.length>4)alts.push(w.slice(0,-1)+'i');
 var re=new RegExp('\\b(?:'+alts.map(function(a){return a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')[a-z]*','ig');
 var out='',last=0,m;re.lastIndex=0;
 while((m=re.exec(sentence))){out+=esc(sentence.slice(last,m.index))+'<b>'+esc(m[0])+'</b>';last=m.index+m[0].length;if(m[0].length===0)re.lastIndex++}
 return out+esc(sentence.slice(last));
}
/* 中文意思的顯示：詞性標記（「；v. 進入」這類）包成小標籤，並跟後面第一個字綁在一起，不會斷在詞性中間，也不會單獨留在行尾；符合搜尋詞的那一段標出來 */
var PS='(?:adj|adv|n|v|prep|conj|pron|aux|det|int|interj|num|abbr)\\.';
var POSRE=new RegExp('(^|；)('+PS+'(?:\\/'+PS+')*)( ?)(<mark class="hl">[\\s\\S]*?<\\/mark>|&[a-z]+;|[^<])','g');
function tagPos(h){return h.replace(POSRE,function(m,a,t,sp,n){return a+'<span class="nb"><span class="pt">'+t+'</span>'+sp+n+'</span>'})}
function zh(t,q){var s=String(t),i=q?s.indexOf(q):-1;
 return tagPos(i>=0?esc(s.slice(0,i))+'<mark class="hl">'+esc(q)+'</mark>'+esc(s.slice(i+q.length)):esc(s))}
/* 中文搜尋結果小卡：只顯示「符合的那一段」（以「；」分段），太長就以符合處為中心截短，並標出搜尋詞 */
function zpv(t,q){var s=String(t),segs=s.split('；'),k=-1,i;
 for(i=0;i<segs.length;i++)if(segs[i].indexOf(q)>=0){k=i;break}
 var seg=k>=0?segs[k]:s,p=seg.indexOf(q);
 if(p<0){var x=seg.slice(0,14);return esc(x)+(seg.length>14?'…':'')}
 var MAX=14,a=0,b=seg.length;
 if(seg.length>MAX){a=Math.max(0,p-4);b=Math.max(a+MAX,p+q.length);if(b>seg.length){b=seg.length;a=Math.max(0,Math.min(a,b-MAX))}if(a>p)a=p;if(b<p+q.length)b=p+q.length}
 var w=seg.slice(a,b),j=p-a;
 var h=esc(w.slice(0,j))+'<mark class="hl">'+esc(q)+'</mark>'+esc(w.slice(j+q.length));
 return (a>0?'…':'')+tagPos(h)+(b<seg.length?'…':'')}
/* 單字說明：面板與主頁單字查詢共用 */
function detail(w,opt){opt=opt||{};
 var r=lookW(w),lw=lemma(w),z=hc(Z,lw)?Z[lw]:null,xw=hc(W.x,w)||hc(W.x,lw),ex=hc(EX,w)||hc(EX,lw);
 var h='<div class="dw"><span class="w" lang="en">'+esc(w)+'</span>'+(lw!==w&&z?'<span class="p">（原形 '+esc(lw)+'）</span>':'')+(z&&z[0]?'<span class="p">'+esc(z[0])+'</span>':'')+(window.KK?KK.html(w):'')+(window.SPK?(SPK.html(w)||''):'')+'</div>'+
 '<div class="z">'+(z?zh(z[1]):'這個字沒有中文意思，請看下方的劍橋字典。')+'</div>'+
 '<div class="bds">'+badges(r,true)+'</div>';
 var m=[];
 if(CP.has(lw)||CP.has(w))m.push('複合字，注意是一個字、兩個字，還是有連字號');
 if(z&&w!==lw){var pk='（複數 '+w+'）',pi=z[1].indexOf(pk);if(pi>=0){var pr=z[1].slice(pi+pk.length).split(/[；（]/)[0];if(pr)m.unshift('<b>注意</b>：寫成複數 <b>'+esc(w)+'</b> 時，意思是「'+esc(pr)+'」')}}
 if(xw)m.push('歷屆學測試題中出現 '+xw[0]+' 份（'+esc(xw[1])+' 學年度）');
 if(m.length)h+='<div class="m">'+m.join('<br>')+'</div>';
 if(ex){
  h+='<div class="ex"><div class="exh">例句</div><p class="en">'+hl(ex.e,lw===w||!hc(EX,w)?lw:w)+'</p><p class="zhx">'+esc(ex.z)+'</p></div>';
  if(ex.c&&ex.c.length)h+='<div class="co" id="wco"><div class="exh">字詞搭配</div><ul>'+ex.c.map(function(c){return '<li><span class="ce">'+esc(c[0])+'</span> <span class="cz">'+esc(c[1])+'</span></li>'}).join('')+'</ul></div>';
 }
 h+='<div class="m"><a href="https://dictionary.cambridge.org/zht/search/direct/?datasetsearch=english-chinese-traditional&q='+encodeURIComponent(lw)+'" target="_blank" rel="noopener">到劍橋字典看更多</a></div>';
 return h}

/* 我的標記：只存在這個瀏覽器（localStorage） */
var MK={},canStore=true,MKKEY='wl_marks_v1';
/* 讀出的內容不是 {字:1 或 2} 的物件時（資料損壞），丟掉壞的部分，不讓整頁失效 */
function cleanMK(v){var o={};if(v&&typeof v==='object'&&!Array.isArray(v))Object.keys(v).forEach(function(k){var x=v[k];if((x===1||x===2)&&typeof k==='string'&&k&&k.length<=40)o[k]=x});return o}
function readMK(){var raw=null,v=null;try{raw=localStorage.getItem(MKKEY)}catch(e){return null}
 if(raw==null)return {};try{v=JSON.parse(raw)}catch(e){v=null}
 var o=cleanMK(v);if(!(v&&typeof v==='object'&&!Array.isArray(v))||Object.keys(o).length!==Object.keys(v).length){try{localStorage.setItem(MKKEY,JSON.stringify(o))}catch(e){}}
 return o}
try{localStorage.setItem('wl_t','1');canStore=localStorage.getItem('wl_t')==='1';localStorage.removeItem('wl_t')}catch(e){canStore=false}
if(canStore){var mk0=readMK();if(mk0)MK=mk0}
function loadMK(){if(!canStore)return;var o=readMK();if(o)MK=o}
function syncDom(){[].forEach.call(document.querySelectorAll('[data-w]'),function(el){var v=MK[el.getAttribute('data-w')];if(v)el.setAttribute('data-m',v);else el.removeAttribute('data-m')})}
try{window.addEventListener('storage',function(e){if(e.key==='wl_marks_v1'||e.key===null){loadMK();syncDom();if(window.WLC&&WLC.onMark)WLC.onMark(null,0)}})}catch(e){}
function saveMK(){if(!canStore)return false;try{var t=JSON.stringify(MK);localStorage.setItem(MKKEY,t);return localStorage.getItem(MKKEY)===t}catch(e){return false}}
function mark(w){return MK[w]||0}
function setMark(w,v){loadMK();if(v)MK[w]=v;else delete MK[w];if(canStore&&!saveMK())canStore=false;
 [].forEach.call(document.querySelectorAll('[data-w]'),function(el){if(el.getAttribute('data-w')===w){if(v)el.setAttribute('data-m',v);else el.removeAttribute('data-m')}});
 if(window.WLC&&WLC.onMark)WLC.onMark(w,v)}
function clearMarks(){loadMK();MK={};saveMK();[].forEach.call(document.querySelectorAll('[data-m]'),function(el){el.removeAttribute('data-m')});if(window.WLC&&WLC.onMark)WLC.onMark(null,0)}
function allMarks(){loadMK();var o={};Object.keys(MK).forEach(function(k){o[k]=MK[k]});return o}
/* 只收字表裡查得到的字（含 café、résumé 這類重音字母） */
function known(k){return typeof k==='string'&&k.length<=40&&(has.call(Z,k)||hit(lookW(k)))}
function importMarks(obj){loadMK();var n=0;if(!obj||typeof obj!=='object'||Array.isArray(obj))return 0;var seenK=Object.create(null);Object.keys(obj).forEach(function(k0){var v=obj[k0],k=String(k0).normalize('NFC').toLowerCase();if((v===1||v===2)&&known(k)){MK[k]=v;if(!seenK[k]){seenK[k]=1;n++}}});if(n)saveMK();syncDom();if(window.WLC&&WLC.onMark)WLC.onMark(null,0);return n}
function marked(){return Object.keys(MK).length}
function speak(w){try{var u=new SpeechSynthesisUtterance(w);u.lang='en-US';u.rate=.9;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}catch(e){}}
var canSpeak='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
/* 底部面板 */
var wd=document.createElement('div');wd.id='wd';wd.className='wd';wd.hidden=true;wd.setAttribute('role','region');wd.setAttribute('aria-label','單字說明');
wd.innerHTML='<div class="in"><button type="button" id="wdx" aria-label="關閉">×</button><div id="wdb" tabindex="-1"></div><button type="button" class="morehint" id="wmore" hidden></button><div class="act"><button type="button" id="wp" class="nv" aria-label="上一個">‹<span class="lt"> 上一個</span></button><button type="button" id="wsp">🔊 發音</button><button type="button" id="wm1" aria-pressed="false">↻ 再複習</button><button type="button" id="wm2" aria-pressed="false">✓ 我會了</button><button type="button" id="wn" class="nv" aria-label="下一個"><span class="lt">下一個 </span>›</button></div><p class="ms" id="wms"></p></div>';
document.body.appendChild(wd);
var wdb=document.getElementById('wdb'),wp=document.getElementById('wp'),wn=document.getElementById('wn'),wmore=document.getElementById('wmore');
/* 面板內容超過可視高度時，底部顯示提示，捲到底就隱藏 */
function moreHint(){var over=wdb.scrollHeight-wdb.clientHeight>4,atEnd=wdb.scrollTop+wdb.clientHeight>=wdb.scrollHeight-6;
 if(!over||atEnd){wmore.hidden=true;return}
 var co=wdb.querySelector('.co'),n=co?co.querySelectorAll('li').length:0,coHidden=co&&co.getBoundingClientRect().bottom>wdb.getBoundingClientRect().bottom+2;
 wmore.textContent=n&&coHidden?'↓ 往下捲動，看字詞搭配（'+n+' 組）':'↓ 往下捲動，看下面的內容';wmore.hidden=false}
wdb.addEventListener('scroll',moreHint,{passive:true});
wmore.addEventListener('click',function(){var co=wdb.querySelector('.co');if(co)wdb.scrollTop=co.offsetTop-wdb.offsetTop-4;else wdb.scrollTop=wdb.scrollHeight;moreHint()});
var st=document.getElementById('st');
var P={list:[],i:-1,onNav:null,back:null};
function pad(){document.body.style.paddingBottom=wd.hidden?'':wd.offsetHeight+'px'}
function actState(w){var m=mark(w);var a=document.getElementById('wm1'),b=document.getElementById('wm2');a.setAttribute('aria-pressed',m===1?'true':'false');b.setAttribute('aria-pressed',m===2?'true':'false');a.classList.toggle('on',m===1);b.classList.toggle('on',m===2);document.getElementById('wsp').hidden=!canSpeak;document.getElementById('wms').textContent=canStore?'':'這個瀏覽器不能儲存標記，關掉頁面後標記會消失。'}
function render(){var w=P.list[P.i];wdb.innerHTML=detail(w);actState(w);
 if(P.hz){var hs=wdb.querySelectorAll('.z,.zhx,.cz');if(hs.length){[].forEach.call(hs,function(e){e.hidden=true});var sb=document.createElement('button');sb.type='button';sb.className='showz';sb.textContent='看中文意思';sb.onclick=function(){[].forEach.call(hs,function(e){e.hidden=false});sb.remove()};var z0=wdb.querySelector('.z');z0.parentNode.insertBefore(sb,z0)}}
wdb.scrollTop=0;wp.disabled=P.i<=0;wn.disabled=P.i>=P.list.length-1;wd.hidden=false;pad();moreHint();
 if(st)st.textContent=P.hz?w:w+'：'+((hc(Z,lemma(w))?Z[lemma(w)][1]:''));
 if(P.onNav)P.onNav(w,P.i)}
P.open=function(list,i,onNav,back){P.list=list;P.i=i;P.onNav=onNav||null;P.back=back||null;
 if(back&&back.closest){var box=back.closest('details')||back.closest('ul,ol');if(box&&box.parentNode&&box.nextSibling!==wd)box.parentNode.insertBefore(wd,box.nextSibling)}
 render()};
P.go=function(d){var n=P.i+d;if(n<0||n>=P.list.length)return;P.i=n;render()};
P.close=function(noFocus){if(wd.hidden)return;wd.hidden=true;pad();var b=P.back;P.list=[];P.i=-1;if(P.onNav)P.onNav(null,-1);P.onNav=null;P.back=null;if(!noFocus&&b&&document.contains(b))b.focus()};
P.isOpen=function(){return !wd.hidden};
wd.addEventListener('click',function(e){var id=e.target.id;var cw=P.list[P.i];
 if(id==='wsp'){speak(cw);return}
 if(id==='wm1'||id==='wm2'){var v=id==='wm1'?1:2,nv=mark(cw)===v?0:v;setMark(cw,nv);actState(cw);document.getElementById('wms').textContent=!canStore?'這個瀏覽器不能儲存標記，關掉頁面後標記會消失。':nv?'已標記：'+(nv===1?'再複習':'我會了'):'已取消標記';return}
if(id==='wp'||id==='wn'){P.go(id==='wp'?-1:1);var bb=id==='wp'?wp:wn;(bb.disabled?(id==='wp'?wn:wp):bb).focus()}});
document.getElementById('wdx').addEventListener('click',function(){P.close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!wd.hidden){var t=e.target;P.close(t&&t.tagName==='INPUT');}});
window.addEventListener('resize',function(){pad();if(!wd.hidden)moreHint()});
/* 讓被選的項目不被面板蓋住 */
P.reveal=function(el){if(!el)return;var r=el.getBoundingClientRect(),t=wd.getBoundingClientRect().top;if(r.bottom>t-8||r.top<0)window.scrollBy({top:r.bottom-t+24,behavior:'smooth'})};
/* 一個 tab 停駐點，方向鍵移動（容器內每一項要有 data-w） */
function rove(box,sel,onKey){
 box.addEventListener('keydown',function(e){var li=e.target.closest&&e.target.closest(sel);if(!li||!box.contains(li))return;
  var k=e.key,items=[].filter.call(box.querySelectorAll(sel),function(x){return !x.hidden&&!x.classList.contains('hid')&&!x.classList.contains('nc')});
  var i=items.indexOf(li),go=null;
  if(k==='Enter'||k===' '){e.preventDefault();li.click();return}
  if(k==='ArrowRight'||k==='ArrowDown')go=items[i+1];else if(k==='ArrowLeft'||k==='ArrowUp')go=items[i-1];
  else if(k==='Home')go=items[0];else if(k==='End')go=items[items.length-1];
  if(go){e.preventDefault();li.tabIndex=-1;go.tabIndex=0;go.focus();if(P.isOpen()&&onKey)onKey(go)}})}
function setRoving(box,sel){var first=null;[].forEach.call(box.querySelectorAll(sel),function(li){if(li.classList.contains('nc')||li.classList.contains('hid')){li.removeAttribute('tabindex');return}li.setAttribute('role','option');li.setAttribute('aria-selected',li.classList.contains('sel')?'true':'false');if(!first){first=li;li.tabIndex=0}else li.tabIndex=-1})}

/* 單字總表的列（大考詞彙表＋英檢補強清單＋多益補充字表），進度與每日計畫用同一組字計算 */
var ROWS=null;
function rowWords(){if(ROWS)return ROWS;var o=Object.create(null);Object.keys(C).concat(W.hi,W.mid,W.t).forEach(function(w){o[w]=1});ROWS=Object.keys(o).sort(function(a,b){return a<b?-1:a>b?1:0});return ROWS}
var LVOF=null;
function levelOf(w){if(!LVOF){LVOF=Object.create(null);rowWords().forEach(function(x){LVOF[x]=lookW(x).c})}return has.call(LVOF,w)?LVOF[w]:0}
window.WLC={zh:zh,zpv:zpv,rowWords:rowWords,levelOf:levelOf,similar:similar,allMarks:allMarks,importMarks:importMarks,speak:speak,canSpeak:canSpeak,mark:mark,setMark:setMark,clearMarks:clearMarks,marked:marked,canStore:function(){return canStore},W:W,look:lookW,lemma:lemma,Z:Z,hc:hc,esc:esc,cl:cl,GN:GN,badges:badges,bd:bd,detail:detail,P:P,CP:CP,rove:rove,setRoving:setRoving,bases:bases,EX:EX};
window.__look=lookW;
})();
