# 開發用小工具：截圖、改版前後逐像素比對、版面檢查、行程資料檢查。Mac / Windows 都能跑。
# 需要 Google Chrome；比對需要 Pillow（pip install pillow）。Chrome 不在預設位置時設環境變數 CHROME。
#
#   python3 docs/tools.py shot [--page index|prep] [--theme light|dark] [--width 390] [--height 1600]
#                              [--day 0-7] [--open] [--at 選擇器] [--out 檔名.png]
#       截一張圖（手機寬度用 iframe，因為無頭 Chrome 視窗最小 500px）。
#       --day 切到第幾天、--open 展開附近可換和注意事項、--at 捲到某個元素。
#   python3 docs/tools.py baseline 資料夾      整站基準截圖（兩頁 × 深淺 × 手機/電腦，加上第 2、7 天展開狀態）
#   python3 docs/tools.py diff 舊資料夾 新資料夾  逐像素比對（倒數秒數那一小塊本來就會不同）
#   python3 docs/tools.py check               手機寬度下：有沒有撐出畫面、文字對比、太小的按鈕、JS 錯誤
#   python3 docs/tools.py lint                行程資料檢查（呼叫 node docs/lint-data.js）
import argparse, os, pathlib, platform, re, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TMP = pathlib.Path(tempfile.gettempdir()) / "jp8day-tools"


def chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for p in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(p):
            return p
    for n in ["google-chrome", "chromium", "chrome"]:
        if shutil.which(n):
            return shutil.which(n)
    sys.exit("找不到 Chrome，請設環境變數 CHROME")


def url(p):
    return pathlib.Path(p).resolve().as_uri()


def probe_page(page, theme, script=""):
    """複製一份頁面：拿掉 CSP（才能插入檢查用 script）、資源指回網站資料夾、固定深淺色。"""
    TMP.mkdir(exist_ok=True)
    s = (ROOT / f"{page}.html").read_text(encoding="utf-8")
    s = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', "", s)
    s = s.replace("<head>", f'<head><base href="{url(ROOT)}/"><script>document.documentElement.dataset.theme="{theme}"</script>', 1)
    s = re.sub(r"<script>/\* 先套用記住的深淺色.*?</script>", "", s)
    s = s.replace("</body>", f"<script>{script}</script></body>")
    f = TMP / f"probe-{page}-{theme}.html"
    f.write_text(s, encoding="utf-8")
    return f


def run_chrome(target, width, height, shot=None, log=False, theme="light"):
    w = max(width, 500)
    if width < 500:  # 用 iframe 包住，做出真正的手機寬度
        wrap = TMP / f"wrap-{width}-{height}.html"
        wrap.write_text(f'<!doctype html><body style="margin:0"><iframe src="{url(target)}" style="width:{width}px;height:{height}px;border:0;display:block"></iframe>', encoding="utf-8")
        target = wrap
    cmd = [chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
           "--force-prefers-reduced-motion", "--force-device-scale-factor=1",
           f"--blink-settings=preferredColorScheme={1 if theme == 'light' else 0}",
           f"--window-size={w},{height}", "--virtual-time-budget=4000"]
    if shot:
        cmd.append(f"--screenshot={pathlib.Path(shot).resolve()}")
    if log:
        cmd += ["--enable-logging=stderr", "--v=0", "--dump-dom"]
    cmd.append(url(target))
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.stderr


def state_script(day=None, opened=False, at=None):
    js = "setTimeout(function(){"
    if day is not None:
        js += f"var t=document.getElementById('tab-{day}');if(t)t.click();"
    js += "setTimeout(function(){"
    if opened:
        js += ("document.querySelectorAll('.alt-btn').forEach(function(b,i){if(i<2)b.click()});"
               "document.querySelectorAll('details').forEach(function(d){d.open=true});"
               "document.querySelectorAll('.det-btn').forEach(function(b,i){if(i<2)b.click()});")
    if at:
        js += f"var e=document.querySelector({at!r});if(e)scrollTo(0,e.getBoundingClientRect().top+scrollY-70);"
    js += "},300)},500)"
    return js


def shot(page="index", theme="light", width=390, height=1600, day=None, opened=False, at=None, out="shot.png"):
    f = probe_page(page, theme, state_script(day, opened, at))
    run_chrome(f, width, height, shot=out, theme=theme)
    print(out)


def baseline(folder):
    d = pathlib.Path(folder); d.mkdir(parents=True, exist_ok=True)
    for page in ["index", "prep"]:
        for theme in ["light", "dark"]:
            for w in [390, 1280]:
                shot(page, theme, w, 9000 if page == "index" else 12000, out=d / f"{page}-{theme}-{w}.png")
    for theme in ["light", "dark"]:
        for day in [1, 6]:
            shot("index", theme, 390, 3200, day=day, opened=True, at="#days", out=d / f"day{day}-{theme}.png")


