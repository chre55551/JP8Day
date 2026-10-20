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
      if(heroHidden)return;
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

  /* 首頁插圖捲出畫面就暫停動畫和倒數，省電、捲動更順 */
  var heroHidden=false;
  function initHeroPause(){
    var arts=document.querySelectorAll(".hero-art");
    if(!arts.length||!("IntersectionObserver" in window))return;
    new IntersectionObserver(function(es){
      heroHidden=!es[0].isIntersecting;
      Array.prototype.forEach.call(arts,function(a){a.classList.toggle("paused",heroHidden);});
    }).observe(document.getElementById("home"));
  }

  /* 深淺色切換：預設跟手機設定，按右上角按鈕就記住選擇 */
  function initTheme(){
    var btn=document.getElementById("theme-btn"),root=document.documentElement;
    var mq=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
    function current(){return root.dataset.theme||(mq&&mq.matches?"dark":"light");}
    function paintBar(){
      Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'),function(m){
        if(root.dataset.theme)m.setAttribute("content",root.dataset.theme==="dark"?"#1C1E21":"#FFFCF6");
      });
    }
    paintBar();
    btn.addEventListener("click",function(){
      root.dataset.theme=current()==="dark"?"light":"dark";store("kansai8-theme",root.dataset.theme);paintBar();
    });
  }

  /* ---------- 附近可換：行程卡片可以換成距離近的備選 ---------- */
  var SWAP_KEY="kansai8-swaps";
  var RADIUS=1.5; /* 直線 1.5 公里內（走路約 25 分）才列出來 */
  var swaps=store(SWAP_KEY)||{};
  /* 備選的代號：清單＋名稱，資料順序改了也不會跑掉 */
  var PICKS=[];
  if(typeof FOODS!=="undefined"){
    FOODS.forEach(function(p){PICKS.push({id:"F:"+p.n,food:true,p:p});});
    SPOTS.concat(SHOPS).forEach(function(p){PICKS.push({id:"S:"+p.n,food:false,p:p});});
  }
  function pickById(id){for(var i=0;i<PICKS.length;i++)if(PICKS[i].id===id)return PICKS[i];return null;}
  function ll(q){return q&&typeof LL!=="undefined"?LL[q]:null;}
  function km(a,b){
    var r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r;
    var h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)*Math.sin(dg/2);
    return 6371*2*Math.asin(Math.sqrt(h));
  }
  /* 直線距離 × 1.3 估實際路程，走路每分鐘 80 公尺 */
  function walkMin(d){return Math.max(1,Math.round(d*1.3*1000/80));}
  function swapKey(day,it){return day.d+"|"+it.n;}
  /* 這一站的位置；待安排、沒填地點的，用前面最近一站的位置 */
  function anchor(day,j){
    for(var k=j;k>=0;k--){var p=ll(day.items[k].q);if(p)return {ll:p,q:day.items[k].q};if(k===j&&!day.items[j].x)return null;}
    return null;
  }
  function alternatives(day,j){
    var it=day.items[j];
    /* 必去不能換；最後一站固定是便利商店＋超市，也不換 */
    if(it.m||/^最後一站/.test(it.n)||(it.k!=="food"&&it.k!=="shop"&&it.k!=="sight"))return null;
    var a=anchor(day,j);if(!a)return null;
    var today={};day.items.forEach(function(x){if(x.q)today[x.q]=1;});
    var out=[];
    PICKS.forEach(function(pk){
      if(pk.food!==(it.k==="food")||today[pk.p.q]||/官方/.test(pk.p.n))return;
      var p=ll(pk.p.q);if(!p)return;
      var d=km(a.ll,p);if(d<=RADIUS)out.push({pk:pk,d:d});
    });
    out.sort(function(x,y){return x.d-y.d;});
    return {from:a,list:out.slice(0,8)};
  }
  function dirUrl(from,to){
    return "https://www.google.com/maps/dir/?api=1&amp;travelmode=walking&amp;origin="+encodeURIComponent(from)+"&amp;destination="+encodeURIComponent(to);
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
        /* 注意事項預設收起來，第一站不會被擠到螢幕外 */
        h+='<details class="day-notes"><summary>'+NOTE_ICON+'<span>注意事項（'+day.notes.length+'）</span></summary>'+
          day.notes.map(function(n){return '<p class="day-note">'+esc(n)+'</p>';}).join("")+'</details>';
      }
      h+='<ol class="timeline">';
      day.items.forEach(function(it,j){
        /* 怎麼到這一站：放在兩張卡片中間 */
        if(it.tr)h+='<li class="leg" aria-label="交通"><span></span><div class="leg-in">↓ '+it.tr.map(ttag).join("")+'</div></li>';
        var alt=alternatives(day,j), sw=alt&&swaps[swapKey(day,it)]?pickById(swaps[swapKey(day,it)]):null;
        var cls="ev k-"+it.k+(it.m?" must":"")+(it.x&&!sw?" tbd":"")+(sw?" swapped":"");
        var show=sw?{n:sw.p.n,o:sw.p.d,q:sw.p.q,h:sw.p.h}:it;
        var go=show.q?'<a class="go-btn" href="https://www.google.com/maps/dir/?api=1&amp;travelmode=transit&amp;destination='+encodeURIComponent(show.q)+'" target="_blank" rel="noopener">導航</a>':'';
        var altBtn=alt&&(alt.list.length||sw)?'<button type="button" class="alt-btn" aria-expanded="false" data-j="'+j+'">附近可換（'+alt.list.length+'）</button>':'';
        h+='<li class="'+cls+'" style="--i:'+j+'"><span class="tpill'+(it.t?'':' empty')+'">'+esc(it.t)+'</span><div class="card">'+
          '<div class="row1">'+(it.m?'<span class="must-badge">'+STAR+'必去</span>':'')+'<span class="kind">'+(it.x&&!sw?"待安排":KIND[it.k])+'</span>'+(sw?'<span class="swap-badge">已替換</span>':'')+(it.w&&!sw?'<span class="warn">需確認</span>':'')+'</div>'+
          '<div class="ttl">'+esc(show.n)+'</div>'+(show.o?'<p class="note clamp">'+esc(show.o)+'</p>':'')+
          (show.h?'<p class="hours">營業：'+esc(show.h)+'</p>':'')+
          (sw?'<p class="orig">原本：'+esc(it.n)+'<button type="button" class="alt-undo" data-j="'+j+'">換回</button></p>':'')+
          (go||altBtn?'<div class="tags">'+altBtn+go+'</div>':'')+
          (altBtn?'<div class="alts" id="alts-'+j+'" hidden></div>':'')+'</div></li>';
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
      markNow();
      addMore();
      /* 日期分頁黏在頂端時換天，捲回新那天的開頭 */
      if(animate&&tabsEl.getBoundingClientRect().top<=stickyTop()+1){
        window.scrollTo({top:dayEl.getBoundingClientRect().top+window.scrollY-stickyTop()-tabsEl.offsetHeight-8});
      }
      if(animate){
        void tab.offsetWidth; tab.classList.add("bounce");
        dayEl.classList.remove("pop"); void dayEl.offsetWidth; dayEl.classList.add("pop");
        var tr=tabsEl.getBoundingClientRect(), r=tab.getBoundingClientRect();
        if(r.left<tr.left||r.right>tr.right){tabsEl.scrollLeft+=r.left-tr.left-12;}
      }
    }
    /* 說明超過 3 行的才加「展開全文」按鈕 */
    function addMore(){
      Array.prototype.forEach.call(dayEl.querySelectorAll(".note.clamp"),function(n){
        if(n.scrollHeight>n.clientHeight+2&&!(n.nextElementSibling&&n.nextElementSibling.classList.contains("more"))){
          n.insertAdjacentHTML("afterend",'<button type="button" class="more" aria-expanded="false">展開全文</button>');
        }
      });
    }
    /* 附近可換的清單：按下去才產生 */
    function renderAlts(day,j){
      var it=day.items[j],alt=alternatives(day,j),cur=swaps[swapKey(day,it)];
      var rows=alt.list.map(function(x){
        var p=x.pk.p,on=cur===x.pk.id;
        return '<li class="alt'+(on?' on':'')+'"><div class="alt-top"><span class="alt-n">'+esc(p.n)+'</span>'+
          '<span class="alt-dist">走路約 '+walkMin(x.d)+' 分</span>'+(p.p?'<span class="pick-p">¥'+esc(p.p)+'</span>':'')+
          (p.s?'<span class="pick-s">已排 '+esc(p.s)+'</span>':'')+'</div>'+
          '<p class="alt-d">'+esc(p.d)+'</p>'+
          '<p class="hours">營業：'+(p.h?esc(p.h):'還沒查，出發前看 Google Maps')+'</p>'+
          '<div class="alt-btns">'+(on?'<span class="alt-cur">目前選這間</span>':'<button type="button" class="alt-use" data-j="'+j+'" data-id="'+esc(x.pk.id)+'">換成這間</button>')+
          '<a class="lk" href="'+dirUrl(alt.from.q,p.q)+'" target="_blank" rel="noopener">路線</a></div></li>';
      }).join("");
      return (rows?'<ul class="alt-list">'+rows+'</ul>':'<p class="alt-d">附近沒有其他備選。</p>')+
        '<p class="alt-foot">距離是從「'+esc(alt.from.q)+'」算的直線估計，實際走法按「路線」看 Google Maps。換過的只記在這支手機。</p>';
    }
    function curDay(){return DAYS[Number(store("kansai8-day"))||0];}
    function setSwap(j,id){
      var day=curDay(),k=swapKey(day,day.items[j]);
      if(id)swaps[k]=id;else delete swaps[k];
      store(SWAP_KEY,swaps);
      var y=window.scrollY;dayEl.innerHTML=renderDay(Number(store("kansai8-day"))||0);markNow();addMore();window.scrollTo(0,y);
    }
    dayEl.addEventListener("click",function(e){
      var t=e.target.closest(".alt-btn,.alt-use,.alt-undo");
      if(t){
        var j=Number(t.dataset.j);
        if(t.classList.contains("alt-btn")){
          var box=document.getElementById("alts-"+j),open=box.hidden;
          if(open)box.innerHTML=renderAlts(curDay(),j);
          box.hidden=!open;t.setAttribute("aria-expanded",open?"true":"false");
        }else setSwap(j,t.classList.contains("alt-use")?t.dataset.id:null);
        return;
      }
      var b=e.target.closest(".more");if(!b)return;
      var n=b.previousElementSibling,open=n.classList.toggle("clamp")===false;
      b.textContent=open?"收起":"展開全文";b.setAttribute("aria-expanded",open?"true":"false");
    });
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(addMore);
    function stickyTop(){return parseFloat(getComputedStyle(tabsEl).top)||0;}
    function jst(){return new Date(Date.now()+9*3600*1000);} /* 日本時間 */
    /* 旅途中：今天的行程標出「現在」這一站（時間已經到的最後一站） */
    function markNow(){
      var now=jst(),iso=now.toISOString().slice(0,10),mins=now.getUTCHours()*60+now.getUTCMinutes();
      var cur=Number(store("kansai8-day"))||0;
      Array.prototype.forEach.call(dayEl.querySelectorAll(".ev.now"),function(el){el.classList.remove("now");});
      if(DAYS[cur].iso!==iso)return null;
      var hit=null;
      DAYS[cur].items.forEach(function(it,j){
        var m=/^(\d{1,2}):(\d{2})$/.exec(it.t);
        if(m&&Number(m[1])*60+Number(m[2])<=mins)hit=j;
      });
      if(hit===null)return null;
      var el=dayEl.querySelectorAll(".ev")[hit];el.classList.add("now");return el;
    }
    setInterval(markNow,60000);
    var start=0;
    var todayIso=jst().toISOString().slice(0,10);
    var match=DAYS.findIndex(function(d){return d.iso===todayIso;});
    if(match>=0){start=match;}else{var saved=Number(store("kansai8-day"));if(saved>=0&&saved<DAYS.length)start=saved;}
    select(start,false);
    /* 旅途中直接打開網頁（網址沒有指定區塊）：跳到今天的行程、現在這一站 */
    if(match>=0&&!location.hash){
      var nowEl=markNow();
      requestAnimationFrame(function(){
        if(nowEl)nowEl.scrollIntoView({block:"center"});
        else document.getElementById("days").scrollIntoView();
      });
    }
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
      function link(l){return '<a class="todo-link" href="'+esc(l.href)+'" target="_blank" rel="noopener">'+esc(l.hl||"連結")+'</a>';}
      /* 一個連結用 href/hl，放在右邊；多個連結用 links:[{href,hl}]，排在下一行 */
      if(td.links){li.innerHTML+='<div class="todo-links">'+td.links.map(link).join("")+'</div>';}
      else if(td.href){li.innerHTML+=link(td);}
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
        '<p class="pick-d">'+esc(it.d)+'</p>'+(it.h?'<p class="pick-h">營業：'+esc(it.h)+'</p>':'')+'<div class="idea-links">'+links.join("")+'</div></li>';
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
  [["theme-btn",initTheme],["home",initHeroPause],["cd-d",initCountdown],["tabs",initDays],["todo-list",initTodo],["gift-list",initGifts],["plans-list",initIdeas]].forEach(function(p){
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
