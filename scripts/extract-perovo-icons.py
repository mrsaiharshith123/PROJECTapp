"""Extract Perovo app icons from the brand sheet image."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\Harsha\.cursor\projects\c-Users-Harsha-OneDrive-Desktop-PROJECTapp\assets"
    r"\c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"95b9b4fd4ad734c315aaf39a5da6c279_images_ChatGPT_Image_Jun_12__"
    r"2026__01_04_34_PM-9ad6b32a-779d-48cc-a615-6d1ff7585c2c.png"
)
OUT = ROOT / "public" / "brand"

CROPS = {
    "icon-dark-lg": (120, 70, 390, 340),
    "icon-dark-md": (60, 500, 200, 640),
    "icon-dark-sm": (210, 500, 310, 600),
    "icon-light-lg": (632, 70, 902, 340),
    "icon-light-md": (572, 500, 712, 640),
    "icon-light-sm": (722, 500, 822, 600),
}

SIZES = {
    "pwa-512": 512,
    "pwa-192": 192,
    "icon-64": 64,
    "icon-48": 48,
    "icon-32": 32,
}


def square_crop(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side))


def main() -> None:
    im = Image.open(SRC)
    OUT.mkdir(parents=True, exist_ok=True)
    public = ROOT / "public"

    for name, box in CROPS.items():
        square_crop(im.crop(box)).save(OUT / f"{name}.png")

    for theme in ("dark", "light"):
        lg = Image.open(OUT / f"icon-{theme}-lg.png")
        for out_name, px in SIZES.items():
            resized = lg.resize((px, px), Image.Resampling.LANCZOS)
            resized.save(OUT / f"{out_name}-{theme}.png")
            if out_name in ("pwa-512", "pwa-192") and theme == "light":
                resized.save(public / f"{out_name}.png")

    lg_light = Image.open(OUT / "icon-light-lg.png")
    lg_light.resize((32, 32), Image.Resampling.LANCZOS).save(public / "favicon-32.png")
    print("Icons written to", OUT)


if __name__ == "__main__":
    main()
