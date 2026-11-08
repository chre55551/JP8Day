// 給 node 小程式用：把 js/data/ 的資料檔依網站的載入順序讀進來，回傳 { DAYS, TODOS, GIFTS, PLANS, SPOTS, FOODS, SHOPS, LL }
var fs = require("fs"), path = require("path");
module.exports = function () {
  var dir = path.join(__dirname, "..", "js", "data"), src = "";
  ["days", "todos", "plans", "spots", "foods", "ll"].forEach(function (f) { src += fs.readFileSync(path.join(dir, f + ".js"), "utf8") + "\n"; });
  return new Function(src + "return {DAYS:DAYS,TODOS:TODOS,GIFTS:GIFTS,PLANS:PLANS,SPOTS:SPOTS,FOODS:FOODS,SHOPS:SHOPS,LL:LL};")();
};
