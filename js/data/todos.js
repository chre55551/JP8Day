/* 待辦：id 用來記住勾選狀態，改文字或順序都不會跑掉；新增項目給一個新的 id */
/* 購物清單：n 名稱、g:1 伴手禮（沒填＝自己想買的）、d 說明、buy 在哪買（行程裡順路的那一站）、u 官方商品頁、img:1 有商品照（images/shop/{id}.jpg 縮圖、{id}-l.jpg 大圖，取自官網）；id 不要改，打勾紀錄靠它 */
var GIFTS=[
  {id:"caramel-crown",g:1,img:1,u:"https://www.caramelcrown.jp/",n:"THE CARAMEL CROWN",d:"招牌 THE バターキャラメルサンド，2025 年在阪急梅田開的焦糖甜點專賣店",buy:"12/31 阪急梅田本店 B1（跟 Sugar Butter Tree 同一層），平常 10:00–20:00"},
  {id:"sugar-butter-tree",g:1,img:1,u:"https://www.sugarbuttertree.jp/",n:"Sugar Butter Tree",d:"招牌シュガーバターサンドの木，酥脆穀物餅乾夾白巧克力",buy:"12/31 阪急うめだ店（阪急梅田本店 B1），平常 10:00–20:00；行程已排 16:00"},
  {id:"grand-calbee",g:1,img:1,u:"https://www.calbee.co.jp/grandcalbee/",n:"Grand Calbee",d:"Calbee 的高級洋芋片品牌，厚切洋芋片，主要在阪急梅田本店才買得到",buy:"12/31 阪急梅田本店 B1，平常 10:00–20:00；行程已排 15:45"},
  {id:"baton-dor",g:1,img:1,u:"https://www.glico.com/jp/batondor/",n:"BATON d'OR（必買）",d:"固力果的高級 Pocky「金色權杖」，只在關西幾家百貨和博多阪急有店、沒有網購",buy:"12/31 阪急梅田本店 B1，平常 10:00–20:00；行程已排 16:00，跟 Sugar Butter Tree 一起買"},
  {id:"kaldi-choco-creams",g:1,img:1,u:"https://www.kaldi.co.jp/ec/pro/disp/1/5425001304103",n:"KALDI 比利時巧克力奶油球（香草）",d:"Belgian Chocolate Creams Vanilla：巧克力殼包香草奶油、外面裹糖粉，比利時製，100 g 約 645 日圓；去年賣到缺貨，今年冬天再販，可能買不到",buy:"12/31 LUCUA 1100（ルクア イーレ）2F 的 KALDI，逛 LUCUA 時順便買；另一間在茶屋町 NU茶屋町プラス 2F"},
  {id:"3coins-dog-hood",u:"https://www.palcloset.jp/3coins/",n:"3COINS 狗狗頭套盲包",d:"3COINS 的隨機款（盲包）狗狗頭套；款式和有沒有貨要到店看",buy:"12/29 晚上逛 HEP FIVE 時，6F 的 3COINS"}
];

var TODOS=[
  {id:"nm-account",cat:"ticket",due:"2026-10-31",t:"任天堂博物館①：申請任天堂帳號",when:"10/31 前；要手機號碼收驗證碼",u:1,href:"https://museum-tickets.nintendo.com/en/calendar",hl:"官方網站"},
  {id:"nm-lottery",cat:"ticket",due:"2026-10-31",t:"任天堂博物館②：抽籤報名，三個志願都選 1/4 的不同時段",when:"10/31 23:59（日本時間）截止。兩人姓名跟護照一模一樣；只送一次，不要找代購",u:1,href:"https://museum-tickets.nintendo.com/en/calendar",hl:"官方網站"},
  {id:"nm-result",cat:"ticket",t:"任天堂博物館③：看抽籤結果",when:"11 月已公布：沒抽中"},
  {id:"nm-resale",cat:"ticket",t:"任天堂博物館④：沒抽中，找其他管道入場（官網釋出的票等）",when:"參觀日前約兩個月起常上官網看，一釋出幾分鐘就被搶光；拿到票就把 1/4 下午排回去",href:"https://museum-tickets.nintendo.com/en/calendar",hl:"官方網站"},
  {id:"usj",cat:"ticket",t:"環球影城 12/30 門票＋快速通關（已買快速通關）",when:"快速通關：任天堂世界保證入場 9:00–10:00、瑪利歐賽車 9:00–9:30、咚奇剛的瘋狂礦車 9:30–10:00、大白鯊、飛天翼龍。門票如果還沒買也要買好",links:[{href:"https://www.kkday.com/zh-tw/product/18618-universal-studios-japan-express-pass-osaka",hl:"KKday"},{href:"https://www.klook.com/zh-TW/activity/3407-universal-studios-japan-express-pass-osaka/",hl:"Klook"},{href:"https://www.usj.co.jp/web/zh/tw/tickets/lineup/expresspass",hl:"官方網站"}]},
  {id:"teamlab",cat:"book",t:"teamLab Biovortex Kyoto（數位藝術美術館）1/2 下午的時段預約（14:45 左右）"},
  {id:"tonemon",cat:"book",t:"TableCheck 訂宮川豚衛門 1/2 午餐（12:30）"},
  {id:"ukb-t2",cat:"check",t:"查神戶機場第 2 航廈的位置"},
  {id:"icoca",cat:"prep",due:"2026-12-28",t:"兩支 iPhone 加入 ICOCA 並儲值"},
  {id:"countdown",cat:"check",due:"2026-12-15",t:"選大阪跨年地點，確認除夕當晚的開放時間和回飯店的交通",when:"12 月中"},
  {id:"recheck",cat:"check",due:"2026-12-15",t:"再查一次標「需確認」的店家年末年始公告",when:"11 月底到 12 月中"},
  {id:"gmaps",cat:"prep",t:"行程定案後補上每天的 Google Maps 路線"},
  {id:"life",cat:"check",due:"2026-12-15",t:"確認 Life 超市、阪急梅田 B1 的年末年始營業時間",when:"12 月中"},
  {id:"first-train",cat:"check",due:"2026-12-28",t:"查 1/2 JR 大阪 → 京都的首班車時刻",when:"出發前"},
  {id:"marukyu",cat:"check",due:"2026-12-15",t:"確認丸久小山園本店 1/4 有沒有營業（一早要去排）",when:"12 月中；沒開就改去西洞院店"},
  {id:"holiday-unknown",cat:"check",due:"2026-12-15",t:"查 HARBS 三宮店（12/29）、よーじや祇園本店（1/2）、宮川豚衛門（1/2）、錦市場（1/2）、RIKI（12/29）、居酒屋 月盗（12/31 午餐）、ごりちゃん中崎町本店（1/3）、治一郎、芋屋金次郎 GRAND FRONT 大阪店（12/31 幾點關）、桐麺梅田店（1/4）的年末年始營業",when:"12 月中；網路上還查不到"}
];