def diff(a, b):
    try:
        from PIL import Image, ImageChops
    except ImportError:
        sys.exit("需要 Pillow：pip install pillow")
    bad = 0
    for f in sorted(pathlib.Path(a).glob("*.png")):
        g = pathlib.Path(b) / f.name
        if not g.exists():
            print(f.name, "新資料夾沒有"); bad += 1; continue
        x, y = Image.open(f).convert("RGB"), Image.open(g).convert("RGB")
        if x.size != y.size:
            print(f.name, "尺寸不同", x.size, y.size); bad += 1; continue
        bb = ImageChops.difference(x, y).getbbox()
        if not bb:
            print(f.name, "相同")
        else:
            small = (bb[2] - bb[0]) * (bb[3] - bb[1]) < 6000  # 倒數秒數那一小塊
            print(f.name, "只有倒數秒數不同" if small else f"不同：{bb}")
            bad += 0 if small else 1
    sys.exit(1 if bad else 0)


AUDIT = r"""
window.addEventListener('error',function(e){console.log('AUDIT 錯誤 '+e.message)});
setTimeout(function(){
 function rgb(c){var m=c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
  if(m)return [m[1]*255,m[2]*255,m[3]*255,m[4]===undefined?1:+m[4]];
  m=c.match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]:null}
 function lum(c){var a=rgb(c);if(!a)return null;var l=a.slice(0,3).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return {l:.2126*l[0]+.7152*l[1]+.0722*l[2],a:a[3]}}
 function bg(e){while(e){var L=lum(getComputedStyle(e).backgroundColor);if(L&&L.a>.9)return L.l;e=e.parentElement}return 1}
 var out=['寬度 '+innerWidth+'，頁面 '+document.documentElement.scrollWidth+(document.documentElement.scrollWidth>innerWidth?'（撐出畫面！）':'')],low={},small={},wide={};
 document.querySelectorAll('body *').forEach(function(e){
  if(!e.getClientRects().length||e instanceof SVGElement)return;
  var r=e.getBoundingClientRect(),k=((e.className&&e.className.baseVal===undefined?e.className:'')||e.tagName).toString().slice(0,40);
  if(r.right>innerWidth+1&&!e.closest('.map-wrap,.tabs,.nav-links'))wide[k]=Math.round(r.right);
  if([].some.call(e.childNodes,function(n){return n.nodeType==3&&n.textContent.trim()})){
   var L=lum(getComputedStyle(e).color);if(L){var b=bg(e),x=(Math.max(L.l,b)+.05)/(Math.min(L.l,b)+.05),fs=parseFloat(getComputedStyle(e).fontSize);
   if(x<4.5&&!(x>=3&&fs>=18.6))low[k]=Math.min(low[k]||99,+x.toFixed(2))}}
  if(e.matches('a,button,summary')&&!e.closest('p')&&r.height<32)small[k]=Math.round(r.height);
 });
 out.push('撐出畫面的元素 '+JSON.stringify(wide),'對比不足 '+JSON.stringify(low),'太小的按鈕 '+JSON.stringify(small));
 out.forEach(function(s){console.log('AUDIT '+s.replace(/"/g,''))});
},2500);
"""


def check():
    for page in ["index", "prep"]:
        for theme in ["light", "dark"]:
            print(f"== {page} {theme}")
            log = run_chrome(probe_page(page, theme, AUDIT), 390, 900, log=True, theme=theme)
            for line in re.findall(r"AUDIT ([^\n\"]*)", log):
                print("  " + line)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("shot")
    s.add_argument("--page", default="index"); s.add_argument("--theme", default="light")
    s.add_argument("--width", type=int, default=390); s.add_argument("--height", type=int, default=1600)
    s.add_argument("--day", type=int); s.add_argument("--open", action="store_true"); s.add_argument("--at")
    s.add_argument("--out", default="shot.png")
    sub.add_parser("baseline").add_argument("folder")
    d = sub.add_parser("diff"); d.add_argument("a"); d.add_argument("b")
    sub.add_parser("check")
    sub.add_parser("lint")
    a = ap.parse_args()
    if a.cmd == "shot":
        shot(a.page, a.theme, a.width, a.height, a.day, a.open, a.at, a.out)
    elif a.cmd == "baseline":
        baseline(a.folder)
    elif a.cmd == "diff":
        diff(a.a, a.b)
    elif a.cmd == "check":
        check()
    elif a.cmd == "lint":
        sys.exit(subprocess.run(["node", str(ROOT / "docs" / "lint-data.js")]).returncode)


if __name__ == "__main__":
    main()
