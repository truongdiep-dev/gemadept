"""Keep the original gold lettering and remove the damaged yellow backgrounds."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


IMAGES = Path(__file__).resolve().parents[1] / "assets/images"
NAMES = (
    "title-registration-success-2026",
    "title-party-detail-2026",
    "title-party-agenda-2026",
    "title-party-2026",
    "title-attendance-confirmation-2026",
)


for name in NAMES:
    source = np.array(Image.open(IMAGES / f"{name}.webp").convert("RGBA"))
    red = source[:, :, 0].astype(np.int16)
    green = source[:, :, 1].astype(np.int16)
    blue = source[:, :, 2].astype(np.int16)
    original_alpha = source[:, :, 3]

    # The gold ink has a warm blue component and more red than green. The
    # damaged solid-yellow rectangles have virtually no blue component.
    gold = (
        (original_alpha > 80)
        & (red > 120)
        & (blue > 25)
        & (red > green)
    )
    alpha = Image.fromarray((gold * 255).astype(np.uint8), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.5))
    source[:, :, 3] = np.asarray(alpha)
    source[source[:, :, 3] == 0, :3] = 0

    destination = IMAGES / f"{name}-clean.png"
    Image.fromarray(source, "RGBA").save(destination, optimize=True)
    print(destination.name)
