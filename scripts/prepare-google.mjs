import fs from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const sheetId='1fcJOvdaQrt0WUpdPjhYnlgw28LaAcHVykh6jnIWFBvI';
let secret;
try {const env=await fs.readFile('.env','utf8');secret=env.match(/^GOOGLE_SCRIPT_SECRET=(.+)$/m)?.[1]?.trim();}catch{}
secret ||= randomBytes(32).toString('hex');
try {await fs.access('.env');}catch{await fs.writeFile('.env',`PORT=3000\nHOST=127.0.0.1\nGOOGLE_SCRIPT_URL=\nGOOGLE_SCRIPT_SECRET=${secret}\nPUBLIC_ORIGIN=\n`);}
const source=await fs.readFile('google-apps-script/Code.gs','utf8');
const install=`// Private setup for this project. Do not publish or commit this file.\nfunction installGemadept() {\n  PropertiesService.getScriptProperties().setProperties({SPREADSHEET_ID:'${sheetId}',API_SECRET:'${secret}'});\n  setup();\n}\n\n`;
await fs.writeFile('google-apps-script/INSTALL.gs',install+source);
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));delete pkg.scripts.test;await fs.writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');
await fs.appendFile('.gitignore','google-apps-script/INSTALL.gs\n');
await fs.writeFile('google-apps-script/sheet.json',JSON.stringify({spreadsheetId:sheetId,url:`https://docs.google.com/spreadsheets/d/${sheetId}/edit`,sheets:['Tiệc tri ân','Golf']},null,2));
console.log('Prepared local installation file and private server configuration.');
