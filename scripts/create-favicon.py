from pathlib import Path

from PIL import Image


root = Path(__file__).resolve().parents[1]
logo = Image.open(root / "assets/images/gemadept-logo.webp").convert("RGBA")

# The globe occupies the upper part of the existing transparent logo.
globe = logo.crop((0, 0, logo.width, 145))
globe = globe.crop(globe.getchannel("A").getbbox())

canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
globe.thumbnail((240, 240), Image.Resampling.LANCZOS)
canvas.alpha_composite(globe, ((256 - globe.width) // 2, (256 - globe.height) // 2))
canvas.save(root / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
