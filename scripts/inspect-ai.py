from pathlib import Path
from PIL import Image
import fitz
p=Path(r'C:/Users/Truong Diep/Downloads/GMD-thumoionl.ai')
print('Header',p.open('rb').read(40))
doc=fitz.open(p)
print('Pages:',len(doc))
for n,page in enumerate(doc):
 print(n+1, page.rect, 'images',len(page.get_images()), 'text', len(page.get_text()))
Path('source/design-text.txt').write_text('\n\n'.join('PAGE '+str(i+1)+'\n'+p.get_text() for i,p in enumerate(doc)),encoding='utf-8')
for n in [2,3,4,5,6,7,8,9,10,11,12]:
 im=Image.open(f'source/JPG/GMD-thumoionl-{n:02}.jpg'); im.thumbnail((900,1700)); im.save(f'source/preview-{n:02}.jpg')
