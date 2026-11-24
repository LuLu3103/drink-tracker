from PIL import Image, ImageDraw
import os, math

OUT = r"D:/APP/Deepseek Harness/Work program/public space/drink-tracker/public/icons"
os.makedirs(OUT, exist_ok=True)

SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
SS = 4
BASE = 512 * SS

img = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
grad = Image.new("RGBA", (BASE, BASE))
gd = ImageDraw.Draw(grad)
c1 = (255, 149, 0)
c2 = (139, 105, 20)
for y in range(BASE):
    t = y / (BASE - 1)
    gd.line([(0, y), (BASE, y)], fill=(
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t),
        255,
    ))
mask = Image.new("L", (BASE, BASE), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.22), fill=255)
img.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(img)

W = (255, 255, 255, 255)
cw = BASE * 0.42
ch = BASE * 0.34
cx = BASE * 0.50
top = BASE * 0.45
left, right = cx - cw / 2, cx + cw / 2
bottom = top + ch
stroke = int(BASE * 0.034)

# steam: smooth sine waves with round caps
def steam(xc, y0, y1, amp, phase):
    pts = []
    steps = 40
    for i in range(steps + 1):
        t = i / steps
        y = y0 + (y1 - y0) * t
        x = xc + amp * math.sin(phase + t * math.pi * 2.2) * (1 - 0.25 * t)
        pts.append((x, y))
    d.line(pts, fill=(255, 255, 255, 240), width=int(stroke * 0.78), joint="curve")
    r = stroke * 0.39
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(255, 255, 255, 240))

steam(cx - cw * 0.19, top - ch * 0.46, top - stroke * 0.9, cw * 0.055, 0.0)
steam(cx + cw * 0.19, top - ch * 0.40, top - stroke * 0.9, cw * 0.055, math.pi)

# handle behind body
hx0 = right - stroke * 0.5
hx1 = right + cw * 0.24
hy0 = top + ch * 0.18
hy1 = top + ch * 0.66
d.arc([hx0, hy0, hx1, hy1], start=-88, end=88, fill=W, width=stroke)

# cup body
body = [(left, top), (right, top), (right - cw * 0.09, bottom), (left + cw * 0.09, bottom)]
d.line(body + [body[0]], fill=W, width=stroke, joint="curve")

# saucer
sy = bottom + stroke * 0.75
d.line([(left - cw * 0.18, sy), (right + cw * 0.02, sy)], fill=W, width=stroke)
for p in ((left - cw * 0.18, sy), (right + cw * 0.02, sy)):
    r = stroke / 2
    d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=W)

for s in SIZES:
    img.resize((s, s), Image.LANCZOS).save(os.path.join(OUT, "icon-%dx%d.png" % (s, s)), "PNG", optimize=True)

mb_inner = img.resize((int(BASE * 0.76), int(BASE * 0.76)), Image.LANCZOS)
mb = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
mb.paste(mb_inner, ((BASE - mb_inner.width) // 2, (BASE - mb_inner.height) // 2), mb_inner)
for s in [192, 512]:
    mb.resize((s, s), Image.LANCZOS).save(os.path.join(OUT, "maskable-%dx%d.png" % (s, s)), "PNG", optimize=True)

print("done")
