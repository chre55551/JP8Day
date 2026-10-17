/* 畫面邏輯：倒數、每日行程分頁、待辦清單、建議備選。index.html 和 prep.html 共用；資料來自 data.js，圖示來自 icons.js */
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
  function initCountdown(){
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
  }

  /* ---------- 每日行程 ---------- */
  function initDays(){
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
  }

  /* ---------- 待辦 ---------- */
  function initTodo(){
    var list=document.getElementById("todo-list");
    var done=store("kansai8-todo-v3");
    if(!done){
      /* 舊版用順序記勾選（v1→v2 曾移除第 5 項），換成用 id 記 */
      var V2=["hotel","usj","teamlab","tonemon","ukb-t2","icoca","keihan","recheck","gmaps","life","first-train","nm-lottery","marukyu"];
      var old=store("kansai8-todo-v2");
      if(!old){
        var v1=store("kansai8-todo")||{};old={};
        Object.keys(v1).forEach(function(k){var n=Number(k);if(n<4)old[n]=v1[k];else if(n>4)old[n-1]=v1[k];});
      }
      done={};
      Object.keys(old).forEach(function(k){if(old[k]&&V2[k])done[V2[k]]=true;});
      store("kansai8-todo-v3",done);
    }
    TODOS.forEach(function(td,i){
      var li=document.createElement("li");
      li.innerHTML='<label class="'+(td.u?"urgent":"")+'" for="todo-'+i+'"><input type="checkbox" id="todo-'+i+'"'+(done[td.id]?" checked":"")+'><span>'+esc(td.t)+(td.when?'<span class="when">'+esc(td.when)+'</span>':'')+'</span></label>';
      if(td.href){li.innerHTML+='<a class="todo-link" href="'+esc(td.href)+'" target="_blank" rel="noopener">'+esc(td.hl||"連結")+'</a>';}
      list.appendChild(li);
    });
    function prog(){
      var n=0;TODOS.forEach(function(_,i){if(document.getElementById("todo-"+i).checked)n++;});
      document.getElementById("prog").textContent=n+" / "+TODOS.length;
      document.getElementById("bar").style.width=(n/TODOS.length*100)+"%";
    }
    list.addEventListener("change",function(e){
      if(!e.target.id)return;
      var i=Number(e.target.id.split("-")[1]);done[TODOS[i].id]=e.target.checked;store("kansai8-todo-v3",done);prog();
    });
    prog();
  }

  /* ---------- 建議備選 ---------- */
  function initIdeas(){
    function mapUrl(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);}
    function tbUrl(q){return "https://tabelog.com/rstLst/?vs=1&sw="+encodeURIComponent(q);}
    function a(href,label,cls){return '<a class="'+cls+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(label)+'</a>';}
    document.getElementById("plans-list").innerHTML=PLANS.map(function(it){
      return '<article class="idea"><h4>'+esc(it.title)+'</h4><p class="why">'+esc(it.why)+'</p>'+
        '<ol>'+it.plan.map(function(p){return '<li>'+esc(p)+'</li>';}).join("")+'</ol>'+
        '<div class="idea-links">'+it.links.map(function(l){return a(l.u||mapUrl(l.q),l.n,"lk");}).join("")+'</div>'+
        (it.note?'<p class="idea-note">'+NOTE_ICON+'<span>'+esc(it.note)+'</span></p>':'')+'</article>';
    }).join("");

    function row(it,food){
      var links=[];
      if(it.u)links.push(a(it.u,"介紹","lk"));
      if(it.u2)links.push(a(it.u2,"介紹 2","lk"));
      if(it.tb)links.push(a(tbUrl(it.q),"食べログ","lk"));
      links.push(a(mapUrl(it.q),"地圖","lk lk-map"));
      return '<li class="pick'+(it.s?" on":"")+'"><div class="pick-top"><span class="pick-n">'+esc(it.n)+'</span>'+
        (it.s?'<span class="pick-s">已排 '+esc(it.s)+'</span>':'')+
        (food&&it.p?'<span class="pick-p">¥'+esc(it.p)+'</span>':'')+'</div>'+
        '<p class="pick-d">'+esc(it.d)+'</p><div class="idea-links">'+links.join("")+'</div></li>';
    }
    var AREAS=["大阪","京都","宇治","奈良","神戶"];
    var areaTabs=document.getElementById("area-tabs"), picksEl=document.getElementById("picks");
    function showArea(area){
      store("kansai8-area",area);
      Array.prototype.forEach.call(areaTabs.children,function(b){b.setAttribute("aria-selected",b.dataset.a===area?"true":"false");});
      picksEl.innerHTML=[["景點",SPOTS,false],["美食",FOODS,true],["購物",SHOPS,false]].map(function(g){
        var list=g[1].filter(function(x){return x.a===area;});
        return '<div class="pick-col"><h4>'+g[0]+'（'+list.length+'）</h4>'+
          (list.length?'<ul class="picks">'+list.map(function(x){return row(x,g[2]);}).join("")+'</ul>':'<p class="pick-d">這區還沒有'+g[0]+'備選。</p>')+'</div>';
      }).join("");
    }
    AREAS.forEach(function(ar){
      var b=document.createElement("button");b.type="button";b.className="area-tab";b.dataset.a=ar;b.setAttribute("role","tab");
      b.textContent=ar;b.addEventListener("click",function(){showArea(ar);});areaTabs.appendChild(b);
    });
    var savedArea=store("kansai8-area");showArea(AREAS.indexOf(savedArea)>=0?savedArea:"大阪");
  }

  /* 伴手禮清單：買到就打勾，用 id 記在這台裝置 */
  function initGifts(){
    var list=document.getElementById("gift-list"),got=store("kansai8-gifts")||{};
    GIFTS.forEach(function(g,i){
      var li=document.createElement("li");
      li.innerHTML='<label for="gift-'+i+'"><input type="checkbox" id="gift-'+i+'"'+(got[g.id]?" checked":"")+'><span>'+esc(g.n)+
        (g.d?'<span class="when">'+esc(g.d)+'</span>':'')+(g.buy?'<span class="when">在哪買：'+esc(g.buy)+'</span>':'')+'</span></label>';
      list.appendChild(li);
    });
    function prog(){
      var n=0;GIFTS.forEach(function(g){if(got[g.id])n++;});
      document.getElementById("gift-prog").textContent=n+" / "+GIFTS.length;
      document.getElementById("gift-bar").style.width=(GIFTS.length?n/GIFTS.length*100:0)+"%";
    }
    list.addEventListener("change",function(e){
      if(!e.target.id)return;
      got[GIFTS[Number(e.target.id.split("-")[1])].id]=e.target.checked;store("kansai8-gifts",got);prog();
    });
    prog();
  }

  /* 兩頁共用這支程式：頁面上有哪個區塊就啟動哪個 */
  [["cd-d",initCountdown],["tabs",initDays],["todo-list",initTodo],["gift-list",initGifts],["plans-list",initIdeas]].forEach(function(p){
    if(document.getElementById(p[0]))p[1]();
  });

  /* 離線快取（sw.js）；file:// 預覽時不支援，略過 */
  var swReg=null;
  if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
    navigator.serviceWorker.register("sw.js").then(function(r){swReg=r;}).catch(function(){});
  }

  /* 點左上角標題：回首頁並強制抓最新版（網址加 ?r= 繞過瀏覽器快取，載入後再拿掉） */
  if(/[?&]r=\d+/.test(location.search))history.replaceState(null,"",location.pathname+location.hash);
  var brand=document.querySelector(".brand");
  if(brand)brand.addEventListener("click",function(e){
    e.preventDefault();
    var go=function(){location.replace("index.html?r="+Date.now()+"#home");};
    if(swReg)swReg.update().then(go,go);else go();
  });
})();
