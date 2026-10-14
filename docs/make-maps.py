# 產生網站「路線圖」區塊的兩張 SVG（大阪市區、關西各城市）。用法：python3 docs/make-maps.py <輸出資料夾>，再把 map1.svg、map2.svg 貼進 index.html 的 #maps 區塊
# 繪本風：粗墨線外框、白底站點；座標是示意位置，不照實際比例
INK="#3E3A39"
C={"mido":"#E5484D","tani":"#9B7BC2","sakai":"#A87C56","loop":"#F08A3C","jr":"#3C8DD8",
   "hankyu":"#8E3B3B","keihan":"#2F8F63","kintetsu":"#D9A21B","port":"#4FB8C4","yume":"#F08A3C"}
def line(pts,col,dash=False,w=9):
    d="M"+" L".join(f"{x} {y}" for x,y in pts)
    s=f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w+5}" stroke-linejoin="round" stroke-linecap="round"/>'
    s+=f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'+(' stroke-dasharray="2 14"' if dash else '')+'/>'
    return s
def st(x,y,big=False):
    r=9 if big else 6
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFFCF6" stroke="{INK}" stroke-width="3"/>'
def lab(x,y,t,anchor="start",size=15,sub=None,bold=False):
    s=f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" fill="{INK}" paint-order="stroke" stroke="#FFFCF6" stroke-width="5" stroke-linejoin="round">{t}</text>'
    if sub: s+=f'<text x="{x}" y="{y+16}" text-anchor="{anchor}" font-size="12" fill="#6B6461" paint-order="stroke" stroke="#FFFCF6" stroke-width="4" stroke-linejoin="round">{sub}</text>'
    return s
def arrow(x,y,t,anchor="start"):
    return lab(x,y,t,anchor,13)

# ---------- 圖 1：大阪市區 ----------
o=[]
# 座標（示意）
S={"jusou":(130,40),"hk_umeda":(200,80),"osaka":(170,135),"umeda":(230,150),"higashi":(300,150),
   "nakazaki":(330,80),"tenroku":(400,30),"ogimachi":(400,115),"tenma":(455,98),"minami":(400,195),
   "kitahama":(400,250),"sakaihon":(400,300),"nagahori":(400,350),"nippombashi":(400,410),"ebisu":(400,465),
   "doubutsu":(230,500),"yodoyabashi":(230,230),"honmachi":(230,300),"shinsaibashi":(230,350),"namba":(230,410),
   "daikoku":(230,455),"tennoji":(230,560),"tenmabashi":(490,250),"tani4":(490,310),"kyobashi":(580,180),
   "fukushima":(110,175),"nishikujo":(60,240),"usj":(60,330),"kintetsu_east":(640,410),"keihan_east":(660,150),
   "hotel":(352,128)}
P=lambda *k:[S[i] for i in k]
o.append(line(P("hk_umeda","jusou")+[(80,15)],C["hankyu"]))
o.append(line([(60,240),(110,175),(170,135),(230,98),(455,98),(580,180),(640,230)],C["loop"]))
o.append(line(P("nishikujo","usj"),C["yume"],w=7))
o.append(line(P("umeda","yodoyabashi","honmachi","shinsaibashi","namba","daikoku","doubutsu","tennoji"),C["mido"]))
o.append(line(P("tenroku","ogimachi","minami","kitahama","sakaihon","nagahori","nippombashi","ebisu")+[(400,500),S["doubutsu"]],C["sakai"]))
o.append(line([S["tenroku"],(330,30),S["nakazaki"],(300,110),S["higashi"],(300,195),S["minami"],(490,195),S["tenmabashi"],S["tani4"],(490,380)],C["tani"]))
o.append(line([S["yodoyabashi"],(400,230),S["kitahama"],(440,250),S["tenmabashi"],(540,250),S["kyobashi"],S["keihan_east"]],C["keihan"]))
o.append(line([S["namba"],S["nippombashi"],S["kintetsu_east"]],C["kintetsu"]))
# 轉乘虛線
for a,b in [("osaka","umeda"),("umeda","higashi"),("hk_umeda","umeda"),("ogimachi","tenma")]:
    (x1,y1),(x2,y2)=S[a],S[b]
    o.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{INK}" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/>')
big={"osaka","umeda","hk_umeda","namba","nippombashi","minami","doubutsu","tenmabashi","kyobashi","nishikujo","kitahama","yodoyabashi","tennoji","tenroku"}
for k,(x,y) in S.items():
    if k in ("kintetsu_east","keihan_east","hotel"): continue
    o.append(st(x,y,k in big))
