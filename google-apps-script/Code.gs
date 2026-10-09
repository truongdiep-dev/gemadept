/**
 * GEMADEPT 2026 registration receiver.
 * Script Properties required: SPREADSHEET_ID and API_SECRET (at least 32 characters).
 * Deploy as Web app: Execute as Me, access Anyone. API_SECRET is kept on the Node server.
 * Spreadsheet sharing remains Restricted; only managers need sheet access.
 */
const COMMON_HEADERS = ['Mã đăng ký','Thời gian đăng ký','Công ty','Họ và tên','Chức vụ','Xác nhận tham dự'];
const PARTY_HEADERS = COMMON_HEADERS.concat(['Ngày đi','Giờ đi','Sân bay đi','Xác nhận tại bước vé','Ngày về','Giờ về','Sân bay đến','Ngày nhận phòng','Ngày trả phòng','Số điện thoại','Email']);
const GOLF_HEADERS = COMMON_HEADERS.concat(['Size áo','Handicap / VGA']);
const STATUS_LABELS = {yes:'Xác nhận tham dự',no:'Xác nhận không tham dự',undecided:'Chưa xác định'};

function setup() {
  const config = PropertiesService.getScriptProperties();
  const id = config.getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Thêm SPREADSHEET_ID trong Project Settings > Script Properties.');
  if ((config.getProperty('API_SECRET') || '').length < 32) throw new Error('Thêm API_SECRET ít nhất 32 ký tự trong Script Properties.');
  const book = SpreadsheetApp.openById(id);
  book.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  [['Tiệc tri ân',PARTY_HEADERS],['Golf',GOLF_HEADERS]].forEach(function(def) {
    const sheet = book.getSheetByName(def[0]) || book.insertSheet(def[0]);
    const headers = def[1];
    if (sheet.getMaxRows() < 1000) sheet.insertRowsAfter(sheet.getMaxRows(),1000-sheet.getMaxRows());
    if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());
    sheet.getRange(1,1,1,headers.length).setValues([headers]).setBackground('#0736b8').setFontColor('#ffffff').setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
    sheet.setRowHeight(1,42);
    sheet.setFrozenRows(1);
    sheet.setHiddenGridlines(true);
    sheet.setColumnWidths(1,headers.length,180);sheet.setColumnWidth(1,310);sheet.setColumnWidth(2,185);
    sheet.getRange(2,1,999,headers.length).setNumberFormat('@');
    sheet.getRange('B2:B1000').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    if (def[0] === 'Tiệc tri ân') {
      ['G','K','N','O'].forEach(function(col){sheet.getRange(col+'2:'+col+'1000').setNumberFormat('dd/MM/yyyy');});
      sheet.setColumnWidth(17,270);
    }
    if (!sheet.getFilter()) sheet.getRange(1,1,sheet.getMaxRows(),headers.length).createFilter();
  });
  SpreadsheetApp.flush();
}
function output_(data) {return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function text_(value) {
  const text = String(value == null ? '' : value).trim();
  // Preserve phone numbers and prevent user input becoming a spreadsheet formula.
  return /^[=+@-]/.test(text) ? "'"+text : text;
}
function date_(value) {return value ? new Date(value+'T00:00:00+07:00') : '';}
function validate_(record) {
  if (!record || !['party','golf'].includes(record.event)) throw new Error('Invalid event');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.requestId || '')) throw new Error('Invalid request id');
  ['company','name','position'].forEach(function(key) {if(typeof record[key] !== 'string' || !record[key].trim() || record[key].length>160)throw new Error('Invalid guest information');});
  if (!Object.prototype.hasOwnProperty.call(STATUS_LABELS,record.attendance)) throw new Error('Invalid attendance');
  Object.keys(record).forEach(function(key){if(typeof record[key] !== 'string' || record[key].length>500)throw new Error('Invalid field');});
  if(record.event==='party') {
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email || ''))throw new Error('Invalid email');
    if(!/^[+0-9() .-]{8,25}$/.test(record.phone || '') || record.phone.replace(/\D/g,'').length<8)throw new Error('Invalid phone');
    if(record.flightAttendance && !Object.prototype.hasOwnProperty.call(STATUS_LABELS,record.flightAttendance))throw new Error('Invalid attendance');
    ['departureDate','returnDate','checkIn','checkOut'].forEach(function(key){const val=record[key];if(val && (!/^202[67]-\d{2}-\d{2}$/.test(val) || isNaN(new Date(val).getTime()) || new Date(val).toISOString().slice(0,10)!==val))throw new Error('Invalid date');});
    ['departureTime','returnTime'].forEach(function(key){const val=record[key];if(val && !Array.from({length:24},function(_,i){return String(i).padStart(2,'0')+':00-'+String((i+2)%24).padStart(2,'0')+':00';}).includes(val))throw new Error('Invalid time slot');});
    if(record.departureDate && record.returnDate && record.returnDate<record.departureDate)throw new Error('Invalid trip dates');
    if(Boolean(record.checkIn)!==Boolean(record.checkOut) || (record.checkIn && record.checkOut<record.checkIn))throw new Error('Invalid hotel dates');
  } else if(!['S','M','L','XL','XXL','XXXL'].includes(record.shirtSize))throw new Error('Invalid shirt size');
}
function row_(r,now) {
  const cells=[r.requestId,now,text_(r.company),text_(r.name),text_(r.position),STATUS_LABELS[r.attendance]];
  if(r.event==='golf')return cells.concat([text_(r.shirtSize),text_(r.handicap)]);
  return cells.concat([date_(r.departureDate),text_(r.departureTime),text_(r.departureAirport),STATUS_LABELS[r.flightAttendance] || '',date_(r.returnDate),text_(r.returnTime),text_(r.returnAirport),date_(r.checkIn),date_(r.checkOut),text_(r.phone),text_(r.email)]);
}
function doPost(e) {
  let lock;
  try {
    const config=PropertiesService.getScriptProperties();
    const payload=JSON.parse(e.postData.contents);
    const secret=config.getProperty('API_SECRET');
    if(!secret || secret.length<32 || payload.secret!==secret)return output_({ok:false,message:'Unauthorized'});
    if(!Array.isArray(payload.records) || !payload.records.length || payload.records.length>100)return output_({ok:false,message:'Invalid batch'});
    payload.records.forEach(validate_);
    lock=LockService.getScriptLock();lock.waitLock(25000);
    const book=SpreadsheetApp.openById(config.getProperty('SPREADSHEET_ID'));
    const results=[];
    ['party','golf'].forEach(function(event) {
      const sheet=book.getSheetByName(event==='party'?'Tiệc tri ân':'Golf');
      if(!sheet)throw new Error('Run setup first');
      const existing=new Set(sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues().map(function(row){return row[0];}) : []);
      const rows=[];
      payload.records.filter(function(r){return r.event===event;}).forEach(function(record){
        if(!existing.has(record.requestId)){rows.push(row_(record,new Date()));existing.add(record.requestId);}
        results.push({ok:true,event:event,requestId:record.requestId,id:record.requestId});
      });
      if(rows.length){
        const start=sheet.getLastRow()+1,needed=start+rows.length-1;
        if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),Math.max(500,needed-sheet.getMaxRows()));
        const range=sheet.getRange(start,1,rows.length,rows[0].length);
        range.setNumberFormat('@').setValues(rows).setFontFamily('Arial').setFontSize(11).setFontColor('#172e4f').setVerticalAlignment('middle');
        sheet.getRange(start,2,rows.length,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
        if(event==='party')[7,11,14,15].forEach(function(col){sheet.getRange(start,col,rows.length,1).setNumberFormat('dd/MM/yyyy');});
        const filter=sheet.getFilter();if(filter && needed>filter.getRange().getLastRow()){filter.remove();sheet.getRange(1,1,sheet.getMaxRows(),rows[0].length).createFilter();}
      }
    });
    SpreadsheetApp.flush();
    return output_({ok:true,results:results});
  } catch(err) {
    console.error(err.message);
    return output_({ok:false,message:'Unable to save registration. Please retry.'});
  } finally {if(lock && lock.hasLock())lock.releaseLock();}
}
function doGet() {return output_({ok:true,service:'Gemadept registration'});}
