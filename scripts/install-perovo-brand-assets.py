"""Install official Perovo brand PNGs into public/brand/."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    r"C:\Users\Harsha\.cursor\projects\c-Users-Harsha-OneDrive-Desktop-PROJECTapp\assets"
)
OUT = ROOT / "public" / "brand"

# User order: 1–2 light mode, 3–4 dark mode
MAPPING = {
    "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-40-24-783-"
    "1baca3b6-8f44-401e-9717-a5a588f28d46.png": "wordmark-light.png",
    "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-37-19-617-"
    "e8262585-66db-46bb-8b99-670b6b38f284.png": "icon-light.png",
    "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_20260613_164537197-"
    "55f50243-9b05-46ef-87b5-2fa639e45d82.png": "wordmark-dark.png",
    "c__Users_Harsha_AppData_Roaming_Cursor_User_workspaceStorage_"
    "95b9b4fd4ad734c315aaf39a5da6c279_images_Picsart_26-06-13_16-38-49-375-"
    "32694ee4-a277-408f-800c-de34c3c2a8a0.png": "icon-dark.png",
}


def main() -> None:
    import subprocess

    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name in MAPPING.items():
        src = ASSETS / src_name
        if not src.exists():
            raise FileNotFoundError(src)
        shutil.copy2(src, OUT / dest_name)
        print("Copied", dest_name)

    subprocess.run(["python", str(ROOT / "scripts" / "process-perovo-brand-assets.py")], check=True)


if __name__ == "__main__":
    main()
