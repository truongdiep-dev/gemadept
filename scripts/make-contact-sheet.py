from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
root=Path.cwd()
files=sorted((root/'source/JPG').glob('*.jpg'))
sheet=Image.new('RGB',(1400,1600),'#e5e7eb')
draw=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 
 if p.stem.endswith('-14'): continue
 im=Image.open(p); print(p.name,im.size)
 thumb=ImageOps.contain(im,(320,720))
 x=(i%4)*350+(350-thumb.width)//2; y=(i//4)*400+30
 thumb=ImageOps.contain(im,(320,360))
 x=(i%4)*350+(350-thumb.width)//2
 sheet.paste(thumb,(x,y)); draw.text(((i%4)*350+15,y-22),p.name,fill='black')
sheet.save(root/'source/contact-sheet.jpg')

