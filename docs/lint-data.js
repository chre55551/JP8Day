// 行程資料檢查：照 CLAUDE.md 的資料規則找漏填的地方。用法：node docs/lint-data.js（或 python3 docs/tools.py lint）
// 有問題會列出來並回傳非 0；只是提醒的（例如過期待辦）不影響結果。
var fs = require("fs"), path = require("path");
var D = require("./load-data.js")();
var css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
var today = new Date().toISOString().slice(0, 10);
var err = [], note = [];
var PLACE = { sight: 1, food: 1, shop: 1 };

D.DAYS.forEach(function (d) {
  if (!d.wx) err.push(d.d + " 沒有 wx（往年氣溫）");
  d.items.forEach(function (it) {
    var at = d.d + " " + (it.t || "—") + " " + it.n;
    /* 真的店家／景點（有 q、不是待安排）第一個標籤要是營業時間；「24 小時」這種寫在 ok 標籤也算 */
    if (it.c && it.q && PLACE[it.k] && !it.x && it.c[0][0] !== "time" && !/\d:\d\d|24 小時/.test(it.c[0][1])) err.push(at + "：c 的第一個標籤要放營業時間");
    if (it.q && PLACE[it.k] && !D.LL[it.q]) err.push(at + "：有 q 但 LL 沒有座標（" + it.q + "）");
    if (it.b === undefined && it.k !== "move" && !it.x) note.push(at + "：沒有 b（一句話摘要）");
    (it.tr || []).forEach(function (t) {
      if (css.indexOf(".tt-" + t.replace(/\s/g, "") + "{") < 0) err.push(at + "：交通標籤「" + t + "」在 style.css 沒有顏色（.tt-" + t.replace(/\s/g, "") + "）");
    });
  });
});

[["SPOTS", D.SPOTS], ["FOODS", D.FOODS], ["SHOPS", D.SHOPS]].forEach(function (g) {
  g[1].forEach(function (p) {
    if (!p.q) err.push(g[0] + " " + p.n + "：沒有 q");
    else if (!D.LL[p.q] && p.h !== "—") note.push(g[0] + " " + p.n + "：LL 沒有座標，不會出現在「附近可換」");
  });
});
[["TODOS", D.TODOS], ["GIFTS", D.GIFTS]].forEach(function (g) {
  var seen = {};
  g[1].forEach(function (x) { if (seen[x.id]) err.push(g[0] + " id 重複：" + x.id); seen[x.id] = 1; });
});
D.TODOS.forEach(function (t) { if (t.due && t.due < today) note.push("待辦已過截止日 " + t.due + "：" + t.t); });

err.forEach(function (s) { console.log("✗ " + s); });
note.forEach(function (s) { console.log("・" + s); });
console.log(err.length ? "\n有 " + err.length + " 個要修的地方" : "\n資料檢查通過" + (note.length ? "（另有 " + note.length + " 個提醒）" : ""));
process.exit(err.length ? 1 : 0);
