import {ValidationError, validateRegistration, googleTransport} from '../server.mjs';

const scriptUrl = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, {ok:false, message:'Phương thức không được hỗ trợ.'});
  }
  if (!req.headers['content-type']?.startsWith('application/json')) {
    return reply(res, 415, {ok:false, message:'Dữ liệu gửi không hợp lệ.'});
  }
  const origin = req.headers.origin;
  if (origin && origin !== `https://${req.headers.host}`) {
    return reply(res, 403, {ok:false, message:'Nguồn gửi không hợp lệ.'});
  }

  let record;
  try {
    const body = req.body;
    if (Buffer.byteLength(JSON.stringify(body ?? null)) > 16384) {
      throw new ValidationError('Thông tin gửi quá lớn.');
    }
    record = validateRegistration(body);
  } catch (error) {
    return reply(res, 400, {ok:false, message:error instanceof ValidationError ? error.message : 'Dữ liệu gửi không hợp lệ.'});
  }

  if (!scriptUrl.test(process.env.GOOGLE_SCRIPT_URL || '') ||
      (process.env.GOOGLE_SCRIPT_SECRET || '').length < 32) {
    return reply(res, 503, {ok:false, message:'Đăng ký trực tuyến chưa mở. Vui lòng liên hệ Ban tổ chức hoặc thử lại sau.'});
  }

  try {
    const results = await googleTransport([record]);
    const saved = results.find(item => item.ok && item.event === record.event &&
      item.requestId === record.requestId && item.id);
    if (!saved) throw new Error('Registration was not acknowledged');
    return reply(res, 200, {ok:true, id:saved.id});
  } catch (error) {
    console.error('Registration storage error:', error.name);
    return reply(res, 503, {ok:false, message:'Chưa xác nhận được việc lưu đăng ký. Vui lòng thử gửi lại sau ít phút.'});
  }
}