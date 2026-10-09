import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const common=['Mã đăng ký','Thời gian đăng ký','Công ty','Họ và tên','Chức vụ','Xác nhận tham dự'];
const sheets=[['Tiệc tri ân',[...common,'Ngày đi','Giờ đi','Sân bay đi','Xác nhận tại bước vé','Ngày về','Giờ về','Sân bay đến','Ngày nhận phòng','Ngày trả phòng','Số điện thoại','Email']],['Golf',[...common,'Size áo','Handicap / VGA']]];
const wb=Workbook.create();
for(const [name,headers] of sheets){
 const s=wb.worksheets.add(name);s.showGridLines=false;s.tabColor='#0639C7';
 const r=s.getRangeByIndexes(0,0,1,headers.length);r.values=[headers];
 r.format={fill:'#0736B8',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:42,columnWidth:24,wrapText:true,verticalAlignment:'center',horizontalAlignment:'center'};
 s.getRange('A:A').format.columnWidth=39;s.getRange('B:B').format.columnWidth=23;s.getRange('C:E').format.columnWidth=27;
 s.freezePanes.freezeRows(1);
 if(name==='Tiệc tri ân'){s.getRange('Q:Q').format.columnWidth=35;s.getRange('P2:P1000').setNumberFormat('@');}
}
wb.recalculate();
console.log((await wb.inspect({kind:'sheet',include:'id,name',maxChars:1000})).ndjson);
await fs.mkdir('outputs',{recursive:true});
for(const [name] of sheets){const image=await wb.render({sheetName:name,range:name==='Golf'?'A1:H3':'A1:F3',scale:1.5,format:'png'});await fs.writeFile(`outputs/${name==='Golf'?'golf':'party'}-sheet.png`,new Uint8Array(await image.arrayBuffer()));}
await (await SpreadsheetFile.exportXlsx(wb)).save('outputs/gemadept-registration-template.xlsx');
console.log('Workbook exported');
