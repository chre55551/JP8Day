/* 畫面邏輯：倒數、每日行程分頁、待辦清單。資料來自 data.js，圖示來自 icons.js */
(function(){
  "use strict";
  var KIND={sight:"景點",food:"美食",shop:"購物",move:"交通",rest:"休息"};

  function store(key,val){
    try{
      if(val===undefined){return JSON.parse(localStorage.getItem(key));}
      localStorage.setItem(key,JSON.stringify(val));
    }catch(e){return null;}
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function ttag(name){return '<span class="tt tt-'+name.replace(/\s/g,"")+'">'+esc(name)+'</span>';}

  /* ---------- 倒數 ---------- */
  var DEPART=Date.parse("2026-12-29T07:00:00+08:00");
  var RETURN=Date.parse("2027-01-05T13:50:00+08:00");
  function pad(n){return (n<10?"0":"")+n;}
  function tick(){
    var now=Date.now(), diff=DEPART-now;
    var note=document.getElementById("count-note");
    if(diff>0){
      var s=Math.floor(diff/1000);
      document.getElementById("cd-d").textContent=Math.floor(s/86400);
      document.getElementById("cd-h").textContent=pad(Math.floor(s%86400/3600));
      document.getElementById("cd-m").textContent=pad(Math.floor(s%3600/60));
      document.getElementById("cd-s").textContent=pad(s%60);
    }else{
      ["cd-d","cd-h","cd-m","cd-s"].forEach(function(id){document.getElementById(id).textContent="0";});
      note.textContent= now<RETURN ? "旅程進行中，玩得開心！" : "旅程結束了，歡迎回家。";
    }
  }
  tick(); setInterval(tick,1000);

  /* ---------- 每日行程 ---------- */
  var tabsEl=document.getElementById("tabs"), dayEl=document.getElementById("day");
  DAYS.forEach(function(day,i){
    var b=document.createElement("button");
    b.type="button";b.className="tab";b.id="tab-"+i;b.setAttribute("role","tab");
    b.setAttribute("aria-controls","day");
    b.innerHTML='<span class="d">'+day.d+'</span><span class="w">Day '+(i+1)+'・'+day.w+'</span>';
    b.addEventListener("click",function(){select(i,true);});
    tabsEl.appendChild(b);
  });
  tabsEl.addEventListener("keydown",function(e){
    if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;
    var cur=Number(store("kansai8-day"))||0;
    var next=(cur+(e.key==="ArrowRight"?1:-1)+DAYS.length)%DAYS.length;
    select(next,true);document.getElementById("tab-"+next).focus();e.preventDefault();
  });

  function renderDay(i){
    var day=DAYS[i];
    var h='<div class="day-head"><div class="day-icon">'+ICONS[day.icon]+'</div><div>'+
      '<div class="num">Day '+(i+1)+'・'+day.d+'（'+day.w+'）</div><h3>'+esc(day.title)+'</h3><div class="where">'+esc(day.where)+'</div></div>'+
      '<div class="route">'+day.route.map(ttag).join('<span class="arrow">→</span>')+'</div></div>';
    if(day.notes){
      h+='<div class="day-notes">'+day.notes.map(function(n){return '<p class="day-note">'+NOTE_ICON+'<span>'+esc(n)+'</span></p>';}).join("")+'</div>';
    }
    h+='<ol class="timeline">';
    day.items.forEach(function(it,j){
      var cls="ev k-"+it.k+(it.m?" must":"")+(it.x?" tbd":"");
      h+='<li class="'+cls+'" style="--i:'+j+'"><span class="time">'+esc(it.t)+'</span><span class="node" aria-hidden="true"></span><div class="card">'+
        '<div class="row1">'+(it.m?'<span class="must-badge">'+STAR+'必去</span>':'')+'<span class="kind">'+(it.x?"待安排":KIND[it.k])+'</span>'+(it.w?'<span class="warn">需確認</span>':'')+'</div>'+
        '<div class="ttl">'+esc(it.n)+'</div>'+(it.o?'<p class="note">'+esc(it.o)+'</p>':'')+
        (it.tr?'<div class="tags">'+it.tr.map(ttag).join("")+'</div>':'')+'</div></li>';
    });
    h+='</ol>';
    return h;
  }
  function select(i,animate){
    store("kansai8-day",i);
    Array.prototype.forEach.call(tabsEl.children,function(t,k){
      t.setAttribute("aria-selected",k===i?"true":"false");
      t.tabIndex=k===i?0:-1;
      t.classList.remove("bounce");
    });
    var tab=document.getElementById("tab-"+i);
    dayEl.setAttribute("aria-labelledby",tab.id);
    dayEl.innerHTML=renderDay(i);
    if(animate){
      void tab.offsetWidth; tab.classList.add("bounce");
      dayEl.classList.remove("pop"); void dayEl.offsetWidth; dayEl.classList.add("pop");
      var tr=tabsEl.getBoundingClientRect(), r=tab.getBoundingClientRect();
      if(r.left<tr.left||r.right>tr.right){tabsEl.scrollLeft+=r.left-tr.left-12;}
    }
  }
  var start=0;
  var todayIso=new Date(Date.now()+9*3600*1000).toISOString().slice(0,10); /* 日本時間 */
  var match=DAYS.findIndex(function(d){return d.iso===todayIso;});
  if(match>=0){start=match;}else{var saved=Number(store("kansai8-day"));if(saved>=0&&saved<DAYS.length)start=saved;}
  select(start,false);

  /* ---------- 待辦 ---------- */
  var list=document.getElementById("todo-list");
  var done=store("kansai8-todo")||{};
  TODOS.forEach(function(td,i){
    var li=document.createElement("li");
    li.innerHTML='<label class="'+(td.u?"urgent":"")+'" for="todo-'+i+'"><input type="checkbox" id="todo-'+i+'"'+(done[i]?" checked":"")+'><span>'+esc(td.t)+(td.when?'<span class="when">'+esc(td.when)+'</span>':'')+'</span></label>';
    list.appendChild(li);
  });
  function prog(){
    var n=0;TODOS.forEach(function(_,i){if(document.getElementById("todo-"+i).checked)n++;});
    document.getElementById("prog").textContent=n+" / "+TODOS.length;
    document.getElementById("bar").style.width=(n/TODOS.length*100)+"%";
  }
  list.addEventListener("change",function(e){
    if(!e.target.id)return;
    var i=Number(e.target.id.split("-")[1]);done[i]=e.target.checked;store("kansai8-todo",done);prog();
  });
  prog();
})();
