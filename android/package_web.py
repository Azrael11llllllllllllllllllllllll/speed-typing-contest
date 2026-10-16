from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = Path(__file__).resolve().parent / "app" / "src" / "main" / "assets" / "www"


def main():
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    for filename in ("index.html", "script.js", "style.css"):
        shutil.copy2(ROOT / filename, ASSET_ROOT / filename)
    shutil.copytree(ROOT / "logo", ASSET_ROOT / "logo", dirs_exist_ok=True)
    certificate_assets = ASSET_ROOT / "cetificates"
    certificate_assets.mkdir(parents=True, exist_ok=True)
    for filename in (
        "First_clean.png",
        "second_clean.png",
        "third_clean.png",
        "participant_clean.png",
    ):
        shutil.copy2(ROOT / "cetificates" / filename, certificate_assets / filename)

    index_path = ASSET_ROOT / "index.html"
    html = index_path.read_text(encoding="utf-8")
    html = re.sub(r"^\s*<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*$", "\n", html, flags=re.MULTILINE)
    config_script = '    <script src="supabase-config.js?v=1"></script>'
    if config_script not in html:
        raise RuntimeError("Could not find the online Supabase config script in index.html")
    html = html.replace(config_script, "    <script>window.SPEED_TYPING_OFFLINE_APP = true;</script>")
    download_panel = '      <section class="apk-download-panel"'
    if download_panel not in html:
        raise RuntimeError("Could not find the Android download panel in index.html")
    html = html.replace(
        download_panel,
        '      <p class="offline-app-notice">Offline app: results are saved only on this device.</p>\n' + download_panel,
    )
    index_path.write_text(html, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
