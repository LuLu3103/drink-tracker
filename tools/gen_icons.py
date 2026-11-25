from PIL import Image, ImageDraw
import os

OUT = r"D:/APP/Deepseek Harness/Work program/public space/drink-tracker/public/icons"
os.makedirs(OUT, exist_ok=True)

SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
SS = 8                      # 超采样倍数
BASE = 64 * SS             # 逻辑坐标 64x64，和 Logo.tsx 一致

BLUE_TOP = (59, 130, 246)   # #3B82F6
BLUE_BOTTOM = (29, 78, 216) # #1D4ED8

def gradient(size):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            # 对角线渐变，和 CSS linear-gradient(135deg) 接近
            t = ((x + y) / (2 * size - 2))
            r = int(BLUE_TOP[0] + (BLUE_BOTTOM[0] - BLUE_TOP[0]) * t)
            g = int(BLUE_TOP[1] + (BLUE_BOTTOM[1] - BLUE_TOP[1]) * t)
            b = int(BLUE_TOP[2] + (BLUE_BOTTOM[2] - BLUE_TOP[2]) * t)
            px[x, y] = (r, g, b, 255)
    return img

def draw_cup(d, s, cx=None, cy=None, scale=1.0):
    """在 64 逻辑单位坐标系里画杯子，s 为像素/逻辑单位"""
    def X(v): return (v if cx is None else (v - 32) * scale + 32) * s
    def Y(v): return (v if cy is None else (v - 32) * scale + 32) * s
    def S(v): return v * s * scale

    white = (255, 255, 255, 255)

    # 蒸汽
    for x0 in (26.5, 37.5):
        d.line([(X(x0), Y(19.5)), (X(x0 + 1.2), Y(15.2))], fill=white, width=int(S(2.4)))
        # 圆头
        r = S(1.2)
        for px, py in ((X(x0), Y(19.5)), (X(x0 + 1.2), Y(15.2))):
            d.ellipse([px - r, py - r, px + r, py + r], fill=white)

    # 杯盖
    d.rounded_rectangle([X(18), Y(21), X(46), Y(26)], radius=S(2), fill=white)

    # 杯身（上宽下窄）
    body = [(X(20), Y(26)), (X(44), Y(26)), (X(41.4), Y(48.6)), (X(22.6), Y(48.6))]
    d.polygon(body, fill=white)

    # 液体（淡蓝，35% 不透明度叠在白底上）
    liquid = (
        (int(255 * 0.65 + BLUE_TOP[0] * 0.35), int(255 * 0.65 + BLUE_TOP[1] * 0.35), int(255 * 0.65 + BLUE_TOP[2] * 0.35), 255)
    )
    d.polygon([(X(25), Y(33.5)), (X(39), Y(33.5)), (X(37.4), Y(45.5)), (X(26.6), Y(45.5))], fill=liquid)

def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    grad = gradient(size * SS)

    if maskable:
        # 满幅背景，系统自行裁切
        img.paste(grad, (0, 0))
        d = ImageDraw.Draw(img)
        draw_cup(d, size * SS / 64, scale=0.72)
    else:
        mask = Image.new("L", (size * SS, size * SS), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size * SS - 1, size * SS - 1], radius=int(size * SS * 18 / 64), fill=255
        )
        img.paste(grad, (0, 0), mask)
        d = ImageDraw.Draw(img)
        draw_cup(d, size * SS / 64)

    return img.resize((size, size), Image.LANCZOS)

for s in SIZES:
    make_icon(s).save(os.path.join(OUT, "icon-%dx%d.png" % (s, s)), "PNG", optimize=True)

for s in (192, 512):
    make_icon(s, maskable=True).save(os.path.join(OUT, "maskable-%dx%d.png" % (s, s)), "PNG", optimize=True)

print("icons regenerated:", sorted(os.listdir(OUT)))
