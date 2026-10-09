import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:720,height:1400},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:3000/#thu-ngo');
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'source/letter-current.png',fullPage:true});
for(const selector of ['.letter-content','.letter-content strong','.letter-content p','.horizon','.welcome-title img','.english-horizon']){
 const item=page.locator(selector).first(); const out=await item.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,width:r.width,height:r.height,top:r.top}});console.log(selector,JSON.stringify(out));
}
await browser.close();
