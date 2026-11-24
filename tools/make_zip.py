import zipfile, os

root = r"D:/APP/Deepseek Harness/Work program/public space/drink-tracker/dist"
out = r"D:/APP/Deepseek Harness/Work program/public space/drink-tracker/drink-tracker-site.zip"

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirnames, filenames in os.walk(root):
        for name in filenames:
            if name.endswith(".zip"):
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace("\\", "/")
            z.write(full, rel)

size = os.path.getsize(out)
with zipfile.ZipFile(out) as z:
    names = z.namelist()
print("zip bytes:", size)
print("entries:", len(names))
print("root has index.html:", "index.html" in names)
print("sample:", names[:6])
