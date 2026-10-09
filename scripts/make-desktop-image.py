from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'source/JPG/GMD-thumoionl-02.jpg'
out=root/'assets/images/port-desktop.webp'
with Image.open(source) as image:
    # The port and sunset are taken from the lower part of the supplied artwork.
    crop=image.crop((0,8150,6000,10550))
    crop.thumbnail((2200,1000),Image.Resampling.LANCZOS)
    crop.save(out,'WEBP',quality=90,method=6)
print(out.name,out.stat().st_size)
