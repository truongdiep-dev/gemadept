from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
src = np.asarray(Image.open(root / 'assets/images/beyond-the-horizon.png').convert('RGB'), dtype=float) / 255
h, w, _ = src.shape
y, x = np.mgrid[:h, :w]
x, y = x / w, y / h
terms = np.stack([np.ones_like(x), x, y, x*x, x*y, y*y], axis=-1)
# Fit the blue gradient from unobstructed background pixels.
samples = (src[..., 0] < .07) & (src[..., 1] > .31) & (src[..., 2] > .83)
coeff = np.linalg.lstsq(terms[samples], src[samples], rcond=None)[0]
bg = np.clip(terms @ coeff, .001, .999)
# Recover translucent glints and dark shadows as well as opaque gold.
positive = (src-bg) / (1-bg)
negative = (bg-src) / bg
alpha = np.clip(np.maximum(positive, negative).max(axis=-1), 0, 1)
gold = src[..., 0] > src[..., 2] + .06
alpha[gold] = 1
alpha[(~gold) & (alpha < .045)] = 0
rgb = np.clip((src-bg*(1-alpha[..., None])) / np.maximum(alpha[..., None], 1e-6), 0, 1)
rgba = np.dstack([rgb, alpha])
Image.fromarray(np.rint(rgba*255).astype('uint8')).save(root / 'assets/images/beyond-the-horizon-transparent.webp', lossless=True)
