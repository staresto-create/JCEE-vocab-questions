/* 詞彙題詳解頁的「教材」一行（2026-11-12）：標出答案收在龍騰、三民、《核心字彙》的哪一冊哪一課（單元）。
   標記寫法和單字卡（cards/word.html）、貼上文章查單字（cards/mark.html）、各題庫的生字表完全相同，
   資料 textbook/vocab_lines.json 由同一支標記程式（passage-vocab.js 的 PV.tb.line）逐題產生。
   用法：頁面載入本程式（defer），顯示詳解時呼叫 TBLINE.fill(題目物件, 容器元素)；讀不到資料就不顯示，不影響詳解頁。 */
(function(){
'use strict';
var BASE=(function(){var s=document.currentScript&&document.currentScript.src;return s?s.slice(0,s.lastIndexOf('/')+1):'';})();
var LEGEND='教材標記：龍＝龍騰、乙＝三民乙版、乙115＝三民乙版 115 改版、甲＝三民甲版、核＝《核心字彙》。B 後面是冊數，L 是 Lesson，R 是 Review，U 是 Unit，例如龍 B2L5 是龍騰第 2 冊 Lesson 5，龍 B3R2 是龍騰第 3 冊 Review 2，乙 B1U3 是三民乙版第 1 冊 Unit 3；核 B3U12 是《核心字彙》第 3 冊 Unit 12。編號後面有 △ 的，列在 Words for Recognition；沒有 △ 的，列在 Words for Production，或是那本書的單字表沒有分這兩類（例如《核心字彙》）。只比對各單字表的標題字。答案是變化形或衍生字時，答案後面的括號會寫明教材收的是哪個字，例如 disturbs（原形 disturb）、deliberately（由 deliberate 衍生）；答案本身和原形都有收錄時，會分段寫，例如 recently：乙 B2U3　recent：龍 B5L4。「教材未收」表示龍騰、三民課本和《核心字彙》都沒有收錄這個字；後面有括號的，括號內是大考中心詞彙表的級別，沒有括號的表示大考中心詞彙表也沒有收錄。片語和句型不列標記，標記只比對單字表的單字，三民列在標題字底下的衍生字也不比對。※ 表示教材單字表列的意思和這題考的意思不同。';
var data=null, loading=null;
function load(){
  if(!loading)loading=fetch(BASE+'textbook/vocab_lines.json').then(function(r){return r.ok?r.json():null;}).then(function(j){data=(j&&j.lines)||{};}).catch(function(){data={};});
  return loading;
}
var st=document.createElement('style');
st.textContent='.tb-box{display:none;margin-top:10px;padding:10px 14px;background:var(--tint-sage2);border:1px solid var(--rule);border-radius:3px;font-size:13px;line-height:1.8;color:var(--ink-soft);overflow-wrap:anywhere}'+
  '.tb-box.show{display:block}'+
  '.tb-box .tb-name{color:var(--sage);font-family:"Noto Serif TC",serif;font-weight:700}'+
  '.tb-box details{margin-top:4px}.tb-box summary{cursor:pointer;font-size:12px;color:var(--ink-soft)}'+
  '.tb-box details p{margin:6px 0 0;font-size:12px;line-height:1.8}'+
  '@media print{.tb-box{display:none!important}}';
document.head.appendChild(st);
function fill(q,box){
  if(!box||!q)return;
  box.textContent='';box.classList.remove('show');box._qid=q.id;
  load().then(function(){
    var t=data[q.id];
    if(!t||box._qid!==q.id)return;
    var line=document.createElement('div');
    var nm=document.createElement('span');nm.className='tb-name';nm.textContent='教材　';
    line.appendChild(nm);line.appendChild(document.createTextNode(t));
    var d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');
    s.textContent='教材標記怎麼看';p.textContent=LEGEND;d.appendChild(s);d.appendChild(p);
    box.appendChild(line);box.appendChild(d);box.classList.add('show');
  });
}
window.TBLINE={fill:fill};
})();
