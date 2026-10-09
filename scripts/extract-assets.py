from pathlib import Path
from PIL import Image
import numpy as np
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/images'
OUT.mkdir(parents=True,exist_ok=True)
manifest=[]
def page(n):
 im=Image.open(ROOT/f'source/JPG/GMD-thumoionl-{n:02}.jpg').convert('RGB')
 return im.resize((1440,round(im.height*1440/im.width)),Image.Resampling.LANCZOS)
def asset(n,name,box,width=None,transparent=False):
 im=page(n); box=tuple(round(v*1.6) for v in box)
 crop=im.crop(box)
 if transparent:
  a=np.asarray(crop).astype(float)
  full=np.asarray(im).astype(float)
  bg=np.median(np.concatenate([full[box[1]:box[3],20:45],full[box[1]:box[3],-45:-20]],axis=1),axis=1)[:,None,:]
  distance=np.max(np.abs(a-bg),axis=2)
  alpha=np.clip((distance-9)/22,0,1)
  # Undo blue edge contamination around the cutout.
  foreground=(a-bg*(1-alpha[:,:,None]))/np.maximum(alpha[:,:,None],.01)
  rgba=np.concatenate([np.clip(foreground,0,255),alpha[:,:,None]*255],axis=2).astype('uint8')
  crop=Image.fromarray(rgba)
 if width and crop.width>width:
  crop=crop.resize((width,round(crop.height*width/crop.width)),Image.Resampling.LANCZOS)
 crop.save(OUT/(name+'.webp'),quality=94,method=6)
 manifest.append({'file':name+'.webp','source':f'GMD-thumoionl-{n:02}.jpg','cropAt1440px':box,'transparent':transparent})
asset(2,'gemadept-logo',(305,155,600,278),480,True)
asset(2,'anniversary-36',(308,305,595,545),480,True)
asset(3,'title-thu-ngo',(352,138,550,250),350,True)
asset(3,'title-welcome',(291,870,635,970),550,True)
asset(4,'title-agenda',(355,170,545,262),320,True)
asset(4,'title-program',(325,654,573,739),430,True)
asset(6,'title-activities',(350,45,552,132),350,True)
asset(6,'event-party',(224,194,665,442),700,True)
asset(6,'event-golf',(237,577,672,825),700,True)
asset(5,'golf-header',(0,0,900,253),1440)
asset(5,'golf-landscape',(0,1090,900,1687.5),1440)
asset(4,'ocean',(0,1258,900,1687.5),1440)
# Reconstruct the text-free homepage using its own edge colours and unaltered lower artwork.
im=page(2); a=np.asarray(im).copy(); rows=np.median(a[:,8:22,:],axis=1).astype('uint8'); bg=np.repeat(rows[:,None,:],1440,axis=1); bg[1480:]=a[1480:]
Image.fromarray(bg).save(OUT/'home-background.webp',quality=92,method=6)
manifest.append({'file':'home-background.webp','source':'GMD-thumoionl-02.jpg','method':'Original lower artwork from y=1480; upper text removed using edge colour per row.'})
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Extracted',len(manifest),'assets; total',round(sum(p.stat().st_size for p in OUT.glob('*.webp'))/1024),'KB')
