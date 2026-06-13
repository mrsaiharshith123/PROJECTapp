"""Strip outer square / page backgrounds from Perovo brand PNGs."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
ASSETS = Path(
    r"C:\Users\Harsha\.cursor\projects\c-Users-Harsha-OneDrive-Desktop-PROJECTapp\assets"
)

# 1–2 light, 3–4 dark (same mapping as install-perovo-brand-assets.py)
SOURCES = {
    "wordmark-light.png": ASSETS
    / "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-40-24-783-"
    "1baca3b6-8f44-401e-9717-a5a588f28d46.png",
    "icon-light.png": ASSETS
    / "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-37-19-617-"
    "e8262585-66db-46bb-8b99-670b6b38f284.png",
    "wordmark-dark.png": ASSETS
    / "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_20260613_164537197-"
    "55f50243-9b05-46ef-87b5-2fa639e45d82.png",
    "icon-dark.png": ASSETS
    / "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-38-49-375-"
    "32694ee4-a277-408f-800c-de34c3c2a8a0.png",
}


def dist(rgb: tuple[int, int, int], bg: tuple[int, int, int]) -> float:
    return math.sqrt(sum((rgb[i] - bg[i]) ** 2 for i in range(3)))


def corner_bg(im: Image.Image) -> tuple[int, int, int]:
    w, h = im.size
    pts = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    rs, gs, bs = [], [], []
    for x, y in pts:
        r, g, b, _ = im.getpixel((x, y))
        rs.append(r)
        gs.append(g)
        bs.append(b)
    return (sum(rs) // 4, sum(gs) // 4, sum(bs) // 4)


def keyed_transparent(im: Image.Image, tolerance: float) -> Image.Image:
    im = im.convert("RGBA")
    bg = corner_bg(im)
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if dist((r, g, b), bg) <= tolerance:
                px[x, y] = (r, g, b, 0)
    return im


def keyed_transparent_black_outer(im: Image.Image) -> Image.Image:
    """Drop pure-black outer canvas; keep squircle icon."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= 10 and g <= 10 and b <= 12:
                px[x, y] = (r, g, b, 0)
    return im


def crop_alpha(im: Image.Image, pad: int = 2) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    return im.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(im.width, x1 + pad),
            min(im.height, y1 + pad),
        )
    )


def process(name: str, src: Path) -> None:
    if not src.exists():
        raise FileNotFoundError(src)
    raw = Image.open(src)
    if name.startswith("icon-"):
        out = crop_alpha(keyed_transparent_black_outer(raw), pad=4)
    elif name.startswith("wordmark-dark"):
        out = crop_alpha(keyed_transparent(raw, tolerance=28), pad=2)
    else:
        # light wordmark on black canvas
        out = crop_alpha(keyed_transparent(raw, tolerance=24), pad=2)

    dest = BRAND / name
    out.save(dest, optimize=True)
    print(f"{name}: {raw.size} -> {out.size}")


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        process(name, src)


if __name__ == "__main__":
    main()
