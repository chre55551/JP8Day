# 把 Huninn 字型裁成只剩網站用到的字，輸出 fonts/huninn-subset.woff2。
# 文字有改（index.html、prep.html、js/*.js）就重跑一次：
#   pip install fonttools brotli
#   python3 docs/make-font.py
# 原始字型第一次會自動下載到 fonts/.src/（不進 git）。Huninn 採 SIL OFL 1.1 授權，見 fonts/OFL.txt。
import pathlib, string, urllib.request
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_URL = "https://github.com/google/fonts/raw/main/ofl/huninn/Huninn-Regular.ttf"
SRC = ROOT / "fonts" / ".src" / "Huninn-Regular.ttf"
OUT = ROOT / "fonts" / "huninn-subset.woff2"
TEXT_FILES = ["index.html", "prep.html", *sorted(str(p.relative_to(ROOT)) for p in (ROOT / "js").glob("*.js"))]

if not SRC.exists():
    SRC.parent.mkdir(parents=True, exist_ok=True)
    print("下載原始字型…")
    urllib.request.urlretrieve(SRC_URL, SRC)

chars = set(string.printable)
for f in TEXT_FILES:
    chars |= set((ROOT / f).read_text(encoding="utf-8"))
# 常用標點先放著，之後加文字時比較不會缺字
chars |= set("，。、；：？！「」『』（）【】《》〈〉…—–～・·★☆→←↑↓↗×÷％＋－＝／｜")
chars = {c for c in chars if not c.isspace() or c == " "}

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
font = subset.load_font(str(SRC), opts)
sub = subset.Subsetter(opts)
sub.populate(text="".join(chars))
sub.subset(font)
OUT.parent.mkdir(parents=True, exist_ok=True)
subset.save_font(font, str(OUT), opts)
cmap = font.getBestCmap()
missing = sorted(c for c in chars if ord(c) > 127 and ord(c) not in cmap)
print(f"{len(chars)} 個字 → {OUT.relative_to(ROOT)}（{OUT.stat().st_size / 1024:.0f} KB）")
if missing:
    print("字型裡沒有、會用系統字型顯示的字：", "".join(missing))
