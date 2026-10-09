from PIL import Image
for n in [2,3,4,5,6,7,8,9,10,11,12]:
 im=Image.open(f'source/JPG/GMD-thumoionl-{n:02}.jpg'); im.thumbnail((900,1700)); im.save(f'source/preview-{n:02}.jpg')
