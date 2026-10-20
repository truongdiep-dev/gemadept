from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parents[1]
canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)

# At 16 px the full wordmark becomes unreadable. Keep the globe's blue and
# simplify its lettering to one bold initial that survives tab-size rendering.
draw.ellipse((8, 8, 248, 248), fill="#087BB9")
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 190)
draw.text((128, 124), "G", font=font, fill="white", anchor="mm")

canvas.save(
    root / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