# 飯店
hx,hy=S["hotel"]
o.append(f'<g transform="translate({hx} {hy})"><path d="M0 -15 L4.4 -5 L15 -4.6 L7 2.6 L9.6 13 L0 7.2 L-9.6 13 L-7 2.6 L-15 -4.6 L-4.4 -5 Z" fill="#F6D27A" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/></g>')
o.append(lab(hx,hy+32,"飯店",anchor="middle",size=15,sub="神山町"))
L=[("jusou",-12,22,"十三","end","桐麵"),("hk_umeda",14,-6,"大阪梅田（阪急）","start",None),
   ("osaka",-14,-4,"大阪（JR）","end","LUCUA・空中庭園"),("umeda",-14,22,"梅田","end",None),
   ("higashi",-12,20,"東梅田","end",None),("nakazaki",12,-8,"中崎町","start",None),("tenroku",14,-4,"天神橋筋六丁目","start",None),
   ("ogimachi",14,10,"扇町","start",None),("tenma",10,-16,"天滿（JR）","start","天神橋筋・天滿市場"),
   ("minami",14,-8,"南森町","start",None),("kitahama",-12,24,"北濱","end",None),("sakaihon",14,5,"堺筋本町","start",None),
   ("nagahori",14,5,"長堀橋","start",None),("nippombashi",14,-8,"日本橋","start","黑門市場"),("ebisu",14,5,"惠美須町","start","新世界"),
   ("yodoyabashi",-14,5,"淀屋橋","end","中之島"),("honmachi",-14,5,"本町","end",None),("shinsaibashi",-14,5,"心齋橋","end","心齋橋筋"),
   ("namba",-14,5,"難波","end","道頓堀・法善寺"),("daikoku",-14,5,"大國町","end",None),("doubutsu",-14,5,"動物園前","end","新世界"),
   ("tennoji",14,5,"天王寺","start","HARUKAS 300"),("tenmabashi",14,24,"天滿橋","start","COBATOPAN"),("tani4",14,5,"谷町四丁目","start","大阪城"),
   ("kyobashi",8,-16,"京橋","start",None),("fukushima",-12,-6,"福島","end",None),("nishikujo",-14,-6,"西九條","end",None),("usj",14,5,"環球城","start","環球影城")]
for k,dx,dy,t,an,sub in L:
    x,y=S[k]; o.append(lab(x+dx,y+dy,t,an,14,sub))
o.append(arrow(84,12,"往京都・神戶（阪急）"))
o.append(arrow(560,400,"往奈良（近鐵）","start"))
o.append(arrow(600,138,"往京都（京阪）","start"))
o.append(arrow(495,395,"往天王寺","start"))
o.append(arrow(600,250,"環狀線","start"))
legend=[("mido","御堂筋線（地鐵）"),("tani","谷町線（地鐵）"),("sakai","堺筋線（地鐵）"),("loop","JR 環狀線・夢咲線"),("hankyu","阪急"),("keihan","京阪"),("kintetsu","近鐵")]
lg='<g transform="translate(470 470)">'
for i,(k,t) in enumerate(legend):
    y=i*20
    lg+=f'<rect x="0" y="{y-6}" width="26" height="10" rx="5" fill="{C[k]}" stroke="{INK}" stroke-width="2"/><text x="34" y="{y+3}" font-size="13" fill="{INK}">{t}</text>'
lg+='</g>'
o.append(lg)
svg1=f'<svg class="map-svg" viewBox="0 0 700 620" role="img" aria-labelledby="map1-t"><title id="map1-t">大阪市區地鐵示意圖：這趟會搭到的路線</title><rect width="700" height="620" fill="#FFFCF6"/>'+"".join(o)+'</svg>'

# ---------- 圖 2：關西城市 ----------
o=[]
N={"ukb":(90,330),"sannomiya":(170,230),"umeda":(370,230),"namba":(370,340),"usj":(250,340),
   "kyoto":(580,90),"kawaramachi":(450,60),"ogura":(600,200),"uji":(680,200),"nara":(660,340)}
o.append(line([N["ukb"],N["sannomiya"]],C["port"]))
o.append(line([(170,222),(372,222),(580,90)],C["jr"]))
o.append(line([(170,240),(366,240),(366,236),(450,60)],C["hankyu"]))
o.append(line([N["kyoto"],(600,130),N["ogura"]],C["kintetsu"]))
o.append(line([N["kyoto"],(680,130),N["uji"]],C["jr"],w=7))
o.append(line([N["umeda"],N["namba"]],C["mido"]))
o.append(line([N["namba"],N["nara"]],C["kintetsu"]))
o.append(line([N["umeda"],(300,280),N["usj"]],C["loop"],w=7))
for k,(x,y) in N.items(): o.append(st(x,y,True))
names={"ukb":("神戶機場","middle",0,32),"sannomiya":("三宮","end",-14,-8),"umeda":("大阪・梅田","start",16,40),
       "namba":("難波","start",14,24),"usj":("環球影城","middle",0,30),"kyoto":("京都站","start",14,-6),
       "kawaramachi":("京都河原町","end",-14,-4),"ogura":("小倉","end",-12,24),"uji":("宇治","start",12,24),"nara":("近鐵奈良","middle",0,32)}
for k,(t,an,dx,dy) in names.items():
    x,y=N[k]; o.append(lab(x+dx,y+dy,t,an,16))
tags=[(118,272,"Port Liner 18 分","end"),(270,208,"JR 新快速 21 分","middle"),(270,264,"阪急 30 分","middle"),
      (490,180,"JR 新快速 30 分","start"),(396,140,"阪急 45 分","end"),(592,160,"近鐵 20 分","end"),(712,104,"JR 奈良線 20 分","middle"),
      (382,302,"御堂筋線 8 分","start"),(515,362,"近鐵 40 分","middle"),(292,306,"JR 15 分","end")]
for x,y,t,an in tags: o.append(lab(x,y,t,an,13))
o.append(lab(600,244,"任天堂博物館・丸久小山園","middle",12))
o.append(lab(690,262,"平等院表參道","middle",12))
svg2=f'<svg class="map-svg" viewBox="0 0 780 400" role="img" aria-labelledby="map2-t"><title id="map2-t">關西各城市之間的交通示意圖</title><rect width="780" height="400" fill="#FFFCF6"/>'+"".join(o)+'</svg>'
import sys
open(sys.argv[1]+"/map1.svg","w",encoding="utf-8").write(svg1)
open(sys.argv[1]+"/map2.svg","w",encoding="utf-8").write(svg2)
