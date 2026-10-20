// 由 js/data.js 的 SPOTS、FOODS、SHOPS 產生 docs/kansai-8days.md 的「景點・美食・購物備選」段落。
// 用法：node docs/make-picks.js（會直接改寫 docs/kansai-8days.md 中兩個標記之間的內容）
var fs = require("fs"), path = require("path");
var root = path.join(__dirname, "..");
eval(fs.readFileSync(path.join(root, "js/data.js"), "utf8") + ";global.S=SPOTS;global.F=FOODS;global.H=SHOPS;");
function m(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }
function tb(q) { return "https://tabelog.com/rstLst/?vs=1&sw=" + encodeURIComponent(q); }
function links(x) {
  var l = [];
  if (x.u) l.push("[介紹](" + x.u + ")");
  if (x.u2) l.push("[介紹 2](" + x.u2 + ")");
  if (x.tb) l.push("[食べログ](" + tb(x.q) + ")");
  l.push("[地圖](" + m(x.q) + ")");
  return l.join("・");
}
function item(x, price) {
  return "- **" + x.n + "**" + (x.s ? "（已排 " + x.s + "）" : "") + (price && x.p ? "｜¥" + x.p : "") + "：" + x.d + (x.h ? "（營業：" + x.h + "）" : "") + "　" + links(x) + "\n";
}
var out = "## 景點・美食・購物備選（依地區）\n\n> 「已排」是已經在行程裡的；美食的預算是每人大約金額（日圓）。網站「建議備選」區塊是同一份資料。\n\n";
["大阪", "京都", "宇治", "奈良", "神戶"].forEach(function (a) {
  out += "### " + a + "\n\n";
  [["景點", S, false], ["美食", F, true], ["購物", H, false]].forEach(function (g) {
    var list = g[1].filter(function (x) { return x.a === a; });
    if (!list.length) return;
    out += "**" + g[0] + "**\n\n" + list.map(function (x) { return item(x, g[2]); }).join("") + "\n";
  });
});
var md = path.join(root, "docs/kansai-8days.md");
var s = fs.readFileSync(md, "utf8");
var BEGIN = "<!-- picks:begin -->", END = "<!-- picks:end -->";
var i = s.indexOf(BEGIN), j = s.indexOf(END);
if (i < 0 || j < 0) throw new Error("找不到 picks 標記");
fs.writeFileSync(md, s.slice(0, i + BEGIN.length) + "\n" + out + s.slice(j));
