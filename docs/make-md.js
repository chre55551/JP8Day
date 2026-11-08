// 由 js/data/ 產生行程原稿 docs/kansai-8days.md 裡標記之間的段落：
//   gen:overview（行程總覽、必去清單）、gen:days（每日行程、行程建議、景點・美食・購物備選）、gen:lists（購物清單、待辦清單）
// 標記外面的段落（開頭說明、住宿、跨年須知）是手寫的，這支程式不會動。
// 用法：node docs/make-md.js（改了 js/data/ 的任何資料就跑一次）
var fs = require("fs"), path = require("path");
var D = require("./load-data.js")();
var KIND_EMOJI = { sight: "📷", food: "🍜", shop: "🛍" };
var AREAS = ["大阪", "京都", "宇治", "奈良", "神戶"];

function cell(s) { return String(s).replace(/\|/g, "｜").replace(/\n/g, " "); }
function mapUrl(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }
function tbUrl(q) { return "https://tabelog.com/rstLst/?vs=1&sw=" + encodeURIComponent(q); }
function shortName(n) { return n.split("：")[0]; }

/* 行程卡片對得上備選（同一個搜尋字）就借用備選的介紹網址 */
var PICK_BY_Q = {};
D.SPOTS.concat(D.FOODS, D.SHOPS).forEach(function (p) { if (p.q && p.u) PICK_BY_Q[p.q] = p.u; });

function overview() {
  var out = "## 行程總覽\n\n| 日期 | 星期 | 主要地點 | 主軸 |\n|---|---|---|---|\n";
  D.DAYS.forEach(function (d) {
    /* 主軸：景點、美食、購物裡挑重點，跳過早餐、空檔、最後一站這類，最多 7 個 */
    var main = d.items.filter(function (it) { return KIND_EMOJI[it.k] && !it.x && !/^(出門|早餐|午餐|晚餐|下午|空檔|最後一站)/.test(it.n); })
      .map(function (it) { return shortName(it.n).replace(/（.*?）/g, ""); });
    out += "| " + d.d + " | " + d.w + " | " + cell(d.where) + " | " + cell(main.slice(0, 7).join("、") + (main.length > 7 ? "…" : "")) + " |\n";
  });
  out += "\n### ⭐ 必去清單（排行程時優先放好，不能拿掉）\n\n| 日期 | 必去 |\n|---|---|\n";
  D.DAYS.forEach(function (d) {
    var must = d.items.filter(function (it) { return it.m && it.k !== "move"; }).map(function (it) { return shortName(it.n); });
    if (must.length) out += "| " + d.d + " | " + cell(must.join("、")) + " |\n";
  });
  return out;
}

function dayRow(it) {
  var head = (it.m ? "⭐" : "") + (KIND_EMOJI[it.k] || "");
  var text = (head ? head + " " : "") + "**" + it.n + "**" + (it.o ? "：" + it.o : "");
  if (it.w) text += "⚠️";
  if (it.x) text += "（待安排）";
  var u = it.k !== "move" && it.q && PICK_BY_Q[it.q];
  if (u) text += " [介紹](" + u + ")";
  return "| " + (it.t || "—") + " | " + cell(text) + " |\n";
}

function days() {
  var out = "## 每日行程\n\n";
  D.DAYS.forEach(function (d, i) {
    out += "### Day " + (i + 1) + "　" + d.d + "（" + d.w + "）" + d.title + "\n\n";
    out += "**動線**：" + (d.path || d.where) + "\n\n";
    if (d.wx) out += "🌡 往年 " + d.wx[0] + "–" + d.wx[1] + "°C：" + d.wx[2] + "\n\n";
    out += "| 時間 | 行程 |\n|---|---|\n" + d.items.map(dayRow).join("") + "\n";
    (d.memo || d.notes || []).forEach(function (m) { out += "> " + m + "\n"; });
    out += "\n---\n\n";
  });

  out += "## 行程建議（還沒排進行程，看過喜歡再挑）\n\n";
  D.PLANS.forEach(function (p) {
    out += "### " + p.title + "\n\n" + p.why + "\n\n";
    out += p.plan.map(function (s) { return "- " + s + "\n"; }).join("") + "\n";
    if (p.links && p.links.length) out += p.links.map(function (l) { return "[" + l.n + "](" + (l.u || mapUrl(l.q)) + ")"; }).join("・") + "\n\n";
    if (p.note) out += "> " + p.note + "\n\n";
  });
  out += "---\n\n" + picks();
  return out;
}

function picks() {
  function links(x) {
    var l = [];
    if (x.u) l.push("[介紹](" + x.u + ")");
    if (x.u2) l.push("[介紹 2](" + x.u2 + ")");
    if (x.tb) l.push("[食べログ](" + tbUrl(x.q) + ")");
    l.push("[地圖](" + mapUrl(x.q) + ")");
    return l.join("・");
  }
  function item(x, price) {
    return "- **" + x.n + "**" + (x.s ? "（已排 " + x.s + "）" : "") + (price && x.p ? "｜¥" + x.p : "") + "：" + x.d + (x.h ? "（營業：" + x.h + "）" : "") + "　" + links(x) + "\n";
  }
  var out = "## 景點・美食・購物備選（依地區）\n\n> 「已排」是已經在行程裡的；美食的預算是每人大約金額（日圓）。網站「建議備選」區塊是同一份資料。\n\n";
  AREAS.forEach(function (a) {
    out += "### " + a + "\n\n";
    [["景點", D.SPOTS, false], ["美食", D.FOODS, true], ["購物", D.SHOPS, false]].forEach(function (g) {
      var list = g[1].filter(function (x) { return x.a === a; });
      if (list.length) out += "**" + g[0] + "**\n\n" + list.map(function (x) { return item(x, g[2]); }).join("") + "\n";
    });
  });
  return out;
}

function lists() {
  var out = "## 購物清單\n\n網站「待辦」頁的購物清單，標「伴手禮」的是送人的、「自己買」是自己要的；買到可以打勾，順路能買的地方也備註在每日行程裡。\n\n";
  out += "| 品項 | 類別 | 說明 | 在哪買 |\n|---|---|---|---|\n";
  D.GIFTS.forEach(function (g) { out += "| " + cell(g.n) + " | " + (g.g ? "伴手禮" : "自己買") + " | " + cell(g.d) + " | " + cell(g.buy || "") + " |\n"; });
  out += "\n## 待辦清單\n\n網站上的勾選只存在各自的手機；這裡列的是全部項目和截止日。\n\n";
  D.TODOS.forEach(function (t) {
    out += "- [ ] **" + t.t + "**" + (t.due ? "（" + t.due.slice(5).replace("-", "/") + " 前）" : "") + (t.when ? "：" + t.when : "") + (t.href ? " [" + (t.hl || "連結") + "](" + t.href + ")" : "") + "\n";
  });
  return out;
}

var md = path.join(__dirname, "kansai-8days.md");
var s = fs.readFileSync(md, "utf8");
[["overview", overview], ["days", days], ["lists", lists]].forEach(function (b) {
  var B = "<!-- gen:" + b[0] + ":begin -->", E = "<!-- gen:" + b[0] + ":end -->";
  var i = s.indexOf(B), j = s.indexOf(E);
  if (i < 0 || j < 0) throw new Error("找不到標記 " + B);
  s = s.slice(0, i + B.length) + "\n" + b[1]() + s.slice(j);
});
fs.writeFileSync(md, s);
console.log("已更新 docs/kansai-8days.md");
