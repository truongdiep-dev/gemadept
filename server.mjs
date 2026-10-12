import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const allowedStatus = new Set(['yes','no','undecided']);
const commonFields = ['company','name','position','attendance'];
const partyFields = ['departureDate','departureTime','departureAirport','flightAttendance','returnDate','returnTime','returnAirport','checkIn','checkOut','phone','email'];
export class ValidationError extends Error {}
export function validateRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('Dữ liệu đăng ký không hợp lệ.');
  if (!['party','golf'].includes(input.event)) throw new ValidationError('Vui lòng chọn sự kiện.');
  if (typeof input.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new ValidationError('Mã yêu cầu không hợp lệ. Vui lòng tải lại trang.');
  const result = {event:input.event,requestId:input.requestId};
  for (const key of [...commonFields,...(input.event === 'party' ? partyFields : ['shirtSize','handicap'])]) {
    if (input[key] != null && typeof input[key] !== 'string') throw new ValidationError('Thông tin nhập không hợp lệ.');
    const value = (input[key] || '').trim();
    if (value.length > (key === 'handicap' ? 500 : 160) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new ValidationError('Thông tin quá dài hoặc chứa ký tự không hợp lệ.');
    result[key] = value;
  }
  for (const key of ['company','name','position']) if (!result[key]) throw new ValidationError('Vui lòng nhập đủ công ty, họ tên và chức vụ.');
  if (!allowedStatus.has(result.attendance)) throw new ValidationError('Xác nhận tham dự không hợp lệ.');
  if (input.event === 'golf') {
    if (!['S','M','L','XL','XXL','XXXL'].includes(result.shirtSize)) throw new ValidationError('Vui lòng chọn size áo.');
    return result;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new ValidationError('Vui lòng nhập email hợp lệ.');
  if (!/^[+0-9() .-]{8,25}$/.test(result.phone) || result.phone.replace(/\D/g,'').length < 8) throw new ValidationError('Vui lòng nhập số điện thoại hợp lệ.');
  if (result.flightAttendance && !allowedStatus.has(result.flightAttendance)) throw new ValidationError('Xác nhận tham dự không hợp lệ.');
  for (const key of ['departureDate','returnDate','checkIn','checkOut']) {
    const val = result[key];
    if (val && (!/^202[67]-\d{2}-\d{2}$/.test(val) || Number.isNaN(Date.parse(val)) || new Date(val).toISOString().slice(0,10) !== val)) throw new ValidationError('Ngày được chọn không hợp lệ.');
  }
  for (const key of ['departureTime','returnTime']) {
    const val = result[key];
    if (val && !Array.from({length:24},(_,i)=>`${String(i).padStart(2,'0')}:00-${String((i+2)%24).padStart(2,'0')}:00`).includes(val)) throw new ValidationError('Vui lòng chọn khoảng giờ hợp lệ.');
  }
  if (result.departureDate && result.returnDate && result.returnDate < result.departureDate) throw new ValidationError('Ngày về phải bằng hoặc sau ngày đi.');
  if (Boolean(result.checkIn) !== Boolean(result.checkOut)) throw new ValidationError('Vui lòng chọn đủ ngày nhận và trả phòng.');
  if (result.checkIn && result.checkOut < result.checkIn) throw new ValidationError('Ngày trả phòng phải bằng hoặc sau ngày nhận phòng.');
  return result;
}
// Short batches reduce simultaneous Apps Script executions during arrival bursts.
export function createBatchWriter(send, {delay=90,maxBatch=100,maxPending=500}={}) {
  let queue=[], running=false, timer;
  async function drain() {
    if (running || !queue.length) return;
    running=true;
    const batch=queue.splice(0,maxBatch);
    try {
      const results=await send(batch.map(item=>item.record));
      for (const item of batch) {
        const result=results.find(r=>r.requestId===item.record.requestId && r.event===item.record.event);
        if (!result?.ok || !result.id) item.reject(new Error(result?.message || 'Chưa lưu được đăng ký. Vui lòng thử lại.'));
        else item.resolve({ok:true,id:result.id});
      }
    } catch(err) { for(const item of batch) item.reject(err); }
    finally {running=false; if(queue.length) timer=setTimeout(drain,delay);}
  }
  return record=>new Promise((resolve,reject)=>{
    if(queue.length>=maxPending) {reject(new Error('Có nhiều lượt đăng ký. Vui lòng thử lại sau ít phút.'));return;}
    queue.push({record,resolve,reject});
    if(!running){clearTimeout(timer);timer=setTimeout(drain,delay);}
  });
}
async function readEnv() {
  try { const text=await readFile(path.join(ROOT,'.env'),'utf8');
    for(const line of text.split(/\r?\n/)){ const match=line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if(match && !process.env[match[1]]) process.env[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2'); }
  } catch(err) {if(err.code!=='ENOENT')throw err;}
}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function readBody(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384)throw new ValidationError('Thông tin gửi quá lớn.');}try{return JSON.parse(body);}catch{throw new ValidationError('Dữ liệu gửi không hợp lệ.');}}
export function createApp({writeRegistration,publicOrigin=''}={}) {
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/health' && req.method==='GET'){json(res,200,{ok:true,registrationConfigured:Boolean(writeRegistration)});return;}
   if(url.pathname==='/api/register'){
    if(req.method!=='POST'){res.setHeader('Allow','POST');json(res,405,{ok:false,message:'Phương thức không được hỗ trợ.'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{ok:false,message:'Dữ liệu gửi không hợp lệ.'});return;}
    const origin=req.headers.origin;
    const expected=publicOrigin || `http://${req.headers.host}`;
    if(origin && origin!==expected){json(res,403,{ok:false,message:'Nguồn gửi không hợp lệ.'});return;}
    const record=validateRegistration(await readBody(req));
    if(!writeRegistration){json(res,503,{ok:false,message:'Đăng ký trực tuyến chưa mở. Vui lòng liên hệ Ban tổ chức hoặc thử lại sau.'});return;}
    try {json(res,200,await writeRegistration(record));}catch(err){console.error('Registration storage error:',err.name);json(res,503,{ok:false,message:'Chưa xác nhận được việc lưu đăng ký. Vui lòng thử gửi lại sau ít phút.'});}
    return;
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   let resource=decodeURIComponent(url.pathname);
   if(resource==='/')resource='/index.html';
   if(resource!=='/index.html' && !path.extname(resource) && !resource.startsWith('/api/'))resource='/index.html';
   const staticAllowed=['/index.html','/styles.css','/app.js'].includes(resource) || /^\/assets\/(images|fonts)\/[a-zA-Z0-9_.-]+\.(webp|png|otf|ttf)$/.test(resource);
   if(!staticAllowed){res.writeHead(404);res.end('Not found');return;}
   const file=path.join(ROOT,resource);
   const data=await readFile(file);const ext=path.extname(file);
   res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.otf':'font/otf','.ttf':'font/ttf'})[ext],'Content-Length':data.length,'Cache-Control':resource.startsWith('/assets/')?'public, max-age=86400':'no-cache'});
   res.end(req.method==='HEAD'?undefined:data);
  }catch(err){if(err instanceof ValidationError)json(res,400,{ok:false,message:err.message});else if(err.code==='ENOENT'){res.writeHead(404);res.end('Not found');}else{console.error('Request failed:',err.name);json(res,500,{ok:false,message:'Có lỗi xảy ra. Vui lòng thử lại.'});}}
 });
}
export async function googleTransport(records) {
 const response=await fetch(process.env.GOOGLE_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.GOOGLE_SCRIPT_SECRET,records}),redirect:'follow',signal:AbortSignal.timeout(35000)});
 if(!response.ok)throw new Error('Google endpoint unavailable');
 const data=await response.json();
 if(!data.ok || !Array.isArray(data.results))throw new Error('Google storage rejected request');
 return data.results;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await readEnv();
 const configured=/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(process.env.GOOGLE_SCRIPT_URL||'') && (process.env.GOOGLE_SCRIPT_SECRET||'').length>=32;
 const server=createApp({writeRegistration:configured?createBatchWriter(googleTransport):undefined,publicOrigin:process.env.PUBLIC_ORIGIN||''});
 const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
 server.listen(port,host,()=>console.log(`Gemadept preview: http://${host}:${port}\nGoogle Sheets: ${configured?'configured':'not connected yet'}`));
}
