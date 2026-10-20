/*  ============================================================
 *  ระบบรายงานอุบัติการณ์ มหาวิทยาลัยนเรศวร — ฝั่งเซิร์ฟเวอร์
 *  ฐานข้อมูล : Google Sheets   |   ไฟล์แนบและรูปภาพ : Google Drive
 *
 *  วิธีติดตั้ง (ทำครั้งเดียว)
 *   1) เปิด script.google.com → New project → วางไฟล์นี้เป็น Code.gs
 *   2) เพิ่มไฟล์สคริปต์อีกไฟล์ชื่อ Api.gs แล้ววางเนื้อหาของ Api.gs
 *      (จุดเรียก API เพียงจุดเดียว ต้องอยู่ในโปรเจกต์เดียวกับไฟล์นี้ ไม่แยก deploy ต่างหาก)
 *   3) สร้างไฟล์ HTML ชื่อ Index แล้ววางเนื้อหาจาก Index.html (ชื่อต้องเป็น Index ตรงกับ doGet)
 *   4) เปิด Project Settings → Show "appsscript.json" manifest file แล้ววาง appsscript.json ที่แนบมาชุดเดียวกัน
 *   5) แก้ CONFIG ด้านล่างให้ตรงกับหน่วยงาน โดยเฉพาะ ALLOWED_DOMAIN และ FIRST_ADMIN
 *   6) เมนู Run → เลือกฟังก์ชัน setupFromEditor → กด Run แล้วอนุญาตสิทธิ์
 *      ระบบจะสร้างโฟลเดอร์ NU-Incident-System ใน My Drive (หรือใต้ CONFIG.PARENT_FOLDER) แล้วเก็บไว้ข้างใน
 *        ├── NU-Incident-DB            ฐานข้อมูลอุบัติการณ์ (Google Sheet)
 *        ├── NU-Incident-Users         ทะเบียนผู้ใช้และสิทธิ์ (Google Sheet แยกไฟล์)
 *        ├── NU-Incident-Attachments/  ไฟล์แนบและรูปภาพ
 *        └── สำรองข้อมูล/              สร้างเมื่อสำรองข้อมูลครั้งแรก
 *      พร้อมพิมพ์ลิงก์ทั้งหมดออกมาใน Execution log
 *      ต้องรันด้วยบัญชีในโดเมน CONFIG.ALLOWED_DOMAIN หรือกรอก CONFIG.FIRST_ADMIN ก่อน มิฉะนั้นระบบจะหยุดก่อนสร้างไฟล์ใด ๆ
 *   7) Deploy → New deployment → Web app
 *        Execute as       : Me (เจ้าของไฟล์)
 *        Who has access   : Anyone within <โดเมนมหาวิทยาลัย>
 *   8) เปิด URL /exec ที่ได้ เฉพาะบัญชี Editor ที่ใช้ Deploy จะเปิด Dashboard อัตโนมัติ
 *      ผู้ใช้ทุกบทบาทรวม reporter จะเริ่มที่หน้า Login และหลังเข้าสู่ระบบสำเร็จจะไปหน้าเขียนรายงานอุบัติการณ์
 *      เมื่อกด "ออกจากระบบ" หน้าปัจจุบันจะกลับไปหน้าเข้าสู่ระบบ แต่หากบัญชีผู้ Deploy เปิด /exec ใหม่
 *      ระบบจะเปิด Dashboard อัตโนมัติตามกติกาข้างต้น ส่วนผู้ใช้อื่นยังต้องกดเข้าสู่ระบบเสมอ
 *      ผู้ดูแลคนแรกมาจาก CONFIG.FIRST_ADMIN หรือบัญชีเจ้าของที่รัน setupFromEditor เท่านั้น
 *   9) รัน runSelfTest จาก Editor ต้องผ่านทุกรายการ แล้วเปิดหน้า สุขภาพระบบ ในเว็บตรวจซ้ำ
 *
 *  อัปเกรดจากรุ่นก่อน 2.8.0 (ระบบที่ใช้งานอยู่แล้ว — ข้อมูลเดิมอยู่ครบ ไม่สร้างฐานข้อมูลใหม่)
 *   1) วางทับ Code.gs Api.gs Tests.gs Index.html และ appsscript.json (เปิด Advanced Drive Service)
 *   2) รัน setupFromEditor อีกครั้งแล้วอนุญาตสิทธิ์ใหม่ — รันซ้ำได้ปลอดภัย ใช้ฐานข้อมูล ทะเบียนผู้ใช้ และโฟลเดอร์เดิม
 *      ย้ายไฟล์ที่วางลอยใน My Drive เข้าโฟลเดอร์ NU-Incident-System ติดตั้งทริกเกอร์ชุดใหม่ และแชร์ชีตทะเบียนผู้ใช้ให้ผู้ดูแลระบบ
 *   3) รัน syncAttachmentAccessFromEditor หนึ่งครั้ง — ปิดลิงก์ไฟล์แนบเดิมที่เคยแชร์ทั้งโดเมน
 *      แล้วแชร์ไฟล์ให้เฉพาะบทบาทที่มีสิทธิ์ (ไฟล์มากจะทำต่อเองเป็นรอบ ๆ รอบละ 4 นาที)
 *   4) รัน runSelfTest แล้ว Deploy → Manage deployments → Edit → New version
 *
 *  ติดตั้งเพิ่มเติม: ให้ server ของมหาวิทยาลัย host หน้าเว็บเอง (ไม่บังคับ)
 *   ทำขั้นตอน 1-7 ข้างต้นให้เสร็จก่อนเสมอ — Apps Script ยังเป็น backend เพียงจุดเดียว ไม่มีการย้ายฐานข้อมูลออกไปไหน
 *   ก) Google Cloud Console ของโปรเจกต์เดียวกับสคริปต์นี้ → สร้าง OAuth 2.0 Client ID ชนิด Web application
 *      ใส่โดเมนของ server มหาวิทยาลัยใน Authorized JavaScript origins แล้วนำ Client ID มาใส่ CONFIG.OAUTH_CLIENT_ID ด้านล่าง
 *   ข) ในสำเนาไฟล์ Index.html ที่จะนำไปวางบน server มหาวิทยาลัย
 *      ตั้งค่า EXTERNAL_API_URL เป็น URL ของ Web App จากขั้นตอน 7 (ลงท้าย /exec) และ OAUTH_CLIENT_ID ให้ตรงกับข้อ ก)
 *   ค) นำไฟล์ Index.html ชุดนั้นไปวางบนเว็บเซิร์ฟเวอร์ของมหาวิทยาลัยได้ตามปกติ
 *      หน้าเว็บจะยืนยันตัวตนด้วย Google Identity Services แล้วเรียก API ผ่าน doPost() ของ Web App เดิม
 *      แทนช่องทาง google.script.run — รายละเอียดเต็มอยู่ใน ARCHITECTURE.md และ API-SPEC.md
 *  ============================================================ */

var CONFIG = {
  ALLOWED_DOMAIN : 'nu.ac.th',                 // << ตรวจสอบให้ตรงกับโดเมนจริงก่อน Deploy
  /* อีเมลผู้ดูแลระบบคนแรก ระบุไว้ล่วงหน้าเพื่อไม่ให้สิทธิ์ผู้ดูแลขึ้นกับ "ใครรันหรือใครเปิดก่อน"
     เว้นว่างได้ ระบบจะใช้บัญชีที่รัน setupFromEditor แทน */
  FIRST_ADMIN    : '',                          // << เว้นว่างไว้ = บัญชีที่ Run setupFromEditor กลายเป็นผู้ดูแลระบบเอง
  /* ทะเบียนผู้ใช้และสิทธิ์แยกจากฐานข้อมูลอุบัติการณ์เสมอ
     USERS_SS_ID คือรหัสระหว่าง /d/ และ /edit ใน URL ของ Google Sheet
     USERS_SHEET_ID คือค่า gid ของแท็บทะเบียนสิทธิ์ (ใช้เลขแท็บเพื่อไม่ผูกกับชื่อที่อาจถูกเปลี่ยน)
     หาก USERS_SS_ID ว่าง setupFromEditor จะสร้าง Spreadsheet ทะเบียนผู้ใช้แยกให้อัตโนมัติ
     และจำรหัสไว้ใน Script Properties ชื่อ USERS_SS_ID โดยไม่ต้องแก้ Code ซ้ำ
     กรอก USERS_SS_ID เฉพาะเมื่อต้องการใช้ทะเบียนที่มีอยู่แล้ว และต้องแชร์ไฟล์นั้น
     ให้บัญชีที่ Deploy เป็น Editor ก่อน มิฉะนั้นระบบจะเปิดทะเบียนไม่ได้ทั้งระบบ */
  USERS_SS_ID    : '',
  USERS_SHEET_ID : 0,
  USERS_SHEET_NAME: 'Users',
  USERS_DB_NAME  : 'NU-Incident-Users',
  /* URL ของเว็บแอปที่ผู้ใช้เปิดจริง (ลงท้าย /exec) ใช้ทำลิงก์ "เปิดเรื่อง" ในอีเมลแจ้งเตือน (รุ่น 2.8.36)
     ScriptApp.getService().getUrl() ในทริกเกอร์รายวันอาจคืน URL ของ Deployment อื่น (เช่น ตัวเก่าที่ยังไม่ได้ลบ)
     ผู้รับอีเมลจึงถูกพาไปเปิดระบบรุ่นเก่า ตั้งค่าได้ที่นี่ หรือที่ Project Settings → Script Properties ชื่อ APP_URL */
  APP_URL        : '',
  /* OAuth 2.0 Client ID (ชนิด Web application) จาก Google Cloud Console ของโปรเจกต์นี้
     ใช้เฉพาะเมื่อหน้าเว็บ served นอก Apps Script (เช่น server ของมหาวิทยาลัย) และยืนยันตัวตนด้วย
     Google Identity Services แทน Session.getActiveUser() — ดู verifyIdToken_ และ doPost ใน Api.gs
     เว้นว่างไว้ได้ถ้าเปิดผ่าน URL ของ Apps Script ตามปกติ (ขั้นตอนติดตั้งหลักไม่ต้องใช้ค่านี้) */
  OAUTH_CLIENT_ID: '',
  /* ID token ต้องมาจากบัญชี Google Workspace ของมหาวิทยาลัย (claim "hd") ไม่ใช่แค่อีเมลลงท้ายโดเมนเดียวกัน
     บัญชี Google ส่วนตัวที่สมัครด้วยอีเมล @nu.ac.th ก็ได้ email_verified=true เช่นกัน แต่ไม่มี hd
     ตั้งเป็น false เฉพาะกรณีโดเมนของมหาวิทยาลัยไม่ได้ใช้ Google Workspace */
  REQUIRE_HOSTED_DOMAIN: true,
  BACKUP_KEEP    : 30,                         // จำนวนสำเนาสำรองรายวันที่เก็บย้อนหลัง
  /* จำนวนรายการบันทึกร่องรอยที่คงไว้ในชีต Audit — ที่เกินจากนี้ถูกย้ายไปชีตเก็บถาวรอัตโนมัติทุกเดือน
     ไม่ใช่การลบ ข้อมูลยังอยู่ครบในไฟล์เดียวกันและถูกสำรองตามรอบปกติ
     ค่านี้กำหนดเพดานเวลาที่หน้าตรวจความพร้อมใช้ เพราะการตรวจต้องคำนวณ HMAC ใหม่ทุกแถวเสมอ
     ที่ 2000 รายการใช้เวลาราว 2-4 วินาที ถ้าตั้งสูงกว่านี้มากหน้าจอจะเริ่มหน่วงจนผู้ดูแลเลิกกดตรวจ */
  AUDIT_KEEP     : 2000,
  /* ชั่วโมงการทำงานมาตรฐานต่อคนต่อปี = HOURS_PER_DAY × WORK_DAYS_PER_YEAR (ดู defaultHoursPerYear_)
     ใช้เมื่อชีต OrgHeadcount ไม่ได้ระบุชั่วโมง/คน/ปีของหน่วยงานนั้น
     ตั้งแต่รุ่น 2.8.2 ใช้ 7 ชั่วโมง/วัน × 240 วัน = 1,680 ชั่วโมง/คน/ปี (เดิม 8 × 240 = 1,920)
     ถ้าเปลี่ยนค่านี้ ดัชนี IFR/PDFR/ISR ของทุกหน่วยงานที่ไม่ได้ระบุค่าเองจะเปลี่ยนตามทันที
     หน่วยงานที่มีบุคลากรหลายแบบ (เข้าเวร พาร์ตไทม์ ฯลฯ) กรอกค่าเฉลี่ยถ่วงน้ำหนักของตนเองในทะเบียนได้ */
  HOURS_PER_DAY      : 7,
  WORK_DAYS_PER_YEAR : 240,
  DB_NAME        : 'NU-Incident-DB',
  /* โฟลเดอร์หลักของระบบ — เก็บ NU-Incident-DB, ทะเบียนผู้ใช้, โฟลเดอร์ไฟล์แนบ และสำเนาสำรองไว้ที่เดียว
     เดิมไฟล์ฐานข้อมูลทั้งสองวางลอยอยู่ที่ My Drive โดยตรง หาไม่เจอว่าระบบเก็บข้อมูลไว้ตรงไหน */
  SYSTEM_FOLDER_NAME : 'NU-Incident-System',
  FOLDER_NAME    : 'NU-Incident-Attachments',
  /* โฟลเดอร์ปลายทางใน Drive ('' = My Drive ของบัญชีที่ Deploy)
     ต้องเป็นโฟลเดอร์ที่บัญชีกลางเข้าถึงได้ หากกำหนดผิดระบบจะหยุดและแจ้งข้อผิดพลาด
     ตรวจผลได้ที่หน้า สุขภาพระบบ → drive-parent-folder */
  PARENT_FOLDER  : '',
  NOTIFY_LEVEL   : 3,                          // ระดับที่ต้องส่งอีเมลแจ้งเตือนทันที
  /* การแชร์ไฟล์แนบ
     'roles'   = (ค่าเริ่มต้น) ไฟล์เป็นส่วนตัว และแชร์รายบุคคลให้บทบาทใน ATTACH_VIEW_ROLES เท่านั้น
                 ได้แก่ ผู้ดูแลระบบ ผู้ดูแลระบบระดับคณะ หัวหน้าสำนักงาน รองคณบดี (กำกับดูแล) และคณบดี ของคณะที่เกิดเหตุ
                 ต้องเปิด Advanced Drive Service (appsscript.json ชุดนี้เปิดไว้แล้ว) เพื่อแชร์โดยไม่ส่งอีเมลแจ้งทุกไฟล์
     'domain'  = บุคลากรในโดเมนที่มีลิงก์เปิดดูได้
     'private' = ไม่แชร์เลย เปิดได้เฉพาะบัญชีเจ้าของระบบ */
  ATTACH_SHARING : 'roles',
  MAX_FILE_MB    : 25,
  SYSTEM_NAME    : 'ระบบรายงานอุบัติการณ์ มหาวิทยาลัยนเรศวร'
};

/* ---------- โครงสร้างชีต ---------- */
var SHEETS = {
  Incidents : ['id','createdAt','updatedAt','status','level','suggestLevel',
               'title','detail','kind','cats','date','time','place','mapUrl',
               'faculty','orgUnit','unit','subUnit',
               'reporter','reporterEmail','reporterPos','anon',
               'activity','course','involved',
               'injuryAxis','damageAxis','damageBaht','parts','treat','daysOff','assets','firstAid',
               'confirmNote','causes','investNote','meetDate','meetPlace','capa','monitor','capaNote','deputyNote','monitorNote','monitorLog','reviewNote','ackNote','ackAt','closeNote',
               'verbalAt','writtenAt','uniReportAt','files','log',
               'cancelledAt','cancelNote','version'],
  Users     : ['email','name','position','faculty','orgUnit','unit','role','active','createdAt','approvedAt'],
  /* ทะเบียนจำนวนบุคลากรรายหน่วยงาน — ตัวหารของ IFR / PDFR / ISR
     ก่อนรุ่นนี้ค่านี้เก็บอยู่ใน localStorage ของแต่ละเบราว์เซอร์ ผู้บริหารสองคนจึงเห็นดัชนีไม่ตรงกัน
     ทั้งที่ดูข้อมูลชุดเดียวกัน ย้ายมาไว้ที่นี่เพื่อให้มีแหล่งความจริงเดียวทั้งระบบ
     hoursPerYear เว้นว่างได้ ระบบจะใช้ defaultHoursPerYear_() (7 ชม. × 240 วัน) แทน */
  /* staffGroups (รุ่น 2.8.3) = วิธีคิดเวลาการทำงานที่แต่ละคณะกรอกเอง เก็บเป็น JSON
     [{t:'ชื่อกลุ่ม', n:จำนวนคน, h:ชั่วโมง/วัน, d:วันทำงาน/ปี}, ...]
     ถ้ามีกลุ่ม ระบบคำนวณ headcount = Σn และ hoursPerYear = Σ(n×h×d) ÷ Σn ให้เอง (ดู cleanStaffGroups_) */
  OrgHeadcount: ['faculty','orgUnit','headcount','hoursPerYear','effectiveYear','updatedAt','updatedBy','staffGroups'],
  Audit     : ['t','who','role','act','target','detail','auditId','requestId','outcome','errorCode','beforeHash','afterHash','changes','appVersion','prevEntryHash','entryHash'],
  Attachments: ['attachmentId','driveFileId','ownerEmail','uploadToken','name','mimeType','size','status','incidentId','createdAt','expiresAt']
};

var APP_VERSION = '2.8.45';
var ALLOWED_MIME = {
  'image/jpeg':1, 'image/png':1, 'image/webp':1,
  'application/pdf':1,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':1,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':1
};

/* ฟิลด์ที่เก็บเป็น JSON ในเซลล์เดียว */
/* นามสกุลไฟล์ที่ยอมรับของแต่ละชนิด กัน .exe ที่แจ้ง mime ปลอมเป็น image/png
   ตรวจคู่กับ ALLOWED_MIME เสมอ ชนิดที่ไม่มีในตารางนี้จะถูกปฏิเสธ */
var ALLOWED_EXT = {
  'image/jpeg':['jpg','jpeg'], 'image/png':['png'], 'image/webp':['webp'],
  'application/pdf':['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx']
};

/* monitorLog เพิ่มในรุ่น 2.7.1 — ประวัติการติดตามมาตรการทุกรอบ ไม่ใช่รอบล่าสุดรอบเดียว
   ต้องอยู่ในรายการนี้ ไม่งั้น hydrate_/dehydrate_ จะอ่านกลับมาเป็นสตริงแล้ว .map พัง */
var JSON_FIELDS = ['cats','involved','parts','causes','capa','files','log','monitorLog'];

/* ประเภทที่จัดเป็นข้อมูลอ่อนไหว ต้องตรงกับฝั่งหน้าจอ */
var SENSITIVE_CATS = ['การทำร้ายตนเอง หรือภาวะวิกฤตทางจิตใจ',
                      'การคุกคาม หรือภัยต่อความปลอดภัยบุคคล'];
/* ต้องตัดช่องว่างหัวท้ายก่อนเทียบเสมอ
   validCategory_ ตรวจค่าที่ trim แล้ว แต่ txt_/list_ เก็บค่าดิบลงชีตโดยไม่ trim
   ประเภทที่ขึ้นต้นด้วยช่องว่างหนึ่งตัวจึงผ่านด่านตรวจได้ แต่หลุดการจัดเป็นข้อมูลอ่อนไหวทั้งหมด
   ผลคือไฟล์แนบไปอยู่โฟลเดอร์ทั่วไปที่แชร์ทั้งโดเมน อีเมลแจ้งเตือนส่งชื่อเรื่องจริงออกไป
   และทุกบทบาทในขอบเขตอ่านเนื้อหาเต็มได้ ทั้งที่เป็นเรื่องคุกคามหรือการทำร้ายตนเอง */
function isSensitive_(cats) {
  return (cats || []).some(function (c) {
    var v = String(c || '').trim();
    return SENSITIVE_CATS.some(function (s) { return v.indexOf(s) === 0; });
  });
}

/* บทบาทและขอบเขต ต้องตรงกับฝั่งหน้าจอ (รวม คปอ.)
   sensitiveAccess = อ่านเรื่องประเภทอ่อนไหวในขอบเขตของตนได้ (ใช้ทั้ง scoped_ และ canOpen ฝั่งหน้าจอ)
   เดิมเป็นรายชื่อบทบาทที่เขียนซ้ำไว้สองไฟล์ ถ้าแก้ไม่ครบ หน้าจอจะเปิดให้กดแต่เซิร์ฟเวอร์ส่งข้อมูลปิดบังมา */
var ROLES = {
  reporter         : { scope:'own',     can:{create:1,confirm:0,assess:0,investigate:0,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:0,exportAll:0,safetyIndex:0,cancel:0,admin:0} },
  supervisor       : { scope:'orgUnit', facReport:1, can:{create:1,confirm:1,assess:0,investigate:1,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:0,exportAll:0,safetyIndex:0,cancel:0,admin:0} },
  /* edit = แก้ไขข้อมูลที่ผู้รายงานกรอก (editIncident_) — หัวหน้าสำนักงาน รองคณบดี (กำกับดูแล) และผู้ดูแลระบบ */
  office_head      : { scope:'faculty', sensitiveAccess:1, can:{create:1,confirm:1,assess:1,investigate:1,capa:1,suggest:1,suggestSup:0,review:0,uniReport:0,ack:0,monitor:1,close:1,cross:0,exportAll:1,safetyIndex:0,cancel:1,admin:0,edit:1,headcount:1} },
  /* รองคณบดีที่ได้รับมอบหมายให้กำกับดูแลงานความปลอดภัย ร่วมดำเนินการได้
     ตั้งแต่รุ่น 2.8.13 บันทึกผลการติดตามและปิด (ติ๊กแล้วเสร็จ) มาตรการได้เช่นเดียวกับหัวหน้าสำนักงาน (monitor) */
  deputy_dean_sup  : { scope:'faculty', sensitiveAccess:1, can:{create:1,confirm:1,assess:1,investigate:1,capa:0,suggest:0,suggestSup:1,review:1,uniReport:0,ack:0,monitor:1,close:0,cross:0,exportAll:1,safetyIndex:0,cancel:0,admin:0,edit:1,headcount:1} },
  /* บทบาทกำกับดูแล: ดูภาพรวมและรายงานภาพรวมเท่านั้น ไม่แก้ไขข้อมูลปฏิบัติการ */
  deputy_dean      : { scope:'faculty', sensitiveAccess:1, oversight:1, can:{create:1,confirm:0,assess:0,investigate:0,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:0,exportAll:1,safetyIndex:0,cancel:0,admin:0} },
  safety_committee : { scope:'faculty', oversight:1, can:{create:1,confirm:0,assess:0,investigate:0,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:0,exportAll:1,safetyIndex:0,cancel:0,admin:0} },
  dean             : { scope:'faculty', sensitiveAccess:1, crossLevel3:1, can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:1,uniReport:1,ack:1,monitor:0,close:0,cross:0,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  /* ผู้ดูแลระดับคณะ: จัดการทะเบียนสิทธิ์เฉพาะคณะของตนเอง มองไม่เห็นและแก้ไม่ได้ซึ่งผู้ใช้ของคณะอื่น
     ไม่มีสิทธิ์ระดับระบบ (สำรองข้อมูล ติดตั้งทริกเกอร์ อ่าน Audit ทั้งมหาวิทยาลัย ตรวจสุขภาพระบบ)
     และไม่มีสิทธิ์ในข้อมูลปฏิบัติการของเรื่อง เพื่อไม่ให้ผู้จัดการสิทธิ์กลายเป็นผู้ตัดสินเรื่องเสียเอง */
  faculty_admin    : { scope:'faculty', can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:0,uniReport:0,ack:0,monitor:0,close:0,cross:0,exportAll:1,safetyIndex:0,cancel:0,admin:0,userAdmin:1} },
  facility         : { scope:'all',     can:{create:1,confirm:0,assess:0,investigate:0,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  /* ผู้บริหารระดับมหาวิทยาลัย — ตั้งแต่รุ่น 2.8.1 รองอธิการบดี (ทั่วไป) และผู้ช่วยอธิการบดี
     เห็น Dashboard รายงานภาพรวมทุกระดับทั้งมหาวิทยาลัยเช่นเดียวกับอธิการบดี (ถอด level3Only ออก)
     ยังเป็นบทบาทกำกับดูแล (oversight) จึงไม่เข้าถึงรายละเอียดรายเรื่องและไม่แก้ไขข้อมูลปฏิบัติการ
     reportOnly (รุ่น 2.8.21): รองอธิการบดี (ทั่วไป) และผู้ช่วยอธิการบดี ใช้เฉพาะ Dashboard รายงานภาพรวม
     ไม่มี Dashboard ติดตามอุบัติการณ์ — ข้อมูลชุดเดียวกัน ธงนี้กำหนดเมนูฝั่งหน้าจอ ไม่เปลี่ยนสิทธิ์ข้อมูล */
  vice_president     : { scope:'all', sensitiveAccess:1, oversight:1, execRead:1, reportOnly:1, can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  assistant_president: { scope:'all', sensitiveAccess:1, oversight:1, execRead:1, reportOnly:1, can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  vice_president_sup : { scope:'all', sensitiveAccess:1, oversight:1, execRead:1, uniAlert:1,  can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  president          : { scope:'all', sensitiveAccess:1, oversight:1, execRead:1, uniAlert:1,  can:{create:1,confirm:0,assess:0,investigate:0,capa:0,suggest:0,suggestSup:0,review:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:1,cancel:0,admin:0} },
  /* ผู้ดูแลระบบแก้ข้อมูลรายงาน (edit) ได้ทุกคณะ ยกเว้นเรื่องอ่อนไหว เพราะไม่มี sensitiveAccess (findScoped_ ปฏิเสธเอง) */
  admin            : { scope:'all',     can:{create:1,confirm:0,assess:0,investigate:0,capa:0,uniReport:0,ack:0,monitor:0,close:0,cross:1,exportAll:1,safetyIndex:0,cancel:1,admin:1,userAdmin:1,edit:1} }
};

/* บทบาทที่ผู้ดูแลระดับคณะกำหนดให้ผู้อื่นได้
   ตั้งใจไม่ใส่ faculty_admin และ admin ไว้ในรายการนี้ เพื่อไม่ให้ยกระดับสิทธิ์ต่อกันเป็นทอด ๆ
   การแต่งตั้งผู้ดูแลระดับคณะจึงยังเป็นอำนาจของผู้ดูแลระบบเพียงผู้เดียว */
var FACULTY_ADMIN_ASSIGNABLE = ['reporter','supervisor','office_head','deputy_dean_sup',
                                'deputy_dean','safety_committee','dean'];
/* ผู้รับแจ้งเตือนระดับคณะ — ใช้ร่วมกันทั้งแจ้งเหตุระดับ 3 ขึ้นไป (notify_) และแจ้งมาตรการเกินกำหนด (notifyOverdueCapa_)
   เดิมเขียนรายการนี้ซ้ำสองที่ ถ้าเพิ่มบทบาทแล้วแก้ไม่ครบ ผู้รับจะไม่ตรงกันระหว่างสองอีเมลโดยไม่มีใครรู้ */
var FACULTY_NOTIFY_ROLES = ['office_head','deputy_dean_sup','deputy_dean','dean','safety_committee'];
/* ผู้รับอีเมลมาตรการเกินกำหนดรายวัน (รุ่น 2.8.15) — แยกจาก FACULTY_NOTIFY_ROLES ของอีเมลแจ้งเหตุ
   ระดับคณะส่งหัวหน้าสำนักงานฯ (ผู้บันทึกผลการติดตาม) รองคณบดี (กำกับดูแล) และคณบดี/ผู้อำนวยการกอง ของคณะนั้น
   ระดับมหาวิทยาลัยส่งกองอาคารสถานที่ (ทุกคณะ) */
var OVERDUE_FACULTY_ROLES = ['office_head','deputy_dean_sup','dean'];
var OVERDUE_UNIVERSITY_ROLES = ['facility'];
/* ผู้รับแจ้งเตือนระดับมหาวิทยาลัยของเหตุระดับ 3 ขึ้นไป */
var UNIVERSITY_NOTIFY_ROLES = ['facility','vice_president_sup','president'];
/* ระดับต่ำสุดที่แจ้งแต่ละบทบาทระดับมหาวิทยาลัย ตามตารางระดับความรุนแรง (SEV_UNI) — รุ่น 2.8.12
   ระดับ 3 รายงานรองอธิการบดีที่เกี่ยวข้อง · ระดับ 4–5 รายงานรองอธิการบดีและอธิการบดี
   บทบาทที่ไม่อยู่ในตารางนี้ใช้ CONFIG.NOTIFY_LEVEL */
var UNIVERSITY_NOTIFY_MIN_LEVEL = { president:4 };
/* ผู้รับสำรองเมื่อคณะยังไม่มีผู้ถือบทบาทข้างต้นเลย — อีเมลแจ้งเตือนต้องไม่เงียบหาย */
var FALLBACK_NOTIFY_ROLES = ['facility','admin'];
/* ตรวจชื่อบทบาทด้วย hasOwnProperty เสมอ ห้ามใช้ ROLES[x] ตรง ๆ เป็นเงื่อนไข
   ค่าอย่าง "constructor" หรือ "toString" ได้ค่าจาก Object.prototype จึงผ่าน ROLES[x] ได้
   บัญชีที่ถูกตั้งบทบาทแบบนั้น (ผ่าน API หรือพิมพ์ในชีต) จะเข้าระบบไม่ได้เลยเพราะ ROLES[x].can เป็น undefined */
function isRole_(name) { return Object.prototype.hasOwnProperty.call(ROLES, String(name)); }
/* ผู้กระทำของงานอัตโนมัติ (ทริกเกอร์) ที่ไม่มี Session ผู้ใช้ — ใช้ค่าเดียวกันทุกงานเพื่อค้นใน Audit ได้ง่าย */
var SYSTEM_ACTOR = { email:'system@trigger', role:'system' };
function isSystemAdmin_(u) { return !!(u && isRole_(u.role) && ROLES[u.role].can.admin); }
/* ชื่อหน่วยงานเดิมที่เปลี่ยนในผังรุ่น 2.8.5 → ชื่อใหม่ ต้องตรงกับ UNIT_ALIASES ใน Index.html เสมอ
   เทียบคณะ/หน่วยงานผ่าน canonUnit_ ทุกครั้ง ผู้ใช้ รายงาน และทะเบียนบุคลากรที่บันทึกด้วยชื่อเก่า
   จึงยังอยู่ในขอบเขตเดียวกับชื่อใหม่ โดยไม่ต้องแก้ข้อมูลในชีต */
var UNIT_ALIASES = {
  'สำนักงานหอสมุด'                              : 'สำนักหอสมุด',
  'โรงเรียนอนุบาลและประถมสาธิตมหาวิทยาลัยนเรศวร' : 'โรงเรียนอนุบาลและประถมสาธิต มหาวิทยาลัยนเรศวร',
  'สำนักงานอธิการดี'                             : 'สำนักงานอธิการบดี'
};
/* ชื่อเดิมที่ "แยก" เป็นหลายหน่วยงานในผังใหม่ จึงจับคู่อัตโนมัติไม่ได้ (รุ่น 2.8.10)
   "กองกลาง สำนักงานอธิการบดี" เดิมใช้ทั้งบุคลากรกองกลางและสำนักงานอธิการบดี แต่ผังใหม่เป็นสองหน่วยงาน
   ที่มีผู้อำนวยการของตนเอง ถ้ารวมเข้ากองกลางอัตโนมัติ ผอ.กองกลาง จะเห็นรายงาน (รวมเรื่องอ่อนไหว) ของสำนักงานอธิการบดี
   จึงคงชื่อเดิมไว้เป็นหน่วยงานแยกเหมือนก่อนรุ่น 2.8.5 และให้ผู้ดูแลเลือกหน่วยงานที่ถูกต้องให้แต่ละคน */
var UNIT_SPLITS = {
  'กองกลาง สำนักงานอธิการบดี': ['กองกลาง', 'สำนักงานอธิการบดี']
};
function canonUnit_(v) {
  var t = String(v || '').trim();
  return Object.prototype.hasOwnProperty.call(UNIT_ALIASES, t) ? UNIT_ALIASES[t] : t;
}
function sameFaculty_(a, b) { return canonUnit_(a) === canonUnit_(b); }
/* หน่วยงานในคณะใช้กติกาเดียวกับคณะ — ช่องว่างหัวท้ายในชีตต้องไม่ทำให้คนหน่วยเดียวกันมองไม่เห็นเรื่องของกัน */
function sameOrgUnit_(a, b) { return String(a || '').trim() === String(b || '').trim(); }

var SEV_UNI = { 3:'รองอธิการบดีที่เกี่ยวข้อง', 4:'รองอธิการบดีที่เกี่ยวข้องและอธิการบดี', 5:'รองอธิการบดีที่เกี่ยวข้องและอธิการบดี' };
var STATUS_ORDER = ['submitted','confirmed','assessed','investigating','capa','monitoring','reviewed','acknowledged','closed'];
/* 'cancelled' อยู่นอกลำดับขั้น เข้าได้จากทุกขั้นและออกไม่ได้ จึงไม่อยู่ใน STATUS_ORDER */
var CANCELLED = 'cancelled';
/* ขั้นถัดไปที่อนุญาตของแต่ละสถานะ ต้องตรงกับปุ่มที่แสดงบนหน้าจอ */
var NEXT_STATUS = (function () {
  var m = {};
  for (var i = 0; i < STATUS_ORDER.length - 1; i++) m[STATUS_ORDER[i]] = STATUS_ORDER[i + 1];
  return m;
})();
/* สิทธิ์ที่ต้องมีเพื่อเดินเข้าสู่แต่ละสถานะ submitted เป็นขั้นเริ่มต้นจึงใช้สิทธิ์ create ตอนสร้างเรื่องแทน
   ตารางนี้คือแหล่งความจริงเดียว ห้ามเขียนแผนที่สถานะ→สิทธิ์ซ้ำในฟังก์ชันอื่นหรือฝั่งหน้าจอ */
var STATUS_CAP = {
  confirmed:'confirm', assessed:'assess', investigating:'investigate', capa:'capa',
  monitoring:'monitor', reviewed:'review', acknowledged:'ack', closed:'close'
};

/* ---------- การส่งเรื่องกลับขั้นก่อนหน้า ----------
   ก่อนรุ่น 2.7.3 ลำดับขั้นเดินหน้าได้ทางเดียว ผู้ตรวจสอบที่เห็นว่ามาตรการยังไม่เพียงพอ
   มีทางเลือกเหลือสองทางเท่านั้น คือเห็นชอบทั้งที่ไม่เห็นด้วย หรือยกเลิกทั้งเรื่อง
   การยกเลิกตัดเรื่องนั้นออกจากสถิติทุกตัวถาวร อุบัติการณ์ที่เกิดขึ้นจริงจึงหายไปจากข้อมูลความปลอดภัย
   เพราะเหตุผลเชิงกระบวนการ ไม่ใช่เพราะไม่ได้เกิด — เป็นการสูญเสียความถูกต้องของข้อมูล

   ตารางนี้คือแหล่งความจริงเดียวว่า "ขั้นไหนส่งกลับไปขั้นไหนได้ และต้องมีสิทธิ์อะไร"
   ผู้ส่งกลับคือเจ้าของขั้นที่เรื่องกำลังรออยู่ ไม่ใช่ใครก็ได้
     monitoring (รอตรวจสอบ)  → capa        ผู้มีสิทธิ์ review ส่งกลับให้ทบทวนมาตรการใหม่
     reviewed   (รอรับทราบ)   → monitoring  ผู้มีสิทธิ์ ack ส่งกลับให้ติดตามผลเพิ่มเติม
   ขั้นอื่นไม่เปิดให้ส่งกลับ เพราะยังไม่มีการอนุมัติใดเกิดขึ้นให้ต้องถอน
   และเรื่องที่ปิดหรือยกเลิกแล้วส่งกลับไม่ได้เด็ดขาด */
var RETURN_MAP = {
  monitoring : { to:'capa',       cap:'review',
                 act:'ส่งกลับให้ทบทวนมาตรการแก้ไขและป้องกัน',
                 hint:'หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมายจะแก้ไขมาตรการแล้วเริ่มติดตามใหม่' },
  reviewed   : { to:'monitoring', cap:'ack',
                 act:'ส่งกลับให้ติดตามผลการดำเนินมาตรการเพิ่มเติม',
                 hint:'หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมายจะบันทึกผลการติดตามเพิ่ม แล้วเสนอตรวจสอบใหม่' }
};
var STATUS_LABEL = {
  submitted:'รอหัวหน้างานยืนยันข้อเท็จจริง', confirmed:'ยืนยันข้อเท็จจริงแล้ว รอประเมินระดับ',
  assessed:'ประเมินระดับแล้ว รอสอบสวน', investigating:'อยู่ระหว่างสอบสวน',
  capa:'กำหนดมาตรการแก้ไขและป้องกัน', monitoring:'ติดตามมาตรการ',
  reviewed:'รองคณบดี (กำกับดูแล) ตรวจสอบแล้ว รอคณบดีรับทราบ',
  acknowledged:'คณบดี / ผู้อำนวยการกอง รับทราบแล้ว รอปิดเรื่อง', closed:'ปิดเรื่อง',
  cancelled:'ยกเลิกรายงาน'
};

/* ============================================================
 *  1. ติดตั้งครั้งแรก
 * ============================================================ */
function setup_() {
  var props  = PropertiesService.getScriptProperties();
  /* ตรวจบัญชีผู้ดูแลคนแรกก่อนสร้างอะไรทั้งสิ้น
     เดิมตรวจหลังสร้างฐานข้อมูลแล้ว ถ้ารันด้วยบัญชีนอกโดเมน (เช่น @gmail.com) จะล้มกลางทาง
     เหลือไฟล์ฐานข้อมูลค้างที่ My Drive แต่ไม่มีโฟลเดอร์ไฟล์แนบและไม่มี trigger */
  firstAdminEmail_();
  var folder = systemFolder_();
  /* สร้างโครงโฟลเดอร์ไฟล์แนบก่อนฐานข้อมูล ให้ครบทุกส่วนแม้ขั้นถัดไปจะล้ม */
  setupStorage_();
  var ss     = getOrCreateSpreadsheet_(folder);

  /* ฐานข้อมูลหลักไม่สร้าง/อ่าน Users แล้ว เพราะทะเบียนสิทธิ์อยู่คนละ Spreadsheet */
  Object.keys(SHEETS).filter(function (name) { return name !== 'Users'; })
    .forEach(function (name) { ensureSheet_(ss, name, SHEETS[name]); });
  props.setProperty('SS_ID', ss.getId());
  /* ป้องกันชีตบันทึกร่องรอยตั้งแต่ติดตั้ง ไม่ใช่รอให้มีคนลบแถวก่อนแล้วค่อยรู้ */
  var auditGuard = auditProtect_();
  /* สร้างหรือเชื่อมทะเบียนผู้ใช้คนละ Spreadsheet ก่อนเรียก sheet_('Users')
     เพื่อไม่ให้มีเส้นทางย้อนกลับไปสร้าง Users ในฐานข้อมูลอุบัติการณ์อีก */
  var usersSh = ensureUsersRegistry_(folder);
  /* ตรวจและซ่อมสิทธิ์ผู้ดูแลทุกครั้งที่รัน setupFromEditor ด้วยบัญชีเจ้าของสคริปต์
     จึงใช้แก้ฐานข้อมูลเดิมที่เคยติดตั้งตอน FIRST_ADMIN ยังว่างได้ด้วย */
  var installer = ensureFirstAdmin_();
  var att = DriveApp.getFolderById(props.getProperty('ATT_FOLDER_ID'));

  var msg = [
    '=== ติดตั้งเรียบร้อย ===',
    'โฟลเดอร์หลักของระบบ    : ' + folder.getUrl(),
    'ฐานข้อมูล Google Sheet : ' + ss.getUrl(),
    'ทะเบียนผู้ใช้และสิทธิ์  : ' + usersSh.getParent().getUrl() + ' · แท็บ ' + usersSh.getName(),
    'โฟลเดอร์เก็บรูปภาพ     : ' + att.getUrl(),
    'ชีตฐานข้อมูลหลัก       : ' + Object.keys(SHEETS).filter(function (name) { return name !== 'Users'; }).join(', '),
    'ป้องกันชีตบันทึกร่องรอย : ' + auditGuard.detail,
    'โดเมนที่อนุญาต         : ' + CONFIG.ALLOWED_DOMAIN,
    '',
    'ขั้นถัดไป: Deploy → New deployment → Web app'
  ].join('\n');
  Logger.log(msg);
  return msg;
}

/* ฟังก์ชัน private นี้เรียกได้เฉพาะจาก setup_ ใน Editor
   ถ้ามีบัญชีอยู่แล้วจะคงข้อมูลชื่อ/หน่วยงานเดิม แต่รับรอง role และ active ให้ถูกต้อง */
function firstAdminEmail_() {
  var email = String(CONFIG.FIRST_ADMIN || '').trim().toLowerCase() || currentEmail_();
  if (!email || !domainOk_(email)) {
    throw apiError_('VALIDATION_FAILED', 'CONFIG.FIRST_ADMIN ต้องเป็นอีเมลในโดเมน @' + CONFIG.ALLOWED_DOMAIN);
  }
  return email;
}

function ensureFirstAdmin_() {
  var email = firstAdminEmail_();

  var sh = sheet_('Users');
  var rows = sh.getDataRange().getValues();
  var head = rows[0];
  var emailCol = head.indexOf('email');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][emailCol] || '').trim().toLowerCase() !== email) continue;
    var user = {};
    head.forEach(function (h, j) { user[h] = rows[i][j]; });
    user.email = email;
    user.name = String(user.name || '').trim() || email.split('@')[0];
    user.position = String(user.position || '').trim() || 'ผู้ดูแลระบบ';
    user.faculty = String(user.faculty || user.unit || '').trim() || 'ส่วนกลางมหาวิทยาลัย';
    user.orgUnit = String(user.orgUnit || '').trim() || 'ผู้ดูแลระบบ';
    user.unit = String(user.unit || user.faculty || '').trim() || 'ส่วนกลางมหาวิทยาลัย';
    user.role = 'admin';
    user.active = true;
    user.createdAt = user.createdAt || now_();
    user.approvedAt = user.approvedAt || now_();
    sh.getRange(i + 1, 1, 1, head.length).setValues([dehydrate_(user, head)]);
    invalidate_('Users');
    return email;
  }

  appendRow_('Users', {email:email,name:email.split('@')[0],position:'ผู้ดูแลระบบ',
    faculty:'ส่วนกลางมหาวิทยาลัย',orgUnit:'ผู้ดูแลระบบ',unit:'ส่วนกลางมหาวิทยาลัย',
    role:'admin',active:true,createdAt:now_(),approvedAt:now_()});
  return email;
}

function getOrCreateFolder_() {
  if (CONFIG.PARENT_FOLDER) {
    try { return DriveApp.getFolderById(CONFIG.PARENT_FOLDER); }
    catch (e) { throw apiError_('NOT_INSTALLED','เปิด CONFIG.PARENT_FOLDER ไม่ได้ กรุณาตรวจรหัสโฟลเดอร์และสิทธิ์ของบัญชีที่ Deploy'); }
  }
  return DriveApp.getRootFolder();
}

/* DriveApp.getFoldersByName / getFilesByName คืนรายการที่อยู่ในถังขยะด้วย
   และ openById / getFolderById ก็ยังเปิดของในถังขยะได้ตามปกติ
   ถ้าไม่กรอง ผู้ดูแลที่ลบฐานข้อมูลเดิมทิ้งแล้วรัน setupFromEditor ใหม่
   จะได้ระบบที่ผูกกับไฟล์ในถังขยะ โดยไม่มีฐานข้อมูลหรือโฟลเดอร์ใหม่ปรากฏใน Drive เลย */
function driveItemAlive_(item) {
  try { return !!item && !item.isTrashed(); } catch (e) { return false; }
}
function aliveFileById_(id) {
  if (!id) return null;
  try { var f = DriveApp.getFileById(id); return driveItemAlive_(f) ? f : null; } catch (e) { return null; }
}
function aliveFolderById_(id) {
  if (!id) return null;
  try { var f = DriveApp.getFolderById(id); return driveItemAlive_(f) ? f : null; } catch (e) { return null; }
}

/* ย้ายไฟล์/โฟลเดอร์เข้าโฟลเดอร์ระบบ เฉพาะเมื่อยังวางลอยอยู่ที่ My Drive (ของที่ติดตั้งด้วยรุ่นก่อน)
   ของที่ผู้ดูแลจัดไว้ในโฟลเดอร์อื่นเองแล้วจะไม่ถูกย้าย รหัสไฟล์ไม่เปลี่ยนเมื่อย้าย ระบบจึงทำงานต่อได้ทันที */
function moveIntoIfLoose_(item, folder) {
  try {
    var rootId = DriveApp.getRootFolder().getId();
    if (folder.getId() === rootId) return;
    var parents = item.getParents(), loose = !parents.hasNext();
    while (parents.hasNext()) { if (parents.next().getId() === rootId) loose = true; }
    if (loose) item.moveTo(folder);
  } catch (e) {
    Logger.log('ย้าย ' + item.getName() + ' เข้าโฟลเดอร์ระบบไม่สำเร็จ: ' + e.message);
  }
}

/* โฟลเดอร์หลักของระบบ ใต้ CONFIG.PARENT_FOLDER หรือ My Drive */
function systemFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folder = aliveFolderById_(props.getProperty('SYSTEM_FOLDER_ID'));
  if (!folder) {
    folder = getOrCreateChildFolder_(getOrCreateFolder_(),
      String(CONFIG.SYSTEM_FOLDER_NAME || 'NU-Incident-System'));
    props.setProperty('SYSTEM_FOLDER_ID', folder.getId());
  }
  return folder;
}

function getOrCreateChildFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  while (it.hasNext()) { var f = it.next(); if (driveItemAlive_(f)) return f; }
  return parent.createFolder(name);
}

/* ============================================================
 *  พื้นที่เก็บไฟล์แนบและรูปภาพ
 *
 *  NU-Incident-Attachments/
 *    ├── ทั่วไป/2026-08/            ไฟล์ปกติ บุคลากรในโดเมนที่มีลิงก์เปิดดูได้
 *    └── ข้อมูลอ่อนไหว/2026-08/      เหตุการณ์ที่จัดเป็นข้อมูลอ่อนไหว ไม่แชร์ลิงก์
 *
 *  ไฟล์ที่สร้างโดยสคริปต์เป็นของบัญชีที่ Deploy และเป็นส่วนตัวโดยปริยาย
 *  หากไม่ตั้งการแชร์ ผู้ใช้คนอื่นกดลิงก์แล้วจะเจอหน้าขอสิทธิ์เข้าถึง
 * ============================================================ */
var ATT_NORMAL = 'ทั่วไป';
var ATT_SENSITIVE = 'ข้อมูลอ่อนไหว';

function attachRoot_() {
  var props = PropertiesService.getScriptProperties();
  var root = aliveFolderById_(props.getProperty('ATT_FOLDER_ID'));
  if (!root) { setupStorage_(); root = DriveApp.getFolderById(props.getProperty('ATT_FOLDER_ID')); }
  return root;
}

function attachBucket_(sensitive) {
  var root = attachRoot_();
  var bucket = getOrCreateChildFolder_(root, sensitive ? ATT_SENSITIVE : ATT_NORMAL);
  var month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  return getOrCreateChildFolder_(bucket, month);
}

/* ============================================================
 *  สิทธิ์เปิดไฟล์แนบตามบทบาท (ATTACH_SHARING = 'roles')
 *  canViewAttachments_ คือแหล่งความจริงเดียวของกติกานี้ ใช้ทั้งสองทาง
 *    1) รายชื่อผู้ที่ได้รับแชร์ไฟล์ใน Google Drive (attachViewers_ → syncFileViewers_)
 *    2) การส่งลิงก์ไฟล์ให้หน้าจอ (scoped_) — ผู้ไม่มีสิทธิ์เห็นเฉพาะชื่อไฟล์ ไม่มีลิงก์ให้กดขอสิทธิ์
 *  ถ้าแก้กติกา แก้ที่ ATTACH_VIEW_ROLES หรือฟังก์ชันนี้จุดเดียว แล้วรัน syncAttachmentAccessFromEditor
 * ============================================================ */
/* faculty_admin (ผู้ดูแลระบบระดับคณะ) เปิดได้เฉพาะไฟล์ของคณะตนเอง ตาม scope 'faculty' ใน ROLES
   และไม่ได้รับไฟล์ของเรื่องอ่อนไหว เพราะไม่มี sensitiveAccess เช่นเดียวกับผู้ดูแลระบบ */
var ATTACH_VIEW_ROLES = ['admin', 'faculty_admin', 'office_head', 'deputy_dean_sup', 'dean'];
function canViewAttachments_(u, rec) {
  if (!u || u.active === false || !isRole_(u.role) || ATTACH_VIEW_ROLES.indexOf(u.role) < 0) return false;
  /* เรื่องอ่อนไหวใช้กติกาเดียวกับเนื้อหาเรื่อง: เฉพาะบทบาทที่มี sensitiveAccess
     ผู้ดูแลระบบไม่มีสิทธิ์อ่านเนื้อหาเรื่องอ่อนไหว จึงไม่ได้รับไฟล์ของเรื่องนั้นด้วย */
  if (isSensitive_(rec.cats) && !ROLES[u.role].sensitiveAccess) return false;
  if (ROLES[u.role].scope === 'all') return true;
  return sameFaculty_(u.faculty, rec.faculty);
}
function attachViewers_(rec) {
  return readAll_('Users').filter(function (x) { return x.active && canViewAttachments_(x, rec); })
    .map(function (x) { return String(x.email).trim().toLowerCase(); });
}

/* แชร์แบบไม่ส่งอีเมลแจ้ง — DriveApp.addViewer ส่งอีเมล "มีคนแชร์ไฟล์กับคุณ" ทุกไฟล์
   คณบดีที่คณะมีไฟล์แนบหลายร้อยไฟล์จะได้อีเมลหลายร้อยฉบับ จึงใช้ Advanced Drive Service เป็นทางหลัก */
function addViewerQuiet_(file, email, role) {
  role = role === 'writer' ? 'writer' : 'reader';
  if (typeof Drive !== 'undefined' && Drive.Permissions && Drive.Permissions.create) {
    Drive.Permissions.create({ role:role, type:'user', emailAddress:email }, file.getId(),
      { sendNotificationEmail:false, supportsAllDrives:true });
  } else if (role === 'writer') {
    file.addEditor(email);
  } else {
    file.addViewer(email);
  }
}

/* ============================================================
 *  ผู้ดูแลระบบแก้ไขทะเบียนผู้ใช้ในชีตได้โดยตรง
 *  - แชร์ Spreadsheet ทะเบียนผู้ใช้ (NU-Incident-Users) เป็น "ผู้แก้ไข" ให้บัญชี admin ที่ใช้งานอยู่ทุกคน
 *    ถอดออกเองเมื่อพ้นบทบาทหรือถูกระงับ — ถอดเฉพาะคนที่ระบบเคยเพิ่มให้ (REGISTRY_EDITORS_MANAGED)
 *    ผู้แก้ไขที่เจ้าของไฟล์เพิ่มเองไม่ถูกแตะ เพราะทะเบียนอาจเป็นไฟล์ของหน่วยงานที่ระบุผ่าน CONFIG.USERS_SS_ID
 *  - ผู้ดูแลระบบระดับคณะไม่ได้รับสิทธิ์นี้ เพราะชีตเดียวมีผู้ใช้ทุกคณะ จะข้ามขอบเขตคณะที่หน้าเว็บบังคับไว้
 *    ผู้ดูแลระดับคณะยังจัดการผู้ใช้ในคณะตนได้ทางหน้าจัดการผู้ใช้ตามเดิม
 *  - หัวคอลัมน์และแท็บรายการบทบาทถูกล็อกไว้ แก้ได้เฉพาะเจ้าของระบบ เพราะระบบอ่านทะเบียนด้วยชื่อหัวคอลัมน์
 *  - ทุกการแก้ในชีตถูกบันทึกลง Audit ผ่าน onUsersRegistryEdit_ พร้อมชื่อผู้แก้ ค่าเดิม และค่าใหม่
 * ============================================================ */
var REGISTRY_PROTECT_DESC = 'ระบบรายงานอุบัติการณ์ — ห้ามแก้หัวคอลัมน์ (ระบบอ่านทะเบียนด้วยชื่อคอลัมน์)';
function registryEditorEmails_() {
  return readAll_('Users').filter(function (x) { return x.active && x.role === 'admin'; })
    .map(function (x) { return String(x.email).trim().toLowerCase(); });
}
function syncRegistryEditors_() {
  var ss = usersDb_(), file = DriveApp.getFileById(ss.getId()), props = PropertiesService.getScriptProperties();
  var owner = '';
  try { owner = String(file.getOwner().getEmail() || '').toLowerCase(); } catch (e0) {}
  var managed = {};
  try { JSON.parse(props.getProperty('REGISTRY_EDITORS_MANAGED') || '[]').forEach(function (e) { managed[e] = 1; }); } catch (e1) {}
  var want = {}, have = {}, added = [], removed = [], failed = 0;
  registryEditorEmails_().forEach(function (e) { if (e !== owner) want[e] = 1; });
  file.getEditors().forEach(function (u) { var e = String(u.getEmail() || '').toLowerCase(); if (e) have[e] = 1; });
  Object.keys(managed).forEach(function (e) {
    if (want[e]) return;
    try { if (have[e]) file.removeEditor(e); removed.push(e); delete managed[e]; }
    catch (err) { failed++; console.error('REGISTRY_EDITOR_REMOVE_FAILED ' + e + ' ' + (err && err.message || err)); }
  });
  Object.keys(want).forEach(function (e) {
    if (have[e]) { if (!managed[e]) managed[e] = 1; return; }
    try { addViewerQuiet_(file, e, 'writer'); added.push(e); managed[e] = 1; }
    catch (err) { failed++; console.error('REGISTRY_EDITOR_ADD_FAILED ' + e + ' ' + (err && err.message || err)); }
  });
  props.setProperty('REGISTRY_EDITORS_MANAGED', JSON.stringify(Object.keys(managed)));
  var guard = protectUsersRegistry_(ss);
  var msg = 'ผู้ดูแลระบบที่แก้ไขทะเบียนได้ ' + Object.keys(want).length + ' บัญชี · เพิ่ม ' + added.length +
            ' · ถอด ' + removed.length + (failed ? ' · ล้มเหลว ' + failed : '') + ' · ' + guard;
  props.setProperty('REGISTRY_SYNC_LAST', now_() + ' · ' + msg);
  if (added.length || removed.length || failed)
    audit_(SYSTEM_ACTOR, 'ปรับสิทธิ์แก้ไขทะเบียนผู้ใช้ในชีต', 'Users',
      msg + (added.length ? ' · เพิ่ม: ' + added.join(', ') : '') + (removed.length ? ' · ถอด: ' + removed.join(', ') : ''));
  return msg;
}
/* ล็อกหัวคอลัมน์ของแท็บ Users และแท็บรายการบทบาททั้งแท็บ ให้แก้ได้เฉพาะเจ้าของระบบ */
function protectUsersRegistry_(ss) {
  try {
    var me = String(Session.getEffectiveUser().getEmail() || '');
    var lock = function (p) {
      p.setDescription(REGISTRY_PROTECT_DESC); p.setWarningOnly(false);
      if (me) { try { p.addEditor(me); } catch (eAdd) {} }
      var others = p.getEditors().filter(function (u) { return String(u.getEmail()).toLowerCase() !== me.toLowerCase(); });
      if (others.length) p.removeEditors(others);
      try { if (p.canDomainEdit()) p.setDomainEdit(false); } catch (eDom) {}
    };
    var find = function (list) { return list.filter(function (p) { return p.getDescription() === REGISTRY_PROTECT_DESC; })[0]; };
    var sh = configuredUsersSheet_(ss);
    var head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn()));
    lock(find(sh.getProtections(SpreadsheetApp.ProtectionType.RANGE)) || head.protect());
    var roleRef = ss.getSheetByName(ROLE_REF_SHEET_NAME);
    if (roleRef) lock(find(roleRef.getProtections(SpreadsheetApp.ProtectionType.SHEET)) || roleRef.protect());
    return 'ล็อกหัวคอลัมน์แล้ว';
  } catch (e) {
    console.error('REGISTRY_PROTECT_FAILED ' + (e && e.message || e));
    return 'ล็อกหัวคอลัมน์ไม่สำเร็จ: ' + (e && e.message || e);
  }
}

/* ทริกเกอร์ onEdit ของ Spreadsheet ทะเบียนผู้ใช้ (ติดตั้งโดย installTriggers_)
   การแก้ในชีตไม่ผ่าน adminSaveUser_ จึงต้องบันทึกร่องรอยที่นี่เอง และนัดปรับสิทธิ์ใน Drive ตามบทบาทใหม่
   ข้อความเตือนในบันทึกช่วยให้เห็นทันทีว่าค่าที่พิมพ์เข้าไประบบจะไม่รับ (บทบาทผิด อีเมลนอกโดเมน) */
function onUsersRegistryEdit_(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet(), usersSh = configuredUsersSheet_(e.source || sh.getParent());
    var who = '';
    try { who = String(e.user && e.user.getEmail ? e.user.getEmail() : '').toLowerCase(); } catch (eu) {}
    var actor = { email:who || 'ไม่ทราบผู้แก้ (Google ไม่ส่งอีเมล)', role:'sheet-editor' };
    if (sh.getSheetId() !== usersSh.getSheetId()) {
      audit_(actor, 'แก้ไขไฟล์ทะเบียนผู้ใช้ (แท็บอื่น)', sh.getName() + '!' + e.range.getA1Notation(), '');
      return;
    }
    invalidate_('Users');
    var head = headers_(sh), row = e.range.getRow(), col = e.range.getColumn();
    var emailCol = head.indexOf('email') + 1, target = e.range.getA1Notation(), detail;
    if (row >= 2 && emailCol > 0) target = String(sh.getRange(row, emailCol).getValue() || target);
    if (e.range.getNumRows() === 1 && e.range.getNumColumns() === 1) {
      var field = head[col - 1] || ('คอลัมน์ ' + col);
      var val = e.value === undefined ? String(e.range.getValue()) : String(e.value);
      detail = field + ': "' + (e.oldValue === undefined ? '' : String(e.oldValue)) + '" → "' + val + '"';
      var warn = '';
      if (field === 'role' && val && !isRole_(val)) warn = ' · คำเตือน: ไม่มีบทบาทนี้ในระบบ ผู้ใช้จะถูกลดเป็นผู้รายงาน';
      if (field === 'email' && val && !domainOk_(val)) warn = ' · คำเตือน: อีเมลนอกโดเมน @' + CONFIG.ALLOWED_DOMAIN + ' เข้าระบบไม่ได้';
      detail += warn;
    } else {
      detail = 'แก้หลายช่องพร้อมกัน ' + e.range.getA1Notation() + ' (' + e.range.getNumRows() + ' แถว × ' + e.range.getNumColumns() + ' คอลัมน์)';
    }
    audit_(actor, 'แก้ไขทะเบียนผู้ใช้ในชีตโดยตรง', target, detail);
    scheduleAttachmentSync_();
  } catch (err) {
    console.error('USERS_REGISTRY_EDIT_AUDIT_FAILED ' + (err && err.stack || err));
  }
}

/* ทำให้ผู้มีสิทธิ์ดูไฟล์ตรงกับรายชื่อที่ควรเป็นพอดี เพิ่มคนที่ขาด ถอดคนที่ไม่ควรมี
   ไม่แตะเจ้าของไฟล์และผู้แก้ไข (ระบบไม่เคยเพิ่มผู้แก้ไข) */
function syncFileViewers_(file, emails) {
  var want = {}, have = {}, added = 0, removed = 0;
  emails.forEach(function (e) { want[e] = 1; });
  file.getViewers().forEach(function (v) { var e = String(v.getEmail() || '').toLowerCase(); if (e) have[e] = 1; });
  Object.keys(have).forEach(function (e) { if (!want[e]) { file.removeViewer(e); removed++; } });
  Object.keys(want).forEach(function (e) { if (!have[e]) { addViewerQuiet_(file, e); added++; } });
  return { added:added, removed:removed };
}

/* ตั้งสิทธิ์การเข้าถึงไฟล์ให้ตรงกับความอ่อนไหวของเรื่อง
   rec = รายงานที่ไฟล์ผูกอยู่ ใช้ในโหมด roles เพื่อหาผู้มีสิทธิ์ (ไฟล์ pending ยังไม่มี จึงเป็นส่วนตัว) */
function applySharing_(file, sensitive, rec) {
  try {
    if (CONFIG.ATTACH_SHARING === 'roles') {
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      if (rec) syncFileViewers_(file, attachViewers_(rec));
    } else if (sensitive || CONFIG.ATTACH_SHARING !== 'domain') {
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    } else {
      file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (e) {
    /* Workspace บางองค์กรปิดการแชร์ทั้งโดเมน ปล่อยให้ไฟล์เป็นส่วนตัวและบันทึกไว้ */
    Logger.log('ตั้งการแชร์ไฟล์ไม่สำเร็จ: ' + e.message);
  }
}

/* ---- ปรับสิทธิ์ไฟล์แนบทั้งระบบให้ตรงกับทะเบียนผู้ใช้ปัจจุบัน ----
   บทบาทเปลี่ยน คณบดีคนใหม่ บัญชีถูกระงับ ต้องสะท้อนไปถึงสิทธิ์ใน Drive ด้วย มิฉะนั้นคนที่พ้นตำแหน่งยังเปิดไฟล์ได้
   ทำงานสามทาง: ทริกเกอร์รายวัน · ครั้งเดียวหลังผู้ดูแลแก้สิทธิ์ผู้ใช้ (scheduleAttachmentSync_) · สั่งเองจาก Editor
   ทำได้ไม่เกิน 4 นาทีต่อรอบ ถ้าไม่ครบจะจำตำแหน่งไว้แล้วนัดรอบถัดไปต่อจากเดิม */
var ATTACH_SYNC_BUDGET_MS = 4 * 60 * 1000;
function runAttachmentSync_() {
  if (CONFIG.ATTACH_SHARING !== 'roles') return 'ATTACH_SHARING ไม่ใช่ roles ไม่ต้องปรับสิทธิ์';
  var props = PropertiesService.getScriptProperties(), started = new Date().getTime();
  var cursor = Number(props.getProperty('ATTACH_SYNC_CURSOR')) || 0;
  var incidents = {};
  readAll_('Incidents').forEach(function (r) { incidents[String(r.id)] = r; });
  var rows = readAll_('Attachments').filter(function (a) {
    return a.status === 'claimed' && a.incidentId && a.driveFileId;
  });
  if (cursor >= rows.length) cursor = 0;
  var viewersByKey = {}, added = 0, removed = 0, failed = 0, done = 0;
  for (var i = cursor; i < rows.length; i++) {
    if (new Date().getTime() - started > ATTACH_SYNC_BUDGET_MS) {
      props.setProperty('ATTACH_SYNC_CURSOR', String(i));
      scheduleAttachmentSync_(true);
      var partial = 'ปรับสิทธิ์ไฟล์แนบได้ ' + done + ' ไฟล์ ยังเหลือ ' + (rows.length - i) + ' ไฟล์ นัดรอบถัดไปแล้ว';
      if (added || removed || failed) audit_(SYSTEM_ACTOR, 'ปรับสิทธิ์เปิดไฟล์แนบตามบทบาท', 'Attachments',
        partial + ' · เพิ่ม ' + added + ' · ถอด ' + removed + ' · ล้มเหลว ' + failed);
      return partial;
    }
    var rec = incidents[String(rows[i].incidentId)];
    if (!rec) continue;
    var key = String(rec.faculty || '').trim() + '\u001F' + (isSensitive_(rec.cats) ? 1 : 0);
    if (!viewersByKey[key]) viewersByKey[key] = attachViewers_(rec);
    try {
      var file = DriveApp.getFileById(rows[i].driveFileId);
      if (file.getSharingAccess() !== DriveApp.Access.PRIVATE)
        file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      var r = syncFileViewers_(file, viewersByKey[key]);
      added += r.added; removed += r.removed; done++;
    } catch (e) {
      failed++;
      console.error('ATTACH_SYNC_FAILED ' + rows[i].attachmentId + ' ' + (e && e.message || e));
    }
  }
  props.deleteProperty('ATTACH_SYNC_CURSOR');
  var msg = 'ตรวจ ' + done + ' ไฟล์ · เพิ่มสิทธิ์ ' + added + ' · ถอดสิทธิ์ ' + removed + ' · ล้มเหลว ' + failed;
  props.setProperty('ATTACH_SYNC_LAST', now_() + ' · ' + msg);
  if (added || removed || failed) audit_(SYSTEM_ACTOR, 'ปรับสิทธิ์เปิดไฟล์แนบตามบทบาท', 'Attachments', msg);
  Logger.log(msg);
  return msg;
}
/* ทริกเกอร์รายวัน */
/* ทริกเกอร์รายวัน — ปรับสิทธิ์ใน Drive ทั้งสองส่วนที่ผูกกับทะเบียนผู้ใช้: ผู้แก้ไขทะเบียน และผู้เปิดไฟล์แนบ */
function syncAttachmentAccess_() {
  var out = [];
  try { out.push(syncRegistryEditors_()); }
  catch (e0) { console.error('REGISTRY_SYNC_ERROR ' + (e0 && e0.stack || e0)); out.push(String(e0 && e0.message || e0)); }
  try { out.push(runAttachmentSync_()); }
  catch (e) { console.error('ATTACH_SYNC_ERROR ' + (e && e.stack || e)); out.push(String(e && e.message || e)); }
  return out.join('\n');
}
/* ทริกเกอร์ครั้งเดียว — แยกชื่อจากรายวันเพื่อลบตัวเองทิ้งได้โดยไม่ลบทริกเกอร์รายวันไปด้วย */
function syncAttachmentAccessSoon_(e) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAttachmentAccessSoon_' && (!e || !e.triggerUid || t.getUniqueId() === e.triggerUid))
      ScriptApp.deleteTrigger(t);
  });
  PropertiesService.getScriptProperties().deleteProperty('ATTACH_SYNC_PENDING');
  return syncAttachmentAccess_();
}
/* นัดปรับสิทธิ์ภายใน 1 นาที ไม่ทำทันทีในคำขอของผู้ดูแล เพราะคณะที่มีไฟล์มากจะใช้เวลานานเกินกว่าหน้าจอจะรอได้
   กันการนัดซ้อนด้วย ATTACH_SYNC_PENDING (แก้สิทธิ์หลายคนติดกัน = ปรับรอบเดียว) */
function scheduleAttachmentSync_(force) {
  var props = PropertiesService.getScriptProperties();
  var pending = Number(props.getProperty('ATTACH_SYNC_PENDING')) || 0;
  if (!force && pending && new Date().getTime() - pending < 15 * 60 * 1000) return false;
  try {
    ScriptApp.newTrigger('syncAttachmentAccessSoon_').timeBased().after(60 * 1000).create();
    props.setProperty('ATTACH_SYNC_PENDING', String(new Date().getTime()));
    return true;
  } catch (e) {
    console.error('ATTACH_SYNC_SCHEDULE_FAILED ' + (e && e.message || e));
    return false;
  }
}
/* รันจาก Editor หลังเปลี่ยนมาใช้โหมด roles ครั้งแรก หรือหลังแก้ชีต Users ด้วยมือ */
function syncAttachmentAccessFromEditor() {
  assertEditorOrAdmin_();
  var out = syncAttachmentAccess_();
  Logger.log(out);
  return out;
}

/* สร้างโครงโฟลเดอร์ทั้งหมด เรียกซ้ำได้ ไม่สร้างซ้ำซ้อน */
function setupStorage_() {
  var props = PropertiesService.getScriptProperties();
  var parent = systemFolder_();
  /* ใช้โฟลเดอร์ไฟล์แนบเดิมถ้ายังอยู่ ไฟล์ที่แนบไว้แล้วจึงไม่แยกไปอยู่คนละที่กับไฟล์ใหม่ */
  var root = aliveFolderById_(props.getProperty('ATT_FOLDER_ID'));
  if (root) moveIntoIfLoose_(root, parent);
  else root = getOrCreateChildFolder_(parent, CONFIG.FOLDER_NAME);
  props.setProperty('ATT_FOLDER_ID', root.getId());

  var month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  var n = getOrCreateChildFolder_(root, ATT_NORMAL);
  var sv = getOrCreateChildFolder_(root, ATT_SENSITIVE);
  getOrCreateChildFolder_(n, month);
  getOrCreateChildFolder_(sv, month);

  /* โฟลเดอร์ข้อมูลอ่อนไหวต้องไม่แชร์ต่อไม่ว่ากรณีใด */
  try { sv.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); } catch (e) {}

  var msg = ['=== พื้นที่เก็บไฟล์แนบพร้อมใช้งาน ===',
    'โฟลเดอร์ระบบ   : ' + parent.getUrl(),
    'โฟลเดอร์หลัก   : ' + root.getUrl(),
    'ไฟล์ทั่วไป     : ' + n.getUrl(),
    'ข้อมูลอ่อนไหว  : ' + sv.getUrl(),
    'การแชร์ไฟล์ปกติ: ' + (CONFIG.ATTACH_SHARING === 'roles'
        ? 'แชร์รายบุคคลให้บทบาท ' + ATTACH_VIEW_ROLES.join(', ') + ' ของคณะที่เกิดเหตุ'
        : CONFIG.ATTACH_SHARING === 'domain'
        ? 'บุคลากรในโดเมน ' + CONFIG.ALLOWED_DOMAIN + ' ที่มีลิงก์เปิดดูได้'
        : 'ไม่แชร์ เปิดได้เฉพาะบัญชีเจ้าของระบบ'),
    'ขนาดไฟล์สูงสุด : ' + CONFIG.MAX_FILE_MB + ' MB ต่อไฟล์'].join('\n');
  Logger.log(msg);
  return msg;
}

/* รายงานการใช้พื้นที่ สำหรับผู้ดูแลระบบ */
/* เดิมชื่อ storageReport_ — ชื่อที่ลงท้าย _ ไม่ขึ้นในเมนู Run ของ Editor จึงไม่เคยถูกเรียกได้เลย */
function storageReportFromEditor() {
  assertEditorOrAdmin_();
  var root = attachRoot_();
  var lines = ['=== รายงานพื้นที่เก็บไฟล์แนบ ===', 'โฟลเดอร์หลัก: ' + root.getUrl(), ''];
  var grand = 0, count = 0;
  [ATT_NORMAL, ATT_SENSITIVE].forEach(function (bucket) {
    var it = root.getFoldersByName(bucket);
    if (!it.hasNext()) return;
    var b = it.next();
    lines.push('[' + bucket + ']');
    var months = b.getFolders();
    while (months.hasNext()) {
      var m = months.next(), files = m.getFiles(), n = 0, size = 0;
      while (files.hasNext()) { var f = files.next(); n++; size += f.getSize(); }
      grand += size; count += n;
      lines.push('  ' + m.getName() + '  ' + n + ' ไฟล์  ' + (size / 1048576).toFixed(1) + ' MB');
    }
    lines.push('');
  });
  lines.push('รวมทั้งสิ้น ' + count + ' ไฟล์ ' + (grand / 1048576).toFixed(1) + ' MB');
  var out = lines.join('\n');
  Logger.log(out);
  return out;
}

function getOrCreateSpreadsheet_(folder) {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  var existing = aliveFileById_(id);
  if (existing) { moveIntoIfLoose_(existing, folder); return SpreadsheetApp.openById(id); }
  if (id) Logger.log('SS_ID เดิม (' + id + ') อยู่ในถังขยะหรือเปิดไม่ได้ จะสร้าง ' + CONFIG.DB_NAME +
    ' ใหม่ — ถ้าต้องการใช้ไฟล์เดิม ให้กู้คืนจากถังขยะแล้วตั้ง Script Property SS_ID กลับเป็นรหัสนี้');

  /* ค้นเฉพาะ Google Sheets ที่ไม่อยู่ในถังขยะ ไฟล์ .xlsx ชื่อเดียวกันเปิดด้วย SpreadsheetApp ไม่ได้ */
  var it = folder.getFilesByName(CONFIG.DB_NAME);
  while (it.hasNext()) {
    var found = it.next();
    if (driveItemAlive_(found) && found.getMimeType() === MimeType.GOOGLE_SHEETS) return SpreadsheetApp.open(found);
  }

  var ss = SpreadsheetApp.create(CONFIG.DB_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  return ss;
}

/* สร้าง/เชื่อม Spreadsheet ทะเบียนผู้ใช้แยกจากฐานข้อมูลหลักแบบ idempotent
   ลำดับความสำคัญ: CONFIG.USERS_SS_ID → Script Property USERS_SS_ID → สร้างใหม่
   ห้ามค้นหาด้วยชื่อไฟล์ เพราะชื่อซ้ำกันได้และอาจเชื่อมผิดทะเบียนโดยไม่รู้ตัว */
function ensureUsersRegistry_(folder) {
  var props = PropertiesService.getScriptProperties();
  var configured = String(CONFIG.USERS_SS_ID || '').trim();
  var stored = String(props.getProperty('USERS_SS_ID') || '').trim();
  /* รหัสที่ระบบจำเองใน Script Property แต่ไฟล์อยู่ในถังขยะ ถือว่ายังไม่มีทะเบียน แล้วสร้างใหม่
     ส่วนรหัสที่ผู้ดูแลกำหนดเองใน CONFIG ต้องไม่ถูกแทนที่เงียบ ๆ จึงยังคงแจ้งข้อผิดพลาด */
  if (!configured && stored && !aliveFileById_(stored)) {
    Logger.log('USERS_SS_ID เดิม (' + stored + ') อยู่ในถังขยะหรือเปิดไม่ได้ จะสร้างทะเบียนผู้ใช้ใหม่ — ' +
      'ถ้าต้องการใช้ไฟล์เดิม ให้กู้คืนจากถังขยะแล้วตั้ง Script Property USERS_SS_ID กลับเป็นรหัสนี้');
    stored = '';
  }
  var id = configured || stored;
  var ss;

  if (id) {
    if (configured && !aliveFileById_(configured)) {
      throw apiError_('NOT_INSTALLED',
        'เปิด Spreadsheet ทะเบียนผู้ใช้ไม่ได้ หรือไฟล์อยู่ในถังขยะ (ID ' + id + ') กรุณาตรวจรหัสและแชร์ไฟล์ให้บัญชีที่ Deploy เป็น Editor');
    }
    try { ss = SpreadsheetApp.openById(id); }
    catch (e) {
      throw apiError_('NOT_INSTALLED',
        'เปิด Spreadsheet ทะเบียนผู้ใช้ไม่ได้ (ID ' + id + ') กรุณาตรวจรหัสและแชร์ไฟล์ให้บัญชีที่ Deploy เป็น Editor');
    }
    /* ย้ายเฉพาะทะเบียนที่ระบบสร้างเอง ไฟล์ที่ผู้ดูแลระบุผ่าน CONFIG อาจเป็นของหน่วยงานอื่น */
    if (!configured) moveIntoIfLoose_(DriveApp.getFileById(id), folder);
  } else {
    ss = SpreadsheetApp.create(String(CONFIG.USERS_DB_NAME || 'NU-Incident-Users'));
    DriveApp.getFileById(ss.getId()).moveTo(folder);
  }

  if (ss.getId() === String(props.getProperty('SS_ID') || '')) {
    throw apiError_('NOT_INSTALLED',
      'USERS_SS_ID ชี้ไปที่ฐานข้อมูลอุบัติการณ์ไฟล์เดียวกัน กรุณาใช้ Spreadsheet ทะเบียนผู้ใช้คนละไฟล์');
  }

  props.setProperty('USERS_SS_ID', ss.getId());
  var sh = configuredUsersSheet_(ss);
  ensureSheetSchema_(ss, sh, 'Users', SHEETS.Users);
  return sh;
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return ensureSheetSchema_(ss, sh, name, headers);
}

/* ตรวจ schema ของชีตที่ระบุไว้แล้ว ใช้ร่วมกันทั้งฐานข้อมูลหลักและทะเบียนสิทธิ์ภายนอก */
function ensureSheetSchema_(ss, sh, name, headers) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#F58220').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  } else {
    /* ชีตที่ติดตั้งไว้ก่อนอาจยังไม่มีคอลัมน์ที่เพิ่มในเวอร์ชันหลัง
       เติมต่อท้ายให้อัตโนมัติ ข้อมูลเดิมไม่กระทบเพราะอ่านและเขียนด้วยชื่อหัวคอลัมน์ */
    var have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var add  = headers.filter(function (h) { return have.indexOf(h) < 0; });
    if (add.length) {
      sh.getRange(1, have.length + 1, 1, add.length).setValues([add])
        .setFontWeight('bold').setBackground('#F58220').setFontColor('#FFFFFF');
      Logger.log('เพิ่มคอลัมน์ใหม่ในชีต ' + name + ': ' + add.join(', '));
    }
  }
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
  return sh;
}

/* เปิด Spreadsheet ทะเบียนสิทธิ์โดยเฉพาะ — ไม่มี fallback ไปฐานข้อมูลหลัก
   เพื่อรับรองว่าเหตุการณ์และข้อมูลสิทธิ์แยกกันจริงทั้งการอ่านและการเขียน */
function usersDb_() {
  var props = PropertiesService.getScriptProperties();
  var id = String(CONFIG.USERS_SS_ID || '').trim() || String(props.getProperty('USERS_SS_ID') || '').trim();
  if (!id) throw apiError_('NOT_INSTALLED',
    'ยังไม่ได้เชื่อมทะเบียนผู้ใช้ กรุณาให้ผู้ดูแลรัน setupFromEditor จาก Apps Script Editor หนึ่งครั้ง');
  try {
    var ss = SpreadsheetApp.openById(id);
    if (ss.getId() === String(props.getProperty('SS_ID') || ''))
      throw apiError_('NOT_INSTALLED',
        'ทะเบียนผู้ใช้ต้องอยู่คนละ Spreadsheet กับฐานข้อมูลอุบัติการณ์ กรุณาแก้ USERS_SS_ID แล้วรัน setupFromEditor');
    return ss;
  }
  catch (e) {
    if (e && e.apiCode) throw e;
    throw apiError_('NOT_INSTALLED',
      'เปิดทะเบียนผู้ใช้ USERS_SS_ID ไม่ได้ กรุณาแชร์ไฟล์ให้บัญชีที่ Deploy เป็น Editor และตรวจรหัส Spreadsheet');
  }
}

/* เลือกแท็บทะเบียนจาก gid ก่อน เพื่อให้เปลี่ยนชื่อแท็บได้โดยการเชื่อมต่อไม่ขาด
   ถ้าไม่ได้กำหนด gid จึงใช้ชื่อ USERS_SHEET_NAME และสร้างแท็บเมื่อยังไม่มี */
function configuredUsersSheet_(ss) {
  var configuredId = Number(CONFIG.USERS_SHEET_ID);
  var name = String(CONFIG.USERS_SHEET_NAME || 'Users').trim() || 'Users';
  var sh = null;
  if (configuredId) {
    sh = ss.getSheets().filter(function (x) { return x.getSheetId() === configuredId; })[0] || null;
  }
  /* gid เปลี่ยนทุกครั้งที่มีการ "ทำสำเนา" Spreadsheet ทะเบียนสิทธิ์
     เดิมกรณีนี้จะโยน NOT_INSTALLED ทำให้ทั้งระบบเข้าใช้งานไม่ได้ทั้งที่ข้อมูลยังอยู่ครบ
     จึงถอยไปใช้ชื่อแท็บแทน แล้วบันทึกไว้ให้ผู้ดูแลอัปเดต CONFIG.USERS_SHEET_ID ตามภายหลัง */
  if (!sh) {
    sh = ss.getSheetByName(name);
    if (sh && configuredId) {
      console.warn('USERS_SHEET_ID=' + configuredId + ' ไม่ตรงกับแท็บใด ใช้แท็บชื่อ "' + name +
        '" (gid ' + sh.getSheetId() + ') แทน กรุณาแก้ CONFIG.USERS_SHEET_ID ให้ตรง');
    }
  }
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function db_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  /* เดิมติดตั้งให้อัตโนมัติเมื่อยังไม่มีฐานข้อมูล ทำให้ "คนแรกที่เปิด URL" กลายเป็นผู้ดูแลระบบ
     ถ้า URL หลุดออกไปก่อนติดตั้ง จึงต้องปฏิเสธและให้ผู้ดูแลรัน setupFromEditor เท่านั้น */
  if (!id) throw apiError_('NOT_INSTALLED',
    'ระบบยังไม่ได้ติดตั้งฐานข้อมูล กรุณาให้ผู้ดูแลระบบรัน setupFromEditor จาก Apps Script Editor ก่อน');
  return SpreadsheetApp.openById(id);
}

/* ชีตที่ติดตั้งไว้ก่อนอาจยังไม่มีคอลัมน์ที่เพิ่มในเวอร์ชันหลัง
   ตรวจและเติมให้ครั้งเดียวต่อการทำงานหนึ่งครั้ง ไม่ใช่ทุกครั้งที่เรียกใช้ */
var SHEET_CHECKED = {};
function sheet_(name) {
  var isUsers = name === 'Users';
  var ss = isUsers ? usersDb_() : db_();
  var sh = isUsers ? configuredUsersSheet_(ss) : ss.getSheetByName(name);
  if (!sh) return ensureSheet_(ss, name, SHEETS[name]);
  var checkKey = ss.getId() + ':' + sh.getSheetId();
  if (!SHEET_CHECKED[checkKey]) {
    SHEET_CHECKED[checkKey] = true;
    ensureSheetSchema_(ss, sh, name, SHEETS[name]);
  }
  return sh;
}

/* ============================================================
 *  2. อ่าน / เขียนตาราง
 * ============================================================ */
/* หนึ่งคำสั่งอ่านชีตเดิมซ้ำหลายรอบ (me_ → scoped_ → notify_)
   จำค่าไว้ตลอดการทำงานหนึ่งครั้ง แล้วล้างทิ้งเมื่อมีการเขียน */
var READ_CACHE = {};
function readAll_(name) {
  if (READ_CACHE[name]) return READ_CACHE[name];
  return (READ_CACHE[name] = readSheet_(name));
}
function invalidate_(name) { if (name) delete READ_CACHE[name]; else READ_CACHE = {}; }

function readSheet_(name) {
  var sh = sheet_(name);
  if (sh.getLastRow() < 2) return [];
  var values  = sh.getDataRange().getValues();
  var headers = values.shift();
  return values.map(function (row) {
    var o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    if (name === 'Incidents') o = hydrate_(o);
    if (name === 'Audit') o.t = fmtStamp_(o.t);
    if (name === 'Attachments') { o.createdAt = fmtStamp_(o.createdAt); o.expiresAt = fmtStamp_(o.expiresAt); }
    if (name === 'OrgHeadcount') {
      o.faculty = canonUnit_(o.faculty);   /* แถวที่บันทึกด้วยชื่อเก่าจะถูกเขียนกลับเป็นชื่อใหม่ในการบันทึกครั้งถัดไป */
      o.orgUnit = String(o.orgUnit || '').trim();
      o.headcount = Math.max(0, Number(o.headcount) || 0);
      o.hoursPerYear = Math.max(0, Number(o.hoursPerYear) || 0);
      o.effectiveYear = String(o.effectiveYear || '').trim();
      o.updatedAt = fmtStamp_(o.updatedAt);
      o.updatedBy = String(o.updatedBy || '').trim();
      try { o.staffGroups = o.staffGroups ? JSON.parse(String(o.staffGroups)) : []; } catch (eg) { o.staffGroups = []; }
      if (!Array.isArray(o.staffGroups)) o.staffGroups = [];
    }
    if (name === 'Users') {
      o.email = String(o.email || '').trim().toLowerCase();
      o.role = String(o.role || '').trim();
      o.faculty = String(o.faculty || o.unit || '').trim();
      o.orgUnit = String(o.orgUnit || '').trim();
      o.unit = String(o.unit || o.faculty || '').trim();
      o.createdAt = fmtStamp_(o.createdAt); o.approvedAt = fmtStamp_(o.approvedAt);
      /* ผู้ดูแลแก้ชีตด้วยมือได้แล้ว ค่าที่พิมพ์เองอาจเป็น true / True / ใช่ — รับทุกแบบที่มีความหมายว่าเปิดใช้งาน
         เดิมรับเฉพาะ TRUE ตัวพิมพ์ใหญ่ บัญชีที่พิมพ์ true ตัวเล็กจึงถูกระงับเงียบ ๆ โดยไม่มีใครรู้ */
      o.active = (o.active === true || o.active === 1 || /^\s*(true|1|yes|y|ใช่)\s*$/i.test(String(o.active)));
    }
    return o;
  }).filter(function(o) {
    /* แม่แบบรุ่นเก่าเคยมีแถวคำอธิบาย/หมายเหตุคั่นอยู่ในแท็บ Users
       ไม่นับแถวเหล่านั้นเป็นบัญชี และไม่ส่งแถวว่างหลายร้อยแถวไปยังหน้า Admin */
    if (name === 'Users') return /^[^@\s]+@[^@\s]+$/.test(String(o.email || ''));
    /* แถวว่างท้ายชีตที่เกิดจากการกด Enter ค้างไว้ ต้องไม่กลายเป็นหน่วยงานชื่อว่างที่มีคน 0 คน */
    if (name === 'OrgHeadcount') return !!o.faculty;
    return true;
  });
}

function hydrate_(o) {
  JSON_FIELDS.forEach(function (k) {
    if (typeof o[k] === 'string' && o[k]) { try { o[k] = JSON.parse(o[k]); } catch (e) { o[k] = []; } }
    if (!Array.isArray(o[k])) o[k] = [];
  });
  o.anon = (o.anon === true || o.anon === 'TRUE');
  ['level','suggestLevel','injuryAxis','damageAxis','damageBaht','daysOff'].forEach(function (k) {
    o[k] = Number(o[k]) || 0;
  });
  /* แถวที่บันทึกไว้ก่อนมีคอลัมน์ version จะเป็นค่าว่าง ต้องอ่านเป็น 1 ให้ตรงกับค่าเริ่มต้นของ updateIncident_
     มิฉะนั้นหน้าจอจะส่ง expectedVersion ไม่ได้ แล้วถูกปฏิเสธทุกคำสั่งที่แก้ไขเรื่องเก่า */
  o.version = Number(o.version) || 1;
  ['date','meetDate'].forEach(function (k) { o[k] = fmtDate_(o[k]); });
  o.time = fmtTime_(o.time);
  ['createdAt','updatedAt','ackAt','verbalAt','writtenAt','uniReportAt','cancelledAt']
    .forEach(function (k) { o[k] = fmtStamp_(o[k]); });
  return o;
}

function fmtDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).slice(0, 10);
}

/* เวลาเกิดเหตุ "14:35" ถูก Sheets แปลงเป็นค่าเวลา (Date วันที่ 1899-12-30) อ่านกลับมาจึงแสดงเป็น
   "1899-12-30T07:35:52.000Z" บนหน้าจอ (รุ่น 2.8.37) — แปลงกลับเป็น HH:mm ตามเขตเวลาของสคริปต์
   ซึ่งตรงกับเขตเวลาที่ Sheets ใช้ตอนแปลง จึงได้เวลาเดิมที่ผู้รายงานกรอก */
function fmtTime_(v) {
  if (v === '' || v === null || v === undefined) return '';
  var tz = Session.getScriptTimeZone();
  /* ปัดเป็นนาทีที่ใกล้ที่สุด: ค่าเวลาปี 1899 ใช้เวลาท้องถิ่นเดิมของกรุงเทพฯ (+06:42:04) จึงมีเศษวินาทีติดมา */
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(new Date(v.getTime() + 30000), tz, 'HH:mm');
  var s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) { var d = new Date(s); if (!isNaN(d)) return Utilities.formatDate(new Date(d.getTime() + 30000), tz, 'HH:mm'); }
  var m = s.match(/^(\d{1,2})[:.](\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : s;
}

/* Google Sheets แปลงข้อความที่มีรูปแบบวันเวลาให้เป็น "ค่าวันที่" อัตโนมัติ
   อ่านกลับมาจึงได้ Date object ไม่ใช่สตริง ถ้านำไปเทียบกับ now_() ตรง ๆ จะเทียบผิดเสมอ
   ทุกช่องที่เก็บวันเวลาต้องผ่านตัวนี้ก่อนเทียบหรือส่งออกหน้าจอ */
function fmtStamp_(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  }
  return String(v);
}

/* กัน Spreadsheet/CSV Formula Injection เมื่อค่าที่จะเขียนลงเซลล์ขึ้นต้นด้วย = + - @
   จุดเดียวที่ implement กติกานี้ในฝั่งเซิร์ฟเวอร์ ใช้ร่วมกันทั้ง dehydrate_ (เขียนชีตข้อมูล) และ auditCell_ (เขียนชีต Audit)
   เพื่อไม่ให้ตรรกะป้องกันหลุดไม่ตรงกันหากมีการแก้ไขจุดใดจุดหนึ่งในอนาคตแล้วลืมอีกจุด */
function escFormula_(v) {
  return /^[\s]*[=+\-@]/.test(v) ? "'" + v : v;
}
function dehydrate_(o, headers) {
  return headers.map(function (h) {
    var v = o[h];
    if (JSON_FIELDS.indexOf(h) >= 0) return JSON.stringify(Array.isArray(v) ? v : []);
    if (v === undefined || v === null) return '';
    /* เวลาเกิดเหตุเก็บเป็นข้อความ — ' นำหน้าบอก Sheets ไม่ให้แปลงเป็นค่าเวลา (อ่านกลับได้ "14:35" ตรงตัว) (2.8.37) */
    if (h === 'time' && typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) return "'" + v;
    if (typeof v === 'string') return escFormula_(v);
    return v;
  });
}

/* ลำดับหัวคอลัมน์จริงของชีต อาจต่างจากลำดับใน SHEETS ถ้ามีการเติมคอลัมน์ภายหลัง
   จึงต้องเขียนตามลำดับจริงเสมอ ไม่เช่นนั้นข้อมูลจะเลื่อนช่อง */
function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function appendRow_(name, obj) {
  var sh = sheet_(name);
  sh.appendRow(dehydrate_(obj, headers_(sh)));
  invalidate_(name);
}

function updateIncident_(obj) {
  var sh = sheet_('Incidents');
  var ids = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(obj.id)) {
      var head = headers_(sh);
      var currentValues = sh.getRange(i + 2, 1, 1, head.length).getValues()[0];
      var current = {};
      head.forEach(function(h,j){ current[h]=currentValues[j]; });
      current = hydrate_(current);
      var currentVersion = Number(current.version) || 1;
      if (CURRENT_EXPECTED_VERSION !== null && CURRENT_EXPECTED_VERSION !== currentVersion) {
        throw apiError_('VERSION_CONFLICT','ข้อมูลถูกเปลี่ยนแปลงโดยผู้ใช้อื่น กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก');
      }
      CURRENT_BEFORE_HASH = hashObject_(current);
      CURRENT_CHANGES = diffForAudit_(current,obj);
      obj.version = currentVersion + 1;
      obj.updatedAt = now_();
      sh.getRange(i + 2, 1, 1, head.length).setValues([dehydrate_(obj, head)]);
      CURRENT_AFTER_HASH = hashObject_(obj);
      invalidate_('Incidents');
      return true;
    }
  }
  return false;
}

function now_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'); }
function today_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

/* ============================================================
 *  3. ผู้ใช้และสิทธิ์
 * ============================================================ */
/* URL สำหรับลิงก์ในอีเมล: Script Property APP_URL → CONFIG.APP_URL → URL ที่ Apps Script รายงาน (สำรอง) */
function appUrl_() {
  var p = '';
  try { p = String(PropertiesService.getScriptProperties().getProperty('APP_URL') || '').trim(); } catch (e) {}
  var c = String(CONFIG.APP_URL || '').trim();
  var u = p || c;
  if (/^https:\/\/script\.google\.com\/.+\/exec$/.test(u)) return u;
  try { return String(ScriptApp.getService().getUrl() || ''); } catch (e2) { return ''; }
}

function doGet(e) {
  /* ตัดสินสิทธิ์เปิด Dashboard ที่ฝั่งเซิร์ฟเวอร์ก่อนส่ง HTML
     เพื่อไม่ให้ผลขึ้นกับจังหวะโหลด google.script.run ในเบราว์เซอร์ */
  var template = HtmlService.createTemplateFromFile('Index');
  template.editorAutoStart = isDeployEditor_();
  /* ลิงก์จากอีเมลแจ้งเตือน (?incident=IR-2569-001) เปิดหน้ารายละเอียดเรื่องนั้นหลังเข้าสู่ระบบ
     รับเฉพาะรูปแบบเลขที่รายงาน เพราะค่านี้ถูกวางลงในหน้า HTML — สิทธิ์ยังตรวจตามปกติทุกขั้น */
  var inc = String((e && e.parameter && e.parameter.incident) || '');
  template.initialIncident = /^IR-\d{4}-\d{3,}$/.test(inc) ? inc : '';
  return template.evaluate()
    .setTitle(CONFIG.SYSTEM_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);   // กันการฝังหน้าจอในเว็บอื่นเพื่อหลอกให้กดปุ่ม
}

/* CURRENT_ID_TOKEN ตั้งค่าที่ api() ใน Api.gs จาก req.idToken
   มีทั้งคำขอ doPost() จากเว็บภายนอกและคำขอ google.script.run เมื่อ Session ไม่คืนอีเมล
   เส้นทางปกติที่ Session ระบุอีเมลได้ยังไม่ต้องส่ง token */
function currentEmail_() {
  if (CURRENT_VERIFIED_EMAIL) return CURRENT_VERIFIED_EMAIL;
  var e = CURRENT_ID_TOKEN ? verifyIdToken_(CURRENT_ID_TOKEN) : Session.getActiveUser().getEmail();
  e = String(e || '').trim().toLowerCase();
  if (!e) throw apiError_('AUTH_REQUIRED',
    'ไม่สามารถระบุบัญชีผู้ใช้จาก Session ได้ ระบบจะเปิด Google Sign-In สำรองให้ หากยังไม่ปรากฏ กรุณาตรวจการ Deploy และ CONFIG.OAUTH_CLIENT_ID');
  /* แจ้งอีเมลที่ระบบเห็นจริงกลับไปด้วย เพราะ "อนุญาตเฉพาะ @nu.ac.th" ลอย ๆ
     ทำให้แยกไม่ออกว่าเข้าด้วยบัญชีส่วนตัวอยู่ หรือโดเมนย่อยไม่ผ่านเกณฑ์ */
  if (!domainOk_(e)) {
    throw apiError_('FORBIDDEN', 'บัญชีที่กำลังใช้งานคือ ' + e +
      ' ซึ่งไม่อยู่ในโดเมน @' + CONFIG.ALLOWED_DOMAIN +
      ' กรุณาออกจากบัญชี Google อื่นในเบราว์เซอร์ แล้วเข้าใหม่ด้วยบัญชีของมหาวิทยาลัย');
  }
  CURRENT_VERIFIED_EMAIL = e;
  return e;
}

/* โดเมนที่อนุญาต ต้องครอบคลุมโดเมนย่อยที่มหาวิทยาลัยใช้จริงด้วย เช่น
   @grad.nu.ac.th หรือ @email.nu.ac.th มิฉะนั้นบุคลากรและนิสิตกลุ่มนั้นจะเข้าระบบไม่ได้เลย
   แหล่งความจริงเดียวของกติกานี้ ใช้ทั้ง currentEmail_ และ ensureFirstAdmin_ */
function domainOk_(email) {
  var domain = String(CONFIG.ALLOWED_DOMAIN || '').trim().toLowerCase();
  if (!domain) return true;
  var at = String(email || '').lastIndexOf('@');
  if (at < 0) return false;
  var host = String(email).slice(at + 1).trim().toLowerCase();
  return host === domain || (host.length > domain.length && host.slice(-(domain.length + 1)) === '.' + domain);
}

/* ตรวจสอบ Google ID token จาก Google Identity Services บนหน้าเว็บที่ served นอก Apps Script
   ใช้ tokeninfo endpoint ของ Google แทนการตรวจลายเซ็น JWT เอง เพราะ Apps Script ไม่มีไลบรารีนี้ในตัว
   และไฟล์นี้ต้องเรียก UrlFetchApp ข้ามโดเมนได้ (ขอบเขต script.external_request ที่ Apps Script ให้มาโดยปริยาย)
   ต้องตรวจ aud ให้ตรงกับ CONFIG.OAUTH_CLIENT_ID เสมอ มิฉะนั้นโทเคนที่ Google ออกให้แอปอื่นจะสวมรอยเข้าระบบนี้ได้
   คืนเฉพาะอีเมล ไม่ตรวจโดเมน @ALLOWED_DOMAIN ที่นี่ เพราะ currentEmail_ ตรวจซ้ำอยู่แล้วเป็นจุดเดียว */
function verifyIdToken_(idToken) {
  if (!CONFIG.OAUTH_CLIENT_ID) throw apiError_('NOT_INSTALLED', 'ยังไม่ได้ตั้งค่า CONFIG.OAUTH_CLIENT_ID สำหรับการเข้าสู่ระบบจากภายนอก Apps Script');
  /* โทเคนเดิมถูกส่งมาทุกคำขอจนหมดอายุ (ราว 1 ชั่วโมง) ถ้าเรียก tokeninfo ทุกครั้งจะกินโควตา UrlFetch ของบัญชีที่ Deploy
     จำผลที่ตรวจผ่านแล้วไว้ด้วยแฮชของโทเคน (ไม่เก็บตัวโทเคนเอง) ไม่เกิน 10 นาทีและไม่เกินเวลาหมดอายุ */
  var cacheKey = 'idt_' + hashToken_(idToken), cache = null;
  try { cache = CacheService.getScriptCache(); var hit = cache.get(cacheKey); if (hit) return hit; } catch (cacheErr) { cache = null; }
  var resp;
  try {
    resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions:true });
  } catch (e) {
    throw apiError_('AUTH_REQUIRED', 'ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่');
  }
  if (resp.getResponseCode() !== 200) throw apiError_('AUTH_REQUIRED', 'โทเคนการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  var info;
  try { info = JSON.parse(resp.getContentText()); }
  catch (parseErr) { throw apiError_('AUTH_REQUIRED', 'บริการยืนยันตัวตนตอบกลับไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'); }
  if (info.aud !== CONFIG.OAUTH_CLIENT_ID) throw apiError_('AUTH_REQUIRED', 'โทเคนนี้ไม่ได้ออกให้สำหรับระบบนี้');
  if (['accounts.google.com','https://accounts.google.com'].indexOf(String(info.iss || '')) < 0)
    throw apiError_('AUTH_REQUIRED', 'ผู้ออกโทเคนการเข้าสู่ระบบไม่ถูกต้อง');
  if (!info.exp || Number(info.exp) * 1000 <= new Date().getTime())
    throw apiError_('AUTH_REQUIRED', 'โทเคนการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  if (String(info.email_verified) !== 'true') throw apiError_('AUTH_REQUIRED', 'บัญชี Google นี้ยังไม่ได้ยืนยันอีเมล');
  var email = String(info.email || '').trim().toLowerCase();
  if (!email) throw apiError_('AUTH_REQUIRED', 'ไม่พบอีเมลในโทเคนการเข้าสู่ระบบ');
  if (CONFIG.REQUIRE_HOSTED_DOMAIN !== false && !domainOk_('x@' + String(info.hd || '')))
    throw apiError_('FORBIDDEN', 'บัญชี ' + email + ' ไม่ใช่บัญชี Google Workspace ของมหาวิทยาลัย กรุณาเข้าสู่ระบบด้วยบัญชีของมหาวิทยาลัย');
  if (cache) {
    var ttl = Math.min(600, Math.floor(Number(info.exp) - new Date().getTime() / 1000) - 30);
    if (ttl > 0) { try { cache.put(cacheKey, email, ttl); } catch (putErr) {} }
  }
  return email;
}

/* allowInactive ใช้เฉพาะ auth.bootstrap เพื่อให้ตอบกลับหน้าจอได้ว่า "รออนุมัติ" หรือ "ถูกระงับ"
   คำสั่งอื่นทุกคำสั่งยังคงปฏิเสธบัญชีที่ไม่ active เหมือนเดิม */
function me_(allowInactive) {
  var email = currentEmail_();
  var users = readAll_('Users');
  /* ช่องว่างหัวท้ายในเซลล์ email เป็นสาเหตุที่พบบ่อยที่สุดที่ทำให้ "มีบัญชีในทะเบียนแล้วแต่ระบบพาไปหน้าลงทะเบียนซ้ำ"
     แล้วผู้ใช้ค้างอยู่ที่สถานะรออนุมัติตลอดไป จึงตัดช่องว่างก่อนเทียบเสมอ */
  var u = users.filter(function (x) { return String(x.email || '').trim().toLowerCase() === email; })[0];

  if (!u) {
    return { registered:false, email:email };
  }
  if (!isRole_(u.role)) u.role = 'reporter';
  if (!u.active) {
    /* นโยบายปัจจุบันคือเปิดลงทะเบียนเสรี (ดู registerSelf_) ผู้ลงทะเบียนใหม่จึงเป็น
       active=true และมี approvedAt ทันที เส้นทาง "รออนุมัติ" ที่นี่จึงเหลือไว้สำหรับ
       แถวที่ผู้ดูแลกรอกลงชีตเองโดยยังไม่ติ๊ก active และยังไม่มี approvedAt
       และเผื่อกรณีกลับไปใช้คิวอนุมัติในอนาคต ต้องแยกออกจากบัญชีที่ "ถูกระงับ"
       (active=false แต่มี approvedAt แล้ว) มิฉะนั้นทั้งสองกรณีจะได้ข้อความเดียวกัน */
    u.pending = !String(u.approvedAt || '').trim();
    if (!allowInactive) {
      throw apiError_(u.pending ? 'ACCOUNT_PENDING' : 'ACCOUNT_INACTIVE',
        u.pending ? 'บัญชีของท่านอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบต้นสังกัดและอนุมัติสิทธิ์'
                  : 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    }
  }

  u.registered = true;
  u.pos  = u.position;
  u.can  = ROLES[u.role].can;
  u.scope = ROLES[u.role].scope;
  return u;
}

function need_(u, cap) {
  if (!u.registered || !ROLES[u.role].can[cap]) {
    /* บันทึกความพยายามที่ถูกปฏิเสธด้วย ถ้าบันทึกเฉพาะที่สำเร็จจะมองไม่เห็นการลองสิทธิ์ */
    audit_(u, 'ถูกปฏิเสธสิทธิ์', cap, 'บทบาท ' + (u && u.role));
    throw apiError_('FORBIDDEN', 'ไม่มีสิทธิ์ดำเนินการนี้');
  }
}

/* ขอบเขตสิทธิ์ระดับแถว — แหล่งความจริงเดียวของกติกา own / orgUnit / faculty / all
   ทั้งการกรองรายการ (scoped_) และการตรวจสิทธิ์รายเรื่อง (cancelIncident_) ต้องเรียกตัวนี้
   ห้ามเขียนเงื่อนไขเทียบ faculty/orgUnit/reporterEmail ซ้ำที่อื่นอีก */
function isOwner_(u, x) {
  return String(x.reporterEmail).toLowerCase() === String(u.email).toLowerCase();
}

function inScope_(u, x) {
  var scope = ROLES[u.role].scope;
  if (scope === 'all') return true;
  if (scope === 'faculty') return sameFaculty_(x.faculty, u.faculty);
  if (scope === 'orgUnit') return sameFaculty_(x.faculty, u.faculty) && sameOrgUnit_(x.orgUnit, u.orgUnit);
  return isOwner_(u, x);
}

/* กรองตามขอบเขตสิทธิ์ และทำเครื่องหมายข้อมูลอ่อนไหว */
function scoped_(u, list) {
  var role = ROLES[u.role], out;
  /* ผู้บริหารมหาวิทยาลัยเห็นข้อมูลภาพรวมได้ทั้งมหาวิทยาลัยเช่นเดียวกับกองอาคารสถานที่
     การจำกัดเฉพาะระดับ 3 ขึ้นไปทำที่หน้ารายงานภาพรวมฝั่งหน้าจอ */
  if (role.level3Only) {
    /* บทบาทนี้เห็นรายละเอียดรายเรื่องเฉพาะระดับ 3 ขึ้นไปตามเดิม
       แต่ถ้ามีสิทธิ์ดูดัชนีความปลอดภัย จะได้รับ "แถวสรุปเชิงสถิติ" ของระดับ 1-2 เพิ่มมาด้วย
       แถวสรุปมีเฉพาะตัวเลขที่ใช้คำนวณ ไม่มีเรื่อง เนื้อหา ผู้รายงาน หรือบันทึกใด ๆ
       จึงได้ค่า IFR และ ISR ที่ตรงความจริง โดยไม่เปิดเผยรายละเอียดรายเรื่องเพิ่มขึ้น */
    var full = list.filter(function (x) { return (x.level || x.suggestLevel) >= 3; });
    out = role.can.safetyIndex
      ? full.concat(list.filter(function (x) { return (x.level || x.suggestLevel) < 3; }).map(statStub_))
      : full;
  }
  else if (role.scope === 'all')   out = list;
  else if (role.scope === 'faculty') {
    out = list.filter(function (x) { return inScope_(u, x); });
    /* คณบดี / ผู้อำนวยการกอง (รุ่น 2.8.22) — Dashboard รายงานภาพรวมทุกระดับทั้งมหาวิทยาลัย
       เรื่องของหน่วยงานอื่นส่งไปทุกระดับ แต่ในรูปแบบที่ต่างกัน (จัดการใน map ด้านล่าง)
       ระดับ 1–2 → แถวสรุป (summaryOnly) มีเฉพาะตัวเลขที่ใช้นับ ไม่มีเนื้อหา
       ระดับ 3+ → อ่านรายละเอียดได้ ติดธง crossRead = อ่านอย่างเดียว (findScopedRaw_ ปฏิเสธทุกการแก้ไข) */
    if (role.crossLevel3) {
      out = out.concat(list.filter(function (x) { return !sameFaculty_(x.faculty, u.faculty); }));
    }
  }
  else {
    out = list.filter(function (x) { return inScope_(u, x); });
    /* หัวหน้างาน/หัวหน้ากลุ่มสาขา/หัวหน้าภาค (facReport · รุ่น 2.8.31) — Dashboard รายงานภาพรวมของทั้งคณะ
       เรื่องของหน่วยงานอื่นในคณะเดียวกันส่งไปเป็นแถวสรุป (summaryOnly) ทุกระดับ มีเฉพาะตัวเลขที่ใช้นับ
       ไม่มีชื่อเรื่อง เนื้อหา ผู้รายงาน สถานที่ หรือบันทึก — เปิดรายละเอียดหรือแก้ไขไม่ได้ */
    if (role.facReport && role.scope === 'orgUnit') {
      out = out.concat(list.filter(function (x) {
        return sameFaculty_(x.faculty, u.faculty) && !inScope_(u, x) && !isOwner_(u, x);
      }));
    }
  }

  /* ผู้มีสิทธิ์อ่านเรื่องอ่อนไหวกำหนดที่ธง sensitiveAccess ใน ROLES จุดเดียว (ตรงกับฝั่งหน้าจอ) */
  var canSee = !!role.sensitiveAccess;
  return out.map(function (x) {
    /* ผู้รายงานต้องเห็นเรื่องของตนเองเสมอ แม้เป็นประเภทข้อมูลอ่อนไหว
       มิฉะนั้นคนที่แจ้งเรื่องการคุกคามหรือภาวะวิกฤต จะติดตามเรื่องของตัวเองไม่ได้เลย */
    var mine = isOwner_(u, x);
    var crossRead = !!role.crossLevel3 && role.scope === 'faculty' && !mine && !sameFaculty_(x.faculty, u.faculty);
    if (role.facReport && role.scope === 'orgUnit' && !mine && !inScope_(u, x)) return execSummary_(x);
    if ((role.execRead || crossRead) && !mine && effLevel_(x) < EXEC_DETAIL_MIN_LEVEL) return execSummary_(x);
    /* บทบาทระดับคณะเข้าถึงเรื่องอ่อนไหวได้เฉพาะของหน่วยงานตนเอง
       เดิมไม่ต้องตรวจเพราะขอบเขตจำกัดอยู่แล้ว แต่ตอนนี้เห็นข้ามหน่วยงานได้ จึงต้องตรวจ */
    var sameFac = role.scope !== 'faculty' || sameFaculty_(x.faculty, u.faculty);
    if (isSensitive_(x.cats) && !(canSee && sameFac) && !mine) {
      var masked = maskSensitive_(x);
      if (crossRead) masked.crossRead = true;
      return masked;
    }
    /* คัดลอกก่อนแก้เสมอ เพราะแถวเดียวกันถูกใช้ซ้ำจากแคชภายในคำสั่งเดียวกัน
       ถ้าแก้ของเดิมโดยตรง ค่าที่ลบออกเพื่อส่งให้หน้าจอจะติดไปถึงตอนเขียนกลับลงชีต */
    var o = {};
    Object.keys(x).forEach(function (k) { o[k] = x[k]; });
    o.restricted = false;
    if (crossRead) o.crossRead = true;
    /* อีเมลผู้รายงานเก็บไว้ในชีตเสมอเพื่อการตรวจสอบ แต่ไม่ส่งออกไปให้ผู้อื่นเห็น
       ส่งกลับเฉพาะของตัวผู้เรียกเอง เพราะหน้าจอใช้ตรวจว่าเป็นเรื่องของตนหรือไม่ */
    if (!mine) o.reporterEmail = '';
    /* โหมด roles: ผู้ไม่มีสิทธิ์เปิดไฟล์เห็นเพียงชื่อไฟล์ ไม่ได้ลิงก์หรือรหัสไฟล์ใน Drive */
    if (CONFIG.ATTACH_SHARING === 'roles' && Array.isArray(o.files) && o.files.length && !canViewAttachments_(u, x)) {
      o.files = o.files.map(function (f) {
        return { attachmentId:f && f.attachmentId, name:(f && f.name) || 'ไฟล์แนบ', mime:f && f.mime, locked:true };
      });
    }
    return o;
  });
}

/* แถวสรุปเชิงสถิติ — เก็บเฉพาะตัวเลขที่ดัชนีความปลอดภัยต้องใช้
   ระบุช่องที่อนุญาตเช่นเดียวกับการปิดบังข้อมูลอ่อนไหว ช่องที่เพิ่มใหม่ในอนาคตจึงไม่หลุดเอง
   statOnly เป็นเครื่องหมายให้หน้าจอรู้ว่าแถวนี้ใช้ได้เฉพาะการนับ ห้ามนำไปแสดงเป็นรายการหรือเปิดอ่าน */
/* createdAt/updatedAt ต้องอยู่ในรายการนี้ด้วย ไม่ใช่เพื่อการแสดงผล แต่เพื่อให้การซิงก์แบบส่วนต่างเห็นแถวนี้
   ถ้าไม่มี แถวสถิติจะไม่เข้าเงื่อนไข since แล้วเรื่องที่ถูกลดระดับจาก 3 เหลือ 2 จะค้างเป็นแถวเต็มบนหน้าจอตลอดไป */
var STAT_KEEP = ['id','date','kind','status','level','suggestLevel','createdAt','updatedAt',
                 'injuryAxis','damageAxis','daysOff','faculty','orgUnit','unit','cancelledAt'];
/* ผู้บริหารระดับมหาวิทยาลัย (execRead) เปิดอ่านรายละเอียดได้เฉพาะเรื่องระดับ 3 ขึ้นไป (รุ่น 2.8.11)
   เรื่องระดับ 1–2 ส่งไปเบราว์เซอร์เป็น "แถวสรุป" ที่มีเฉพาะข้อมูลที่แดชบอร์ดและดัชนีใช้นับ
   ไม่มีชื่อเรื่อง เนื้อหา ผู้รายงาน สถานที่ บันทึก หรือข้อความมาตรการ — แดชบอร์ดยังนับครบทุกเรื่อง
   เดิมเบราว์เซอร์ของบทบาทเหล่านี้ได้รับเนื้อหาครบทุกเรื่องทุกระดับ แม้หน้าจอไม่แสดงก็อ่านได้จากเครื่องมือนักพัฒนา */
var EXEC_DETAIL_MIN_LEVEL = 3;
function effLevel_(x) { return Number(x && (x.level || x.suggestLevel)) || 0; }
function execSummary_(x) {
  var m = { summaryOnly:true, restricted:true, title:'(ระดับ 1–2 · เห็นเฉพาะในสถิติ)', detail:'',
            reporter:'', reporterEmail:'', reporterPos:'', place:'', mapUrl:'', activity:'', course:'',
            treat:'', assets:'', firstAid:'', confirmNote:'', investNote:'', meetPlace:'', capaNote:'',
            deputyNote:'', monitorNote:'', reviewNote:'', ackNote:'', closeNote:'', cancelNote:'',
            parts:[], involved:[], files:[], log:[], monitorLog:[] };
  MASK_KEEP.forEach(function (k) { m[k] = x[k]; });
  /* สาเหตุเป็นหมวดจากรายการคงที่ ไม่ใช่ข้อความอิสระ จึงส่งได้ ส่วนมาตรการเหลือเฉพาะกำหนดเสร็จและสถานะ */
  m.causes = Array.isArray(x.causes) ? x.causes.slice() : [];
  m.capa = (Array.isArray(x.capa) ? x.capa : []).map(function (c) {
    return { m:'', who:'', due:(c && c.due) || '', done:!!(c && c.done), doneAt:(c && c.doneAt) || '' };
  });
  m.cancelledAt = x.cancelledAt; m.version = x.version;
  return m;
}

function statStub_(x) {
  var o = { statOnly:true, restricted:true, title:'(นับในสถิติเท่านั้น)', detail:'',
            reporter:'', reporterEmail:'', reporterPos:'', place:'', mapUrl:'',
            cats:[], parts:[], involved:[], causes:[], capa:[], files:[], log:[],
            damageBaht:0, cancelNote:'' };
  STAT_KEEP.forEach(function (k) { o[k] = x[k]; });
  return o;
}

/* เก็บเฉพาะช่องที่จำเป็นต่อการนับสถิติ ที่เหลือทิ้งทั้งหมด
   ใช้วิธีระบุช่องที่อนุญาต ไม่ใช่ระบุช่องที่ต้องลบ เพื่อไม่ให้ช่องที่เพิ่มใหม่ในอนาคตหลุดออกไปเอง */
var MASK_KEEP = ['id','createdAt','updatedAt','status','level','suggestLevel','kind','cats',
                 'date','time','faculty','orgUnit','unit','subUnit','anon',
                 'injuryAxis','damageAxis','damageBaht','daysOff','monitor',
                 'verbalAt','writtenAt','uniReportAt','ackAt','meetDate'];
function maskSensitive_(x) {
  var m = { restricted:true, title:'(ข้อมูลอ่อนไหว — จำกัดการเข้าถึง)', detail:'',
            reporter:'(จำกัดการเข้าถึง)', reporterEmail:'', reporterPos:'',
            place:'', mapUrl:'', activity:'', course:'', treat:'', assets:'', firstAid:'',
            confirmNote:'', investNote:'', meetPlace:'', capaNote:'', deputyNote:'',
            monitorNote:'', reviewNote:'', ackNote:'', closeNote:'',
            parts:[], involved:[], causes:[], capa:[], files:[], log:[] };
  MASK_KEEP.forEach(function (k) { m[k] = x[k]; });
  return m;
}

/* ============================================================
 *  4. ระดับความรุนแรงตามตารางระดับความรุนแรง
 * ============================================================ */
/* ทุกค่าที่ผู้ใช้กรอกต้องผ่านตัวนี้ก่อนเขียนลงชีต
   Google Sheets รับได้ 50,000 อักขระต่อเซลล์ ถ้าเกินจะเขียนไม่ผ่านทั้งแถว */
function txt_(v, max) {
  v = (v === undefined || v === null) ? '' : String(v);
  /* ต้องเป็น NFC เท่านั้น ห้ามใช้ NFKC เด็ดขาด
     NFKC แยก ำ (U+0E33) ออกเป็น ํ + า ทำให้ข้อความไทยที่บันทึกลงชีตเปลี่ยนรูป
     และทำให้ประเภทอุบัติการณ์ที่มีสระอำ (เช่น "การทำร้ายตนเอง...") เทียบกับรายการที่อนุญาตไม่ตรง
     ผู้ใช้จะส่งรายงานหมวดนั้นไม่ได้เลยโดยไม่มีคำอธิบายว่าผิดตรงไหน */
  try { v = v.normalize('NFC'); } catch (ignore) {}
  v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return v.length > (max || 2000) ? v.slice(0, max || 2000) : v;
}
/* ลิงก์แผนที่ต้องเป็น HTTPS และห้ามมี userinfo กัน javascript:/data: และ URL หลอกแบบ user@host */
function url_(v) {
  v = String(v || '').trim();
  return /^https:\/\/[^\s\/@]+(?:[\/:?#]|$)/i.test(v) && v.indexOf('@') < 0 && v.length <= 500 ? v : '';
}
function list_(v, max, len) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max || 20).map(function (x) {
    if (x && typeof x === 'object') {
      var o = {};
      Object.keys(x).slice(0, 12).forEach(function (k) {
        o[k] = (typeof x[k] === 'string') ? txt_(x[k], len || 500) : x[k];
      });
      return o;
    }
    return txt_(x, len || 500);
  });
}

function boundedInt_(v, min, max, field) {
  var n = Number(v);
  if (!isFinite(n) || Math.floor(n) !== n || n < min || n > max)
    throw apiError_('VALIDATION_FAILED', field + ' ต้องเป็นจำนวนเต็มระหว่าง ' + min + '–' + max);
  return n;
}
function nonNegativeNumber_(v, field, max) {
  if (v === '' || v === undefined || v === null) return 0;
  var n=Number(v);
  if (!isFinite(n) || n < 0 || n > max) throw apiError_('VALIDATION_FAILED',field+' ต้องเป็นตัวเลขตั้งแต่ 0 ถึง '+max);
  return n;
}
function validDate_(v, field) {
  v=String(v||'');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw apiError_('VALIDATION_FAILED',field+' ต้องอยู่ในรูปแบบ YYYY-MM-DD');
  var p=v.split('-').map(Number), d=new Date(Date.UTC(p[0],p[1]-1,p[2]));
  if (d.getUTCFullYear()!==p[0]||d.getUTCMonth()!==p[1]-1||d.getUTCDate()!==p[2]) throw apiError_('VALIDATION_FAILED',field+' ไม่ใช่วันที่ที่มีอยู่จริง');
  var year = Number(today_().slice(0,4));
  if (p[0] < 2000 || p[0] > year + 1) throw apiError_('VALIDATION_FAILED',field+' อยู่นอกช่วงปีที่ระบบรองรับ');
  return v;
}

var INCIDENT_CATEGORIES = [
  'การลื่น สะดุด หกล้ม หรือตกจากที่สูง','การชน กระแทก ถูกวัตถุตกใส่ หนีบ หรือบดทับ',
  'การถูกของมีคมบาด แทง หรือทิ่มตำ','อุบัติเหตุจากเครื่องจักร เครื่องมือ หรืออุปกรณ์',
  'การยก เคลื่อนย้าย หรือออกแรงเกินกำลัง','อุบัติเหตุจากการจราจรและการเดินทาง',
  'สารเคมีหรือวัตถุอันตรายหกรั่วไหล','การสัมผัสสารเคมีหรือวัตถุอันตราย',
  'การสัมผัสเชื้อโรค สารชีวภาพ หรือสิ่งติดเชื้อ','การสัมผัสรังสี หรือปัจจัยทางกายภาพที่เป็นอันตราย',
  'การขาดอากาศ หรือเหตุในพื้นที่อับอากาศ','อุบัติเหตุหรือเหตุขัดข้องจากระบบไฟฟ้า',
  'ระบบสาธารณูปโภคหรือระบบวิศวกรรมอาคารขัดข้อง','ส่วนประกอบของอาคารชำรุดหรือพังถล่ม',
  'ความเสียหายต่อทรัพย์สิน อุปกรณ์ หรือเครื่องมือ','เหตุที่ส่งผลกระทบต่อสิ่งแวดล้อม',
  'การทำร้ายตนเอง หรือภาวะวิกฤตทางจิตใจ','ความรุนแรง หรือการทำร้ายร่างกาย',
  'การคุกคาม หรือภัยต่อความปลอดภัยบุคคล','ภัยคุกคามทางไซเบอร์และความปลอดภัยข้อมูล',
  'ภัยธรรมชาติ','เหตุฉุกเฉินสาธารณะ','เพลิงไหม้ การระเบิด','อื่น ๆ (โปรดระบุรายละเอียด)'
];
function validCategory_(v) {
  v = txt_(v, 300).trim();
  return INCIDENT_CATEGORIES.indexOf(v) >= 0 || /^อื่น ๆ \(โปรดระบุรายละเอียด\):\s*\S.{0,199}$/.test(v);
}
function validateIncidentInput_(p) {
  if (!p || typeof p !== 'object') throw apiError_('VALIDATION_FAILED','ไม่พบข้อมูลรายงาน');
  var fields={};
  ['title','detail','place','date','time','mapUrl','activity','course','treat','assets','firstAid'].forEach(function(k){
    if(p[k]!==undefined&&typeof p[k]!=='string') fields[k]='ต้องเป็นข้อความ';
  });
  if (!String(p.title||'').trim()) fields.title='จำเป็นต้องระบุ';
  if (!String(p.detail||'').trim()) fields.detail='จำเป็นต้องระบุ';
  if (['acc','near'].indexOf(p.kind)<0) fields.kind='ต้องเป็น acc หรือ near';
  if (!Array.isArray(p.cats)||!p.cats.length||p.cats.length>24) fields.cats='ต้องเลือกอย่างน้อย 1 ประเภท และไม่เกิน 24 ประเภท';
  else if (p.cats.some(function(c){ return !validCategory_(c); })) fields.cats='มีประเภทอุบัติการณ์ที่ไม่อยู่ในรายการที่อนุญาต';
  if (!String(p.place||'').trim()) fields.place='จำเป็นต้องระบุ';
  if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.time))) fields.time='ต้องอยู่ในรูปแบบ HH:mm';
  if(p.anon!==undefined&&typeof p.anon!=='boolean') fields.anon='ต้องเป็น true หรือ false';
  ['parts','involved','files'].forEach(function(k){if(p[k]!==undefined&&!Array.isArray(p[k]))fields[k]='ต้องเป็นรายการ';});
  ['parts','involved'].forEach(function(k){if(Array.isArray(p[k])&&p[k].some(function(x){return typeof x!=='string';}))fields[k]='แต่ละรายการต้องเป็นข้อความ';});
  if (Object.keys(fields).length) throw apiError_('VALIDATION_FAILED','กรุณาตรวจสอบข้อมูลรายงาน',fields);
}

function damageBand_(b) { b = Number(b) || 0; return b <= 0 ? 1 : b <= 10000 ? 2 : b <= 100000 ? 3 : b <= 1000000 ? 4 : 5; }
function calcLevel_(inj, dmg) { return Math.max(Number(inj) || 1, Number(dmg) || 1); }

/* ============================================================
 *  5. API ที่หน้าจอเรียกใช้
 * ============================================================ */
/* การตั้งค่านี้ไม่ใช่ความลับและเปิดให้อ่านก่อนยืนยันตัวตนโดยตั้งใจ
   ใช้เฉพาะให้หน้า Login เลือกเส้นทางสำรองเมื่อ Session.getActiveUser() ไม่เปิดเผยอีเมล
   การอนุญาตจริงยังตรวจ ID token และโดเมนซ้ำใน currentEmail_ ทุกคำขอ */
/* Web App ติดตั้งแบบ Execute as: Me ทำให้ Effective user เป็นบัญชีที่ใช้ Deploy
   ส่วน Active user เป็นบัญชีที่กำลังเปิดหน้าเว็บ การเทียบต้องเกิดบนเซิร์ฟเวอร์ใน doGet()
   ก่อนสร้าง HTML เพื่อให้เปิด Dashboard อัตโนมัติเฉพาะบัญชีผู้ Deploy อย่างเคร่งครัด
   ค่านี้ควบคุมเพียงหน้าเริ่มต้น ไม่แทนการตรวจสิทธิ์จากทะเบียน Users */
/* ฟังก์ชันที่ไม่ลงท้ายด้วย _ ทุกตัวเรียกจากเบราว์เซอร์ผ่าน google.script.run ได้ ไม่ใช่เฉพาะจาก Editor
   Web App ตั้ง Execute as: Me จึงต้องกันไว้ด้วยการเทียบ Active user กับ Effective user
   ใช้ตัวนี้ตัวเดียวกับทุกฟังก์ชันที่ตั้งใจให้รันจาก Editor เท่านั้น */
function assertEditor_() {
  if (!isDeployEditor_())
    throw apiError_('FORBIDDEN', 'ฟังก์ชันนี้เรียกได้จาก Apps Script Editor ด้วยบัญชีเจ้าของสคริปต์เท่านั้น');
}
/* ฟังก์ชันวินิจฉัยที่อ่านอย่างเดียว — เจ้าของสคริปต์รันจาก Editor ได้ หรือผู้ดูแลระบบเรียกได้ */
function assertEditorOrAdmin_() {
  if (isDeployEditor_()) return;
  need_(me_(), 'admin');
}
function isDeployEditor_() {
  try {
    var active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    var effective = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
    return !!active && !!effective && active === effective;
  } catch (e) {
    return false;
  }
}

function getAuthConfig_() {
  return {
    oauthClientId:String(CONFIG.OAUTH_CLIENT_ID || '').trim(),
    allowedDomain:String(CONFIG.ALLOWED_DOMAIN || '').trim().toLowerCase(),
    appVersion:APP_VERSION,
    editorAutoStart:isDeployEditor_()
  };
}

/* ตรวจสาเหตุที่เข้าสู่ระบบไม่ได้ เรียกได้โดยยังไม่ต้องมีบัญชีในทะเบียน
   คืนเฉพาะข้อมูลที่จำเป็นต่อการแก้ปัญหาของผู้เรียกเอง ไม่มีรายชื่อผู้ใช้และไม่มีข้อมูลอุบัติการณ์
   ห้าม throw เด็ดขาด มิฉะนั้นหน้าจอจะว่างเปล่าเหมือนเดิมและวินิจฉัยอะไรไม่ได้เลย */
function diagnose_() {
  var steps = [];
  function step(name, ok, detail) {
    steps.push({ step:name, ok:!!ok, detail:String(detail === undefined || detail === null ? '' : detail) });
  }

  var email = '';
  try { email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); } catch (e1) { email = ''; }
  step('Session ระบุอีเมลผู้ใช้ได้', !!email, email ||
    'Session ไม่คืนอีเมล — ตรวจการ Deploy ให้เป็น Execute as: Me และ Who has access: Anyone within ' +
    CONFIG.ALLOWED_DOMAIN + ' (ถ้าตั้งเป็น Anyone อีเมลจะไม่ถูกส่งมา)');

  var domainPass = email ? domainOk_(email) : false;
  step('อยู่ในโดเมนที่อนุญาต', domainPass, !email ? 'ยังระบุอีเมลไม่ได้' :
    (domainPass ? 'ผ่าน (@' + CONFIG.ALLOWED_DOMAIN + ' และโดเมนย่อย)' :
      'บัญชี ' + email + ' ไม่อยู่ในโดเมน @' + CONFIG.ALLOWED_DOMAIN));

  var ssId = '';
  try { ssId = PropertiesService.getScriptProperties().getProperty('SS_ID') || ''; } catch (e2) {}
  /* ไม่แสดงรหัส Spreadsheet เพราะคำสั่งนี้เรียกได้ทุกบัญชีในโดเมนก่อนลงทะเบียน */
  step('ติดตั้งฐานข้อมูลแล้ว', !!ssId, ssId ? 'ติดตั้งแล้ว' :
    'ยังไม่มี SS_ID — ให้ผู้ดูแลเปิด Apps Script Editor แล้ว Run ฟังก์ชัน setupFromEditor หนึ่งครั้ง');

  var usersOk = false, usersDetail = '';
  try {
    var sh = sheet_('Users');
    usersOk = sh.getParent().getId() !== ssId;
    usersDetail = 'เปิดได้: ' + sh.getParent().getName() + ' · แท็บ ' + sh.getName() +
      ' (gid ' + sh.getSheetId() + ') · ' + Math.max(0, sh.getLastRow() - 1) + ' แถวข้อมูล' +
      (usersOk ? ' · แยกจากฐานข้อมูลหลักแล้ว' : ' · ผิดการตั้งค่า: ยังอยู่ไฟล์เดียวกับฐานข้อมูลหลัก');
  } catch (e3) { usersDetail = (e3 && e3.message) || String(e3); }
  step('ทะเบียนผู้ใช้แยกไฟล์และเปิดได้', usersOk, usersDetail);

  var found = null;
  if (email && usersOk) {
    try {
      found = readAll_('Users').filter(function (x) {
        return String(x.email || '').trim().toLowerCase() === email;
      })[0] || null;
    } catch (e4) {}
  }
  step('มีบัญชีในทะเบียน', !!found, found ? 'พบบัญชีของ ' + email :
    (email ? 'ยังไม่มีบัญชีนี้ในทะเบียน ระบบจะพาไปหน้าลงทะเบียน' : 'ยังระบุอีเมลไม่ได้'));

  if (found) {
    step('บัญชีเปิดใช้งานแล้ว', !!found.active, found.active ? 'บทบาท ' + found.role :
      (String(found.approvedAt || '').trim() ? 'บัญชีถูกระงับการใช้งาน'
        : 'รอผู้ดูแลระบบอนุมัติ — แก้คอลัมน์ active เป็น TRUE ในทะเบียนผู้ใช้'));
  }

  return { appVersion:APP_VERSION, serverTime:now_(),
           allowedDomain:String(CONFIG.ALLOWED_DOMAIN || ''),
           oauthClientIdSet:!!String(CONFIG.OAUTH_CLIENT_ID || '').trim(),
           ready:steps.every(function (s) { return s.ok; }), steps:steps };
}

/* ความครอบคลุมบทบาทรายคณะ — หน้าจอใช้ตอบเพียงสองคำถาม
     1) คณะของเรื่องนี้มีรองคณบดี (กำกับดูแล) หรือยัง — ถ้าไม่มี คณบดีตรวจสอบผลการติดตามแทนได้
     2) คณะของเรื่องนี้มี คปอ. หรือยัง — ใช้ขึ้นหมายเหตุบนหน้ารายละเอียดของเหตุระดับ 3 ขึ้นไป
   ทั้งสองจุดถามถึงเฉพาะ "คณะของเรื่องที่ผู้ใช้เปิดรายละเอียดได้จริง" เท่านั้น
   เดิมส่ง {คณะ, บทบาท} ของผู้ใช้ที่ใช้งานอยู่ทั้งมหาวิทยาลัยไปให้ทุกบัญชีตั้งแต่ตอนเข้าระบบ
   รวมถึงผู้รายงานและผู้ดูแลระดับคณะซึ่งถูกกันไม่ให้เห็นทะเบียนคณะอื่นอยู่แล้วที่อื่นทุกทาง
   จึงจำกัดตามขอบเขตเดียวกับที่ใช้กับตัวรายงาน และยุบรายการซ้ำเหลือคู่ (คณะ, บทบาท) ที่ไม่ซ้ำกัน */
function roleCoverageFor_(u) {
  var all = readAll_('Users').filter(function (x) { return x.active; });
  /* ขอบเขต all เปิดรายละเอียดได้ทุกคณะ จึงต้องรู้ความครอบคลุมของทุกคณะ
     ขอบเขตอื่นเปิดได้เฉพาะคณะตนเอง (แถวข้ามคณะของคณบดีเป็นแถวดูอย่างเดียว เปิดรายละเอียดไม่ได้) */
  var rows = (ROLES[u.role].scope === 'all') ? all
           : all.filter(function (x) { return sameFaculty_(x.faculty, u.faculty); });
  var seen = {}, out = [];
  rows.forEach(function (x) {
    var fac = String(x.faculty || '').trim();
    var k = fac + '\u001F' + x.role;
    if (seen[k]) return;
    seen[k] = 1;
    out.push({ faculty:fac, role:x.role });
  });
  return out;
}

function getBootstrap_() {
  var u = me_(true);
  if (!u.registered) return { user:u, incidents:[] };
  /* บัญชีที่ยังไม่ได้รับอนุมัติหรือถูกระงับ ต้องได้คำตอบที่หน้าจอแสดงผลได้ ไม่ใช่หน้าจอค้าง
     ส่งกลับเฉพาะข้อมูลที่ใช้แสดงสถานะ ไม่มีสิทธิ์ ไม่มีรายงาน */
  if (!u.active) {
    return { user:{ registered:true, active:false, pending:!!u.pending, role:'',
                    email:u.email, name:u.name, faculty:u.faculty, orgUnit:u.orgUnit },
             incidents:[], appVersion:APP_VERSION };
  }
  audit_(u, 'เข้าสู่ระบบ', '', '');
  var coverage = roleCoverageFor_(u);
  return { user:u, incidents:scoped_(u, readAll_('Incidents')), roleCoverage:coverage,
           syncedAt:now_(), appVersion:APP_VERSION };
}

function registerSelf_(p) {
  if (!p || typeof p !== 'object') throw apiError_('VALIDATION_FAILED','ข้อมูลลงทะเบียนไม่ถูกต้อง');
  ['name','position','unit','faculty','orgUnit'].forEach(function(k){
    if(p[k]!==undefined&&typeof p[k]!=='string') throw apiError_('VALIDATION_FAILED',k+' ต้องเป็นข้อความ');
  });
  var email = currentEmail_();
  var users = readAll_('Users');
  /* ลงทะเบียนแล้ว = ไม่เพิ่มแถวซ้ำ คืนผลแบบเดียวกับการลงทะเบียนสำเร็จ หน้าจอจึงเข้าระบบต่อได้ตามปกติ
     การตรวจนี้กันซ้ำได้จริงก็ต่อเมื่อคำขอก่อนหน้า flush แถวลงชีตก่อนปล่อย lock (ดู releaseLockFlushed_) */
  if (users.some(function (x) { return String(x.email || '').trim().toLowerCase() === email; }))
    return { pending:false, email:email, alreadyRegistered:true };
  /* ช่องว่างหัวท้ายเป็นสาเหตุที่พบบ่อยที่สุดที่ทำให้ชื่อคณะไม่ตรงกัน
     แล้วรายงานตกไปอยู่ในกลุ่มที่ไม่มีใครดูแล จึงตัดทิ้งตั้งแต่ตอนบันทึก */
  var fac = txt_(p.faculty || p.unit || '', 200).trim();
  var name = txt_(p.name, 150).trim(), org = txt_(p.orgUnit, 200).trim();
  if (!name || !fac || !org) throw apiError_('VALIDATION_FAILED','กรุณากรอกชื่อ คณะ/หน่วยงานหลัก และหน่วยงานในคณะให้ครบถ้วน',
    {name:name?'':'จำเป็นต้องระบุ',faculty:fac?'':'จำเป็นต้องระบุ',orgUnit:org?'':'จำเป็นต้องระบุ'});
  /* นโยบายการนำร่อง: เปิดลงทะเบียนเสรี บุคลากรในโดเมนที่อนุญาตเข้าใช้งานได้ทันทีในสิทธิ์ผู้รายงาน
     ไม่มีคิวรออนุมัติ เพราะการรอทำให้ผู้พบเหตุไม่รายงานตั้งแต่ต้น ซึ่งเสียหายกว่าการมีบัญชีเกิน
     ผู้ดูแลระบบยังปิดบัญชีย้อนหลังได้ที่หน้าจัดการผู้ใช้ (active = FALSE) และเลื่อนบทบาทให้ทีหลังได้
     หากภายหลังต้องการกลับไปใช้คิวอนุมัติ ให้เปลี่ยนเป็น active:false และ approvedAt:'' */
  var u = { email:String(email).trim().toLowerCase(),
            name:name,
            position:txt_(p.position, 150).trim(),
            faculty:fac, orgUnit:org, unit:fac,
            role:'reporter', active:true, createdAt:now_(), approvedAt:now_() };
  appendRow_('Users', u);
  CURRENT_AFTER_HASH = hashObject_(u);
  CURRENT_CHANGES = JSON.stringify({created:true,active:true,role:'reporter'});
  audit_(u, 'ลงทะเบียนผู้ใช้ใหม่', email, u.faculty + ' / ' + u.orgUnit);
  return { pending:false, email:email };
}

/* since = เวลาที่หน้าจอซิงก์ครั้งล่าสุด ('yyyy-MM-dd HH:mm')
   โหลดครั้งแรกส่งทั้งชุด รอบถัดไปส่งเฉพาะแถวที่เปลี่ยนหลังเวลานั้น
   ลดปริมาณข้อมูลที่ส่งและงานเรนเดอร์ฝั่งหน้าจออย่างมากเมื่อข้อมูลสะสมหลายพันเรื่อง
   หมายเหตุ: การอ่านชีตยังอ่านทั้งใบตามข้อจำกัดของ Sheets ถ้าปริมาณโตจนชนโควตา
   ให้ย้าย Repository ไป Cloud SQL/Firestore ตามที่ระบุไว้ใน ARCHITECTURE.md */
function refresh_(since) {
  var u = me_();
  var all  = scoped_(u, readAll_('Incidents'));
  var mark = String(since || '').trim();
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(mark)) {
    return { full:true, syncedAt:now_(), total:all.length, incidents:all };
  }
  var changed = all.filter(function (x) { return String(x.updatedAt || x.createdAt || '') >= mark; });
  return { full:false, syncedAt:now_(), total:all.length, incidents:changed };
}

/* เวลาที่แจ้งด้วยวาจา (รุ่น 2.8.45) รับ yyyy-MM-dd HH:mm หรือ yyyy-MM-ddTHH:mm · ว่าง = ยังไม่ได้แจ้ง
   ต้องไม่ก่อนวันที่เกิดเหตุ และไม่อยู่ในอนาคต */
function verbalStamp_(v, incidentDate) {
  var t = String(v == null ? '' : v).trim().replace('T', ' ');
  if (!t) return '';
  var m = t.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/);
  if (!m || +m[2] > 23 || +m[3] > 59) throw apiError_('VALIDATION_FAILED', 'รูปแบบเวลาที่แจ้งด้วยวาจาไม่ถูกต้อง', { verbalAt:'ต้องเป็นวันที่และเวลา' });
  validDate_(m[1], 'วันที่แจ้งด้วยวาจา');
  var out = m[1] + ' ' + m[2] + ':' + m[3];
  if (incidentDate && m[1] < String(incidentDate).slice(0, 10))
    throw apiError_('VALIDATION_FAILED', 'เวลาที่แจ้งด้วยวาจาต้องไม่ก่อนวันที่เกิดเหตุ', { verbalAt:'ก่อนวันที่เกิดเหตุ' });
  /* เผื่อนาฬิกาเครื่องผู้ใช้เดินเร็วกว่าเซิร์ฟเวอร์ได้ 10 นาที */
  var limit = Utilities.formatDate(new Date(Date.now() + 10 * 60000), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  if (out > limit) throw apiError_('VALIDATION_FAILED', 'เวลาที่แจ้งด้วยวาจาต้องไม่อยู่ในอนาคต', { verbalAt:'อยู่ในอนาคต' });
  return out;
}

function createIncident_(p) {
  var u = me_();
  need_(u, 'create');
  validateIncidentInput_(p);
  /* ผู้ใช้ทั้งมหาวิทยาลัยอาจกดบันทึกพร้อมกัน ต้องล็อกช่วงออกเลขที่และเขียนแถว */
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (e) { throw apiError_('LOCK_BUSY', 'ระบบกำลังบันทึกรายงานอื่นอยู่ กรุณากดบันทึกอีกครั้งใน 2-3 วินาที'); }
  try {

  var inj  = boundedInt_(p.injuryAxis, 1, 5, 'injuryAxis');
  var baht = nonNegativeNumber_(p.damageBaht, 'damageBaht', 1000000000000);
  var dmg  = damageBand_(baht);
  var L    = calcLevel_(inj, dmg);
  var date = validDate_(p.date || today_(), 'date');
  /* วันที่เกิดเหตุต้องไม่อยู่ในอนาคต validDate_ ยอมให้ถึงปีหน้าเพราะใช้ร่วมกับวันครบกำหนดมาตรการด้วย */
  if (date > today_()) throw apiError_('VALIDATION_FAILED', 'วันที่เกิดเหตุต้องไม่เกินวันนี้', {date:'อยู่ในอนาคต'});
  var id   = nextId_(date);
  var ts   = now_();

  var rec = {
    id:id, createdAt:ts, updatedAt:ts, status:'submitted', level:0, suggestLevel:L,
    title:txt_(p.title, 300).trim(), detail:txt_(p.detail, 5000).trim(), kind:p.kind === 'near' ? 'near' : 'acc',
    /* trim ทุกประเภทก่อนเก็บ ให้ค่าที่บันทึกตรงกับค่าที่ validCategory_ ตรวจผ่าน
       ไม่งั้นช่องว่างหัวท้ายหนึ่งตัวจะทำให้ isSensitive_ และการจับกลุ่มหมวดเทียบไม่ตรงตลอดไป */
    cats:list_(p.cats, 24, 300).map(function (c) { return String(c || '').trim(); }).filter(Boolean),
    date:date, time:txt_(p.time, 10), place:txt_(p.place, 300).trim(), mapUrl:url_(p.mapUrl),
    faculty:u.faculty, orgUnit:u.orgUnit,
    unit:u.faculty, subUnit:u.orgUnit,
    reporter:p.anon ? 'ผู้รายงาน (ไม่ระบุชื่อ)' : u.name,
    reporterEmail:u.email,                       // เก็บไว้เสมอเพื่อการตรวจสอบ แม้เลือกไม่ระบุชื่อ
    reporterPos:p.anon ? '' : (u.position || ''), anon:!!p.anon,
    activity:txt_(p.activity, 200), course:txt_(p.course, 300), involved:list_(p.involved, 4, 200),
    injuryAxis:inj, damageAxis:dmg, damageBaht:baht,
    parts:list_(p.parts, 10, 100), treat:txt_(p.treat, 1000), daysOff:nonNegativeNumber_(p.daysOff, 'daysOff', 36500),
    assets:txt_(p.assets, 1000), firstAid:txt_(p.firstAid, 1000),
    confirmNote:'', causes:[], investNote:'', meetDate:'', meetPlace:'', capa:[], monitor:'', capaNote:'', deputyNote:'', monitorNote:'', reviewNote:'', ackNote:'', ackAt:'', closeNote:'',
    /* แจ้งด้วยวาจา = เวลาที่ผู้รายงานระบุว่าแจ้งหัวหน้างานจริง (ว่าง = ยังไม่ได้แจ้ง ให้หัวหน้างานบันทึกตอนยืนยันข้อเท็จจริง)
       ลายลักษณ์อักษร = เวลาที่ส่งรายงานนี้ในระบบ (รุ่น 2.8.45 — เดิมใช้เวลาส่งรายงานทั้งสองช่อง) */
    verbalAt:verbalStamp_(p.verbalAt, date), writtenAt:ts, uniReportAt:'', files:[], version:1,
    log:[{ t:'บันทึกรายงานเข้าสู่ระบบ', by:rec_by_(u, p.anon), d:ts, hi:1 }]
  };

  rec.files = claimAttachments_(p.files || [], u, id, isSensitive_(rec.cats), rec);

  appendRow_('Incidents', rec);
  CURRENT_AFTER_HASH = hashObject_(rec);
  CURRENT_CHANGES = JSON.stringify({created:true,status:rec.status,version:rec.version});
  } finally { releaseLockFlushed_(lock); }
  audit_(u, 'สร้างรายงานอุบัติการณ์', id, 'ระดับที่คำนวณได้ ' + L);
  notify_(rec, u, L);
  return { id:id, level:L };
}

/* ย้ายไฟล์แนบของเรื่องอ่อนไหวเข้าโฟลเดอร์จำกัดสิทธิ์ และยกเลิกการแชร์ลิงก์ */
/* ตรวจ ownership ของไฟล์แนบก่อนผูกกับรายงาน ป้องกันการส่ง Drive fileId ปลอม */
function claimAttachments_(files, u, incidentId, sensitive, incident) {
  if (!Array.isArray(files)) throw apiError_('ATTACHMENT_REJECTED','รูปแบบรายการไฟล์ไม่ถูกต้อง');
  if (files.length > 5) throw apiError_('ATTACHMENT_REJECTED','แนบไฟล์ได้ไม่เกิน 5 ไฟล์ต่อรายงาน');
  var sh=sheet_('Attachments'), rows=sh.getDataRange().getValues(), head=rows[0], out=[], checked=[], seen={};
  files.forEach(function(ref){
    var aid=String(ref&&ref.attachmentId||''), token=String(ref&&ref.uploadToken||''), found=-1, rec={};
    if (seen[aid]) throw apiError_('ATTACHMENT_REJECTED','พบไฟล์แนบซ้ำในรายงานเดียวกัน');
    seen[aid]=1;
    for(var i=1;i<rows.length;i++) if(String(rows[i][head.indexOf('attachmentId')])===aid){found=i;head.forEach(function(h,j){rec[h]=rows[i][j];});break;}
    var stored=String(rec.uploadToken||''), tokenOk=stored===token||stored===hashToken_(token);
    if(found<1||!aid||!token||!tokenOk||String(rec.ownerEmail).toLowerCase()!==String(u.email).toLowerCase()||rec.status!=='pending')
      throw apiError_('ATTACHMENT_REJECTED','ไฟล์แนบไม่ถูกต้อง หมดอายุ หรือไม่ได้อัปโหลดโดยผู้ใช้ปัจจุบัน');
    if(fmtStamp_(rec.expiresAt)<now_()) throw apiError_('ATTACHMENT_REJECTED','ไฟล์แนบหมดอายุ กรุณาอัปโหลดใหม่');
    checked.push({found:found,rec:rec,file:DriveApp.getFileById(rec.driveFileId)});
  });
  /* ตรวจครบทุกไฟล์ก่อนเริ่มเปลี่ยนสถานะ ลดความเสี่ยงผูกสำเร็จเพียงบางรายการ */
  checked.forEach(function(x){
    var found=x.found, rec=x.rec, file=x.file, aid=String(rec.attachmentId);
    file.moveTo(attachBucket_(!!sensitive));
    applySharing_(file, !!sensitive, incident);
    rec.status='claimed';rec.incidentId=incidentId;rec.uploadToken='';
    /* ต้องเขียนผ่าน dehydrate_ เสมอ เพื่อให้ escFormula_ ทำงานซ้ำทุกครั้งที่เขียนแถว
       Google Sheets ไม่เก็บอัญประกาศเดี่ยวที่ escFormula_ เติมไว้ตอนเขียนครั้งแรก อ่านกลับมาจึงเป็นค่าดิบ
       การเขียนค่าดิบกลับลงไปตรง ๆ จึงเปลี่ยนชื่อไฟล์ที่ขึ้นต้นด้วย = + - @ ให้กลายเป็นสูตรที่ทำงานจริง */
    sh.getRange(found+1,1,1,head.length).setValues([dehydrate_(rec, head)]);
    out.push({attachmentId:aid,name:rec.name,url:file.getUrl(),id:rec.driveFileId,mime:rec.mimeType});
  });
  invalidate_('Attachments');
  return out;
}

function rec_by_(u, anon) { return anon ? 'ผู้รายงาน (ไม่ระบุชื่อ)' : u.name + ' (' + u.position + ')'; }

/* เลขลำดับในเลขที่รายงาน — อย่างน้อย 3 หลัก และห้ามตัดหลักที่เกินทิ้ง
   เดิมเขียนเป็น ('000'+n).slice(-3) ซึ่งพอถึงเรื่องที่ 1000 จะได้ '000'
   อ่านกลับมาเป็น 0 เลขที่สูงสุดจึงค้างที่ 999 และทุกเรื่องถัดจากนั้นได้เลขเดียวกันหมด
   updateIncident_ และ findScopedRaw_ ค้นด้วยเลขที่แล้วหยิบแถวแรกที่เจอ
   การแก้ไขเรื่องหนึ่งจึงไปเขียนทับอีกเรื่องหนึ่งเงียบ ๆ */
function padSeq_(n) {
  var s = String(Math.max(1, Math.floor(Number(n) || 1)));
  while (s.length < 3) s = '0' + s;
  return s;
}

function nextId_(date) {
  /* นับแยกตามปี พ.ศ. และอ้างอิงเลขที่สูงสุดที่มีอยู่จริง
     ไม่ใช้จำนวนแถว เพราะถ้ามีการลบแถวออกจะได้เลขซ้ำและทับข้อมูลเดิม */
  var be = Number(String(date).slice(0, 4)) + 543;
  var pre = 'IR-' + be + '-';
  var sh  = sheet_('Incidents');
  var max = 0;
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (row) {
      var v = String(row[0] || '');
      if (v.indexOf(pre) === 0) max = Math.max(max, Number(v.slice(pre.length)) || 0);
    });
  }
  return pre + padSeq_(max + 1);
}

/* เรื่องที่ยกเลิกแล้วต้องหยุดนิ่ง ห้ามเดินสถานะหรือแก้ไขข้อมูลใด ๆ ต่อ */
function notCancelled_(r) {
  if (r.status === CANCELLED) {
    throw apiError_('CONFLICT', 'เรื่องนี้ถูกยกเลิกแล้วเมื่อ ' + (r.cancelledAt || '-') + ' จึงดำเนินการต่อไม่ได้');
  }
  return r;
}

function assessIncident_(id, inj, baht, dmg, daysOff, note) {
  var u = me_();
  need_(u, 'assess');
  var r = findScoped_(u, id);
  notCancelled_(r);
  /* ประเมินครั้งแรก: หลังยืนยันข้อเท็จจริง (สถานะเดินเป็น assessed)
     แก้ผลการประเมิน: ทุกขั้นหลังประเมินแล้วจนก่อนปิดเรื่อง สถานะไม่ขยับ ต้องระบุเหตุผล
     เดิมแก้ได้ครั้งเดียว ผู้บาดเจ็บที่ภายหลังต้องหยุดงานนานขึ้นหรือความเสียหายสูงกว่าที่ประเมินไว้
     จึงค้างเป็นระดับและวันหยุดงานเดิมตลอดไป ดัชนี ISR และการรายงานมหาวิทยาลัยผิดตามไปด้วย */
  var first = NEXT_STATUS[r.status] === 'assessed';
  var reassess = !first && r.status !== 'closed' &&
    STATUS_ORDER.indexOf(r.status) >= STATUS_ORDER.indexOf('assessed');
  if (!first && !reassess)
    throw apiError_('CONFLICT', r.status === 'closed'
      ? 'เรื่องนี้ปิดแล้ว จึงแก้ผลการประเมินไม่ได้'
      : 'ประเมินระดับได้หลังหัวหน้างานยืนยันข้อเท็จจริงแล้วเท่านั้น');
  if (reassess) note = requiredNote_(note, 'note', 1000);
  var before = { level:r.level, suggestLevel:r.suggestLevel, injuryAxis:r.injuryAxis, damageAxis:r.damageAxis, damageBaht:r.damageBaht, daysOff:r.daysOff };
  /* ผู้ประเมินเลือกระดับความเสียหายเอง ถ้าไม่ส่งมาจึงคำนวณจากจำนวนเงิน */
  dmg = boundedInt_(dmg || damageBand_(baht), 1, 5, 'damageAxis');
  r.injuryAxis = boundedInt_(inj, 1, 5, 'injuryAxis');
  r.damageBaht = nonNegativeNumber_(baht, 'damageBaht', 1000000000000);
  /* จำนวนวันหยุดงานเดิมเขียนได้ครั้งเดียวตอนสร้างเรื่อง ทั้งที่ผู้รายงานยังไม่รู้ว่าจะหยุดกี่วัน
     มักกรอก 0 ไว้ก่อน แล้วไม่มีบทบาทใดแก้ได้อีกเลย ค่า ISR ซึ่งใช้วันหยุดงานเป็นตัวตั้ง
     จึงต่ำกว่าความจริงอย่างเป็นระบบ ในเคสรุนแรงที่ดัชนีตัวนี้มีไว้วัดพอดี
     ให้ผู้ประเมินแก้ได้ในขั้นประเมินระดับ ซึ่งเป็นขั้นที่ตรวจข้อเท็จจริงกับตารางความรุนแรงอยู่แล้ว */
  if (daysOff !== undefined && daysOff !== null && daysOff !== '')
    r.daysOff = nonNegativeNumber_(daysOff, 'daysOff', 36500);
  r.damageAxis = dmg;
  r.level = calcLevel_(r.injuryAxis, dmg);
  r.suggestLevel = r.level;
  if (first) {
    r.status = 'assessed';
    r.log.push({ t:'ประเมินระดับความรุนแรงเป็นระดับ ' + r.level + '', by:u.name + ' (' + u.position + ')', d:now_(), hi:1 });
    updateIncident_(r);
    audit_(u, 'ประเมินระดับความรุนแรง', id, 'ระดับ ' + r.level);
    /* ตอนสร้างรายงานแจ้งตามระดับที่ระบบเสนอไปแล้ว ถ้าผลประเมินไม่สูงกว่าเดิม ผู้รับชุดเดิมจะได้อีเมลซ้ำโดยไม่มีข้อมูลใหม่
       แจ้งเฉพาะเมื่อระดับที่ประเมินสูงกว่าระดับที่เสนอ เช่น 2 → 3 (ผู้รับระดับมหาวิทยาลัยเพิ่งเข้าเกณฑ์) หรือ 3 → 4 (ถึงอธิการบดี) */
    if (r.level > (Number(before.suggestLevel) || 0)) notify_(r, u, r.level);
    return { level:r.level };
  }
  var diff = [];
  if (before.level !== r.level) diff.push('ระดับ ' + before.level + ' → ' + r.level);
  if (before.injuryAxis !== r.injuryAxis) diff.push('เกณฑ์ร่างกาย ' + before.injuryAxis + ' → ' + r.injuryAxis);
  if (before.damageAxis !== r.damageAxis || before.damageBaht !== r.damageBaht)
    diff.push('ความเสียหาย ' + before.damageBaht + ' บาท (ระดับ ' + before.damageAxis + ') → ' + r.damageBaht + ' บาท (ระดับ ' + r.damageAxis + ')');
  if (before.daysOff !== r.daysOff) diff.push('วันหยุดงาน ' + before.daysOff + ' → ' + r.daysOff + ' วัน');
  if (!diff.length) throw apiError_('VALIDATION_FAILED', 'ไม่มีข้อมูลการประเมินที่เปลี่ยนแปลง');
  r.log.push({ t:'แก้ผลการประเมิน: ' + diff.join(' · ') + ' · เหตุผล: ' + note,
               by:u.name + ' (' + u.position + ')', d:now_(), hi:1 });
  updateIncident_(r);
  audit_(u, 'แก้ผลการประเมินระดับความรุนแรง', id, diff.join(' · ') + ' · เหตุผล ' + note.length + ' อักขระ');
  /* แจ้งเตือนซ้ำเฉพาะเมื่อระดับสูงขึ้นจนถึงเกณฑ์แจ้งเตือน ผู้รับกลุ่มใหม่ (เช่น มหาวิทยาลัย) จะได้รู้ทันที */
  if (r.level > before.level) notify_(r, u, r.level);
  return { level:r.level, previousLevel:before.level, changed:diff, reassessed:true };
}

function requiredNote_(v, field, max) {
  v=txt_(v,max).trim();
  if(!v) throw apiError_('VALIDATION_FAILED','กรุณากรอกข้อมูลให้ครบถ้วน',(function(){var o={};o[field]='จำเป็นต้องระบุ';return o;})());
  return v;
}
function normalizeCapa_(rows) {
  if(!Array.isArray(rows)||!rows.length||rows.length>30)
    throw apiError_('VALIDATION_FAILED','กรุณาระบุมาตรการอย่างน้อย 1 รายการ และไม่เกิน 30 รายการ',{capa:'รายการไม่ถูกต้อง'});
  return rows.map(function(x,i){
    if(!x||typeof x!=='object'||Array.isArray(x)) throw apiError_('VALIDATION_FAILED','มาตรการลำดับที่ '+(i+1)+' ไม่ถูกต้อง');
    var m=requiredNote_(x.m,'capa',1000), who=requiredNote_(x.who,'capa',300), due=validDate_(x.due,'วันครบกำหนดมาตรการ');
    var done=!!x.done, doneAt='';
    if(done) doneAt=validDate_(x.doneAt||today_(),'วันที่ดำเนินการแล้วเสร็จ');
    return {m:m,who:who,due:due,done:done,doneAt:doneAt};
  });
}

function advanceStatus_(id, to, payload) {
  var u = me_();
  if (STATUS_ORDER.indexOf(to) < 0) throw apiError_('VALIDATION_FAILED', 'สถานะไม่ถูกต้อง');
  if (to === 'assessed') throw apiError_('VALIDATION_FAILED','ขั้นประเมินระดับต้องใช้คำสั่งประเมินความรุนแรงโดยเฉพาะ');
  /* ทุกขั้นที่เดินได้ต้องมีสิทธิ์กำกับไว้ ขั้นที่ตกหล่นจากตารางนี้จะกลายเป็นขั้นที่ "ใครก็เดินได้"
     เดิม assessed ไม่อยู่ในตาราง ผู้รายงานจึงดันเรื่องของตนจาก confirmed ไป assessed ได้เองโดยไม่มีการประเมินระดับ
     Tests.gs ล็อกไว้แล้วว่าทุกสถานะใน STATUS_ORDER (ยกเว้น submitted ซึ่งเป็นขั้นเริ่มต้น) ต้องมีสิทธิ์กำกับ */
  var capNeeded = STATUS_CAP[to];
  if (capNeeded) need_(u, capNeeded);

  var r = notCancelled_(findScoped_(u, id));
  var p = payload || {};

  /* บังคับลำดับขั้นที่เซิร์ฟเวอร์ด้วย ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ
     กันการข้ามขั้น เช่น ปิดเรื่องโดยยังไม่ผ่านการตรวจสอบและการรับทราบ

     ข้อยกเว้นเดียวคือขั้นติดตามมาตรการ ซึ่งบันทึกซ้ำได้ไม่จำกัดโดยสถานะไม่ขยับ
     เหตุผล: มาตรการแก้ไขเป็นแผนที่ทยอยเสร็จคนละวัน (ระยะสั้น/ระยะยาว) การติดตามจึงเป็น
     กิจกรรมที่เกิดซ้ำตามธรรมชาติ ไม่ใช่เหตุการณ์ครั้งเดียว
     ก่อนรุ่น 2.7.1 ขั้นนี้เข้าได้จาก 'capa' เท่านั้น พอบันทึกรอบแรกแล้วสถานะกลายเป็น 'monitoring'
     หน้าจอติ๊กมาตรการก็เปิดไม่ได้อีกเลย มาตรการที่ยังไม่เสร็จในวันนั้นจึงค้างเป็น done=false ตลอดไป
     แล้วชนด่าน "ต้องดำเนินมาตรการให้ครบ" ทั้งขั้นตรวจสอบและขั้นปิดเรื่อง = เรื่องปิดไม่ได้ถาวร
     ทางออกเดียวที่เหลือคือยกเลิกรายงาน (หลุดจากสถิติ) หรือแก้ JSON ในชีตด้วยมือ */
  /* ขั้นกำหนดมาตรการก็บันทึกซ้ำได้ด้วยเหตุผลเดียวกัน — พิมพ์ชื่อผู้รับผิดชอบผิด หรือใส่ปีผิด
     แล้วกดบันทึกไปแล้ว เดิมแก้ไม่ได้เลยเพราะปุ่มขึ้นเฉพาะตอนสถานะเป็น investigating
     มาตรการที่กำหนดวันครบกำหนดผิดจะค้างเป็น "เกินกำหนด" ในทุกหน้าจอไปตลอด
     อนุญาตเฉพาะตอนที่ยังอยู่ขั้น capa เท่านั้น เพราะเมื่อเริ่มติดตามแล้วมีสถานะ done ผูกอยู่กับแต่ละข้อ */
  var repeatMonitor = (to === 'monitoring' && r.status === 'monitoring');
  var repeatCapa    = (to === 'capa'       && r.status === 'capa');
  if (!repeatMonitor && !repeatCapa && NEXT_STATUS[r.status] !== to) {
    throw apiError_('CONFLICT', 'ลำดับขั้นไม่ถูกต้อง เรื่องนี้อยู่ในขั้น "' + (STATUS_LABEL[r.status] || r.status) +
      '" ขั้นถัดไปคือ "' + (STATUS_LABEL[NEXT_STATUS[r.status]] || 'ไม่มี — เรื่องปิดแล้ว') + '"');
  }
  /* คณบดีตรวจสอบผลการติดตามแทนได้เฉพาะคณะที่ยังไม่ได้กำหนดรองคณบดี (กำกับดูแล) */
  if (to === 'reviewed' && u.role === 'dean') { assertDeanMayReview_(u, r); p.reviewBySub = 1; }
  /* ตรวจข้อมูลบังคับตามขั้นที่เซิร์ฟเวอร์ แม้ผู้เรียกข้ามหน้าจอหรือแก้ request เอง */
  if(to==='investigating') {
    p.meetDate=validDate_(p.meetDate,'วันที่ประชุมสอบสวน');
    if(!Array.isArray(p.causes)||!p.causes.length||p.causes.length>10)
      throw apiError_('VALIDATION_FAILED','กรุณาระบุสาเหตุการเกิดอย่างน้อย 1 ข้อ และไม่เกิน 10 ข้อ',{causes:'รายการไม่ถูกต้อง'});
    p.causes=p.causes.map(function(x){return requiredNote_(x,'causes',300);});
  }
  /* มาตรการแก้ไขถูกเขียนทับได้เฉพาะสองขั้นที่ตรวจด้วย normalizeCapa_ เท่านั้น
     เดิม p.capa ถูกเขียนลงระเบียนในทุกขั้น (ดูบรรทัด r.capa = list_(p.capa,...) ด้านล่าง)
     โดย list_ ตัดความยาวสตริงให้อย่างเดียว ไม่ตรวจวันที่และไม่ตรวจ done
     ผู้ที่มีสิทธิ์ ack จึงส่ง capa ที่ done:true ทั้งชุดแนบไปกับขั้น "รับทราบ" แล้วปิดเรื่อง
     ในคำสั่งถัดไปได้ ข้ามกฎ "ต้องดำเนินมาตรการให้ครบ" ทั้งข้อ โดยบันทึกร่องรอยไม่ได้บอกว่าใครแก้ */
  if(to!=='capa'&&to!=='monitoring'&&p.capa!==undefined)
    throw apiError_('VALIDATION_FAILED','แก้ไขมาตรการแก้ไขและป้องกันได้เฉพาะขั้นกำหนดมาตรการและขั้นติดตามมาตรการเท่านั้น');
  /* ปัญหาเดียวกันกับ p.capa แต่เกิดกับช่องบันทึกของแต่ละขั้น
     ทุกช่องอยู่ใน TRANSITION_FIELDS จึงผ่านด่านรูปร่าง payload ได้หมด แล้วถูกเขียนลงระเบียน
     โดยไม่ดูว่ากำลังเดินขั้นไหน หัวหน้างานที่มีแค่สิทธิ์ยืนยันข้อเท็จจริงจึงแนบ ackNote, closeNote
     และ reviewNote ไปกับขั้น confirmed ได้ เรื่องจะแสดงความเห็นของคณบดีที่คณบดีไม่เคยเขียน
     ผูกแต่ละช่องไว้กับขั้นของตัวเองที่นี่จุดเดียว ช่องที่ส่งมาผิดขั้นถูกปฏิเสธทันที */
  var STEP_FIELDS = {
    confirmed:['confirmNote','verbalAt'],
    investigating:['meetDate','meetPlace','causes','investNote'],
    capa:['capa'],
    monitoring:['capa','monitorNote'],
    reviewed:['reviewNote','reviewBySub'],
    acknowledged:['ackNote'],
    closed:['closeNote']
  };
  (function () {
    var allow = STEP_FIELDS[to] || [];
    var extra = Object.keys(p).filter(function (k) { return allow.indexOf(k) < 0; });
    if (extra.length) throw apiError_('VALIDATION_FAILED',
      'ขั้น "' + (STATUS_LABEL[to] || to) + '" ไม่รับข้อมูลช่องนี้: ' + extra.join(', '));
  })();
  if(to==='capa') {
    /* สถานะแล้วเสร็จไม่ได้มาจากหน้าจอในขั้นนี้ เซิร์ฟเวอร์ตัดสินเอง:
       มาตรการเดิมที่เนื้อหา ผู้รับผิดชอบ และกำหนดเสร็จไม่เปลี่ยน คงสถานะแล้วเสร็จเดิมไว้
       เดิมรับค่า done จากหน้าจอ ซึ่งหน้าจอไม่ได้ส่งมา เรื่องที่ถูกส่งกลับมาทบทวนมาตรการ
       จึงถูกล้างสถานะแล้วเสร็จทุกข้อทันทีที่กดบันทึก ต้องติ๊กใหม่ทั้งหมดทั้งที่ทำเสร็จไปแล้ว
       ส่วนมาตรการใหม่หรือที่แก้เนื้อหาเริ่มที่ยังไม่เสร็จเสมอ กันการกำหนดมาตรการที่ "เสร็จแล้ว" โดยไม่ผ่านการติดตาม */
    var prevDone = {};
    (Array.isArray(r.capa) ? r.capa : []).forEach(function(x){
      if(x&&x.done) prevDone[JSON.stringify([String(x.m||''),String(x.who||''),String(x.due||'')])]=String(x.doneAt||'');
    });
    p.capa=normalizeCapa_(p.capa).map(function(x){
      var k=JSON.stringify([x.m,x.who,x.due]), was=Object.prototype.hasOwnProperty.call(prevDone,k);
      x.done=was; x.doneAt=was?prevDone[k]:'';
      if(was) delete prevDone[k];
      return x;
    });
  }
  var undone = [], redated = [];
  if(to==='monitoring') {
    p.monitorNote=requiredNote_(p.monitorNote,'monitorNote',2000);
    /* รุ่น 2.8.33 — เนื้อหามาตรการ (m/who/due) ใช้ค่าที่เก็บไว้ในชีตเสมอ รับจากหน้าจอเฉพาะ done และ doneAt
       เดิมตรวจ due ด้วย validDate_ มาตรการเก่าที่กำหนดเสร็จเป็นข้อความ (เช่น "พ.ค. 2569 (ประมาณการ)") หรือเว้นว่าง
       จึงบันทึกผลการติดตามไม่ได้เลย และผู้ติดตามระบุวันที่แล้วเสร็จจริงเองไม่ได้ (ระบบใส่วันที่กดบันทึกให้) */
    if(!Array.isArray(p.capa)||!Array.isArray(r.capa)||p.capa.length!==r.capa.length)
      throw apiError_('VALIDATION_FAILED','รายการติดตามต้องตรงกับมาตรการที่กำหนดไว้');
    var same=function(a,b){return String(a==null?'':a).trim()===String(b==null?'':b).trim();};
    var monitored=p.capa.map(function(x,i){
      var base=r.capa[i]||{};
      if(!x||typeof x!=='object'||!same(x.m,base.m)||!same(x.who,base.who)||!same(x.due,base.due))
        throw apiError_('VALIDATION_FAILED','ห้ามแก้ไขเนื้อหามาตรการในขั้นติดตาม กรุณากลับไปแก้ในขั้นกำหนดมาตรการ');
      var done=!!x.done, doneAt='';
      if(done){
        var given=String(x.doneAt||'').trim();
        doneAt=given?validDate_(given,'วันที่ดำเนินการแล้วเสร็จของ "'+base.m+'"'):(base.done&&base.doneAt?String(base.doneAt):today_());
        if(doneAt>today_()) throw apiError_('VALIDATION_FAILED','วันที่ดำเนินการแล้วเสร็จของ "'+base.m+'" ต้องไม่เกินวันนี้');
        if(r.date&&doneAt<String(r.date)) throw apiError_('VALIDATION_FAILED','วันที่ดำเนินการแล้วเสร็จของ "'+base.m+'" ต้องไม่ก่อนวันเกิดเหตุ');
        if(base.done&&base.doneAt&&String(base.doneAt)!==doneAt) redated.push(base.m);
      }
      /* ยกเลิกสถานะแล้วเสร็จได้ (กรณีติ๊กผิดหรือมาตรการกลับมาใช้ไม่ได้) แต่ต้องปรากฏในไทม์ไลน์และ Audit เสมอ */
      if(!done&&base.done) undone.push(base.m);
      return {m:String(base.m||''),who:String(base.who||''),due:String(base.due||''),done:done,doneAt:doneAt};
    });
    p.capa=monitored;
  }
  if(to==='reviewed') {
    p.reviewNote=requiredNote_(p.reviewNote,'reviewNote',2000);
    if(!Array.isArray(r.capa)||!r.capa.length||r.capa.some(function(x){return !x.done;}))
      throw apiError_('CONFLICT','ต้องดำเนินมาตรการให้ครบก่อนส่งตรวจสอบผลการติดตาม');
  }
  /* ความเห็นของคณบดีเป็นช่องไม่บังคับ ตรงกับป้าย "(ถ้ามี)" บนหน้าจอ
     เดิมเซิร์ฟเวอร์บังคับด้วย requiredNote_ คณบดีที่ติ๊กรับทราบแล้วไม่พิมพ์อะไรจึงถูกปฏิเสธ
     ด้วยข้อความกลาง "กรุณากรอกข้อมูลให้ครบถ้วน" โดยไม่มีช่องไหนบนจอขึ้นว่าจำเป็น
     การรับทราบคือการกระทำ ซึ่งบันทึกไว้ที่ ackAt อยู่แล้ว ไม่จำเป็นต้องมีข้อความกำกับ */
  if(to==='acknowledged') p.ackNote=txt_(p.ackNote,2000).trim();
  if(to==='closed') {
    p.closeNote=requiredNote_(p.closeNote,'closeNote',2000);
    if(!Array.isArray(r.capa)||!r.capa.length||r.capa.some(function(x){return !x.done;}))
      throw apiError_('CONFLICT','ยังมีมาตรการที่ไม่แล้วเสร็จ จึงยังปิดเรื่องไม่ได้');
    /* ตารางระดับความรุนแรงกำหนดให้เหตุระดับ 3 ขึ้นไปต้องรายงานมหาวิทยาลัย เดิมปิดเรื่องได้แม้ยังไม่มีการบันทึก
       เรื่องจึงหลุดออกจากรายการค้างทั้งที่ขั้นตอนบังคับยังไม่ครบ */
    if(SEV_UNI[r.level]&&!r.uniReportAt)
      throw apiError_('CONFLICT','เหตุระดับ '+r.level+' ต้องให้คณบดี / ผู้อำนวยการกอง บันทึกการรายงาน'+SEV_UNI[r.level]+' ก่อน จึงจะปิดเรื่องได้');
  }
  /* ข้อความบันทึกไทม์ไลน์ ต้องมีครบทุกขั้น มิฉะนั้นชีตจะเก็บค่าว่าง */
  var nCapa = Array.isArray(p.capa) && p.capa.length ? p.capa
            : (Array.isArray(r.capa) ? r.capa : []);
  /* นับรอบการติดตามจากประวัติที่บันทึกไว้ ไม่ใช่จากสถานะ เพราะสถานะไม่ขยับเมื่อบันทึกซ้ำ */
  var monitorRound = (to === 'monitoring')
    ? (Array.isArray(r.monitorLog) ? r.monitorLog.length : 0) + 1 : 0;
  var msg = {
    confirmed    :'หัวหน้างานยืนยันข้อเท็จจริงของเหตุการณ์' + (p.confirmNote ? ' · ' + p.confirmNote : ''),
    investigating:'ประชุมสอบสวนอุบัติการณ์และวิเคราะห์สาเหตุ' + (p.investNote ? ' · ' + p.investNote : ''),
    capa         :(repeatCapa ? 'แก้ไขมาตรการแก้ไขและป้องกัน เป็น ' : 'กำหนดมาตรการแก้ไขและป้องกันไม่ให้เกิดซ้ำ ') + nCapa.length + ' รายการ',
    monitoring   :'ติดตามผลการดำเนินมาตรการ ครั้งที่ ' + monitorRound + ' — เสร็จแล้ว ' +
                  nCapa.filter(function (c) { return c.done; }).length + ' จาก ' + nCapa.length + ' รายการ' +
                  (undone.length ? ' · ยกเลิกสถานะแล้วเสร็จ: ' + undone.join(', ') : '') +
                  (redated.length ? ' · แก้วันที่แล้วเสร็จ: ' + redated.join(', ') : '') +
                  (p.monitorNote ? ' · ' + p.monitorNote : ''),
    reviewed     :(u.role === 'dean'
                    ? 'คณบดี / ผู้อำนวยการกอง ตรวจสอบผลการติดตามมาตรการแทนรองคณบดี (กำกับดูแล)'
                    : 'รองคณบดี (กำกับดูแล) ตรวจสอบผลการติดตามมาตรการแล้ว') +
                  (p.reviewNote ? ' · ' + p.reviewNote : ''),
    acknowledged :'คณบดี / ผู้อำนวยการกอง รับทราบผลการดำเนินการและมาตรการแก้ไขแล้ว' +
                  (p.ackNote ? ' · ' + p.ackNote : ''),
    closed       :'ปิดเรื่อง — ' + (p.closeNote || 'ดำเนินการเสร็จเรียบร้อยตามมาตรการที่กำหนด')
  }[to] || ('เปลี่ยนสถานะเป็น ' + (STATUS_LABEL[to] || to));

  r.status = to;
  if (p.meetDate)  r.meetDate  = validDate_(p.meetDate, 'วันที่ประชุมสอบสวน');
  if (p.meetPlace) r.meetPlace = txt_(p.meetPlace, 300);
  if (Array.isArray(p.causes) && p.causes.length) r.causes = list_(p.causes, 10, 300);
  if (Array.isArray(p.capa) && p.capa.length) r.capa = list_(p.capa, 30, 1000);   // แก้ไขมาตรการซ้ำได้
  if (p.investNote !== undefined && p.investNote !== '') r.investNote = txt_(p.investNote, 5000);
  if (p.confirmNote) r.confirmNote = txt_(p.confirmNote, 2000);
  /* หัวหน้างานบันทึก/แก้เวลาที่รับแจ้งด้วยวาจาได้ตอนยืนยันข้อเท็จจริง (รุ่น 2.8.45) — ส่งค่าว่างมา = คงค่าเดิม */
  if (p.verbalAt) r.verbalAt = verbalStamp_(p.verbalAt, r.date);
  if (p.monitorNote) r.monitorNote = txt_(p.monitorNote, 2000);
  if (p.closeNote)   r.closeNote   = txt_(p.closeNote, 2000);
  if (p.ackNote)     r.ackNote     = txt_(p.ackNote, 2000);
  if (p.reviewNote) r.reviewNote = txt_(p.reviewNote, 2000);
  if (to === 'acknowledged') r.ackAt = now_();
  if (to === 'investigating' && !r.meetDate) { r.meetDate = today_(); r.meetPlace = r.meetPlace || 'ห้องประชุมสำนักงานเลขานุการคณะ'; }
  if (to === 'monitoring') {
    r.monitor = 'inprogress';
    /* เก็บผลการติดตามทุกรอบไว้เป็นประวัติ ไม่ให้รอบใหม่ลบรอบก่อนหน้าทิ้ง
       ผู้ตรวจสอบต้องเห็นว่ามาตรการแต่ละข้อทยอยเสร็จเมื่อไร ไม่ใช่เห็นเฉพาะข้อความรอบล่าสุด */
    if (!Array.isArray(r.monitorLog)) r.monitorLog = [];
    r.monitorLog.push({ n:monitorRound, d:now_(), by:u.name + ' (' + u.position + ')',
                        note:txt_(p.monitorNote, 2000),
                        done:nCapa.filter(function (c) { return c.done; }).length,
                        total:nCapa.length });
    /* กันเซลล์เดียวโตจนชนเพดานอักขระของ Google Sheets ถ้ามีการติดตามถี่มากเป็นปี */
    if (r.monitorLog.length > 60) r.monitorLog = r.monitorLog.slice(-60);
  }
  if (to === 'closed')     r.monitor = 'done';
  r.log.push({ t:msg, by:u.name + ' (' + u.position + ')', d:now_(), hi:to === 'closed' ? 1 : 0 });
  updateIncident_(r);
  audit_(u, repeatMonitor ? 'บันทึกผลการติดตามมาตรการเพิ่มเติม'
          : repeatCapa ? 'แก้ไขมาตรการแก้ไขและป้องกัน' : 'เปลี่ยนสถานะเป็น ' + to, id,
    to === 'monitoring' ? 'ครั้งที่ ' + monitorRound + (undone.length ? ' · ยกเลิกสถานะแล้วเสร็จ ' + undone.length + ' รายการ' : '') :
    /* reviewBySub ไม่มีคอลัมน์ในชีต การทำแทนจึงบันทึกไว้ที่ไทม์ไลน์ (ข้อความขั้น reviewed) และที่นี่
       ค่าที่หน้าจอส่งมาไม่มีผล เซิร์ฟเวอร์ตัดสินเองจากบทบาทผู้กดเท่านั้น */
    (to === 'reviewed' && u.role === 'dean') ? 'คณบดี / ผู้อำนวยการกอง ตรวจสอบแทนรองคณบดี (กำกับดูแล)' : '');
  return { status:to };
}

/* ข้อเสนอแนะของคณะกรรมการสอบสวน บันทึกได้เมื่อกำหนดมาตรการแล้วเท่านั้น */
function addSuggestion_(id, note, kind) {
  var u = me_();
  var field = (kind === 'deputy') ? 'deputyNote' : 'capaNote';
  need_(u, kind === 'deputy' ? 'suggestSup' : 'suggest');
  var r = findScoped_(u, id);
  notCancelled_(r);
  if (r.status === 'closed') throw apiError_('CONFLICT','เรื่องนี้ปิดแล้ว ไม่สามารถเพิ่มหรือแก้ไขข้อเสนอแนะได้');
  if (!r.capa.length) throw apiError_('CONFLICT', 'กรุณาบันทึกมาตรการแก้ไขและป้องกันก่อน จึงจะบันทึกข้อเสนอแนะได้');
  note = String(note || '').trim();
  if (!note) throw apiError_('VALIDATION_FAILED', 'กรุณากรอกข้อเสนอแนะหรือข้อคิดเห็น', {note:'จำเป็นต้องระบุ'});
  var label = (field === 'deputyNote')
    ? 'ข้อเสนอแนะและข้อคิดเห็นของรองคณบดี (กำกับดูแล)'
    : 'ข้อเสนอแนะและข้อคิดเห็นของหัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมาย';
  var edited = !!r[field];
  r[field] = note;
  r.log.push({ t:(edited ? 'แก้ไข' : 'บันทึก') + label + ' · ' + note,
               by:u.name + ' (' + u.position + ')', d:now_(), hi:0 });
  updateIncident_(r);
  audit_(u, 'บันทึกข้อเสนอแนะ', id, (edited ? 'แก้ไข' : 'บันทึก') + 'ข้อความ ' + note.length + ' อักขระ');
  return { field:field, note:note };
}

function reportToUniversity_(id) {
  var u = me_();
  need_(u, 'uniReport');
  var r = findScoped_(u, id);
  notCancelled_(r);
  if (!SEV_UNI[r.level]) throw apiError_('CONFLICT', 'ระดับนี้ยังไม่เข้าเกณฑ์ต้องรายงานมหาวิทยาลัยตามตารางระดับความรุนแรง');
  if (r.uniReportAt) throw apiError_('CONFLICT','เรื่องนี้บันทึกการรายงานมหาวิทยาลัยแล้วเมื่อ '+r.uniReportAt);
  r.uniReportAt = now_();
  r.log.push({ t:'คณบดี / ผู้อำนวยการกอง รายงาน' + SEV_UNI[r.level] + ' ทันทีหลังทราบเหตุการณ์',
               by:u.name + ' (' + u.position + ')', d:r.uniReportAt, hi:1 });
  updateIncident_(r);
  audit_(u, 'รายงานมหาวิทยาลัย', id, 'ระดับ ' + r.level);
  return { uniReportAt:r.uniReportAt };
}

/* ยกเลิกรายงานที่ส่งผิด ทำได้ทุกขั้นตอน
   ไม่ลบข้อมูลออกจากชีต เพื่อให้ตรวจสอบย้อนหลังได้ว่าใครยกเลิกเมื่อไรและเพราะอะไร
   แต่ตัดออกจากสถิติทุกหน้าจอ */
function cancelIncident_(id, note) {
  var u = me_();
  need_(u, 'cancel');
  note = txt_(note, 1000).trim();
  if (!note) throw apiError_('VALIDATION_FAILED', 'กรุณาระบุเหตุผลที่ยกเลิก เพื่อให้ตรวจสอบย้อนหลังได้', {note:'จำเป็นต้องระบุ'});

  /* เข้าถึงได้แม้เป็นเรื่องประเภทข้อมูลอ่อนไหว เพราะการยกเลิกไม่ต้องอ่านเนื้อหา
     แต่ยังต้องอยู่ในขอบเขตสิทธิ์ของผู้ยกเลิก */
  var r = readAll_('Incidents').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!r) throw apiError_('NOT_FOUND', 'ไม่พบรายงานนี้');
  if (!inScope_(u, r)) throw apiError_('FORBIDDEN', 'เรื่องนี้อยู่นอกขอบเขตสิทธิ์ของท่าน');
  if (r.status === CANCELLED) throw apiError_('CONFLICT', 'เรื่องนี้ถูกยกเลิกไปแล้ว');
  /* เรื่องที่ปิดแล้วเข้าสู่สถิติและรายงานประจำปีไปแล้ว การยกเลิกย้อนหลังจะทำให้ตัวเลขที่รายงานไปแล้วเปลี่ยน
     ถ้าพบว่าข้อมูลผิดหลังปิดเรื่อง ให้บันทึกเป็นเรื่องใหม่หรือแก้ที่ต้นทางแทน */
  if (r.status === 'closed') throw apiError_('CONFLICT', 'เรื่องนี้ปิดเรื่องแล้ว จึงยกเลิกย้อนหลังไม่ได้ กรุณาติดต่อผู้ดูแลระบบหากข้อมูลไม่ถูกต้อง');

  r = JSON.parse(JSON.stringify(r));
  var prev = STATUS_LABEL[r.status] || r.status;
  r.status      = CANCELLED;
  r.cancelledAt = now_();
  r.cancelNote  = note;
  r.log.push({ t:'ยกเลิกรายงาน (ขณะอยู่ในขั้น "' + prev + '") · เหตุผล: ' + note,
               by:u.name + ' (' + u.position + ')', d:r.cancelledAt, hi:1 });
  updateIncident_(r);
  audit_(u, 'ยกเลิกรายงาน', id, 'จากขั้น ' + prev + ' · บันทึกเหตุผล ' + note.length + ' อักขระ');
  return { status:CANCELLED, cancelledAt:r.cancelledAt };
}

/* ---- แก้ไขข้อมูลที่ผู้รายงานกรอก (หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมาย) ----
   เดิมไม่มีทางแก้ข้อมูลที่กรอกผิดเลย ทางเดียวคือยกเลิกทั้งเรื่องแล้วรายงานใหม่ ซึ่งตัดเรื่องออกจากสถิติและเสียประวัติเดิม
   แก้ได้ทุกขั้นก่อนปิดเรื่อง ต้องระบุเหตุผลเสมอ บันทึกทั้งในไทม์ไลน์และ Audit (ค่าก่อน/หลังเป็นแฮช + รายชื่อช่อง)
   ช่องที่ตั้งใจไม่เปิดให้แก้:
     - ผู้รายงาน อีเมล การไม่ระบุชื่อ และคณะ/หน่วยงาน — เป็นตัวตนและขอบเขตสิทธิ์ของเรื่อง
     - ประเภทเหตุการณ์ — เปลี่ยนความอ่อนไหวของเรื่องได้ ซึ่งผูกกับสิทธิ์อ่านและตำแหน่งไฟล์แนบ
     - ระดับความรุนแรง — มีขั้นประเมินระดับของตัวเอง (assessIncident_)
   ตารางนี้คือรายการเดียวของช่องที่แก้ได้ หน้าจอใช้รายการเดียวกัน (EDIT_FIELDS ใน Index.html) */
var EDIT_FIELDS = {
  title   :{ label:'ชื่อเรื่อง', max:300, required:1 },
  detail  :{ label:'รายละเอียดเหตุการณ์', max:5000, required:1 },
  kind    :{ label:'ลักษณะเหตุการณ์', kind:1 },
  date    :{ label:'วันที่เกิดเหตุ', date:1 },
  time    :{ label:'เวลา', time:1 },
  place   :{ label:'สถานที่', max:300, required:1 },
  mapUrl  :{ label:'ตำแหน่งแผนที่', url:1 },
  activity:{ label:'กิจกรรมขณะเกิดเหตุ', max:200 },
  course  :{ label:'รายละเอียดกิจกรรม', max:300 },
  treat   :{ label:'การรักษาพยาบาล', max:1000 },
  assets  :{ label:'ทรัพย์สินที่เสียหาย', max:1000 },
  firstAid:{ label:'การปฐมพยาบาล', max:1000 }
};
function cleanEditValue_(k, v) {
  var f = EDIT_FIELDS[k], bad = function (m) { var o = {}; o[k] = m; return apiError_('VALIDATION_FAILED', f.label + ': ' + m, o); };
  if (typeof v !== 'string') throw bad('ต้องเป็นข้อความ');
  v = txt_(v, f.max || 300).trim();
  if (f.required && !v) throw bad('จำเป็นต้องระบุ');
  if (f.kind && ['acc','near'].indexOf(v) < 0) throw bad('ต้องเป็น acc หรือ near');
  if (f.date) { v = validDate_(v, 'date'); if (v > today_()) throw bad('ต้องไม่เกินวันนี้'); }
  if (f.time && v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw bad('ต้องอยู่ในรูปแบบ HH:mm');
  if (f.url && v && !url_(v)) throw bad('ต้องเป็นลิงก์ https ที่ถูกต้อง');
  return v;
}
function editIncident_(id, fields, note) {
  var u = me_();
  need_(u, 'edit');
  if (!fields || typeof fields !== 'object' || Array.isArray(fields))
    throw apiError_('VALIDATION_FAILED', 'รูปแบบข้อมูลที่แก้ไขไม่ถูกต้อง');
  var keys = Object.keys(fields);
  var unknown = keys.filter(function (k) { return !Object.prototype.hasOwnProperty.call(EDIT_FIELDS, k); });
  if (unknown.length) throw apiError_('VALIDATION_FAILED', 'แก้ไขช่องนี้ไม่ได้: ' + unknown.join(', '));
  note = requiredNote_(note, 'note', 1000);
  var r = notCancelled_(findScoped_(u, id));
  if (r.status === 'closed') throw apiError_('CONFLICT', 'เรื่องนี้ปิดแล้ว จึงแก้ไขข้อมูลรายงานไม่ได้');
  var changed = [];
  keys.forEach(function (k) {
    var v = cleanEditValue_(k, fields[k]);
    if (String(r[k] === undefined || r[k] === null ? '' : r[k]) === v) return;
    r[k] = v;
    changed.push(EDIT_FIELDS[k].label);
  });
  if (!changed.length) throw apiError_('VALIDATION_FAILED', 'ไม่มีข้อมูลที่เปลี่ยนแปลง');
  r.log.push({ t:'แก้ไขข้อมูลรายงาน: ' + changed.join(', ') + ' · เหตุผล: ' + note,
               by:u.name + ' (' + u.position + ')', d:now_(), hi:1 });
  updateIncident_(r);
  audit_(u, 'แก้ไขข้อมูลรายงาน', id, 'ช่อง ' + changed.join(', ') + ' · เหตุผล ' + note.length + ' อักขระ');
  return { changed:changed };
}

function findScoped_(u, id) {
  var rec = findScopedRaw_(u, id);
  /* เรื่องอ่อนไหวต้องรู้ว่าใครเปิดดูเมื่อไร ไม่ใช่รู้แค่ว่าใครแก้ */
  if (isSensitive_(rec.cats)) audit_(u, 'เข้าถึงเรื่องข้อมูลอ่อนไหว', id, '');
  return rec;
}

function findScopedRaw_(u, id) {
  /* ตรวจก่อนทางอื่น เพราะบทบาทที่ได้รับแถวสรุปเป็นบทบาทกำกับดูแล
     ถ้าไม่ดักไว้ก่อน ผู้ใช้จะได้ข้อความทั่วไปแทนที่จะรู้ว่าเรื่องนี้อยู่ในสถิติแต่ไม่อยู่ในสิทธิ์อ่าน */
  var role = ROLES[u.role];
  if (role.level3Only && role.can.safetyIndex) {
    var raw = readAll_('Incidents').filter(function (x) { return String(x.id) === String(id); })[0];
    if (raw && (raw.level || raw.suggestLevel) < 3) {
      audit_(u, 'ถูกปฏิเสธการเข้าถึงรายละเอียด', id, 'เรื่องนี้อยู่ในสถิติของบทบาทนี้เท่านั้น');
      throw apiError_('FORBIDDEN', 'เรื่องนี้อยู่ในสถิติของท่าน แต่ไม่อยู่ในสิทธิ์การอ่านรายละเอียดรายเรื่อง');
    }
  }
  if (role.oversight) {
    /* บทบาทกำกับดูแลเข้าถึงได้เฉพาะเรื่องที่ตนเองเป็นผู้รายงาน
       ยกเว้นผู้บริหารระดับมหาวิทยาลัย (execRead) ที่อ่านเรื่องระดับ 3 ขึ้นไปได้ — ตรวจต่อด้านล่างผ่าน scoped_ */
    var own = readAll_('Incidents').filter(function (x) {
      return String(x.id) === String(id) && isOwner_(u, x);
    })[0];
    if (own) return JSON.parse(JSON.stringify(own));
    if (!role.execRead)
      throw apiError_('FORBIDDEN', 'บทบาทนี้เข้าถึงได้เฉพาะข้อมูลระดับภาพรวมและเรื่องที่ตนเองเป็นผู้รายงาน');
  }
  var r = scoped_(u, readAll_('Incidents')).filter(function (x) { return String(x.id) === String(id); })[0];
  if (!r) throw apiError_('NOT_FOUND', 'ไม่พบรายงานนี้ หรืออยู่นอกขอบเขตสิทธิ์ของท่าน');
  if (r.summaryOnly) {
    audit_(u, 'ถูกปฏิเสธการเข้าถึงรายละเอียด', id, 'ผู้บริหารเห็นเรื่องระดับ 1–2 เฉพาะในสถิติ');
    throw apiError_('FORBIDDEN', role.facReport
      ? 'เรื่องนี้เป็นของหน่วยงานอื่นในคณะ แสดงเฉพาะในสถิติภาพรวม'
      : 'เรื่องระดับ 1–2 แสดงเฉพาะในสถิติ ท่านเปิดรายละเอียดได้เฉพาะเรื่องระดับ 3 ขึ้นไป');
  }
  if (r.statOnly) {
    audit_(u, 'ถูกปฏิเสธการเข้าถึงรายละเอียด', id, 'บทบาทนี้เห็นเรื่องนี้เฉพาะในสถิติ');
    throw apiError_('FORBIDDEN', 'เรื่องนี้อยู่ในสถิติของท่านแต่ไม่อยู่ในสิทธิ์การอ่านรายละเอียด');
  }
  /* เรื่องระดับ 3+ ของหน่วยงานอื่นที่คณบดีอ่านได้ — findScopedRaw_ ใช้กับคำสั่งแก้ไขทุกคำสั่ง จึงปฏิเสธที่นี่จุดเดียว */
  if (r.crossRead) {
    audit_(u, 'ถูกปฏิเสธสิทธิ์', id, 'เรื่องของหน่วยงานอื่น อ่านได้อย่างเดียว');
    throw apiError_('FORBIDDEN', 'เรื่องนี้เป็นของหน่วยงานอื่น ท่านอ่านรายละเอียดได้อย่างเดียว ดำเนินการใด ๆ ไม่ได้');
  }
  if (r.restricted) {
    audit_(u, 'ถูกปฏิเสธการเข้าถึงข้อมูลอ่อนไหว', id, 'บทบาท ' + u.role);
    throw apiError_('FORBIDDEN', 'เรื่องนี้เป็นข้อมูลอ่อนไหว จำกัดการเข้าถึง');
  }
  /* คืนสำเนาจากชีตโดยตรง เพราะ scoped_ ลบอีเมลผู้รายงานออกไปแล้ว แต่ตอนบันทึกกลับต้องเขียนค่าเดิมคืน */
  var raw = readAll_('Incidents').filter(function (x) { return String(x.id) === String(id); })[0];
  return JSON.parse(JSON.stringify(raw));
}

/* ============================================================
 *  6. ไฟล์แนบและรูปภาพ → Google Drive
 * ============================================================ */
function uploadAttachment_(p) {
  var u = me_();
  need_(u, 'create');
  if (!p || !p.data) throw apiError_('ATTACHMENT_REJECTED','ไม่พบข้อมูลไฟล์');
  var mime = String(p.mime || '').toLowerCase();
  if (!ALLOWED_MIME[mime]) throw apiError_('ATTACHMENT_REJECTED','ชนิดไฟล์ไม่ได้รับอนุญาต');

  var safe = txt_(p.name || 'attachment', 180).trim().replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '');
  if (!safe) safe = 'attachment';
  /* ตรวจนามสกุลให้ตรงกับ mime ที่แจ้งมา มิฉะนั้นไฟล์ปฏิบัติการที่แจ้ง mime ปลอมเป็นรูปภาพจะเข้าไปนอนใน Drive
     และผู้ใช้ที่กดเปิดจากลิงก์ในระบบจะได้ไฟล์นั้นไปโดยเข้าใจว่าเป็นหลักฐานประกอบรายงาน */
  var ext = safe.indexOf('.') >= 0 ? safe.split('.').pop().toLowerCase() : '';
  if ((ALLOWED_EXT[mime] || []).indexOf(ext) < 0)
    throw apiError_('ATTACHMENT_REJECTED', 'นามสกุลไฟล์ไม่ตรงกับชนิดไฟล์ที่แจ้ง อนุญาตเฉพาะ ' + (ALLOWED_EXT[mime] || []).join(', '));

  /* ตรวจขนาดจากความยาว base64 ก่อนถอดรหัส 3 ใน 4 ของความยาวคือขนาดจริงโดยประมาณ
     ถ้ารอถอดรหัสก่อน คำขอที่ใหญ่เกินจะกินหน่วยความจำและเวลาทำงานไปแล้ว */
  if (String(p.data).length * 0.75 > CONFIG.MAX_FILE_MB * 1024 * 1024 * 1.05)
    throw apiError_('ATTACHMENT_REJECTED', 'ไฟล์ใหญ่เกิน ' + CONFIG.MAX_FILE_MB + ' MB');
  var bytes;
  try { bytes = Utilities.base64Decode(String(p.data || '')); }
  catch (decodeErr) { throw apiError_('ATTACHMENT_REJECTED','ข้อมูลไฟล์ไม่ใช่ Base64 ที่ถูกต้อง'); }
  if (bytes.length > CONFIG.MAX_FILE_MB * 1024 * 1024)
    throw apiError_('ATTACHMENT_REJECTED', 'ไฟล์ใหญ่เกิน ' + CONFIG.MAX_FILE_MB + ' MB');
  if (!validFileSignature_(bytes, mime))
    throw apiError_('ATTACHMENT_REJECTED','เนื้อหาไฟล์ไม่ตรงกับชนิดไฟล์ที่แจ้ง');

  /* pending ยังไม่ทราบระดับความอ่อนไหว จึงเป็น private เสมอ แล้วค่อยกำหนดสิทธิ์หลังผูกกับรายงาน */
  var sub  = attachBucket_(false);
  var blob = Utilities.newBlob(bytes, mime,
                               Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '_' + safe);
  var file = sub.createFile(blob);
  file.setDescription('แนบโดย ' + u.email + ' เมื่อ ' + now_());
  applySharing_(file, true);

  var aid = Utilities.getUuid(), token = Utilities.getUuid() + Utilities.getUuid();
  appendRow_('Attachments', {attachmentId:aid,driveFileId:file.getId(),ownerEmail:u.email,uploadToken:hashToken_(token),
    name:safe,mimeType:file.getMimeType(),size:bytes.length,status:'pending',incidentId:'',createdAt:now_(),
    expiresAt:Utilities.formatDate(new Date(new Date().getTime()+24*60*60*1000),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm')});
  audit_(u, 'อัปโหลดไฟล์แนบ', aid, mime + ' · ' + (bytes.length / 1048576).toFixed(2) + ' MB');
  /* ระหว่าง pending ไม่ส่ง Drive URL/ID ให้ browser; หลังผูกกับรายงานแล้ว refresh_ จะส่งข้อมูลไฟล์ตามสิทธิ์ */
  return { attachmentId:aid, uploadToken:token, name:safe, mime:file.getMimeType() };
}

function hashToken_(token) {
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(token||''),Utilities.Charset.UTF_8);
  return bytes.map(function(b){var v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');
}
function validFileSignature_(bytes,mime) {
  var u=function(i){return (bytes[i]||0)&255;}, ascii=function(start,n){
    var s='';for(var i=start;i<start+n&&i<bytes.length;i++)s+=String.fromCharCode(u(i));return s;
  };
  if(mime==='image/jpeg') return bytes.length>3&&u(0)===0xFF&&u(1)===0xD8&&u(2)===0xFF;
  if(mime==='image/png') return bytes.length>8&&u(0)===0x89&&ascii(1,3)==='PNG'&&u(4)===0x0D&&u(5)===0x0A&&u(6)===0x1A&&u(7)===0x0A;
  if(mime==='image/webp') return bytes.length>12&&ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP';
  if(mime==='application/pdf') return ascii(0,5)==='%PDF-';
  if(mime.indexOf('application/vnd.openxmlformats-officedocument.')===0) {
    var zip=bytes.length>4&&u(0)===0x50&&u(1)===0x4B&&u(2)===0x03&&u(3)===0x04;
    if(!zip||!byteSequence_(bytes,'[Content_Types].xml')) return false;
    return mime.indexOf('wordprocessingml')>=0 ? byteSequence_(bytes,'word/') : byteSequence_(bytes,'xl/');
  }
  return false;
}
function byteSequence_(bytes,text){
  for(var i=0;i<=bytes.length-text.length;i++){
    var ok=true;for(var j=0;j<text.length;j++)if(((bytes[i+j]||0)&255)!==text.charCodeAt(j)){ok=false;break;}
    if(ok)return true;
  }
  return false;
}

/* ============================================================
 *  7. ผู้ดูแลระบบ
 * ============================================================ */
/* ทะเบียนผู้ใช้เท่าที่ผู้เรียกมีสิทธิ์เห็น — จุดเดียวที่ตัดสินกติกานี้
   ห้ามคืน readAll_('Users') ดิบ ๆ จากที่ใดอีก เพราะเคยหลุดมาแล้วทางค่าที่ adminSaveUser_ คืนกลับ */
function usersForAdmin_(u) {
  var all = readAll_('Users');
  if (isSystemAdmin_(u)) return all;
  return all.filter(function (x) { return sameFaculty_(x.faculty, u.faculty); });
}

function adminListUsers_() {
  var u = me_();
  need_(u, 'userAdmin');
  /* ผู้ดูแลระดับคณะต้องไม่เห็นทะเบียนของคณะอื่นเลย การกรองต้องทำที่เซิร์ฟเวอร์
     ถ้าส่งทั้งชุดไปให้หน้าจอกรองเอง ข้อมูลก็หลุดไปถึงเบราว์เซอร์แล้ว */
  return usersForAdmin_(u);
}

function adminSaveUser_(p) {
  var u = me_();
  need_(u, 'userAdmin');
  if (!p || typeof p !== 'object') throw apiError_('VALIDATION_FAILED','ข้อมูลผู้ใช้ไม่ถูกต้อง');
  ['email','name','position','faculty','orgUnit','unit','role'].forEach(function(k){
    if(p[k]!==undefined&&typeof p[k]!=='string') throw apiError_('VALIDATION_FAILED',k+' ต้องเป็นข้อความ');
  });
  if (typeof p.active !== 'boolean') throw apiError_('VALIDATION_FAILED','active ต้องเป็น true หรือ false');
  var targetEmail=String(p.email||'').trim().toLowerCase();
  if (!domainOk_(targetEmail)) throw apiError_('VALIDATION_FAILED',
    'อีเมลต้องอยู่ในโดเมน ' + CONFIG.ALLOWED_DOMAIN + ' หรือโดเมนย่อยที่ได้รับอนุญาต');
  if (!isRole_(p.role)) throw apiError_('VALIDATION_FAILED', 'ไม่รู้จักบทบาท ' + p.role, {role:'ไม่มีบทบาทนี้ในระบบ'});

  var sh = sheet_('Users');
  var rows = sh.getDataRange().getValues();
  var head = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][head.indexOf('email')] || '').trim().toLowerCase() === targetEmail) {
      var merged = {};
      head.forEach(function (h, j) { merged[h] = rows[i][j]; });
      CURRENT_BEFORE_HASH = hashObject_(merged);
      /* ข้อจำกัดของผู้ดูแลระดับคณะ ตรวจจากค่าเดิมในชีตก่อนนำค่าใหม่มาทับ
         จึงกันการ "ย้ายคนของคณะอื่นเข้ามาแล้วค่อยแก้" ได้ในขั้นตอนเดียว */
      if (!isSystemAdmin_(u)) {
        if (targetEmail === String(u.email).trim().toLowerCase())
          throw apiError_('FORBIDDEN', 'ผู้ดูแลระดับคณะแก้ไขบัญชีของตนเองไม่ได้ กรุณาแจ้งผู้ดูแลระบบ');
        if (!sameFaculty_(merged.faculty, u.faculty))
          throw apiError_('FORBIDDEN', 'แก้ไขได้เฉพาะผู้ใช้ในคณะ/หน่วยงานของตนเองเท่านั้น');
        if (p.faculty !== undefined && !sameFaculty_(p.faculty, u.faculty))
          throw apiError_('FORBIDDEN', 'ผู้ดูแลระดับคณะย้ายผู้ใช้ไปคณะอื่นไม่ได้');
        if (['admin','faculty_admin'].indexOf(String(merged.role)) >= 0)
          throw apiError_('FORBIDDEN', 'บัญชีผู้ดูแลต้องให้ผู้ดูแลระบบเป็นผู้แก้ไข');
        if (FACULTY_ADMIN_ASSIGNABLE.indexOf(String(p.role)) < 0)
          throw apiError_('FORBIDDEN', 'ผู้ดูแลระดับคณะกำหนดบทบาทนี้ไม่ได้ กรุณาแจ้งผู้ดูแลระบบ');
      }
      ['name','position','faculty','orgUnit','unit','role'].forEach(function (k) {
        if (p[k] !== undefined) merged[k] = txt_(p[k], 200).trim();
      });
      if (!merged.unit) merged.unit = merged.faculty;
      if(!String(merged.name||'').trim()||!String(merged.faculty||'').trim())
        throw apiError_('VALIDATION_FAILED','ชื่อและคณะ/หน่วยงานหลักต้องไม่เป็นค่าว่าง');
      if(ROLES[merged.role].scope==='orgUnit'&&!String(merged.orgUnit||'').trim())
        throw apiError_('VALIDATION_FAILED','บทบาทนี้ต้องระบุหน่วยงานในคณะ');
      merged.active = !!p.active;
      /* ประทับเวลาที่ผู้ดูแลรับรองต้นสังกัดครั้งแรก ใช้แยก "รออนุมัติ" ออกจาก "ถูกระงับ" */
      if (merged.active && !String(merged.approvedAt || '').trim()) merged.approvedAt = now_();
      if (targetEmail===String(u.email).toLowerCase() && !merged.active)
        throw apiError_('VALIDATION_FAILED','ผู้ดูแลไม่สามารถระงับบัญชีของตนเองได้');
      /* ต้องเหลือผู้ดูแลระบบที่ใช้งานอยู่อย่างน้อยหนึ่งบัญชีเสมอ
         มิฉะนั้นจะไม่มีใครอนุมัติผู้ใช้ใหม่ แก้สิทธิ์ หรือเปิด Audit ได้อีกเลย
         ครอบคลุมทั้งการระงับบัญชีและการเปลี่ยนบทบาทของผู้ดูแลคนสุดท้าย รวมถึงการลดบทบาทตัวเอง */
      var otherAdmins = readAll_('Users').filter(function (x) {
        return x.active && x.role === 'admin' && String(x.email).toLowerCase() !== targetEmail;
      }).length;
      if (!otherAdmins && !(merged.active && merged.role === 'admin'))
        throw apiError_('VALIDATION_FAILED',
          'บัญชีนี้เป็นผู้ดูแลระบบที่ใช้งานอยู่รายสุดท้าย กรุณากำหนดผู้ดูแลระบบสำรองก่อนจึงจะเปลี่ยนบทบาทหรือระงับบัญชีนี้ได้');
      sh.getRange(i + 1, 1, 1, head.length).setValues([dehydrate_(merged,head)]);
      CURRENT_AFTER_HASH = hashObject_(merged);
      CURRENT_CHANGES = diffForAudit_(head.reduce(function(o,h,j){o[h]=rows[i][j];return o;},{}),merged);
      invalidate_('Users');
      audit_(u, 'แก้ไขสิทธิ์ผู้ใช้', p.email, 'บทบาท ' + p.role + (merged.active ? '' : ' · ระงับการใช้งาน'));
      /* บทบาท คณะ หรือสถานะเปลี่ยน = รายชื่อผู้เปิดไฟล์แนบใน Drive ต้องเปลี่ยนตาม */
      scheduleAttachmentSync_();
      /* ต้องกรองตามสิทธิ์เหมือน adminListUsers_ เป๊ะ ๆ เดิมคืนทั้งทะเบียนมหาวิทยาลัย
         ผู้ดูแลระดับคณะจึงได้รายชื่อทุกคณะกลับมาทุกครั้งที่กดบันทึก แม้จะกดโดยไม่แก้อะไรเลย
         การกรองตอนอ่านอย่างเดียวไม่พอ ถ้าทางเขียนคืนข้อมูลดิบกลับไปด้วย */
      return usersForAdmin_(u);
    }
  }
  throw apiError_('NOT_FOUND', 'ไม่พบผู้ใช้ ' + p.email);
}

/* ---- ลบรายชื่อออกจากทะเบียนผู้ใช้ (รุ่น 2.8.32) ----
   ใช้เมื่อรายชื่อในระบบไม่ตรงกับทะเบียนจริง เช่น ลาออก ย้ายหน่วยงาน หรือกรอกซ้ำ
   ลบเฉพาะแถวในทะเบียนผู้ใช้ — รายงานอุบัติการณ์ที่บุคคลนั้นเคยเขียนหรือดำเนินการยังอยู่ครบในชีต Incidents
   กติกาเดียวกับการแก้ไขสิทธิ์: ลบบัญชีตนเองไม่ได้ · ต้องเหลือผู้ดูแลระบบที่ใช้งานอยู่อย่างน้อย 1 บัญชี
   ผู้ดูแลระดับคณะลบได้เฉพาะผู้ใช้ในคณะตนเองที่ไม่ใช่บัญชีผู้ดูแล */
function adminDeleteUser_(p) {
  var u = me_();
  need_(u, 'userAdmin');
  var targetEmail = String((p && p.email) || '').trim().toLowerCase();
  if (!targetEmail) throw apiError_('VALIDATION_FAILED', 'ไม่ได้ระบุอีเมลผู้ใช้ที่จะลบ');
  if (targetEmail === String(u.email).trim().toLowerCase())
    throw apiError_('VALIDATION_FAILED', 'ลบบัญชีของตนเองไม่ได้');
  var sh = sheet_('Users');
  var rows = sh.getDataRange().getValues();
  var head = rows[0], col = head.indexOf('email');
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][col] || '').trim().toLowerCase() !== targetEmail) continue;
    var old = {};
    head.forEach(function (h, j) { old[h] = rows[i][j]; });
    if (!isSystemAdmin_(u)) {
      if (!sameFaculty_(old.faculty, u.faculty))
        throw apiError_('FORBIDDEN', 'ลบได้เฉพาะผู้ใช้ในคณะ/หน่วยงานของตนเองเท่านั้น');
      if (['admin','faculty_admin'].indexOf(String(old.role)) >= 0)
        throw apiError_('FORBIDDEN', 'บัญชีผู้ดูแลต้องให้ผู้ดูแลระบบเป็นผู้ลบ');
    }
    var oldActive = old.active === true || String(old.active).toUpperCase() === 'TRUE';
    /* อีเมลซ้ำหลายแถว: การลบแถวล่างสุดคือการลบสำเนาที่ไม่มีผล บัญชียังอยู่ จึงไม่ต้องตรวจผู้ดูแลรายสุดท้าย */
    var copies = rows.filter(function (row, k) { return k > 0 && String(row[col] || '').trim().toLowerCase() === targetEmail; }).length;
    if (copies < 2 && String(old.role) === 'admin' && oldActive) {
      var others = readAll_('Users').filter(function (x) {
        return x.active && x.role === 'admin' && String(x.email).toLowerCase() !== targetEmail;
      }).length;
      if (!others) throw apiError_('VALIDATION_FAILED',
        'บัญชีนี้เป็นผู้ดูแลระบบที่ใช้งานอยู่รายสุดท้าย กรุณากำหนดผู้ดูแลระบบสำรองก่อนจึงจะลบได้');
    }
    CURRENT_BEFORE_HASH = hashObject_(old);
    sh.deleteRow(i + 1);
    invalidate_('Users');
    audit_(u, 'ลบผู้ใช้ออกจากทะเบียน', targetEmail,
      'ชื่อ ' + String(old.name || '') + ' · บทบาท ' + String(old.role || '') + ' · ' + String(old.faculty || ''));
    /* คนที่ถูกลบต้องไม่อยู่ในรายชื่อผู้เปิดไฟล์แนบใน Drive อีก */
    scheduleAttachmentSync_();
    return usersForAdmin_(u);
  }
  throw apiError_('NOT_FOUND', 'ไม่พบผู้ใช้ ' + targetEmail + ' ในทะเบียน (อาจถูกลบไปแล้ว)');
}

/* ---- ทะเบียนผู้ใช้ที่ระบบเชื่อมอยู่จริง (รุ่น 2.8.32) ----
   รายชื่อบนหน้าจอไม่ตรงกับไฟล์ที่ผู้ดูแลเปิดดู มักเป็นเพราะเปิดคนละไฟล์ (ชื่อ NU-Incident-Users ซ้ำกันได้)
   หรือคนละแท็บ จึงแสดงชื่อไฟล์ ลิงก์ และแท็บที่ระบบอ่านจริงให้ตรวจได้ทันที — เฉพาะผู้ดูแลระบบ */
function adminUsersSource_() {
  var u = me_();
  need_(u, 'admin');
  var ss = usersDb_(), sh = configuredUsersSheet_(ss);
  var fromConfig = !!String(CONFIG.USERS_SS_ID || '').trim();
  return { name:ss.getName(), url:ss.getUrl(), id:ss.getId(), sheet:sh.getName(), gid:sh.getSheetId(),
           rows:Math.max(0, sh.getLastRow() - 1), source:fromConfig ? 'CONFIG.USERS_SS_ID' : 'Script Property USERS_SS_ID' };
}

/* ---- ตรวจความพร้อมของทะเบียนผู้ใช้ก่อนเปิดใช้ทั้งมหาวิทยาลัย ----
   ใช้เมื่อผู้ดูแลนำอีเมลของทุกคณะใส่ชีต Users โดยตรง ซึ่งเป็นเส้นทางที่ไม่ผ่านการตรวจของระบบ
   ฟังก์ชันนี้ไม่แก้ข้อมูลใด ๆ เพียงรายงานสิ่งที่จะทำให้ระบบทำงานไม่ครบ
   รายชื่อหน่วยงานทางการส่งมาจากหน้าจอ เพื่อไม่ต้องเก็บรายชื่อซ้ำสองที่ */
function adminCheckUsers_(officialUnits) {
  var u = me_();
  need_(u, 'userAdmin');
  var units = Array.isArray(officialUnits) ? officialUnits.map(function (x) { return String(x); }) : [];
  var users = readAll_('Users');
  var incs  = readAll_('Incidents');
  /* ผู้ดูแลระดับคณะเห็นผลตรวจเฉพาะคณะของตนเอง ตัวเลขรายงานจึงต้องถูกจำกัดด้วย
     มิฉะนั้นจำนวนเรื่องของคณะอื่นจะรั่วออกไปทางหน้าความพร้อม */
  if (!isSystemAdmin_(u)) {
    users = users.filter(function (x) { return sameFaculty_(x.faculty, u.faculty); });
    incs  = incs.filter(function (x) { return sameFaculty_(x.faculty, u.faculty); });
  }

  var problems = [], seen = {};
  users.forEach(function (x) {
    var mail = String(x.email || '').trim(), low = mail.toLowerCase();
    var add = function (level, msg) { problems.push({ email:mail || '(ไม่มีอีเมล)', level:level, msg:msg }); };
    if (!mail) return add('error', 'ไม่มีอีเมล แถวนี้จะใช้งานไม่ได้เลย');
    if (mail !== low) add('warn', 'อีเมลมีตัวพิมพ์ใหญ่ ระบบเทียบแบบไม่สนตัวพิมพ์อยู่แล้ว แต่ควรแก้ให้เป็นตัวพิมพ์เล็ก');
    /* ต้องใช้กติกาเดียวกับการเข้าสู่ระบบจริง (domainOk_) ซึ่งยอมรับโดเมนย่อยด้วย
       เดิมเทียบท้ายอีเมลกับ @nu.ac.th ตรง ๆ บัญชี @grad.nu.ac.th ที่เข้าระบบได้ปกติจึงถูกฟ้องสีแดงว่าเข้าไม่ได้ */
    if (!domainOk_(low))
      add('error', 'อีเมลไม่ได้อยู่ในโดเมน ' + CONFIG.ALLOWED_DOMAIN + ' หรือโดเมนย่อย จะเข้าใช้งานไม่ได้');
    if (seen[low]) add('error', 'อีเมลซ้ำกับอีกแถวหนึ่ง ระบบจะใช้แถวแรกเท่านั้น'); else seen[low] = 1;
    if (!String(x.name || '').trim()) add('warn', 'ไม่มีชื่อ-สกุล จะแสดงเป็นชื่อหน้าอีเมลในไทม์ไลน์');
    if (!isRole_(x.role)) add('error', 'บทบาท "' + x.role + '" ไม่มีในระบบ จะถูกลดเป็นผู้รายงานอัตโนมัติ');
    var fac = String(x.faculty || x.unit || '');
    if (!fac.trim()) add('error', 'ไม่ได้ระบุคณะ/หน่วยงานหลัก รายงานของผู้ใช้นี้จะไม่เข้าขอบเขตของผู้ใด');
    else {
      /* ตั้งแต่ 2.7.4 ระบบตัดช่องว่างให้เองทุกจุดที่เทียบขอบเขต จึงเหลือเป็นคำเตือนให้เก็บข้อมูลให้สะอาด */
      if (fac !== fac.trim()) add('warn', 'ชื่อคณะมีช่องว่างหัวหรือท้าย ระบบตัดให้อัตโนมัติแล้ว แต่ควรแก้ในชีตให้สะอาด');
      if (Object.prototype.hasOwnProperty.call(UNIT_SPLITS, fac.trim()))
        add('error', 'ใช้ชื่อหน่วยงานเดิม "' + fac.trim() + '" ซึ่งผังใหม่แยกเป็น ' + UNIT_SPLITS[fac.trim()].join(' และ ') +
          ' กรุณาเลือกหน่วยงานที่ถูกต้องให้ผู้ใช้นี้ และแก้คอลัมน์ faculty/unit ของรายงานเดิมในชีต Incidents ให้ตรงด้วย');
      else if (units.length && units.indexOf(canonUnit_(fac)) < 0)
        add('error', 'ชื่อคณะ "' + fac.trim() + '" ไม่ตรงกับรายชื่อหน่วยงานทางการ ต้องเลือกจากรายการเท่านั้น');
      else if (canonUnit_(fac) !== fac.trim())
        add('warn', 'ใช้ชื่อหน่วยงานเดิม "' + fac.trim() + '" ระบบนับเป็น "' + canonUnit_(fac) + '" ให้อัตโนมัติแล้ว แต่ควรแก้ในชีตเป็นชื่อใหม่');
    }
    if (isRole_(x.role) && ROLES[x.role].scope === 'orgUnit' && !String(x.orgUnit || '').trim())
      add('warn', 'บทบาทนี้มีขอบเขตระดับหน่วยงานในคณะ แต่ยังไม่ได้ระบุหน่วยงาน จะไม่เห็นรายงานใด');
    if (String(x.active) === 'false' || x.active === false)
      add('info', 'บัญชีถูกระงับการใช้งานอยู่');
  });

  /* คณะใดมีคนหรือมีรายงานแล้ว ต้องมีผู้รับผิดชอบครบจึงจะเดินครบ 9 ขั้น */
  var facs = {};
  var touch = function (f) { f = canonUnit_(f); if (f) facs[f] = facs[f] || { faculty:f, users:0, incidents:0, roles:{} }; return facs[f]; };
  users.forEach(function (x) { var f = touch(x.faculty || x.unit); if (f) { f.users++; if (x.active !== false && String(x.active) !== 'false') f.roles[x.role] = (f.roles[x.role] || 0) + 1; } });
  incs.forEach(function (x) { var f = touch(x.faculty || x.unit); if (f) f.incidents++; });

  var list = Object.keys(facs).map(function (k) {
    var f = facs[k], miss = [];
    if (!f.roles.office_head) miss.push('หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมาย — ขาดแล้วประเมินระดับ บันทึกมาตรการ ติดตาม และปิดเรื่องไม่ได้');
    if (!f.roles.dean)        miss.push('คณบดี / ผู้อำนวยการกอง — ขาดแล้วรับทราบผลและรายงานมหาวิทยาลัยไม่ได้');
    if (!f.roles.supervisor && !f.roles.office_head) miss.push('หัวหน้างาน — ขาดแล้วยืนยันข้อเท็จจริงไม่ได้');
    /* ไม่มีรองคณบดี (กำกับดูแล) ไม่ถือว่าคณะไม่พร้อม เพราะคณบดีตรวจสอบผลการติดตามแทนได้โดยอัตโนมัติ
       แต่ผู้ดูแลต้องรู้ล่วงหน้าว่าคณะไหนเดินเส้นทางสำรองนี้อยู่ ด้วยเหตุผลสองข้อ
       หนึ่ง คณบดีจะเป็นทั้งผู้ตรวจสอบและผู้รับทราบ คือคนเดียวอนุมัติสองขั้นติดกัน ซึ่งควรมีมติ คปอ. รับรอง
       สอง ช่องข้อเสนอแนะของรองคณบดี (กำกับดูแล) จะว่างไว้ตลอดในเรื่องของคณะนั้น
       จึงแยกเป็น notes ไม่ปนกับ missing ที่ทำให้สถานะ ready เป็นเท็จ */
    var notes = [];
    if (!f.roles.deputy_dean_sup) {
      notes.push(f.roles.dean
        ? 'ยังไม่มีรองคณบดี (กำกับดูแล) — คณบดี / ผู้อำนวยการกอง จะตรวจสอบผลการติดตามแทน และเป็นผู้รับทราบด้วย'
        : 'ยังไม่มีทั้งรองคณบดี (กำกับดูแล) และคณบดี / ผู้อำนวยการกอง — เรื่องของคณะนี้จะค้างที่ขั้นตรวจสอบ ไม่มีผู้ทำแทน');
    }
    f.notes = notes;
    f.missing = miss;
    f.ready = miss.length === 0;
    f.official = units.length ? units.indexOf(canonUnit_(f.faculty)) >= 0 : true;
    return f;
  }).sort(function (a, b) { return (a.ready === b.ready) ? b.incidents - a.incidents : (a.ready ? 1 : -1); });

  var uni = [];
  var actives = users.filter(function (x) { return x.active !== false && String(x.active) !== 'false'; });
  var hasRole = function (r) { return actives.some(function (x) { return x.role === r; }); };
  if (!hasRole('admin'))              uni.push('ยังไม่มีผู้ดูแลระบบที่ใช้งานอยู่');
  if (!hasRole('vice_president_sup')) uni.push('ยังไม่มีรองอธิการบดี (กำกับดูแล) อีเมลแจ้งเหตุระดับ 3 ขึ้นไปจะไม่ถึงระดับมหาวิทยาลัย');
  if (!hasRole('president'))          uni.push('ยังไม่มีอธิการบดี อีเมลแจ้งเหตุระดับ 3 ขึ้นไปจะไม่ถึงระดับมหาวิทยาลัย');
  if (!hasRole('facility'))           uni.push('ยังไม่มีกองอาคารสถานที่ ศูนย์รวมข้อมูลจะไม่มีผู้ดูแล');

  audit_(u, 'ตรวจความพร้อมทะเบียนผู้ใช้', '', users.length + ' บัญชี · ' + list.length + ' หน่วยงาน');
  return { total:users.length, active:actives.length, domain:CONFIG.ALLOWED_DOMAIN,
           officialCount:units.length, problems:problems, faculties:list, university:uni };
}

/* ============================================================
 *  ทะเบียนจำนวนบุคลากรรายหน่วยงาน (ตัวหารของ IFR / PDFR / ISR)
 *  ------------------------------------------------------------
 *  ก่อนรุ่น 2.7.0 ค่าจำนวนบุคลากรถูกเก็บใน localStorage ของแต่ละเบราว์เซอร์
 *  ผู้บริหารสองคนที่เปิดรายงานเดียวกันจึงเห็น IFR/ISR คนละค่า และไม่มีใครรู้ว่าค่าไหนถูก
 *  ย้ายมาเก็บในชีต OrgHeadcount ของฐานข้อมูลหลัก เพื่อให้มีแหล่งความจริงเดียวทั้งระบบ
 *
 *  ขอบเขตที่คืนกลับ ต้องเป็นประชากรกลุ่มเดียวกับตัวตั้งเสมอ มิฉะนั้นอัตราที่ได้จะไม่มีความหมาย
 *    scope 'all'      → ทุกหน่วยงาน (ตัวตั้งคือทั้งมหาวิทยาลัย)
 *    scope 'faculty'  → หน่วยงานในคณะของผู้ใช้
 *    scope 'orgUnit'  → เฉพาะหน่วยงานของผู้ใช้
 *    scope 'own'      → เฉพาะหน่วยงานของผู้ใช้เช่นกัน (ผู้รายงานไม่มีสิทธิ์ดูดัชนีอยู่แล้ว)
 * ============================================================ */

/* ชั่วโมงการทำงานต่อปีของหนึ่งหน่วยงาน — ค่าที่ระบุเองมาก่อน ถ้าไม่ระบุใช้ค่ามาตรฐานกลาง
   คำนวณที่นี่ที่เดียว ทั้งการรวมยอดและการแสดงผลรายแถวต้องเรียกตัวนี้ ห้ามคูณเองซ้ำที่อื่น */
function defaultHoursPerYear_() {
  var h = Number(CONFIG.HOURS_PER_DAY) || 7, d = Number(CONFIG.WORK_DAYS_PER_YEAR) || 240;
  return h * d;
}
function orgHoursPerYear_(row) {
  var own = Number(row && row.hoursPerYear) || 0;
  return own > 0 ? own : defaultHoursPerYear_();
}

/* คีย์ประจำหน่วยงาน — คณะและหน่วยงานประกอบกันเป็นคีย์ เพราะชื่อหน่วยงานอย่าง "งานธุรการ"
   ซ้ำกันได้หลายคณะ ถ้าใช้ชื่อหน่วยงานอย่างเดียว จำนวนคนของคณะหนึ่งจะไปทับอีกคณะหนึ่ง */
function orgKey_(faculty, orgUnit) {
  /* ใช้ JSON แทนการต่อสตริงด้วยตัวคั่น เพราะชื่อคณะและหน่วยงานมีช่องว่างได้ทั้งคู่
     "คณะ ก" + "งาน ข" กับ "คณะ ก งาน" + "ข" จะได้คีย์เดียวกันถ้าต่อด้วยช่องว่างเฉย ๆ */
  return JSON.stringify([canonUnit_(faculty), String(orgUnit || '').trim()]);
}

/* กรองทะเบียนตามขอบเขตของผู้ใช้ ใช้กติกาเดียวกับ inScope_ โดยมองหนึ่งแถวเป็นหนึ่งหน่วยงาน */
function orgHeadcountInScope_(u, rows) {
  var scope = ROLES[u.role].scope;
  if (scope === 'all') return rows;
  if (scope === 'faculty') return rows.filter(function (r) { return sameFaculty_(r.faculty, u.faculty); });
  return rows.filter(function (r) {
    return sameFaculty_(r.faculty, u.faculty) && String(r.orgUnit || '').trim() === String(u.orgUnit || '').trim();
  });
}

/* สิทธิ์แก้ไขทะเบียน — ผู้ดูแลระบบแก้ได้ทุกคณะ
   ตั้งแต่รุ่น 2.8.8 ผู้กรอกและบันทึกจำนวนบุคลากร/วิธีคิดเวลาการทำงาน คือบทบาทที่มีสิทธิ์ headcount เท่านั้น
   ได้แก่ หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมาย และรองคณบดี (กำกับดูแล) แก้ได้เฉพาะคณะ/กองของตนเอง
   คณบดี/ผู้อำนวยการกอง และผู้ดูแลระดับคณะ ดูได้แต่แก้ไม่ได้ — แต่ละคณะและกองกรอกจำนวนบุคลากรและชั่วโมงทำงานเองได้เหมือนรุ่น 2.6.6
   แต่ค่ายังเก็บที่ฐานข้อมูลกลาง ทุกคนจึงเห็นดัชนีตรงกัน
   ใช้ตัวนี้ทั้งตอนบอกหน้าจอว่าให้แสดงปุ่มหรือไม่ และตอนตรวจจริงตอนบันทึก
   จึงไม่มีทางที่หน้าจอกับเซิร์ฟเวอร์จะเห็นสิทธิ์ไม่ตรงกัน */
function canEditHeadcount_(u, faculty) {
  if (!u || !u.registered || !isRole_(u.role)) return false;
  if (isSystemAdmin_(u)) return true;
  if (!ROLES[u.role].can.headcount) return false;
  if (!String(u.faculty || '').trim()) return false;
  return faculty === undefined || sameFaculty_(faculty, u.faculty);
}

/* ตรวจกลุ่มบุคลากรที่คณะกรอกเอง — คืน null ถ้าไม่ได้ส่งมา (คงของเดิม) และ [] ถ้าส่งมาว่าง (ล้าง)
   จำกัดขนาดและช่วงค่าทุกช่อง เพราะผลรวมกลายเป็นตัวหารของดัชนีทั้งมหาวิทยาลัยโดยตรง */
var STAFF_GROUPS_MAX = 20;
function cleanStaffGroups_(v, label) {
  if (v === undefined || v === null) return null;
  if (!Array.isArray(v)) throw apiError_('VALIDATION_FAILED', 'กลุ่มบุคลากรของ ' + label + ' ต้องเป็นรายการ');
  if (v.length > STAFF_GROUPS_MAX)
    throw apiError_('VALIDATION_FAILED', 'กลุ่มบุคลากรของ ' + label + ' ได้ไม่เกิน ' + STAFF_GROUPS_MAX + ' กลุ่ม');
  var out = [];
  v.forEach(function (g, i) {
    if (!g || typeof g !== 'object' || Array.isArray(g))
      throw apiError_('VALIDATION_FAILED', 'กลุ่มที่ ' + (i + 1) + ' ของ ' + label + ' ไม่ถูกต้อง');
    var bad = Object.keys(g).filter(function (k) { return ['t','n','h','d'].indexOf(k) < 0; });
    if (bad.length) throw apiError_('VALIDATION_FAILED', 'กลุ่มบุคลากรมี field ที่ไม่รองรับ: ' + bad.join(', '));
    var n = Number(g.n), h = Number(g.h), d = Number(g.d);
    if (!(n > 0)) return;                                   /* กลุ่มที่ไม่มีคนไม่มีผลต่อการคำนวณ ตัดทิ้ง */
    if (Math.floor(n) !== n || n > 100000)
      throw apiError_('VALIDATION_FAILED', 'จำนวนคนของกลุ่มที่ ' + (i + 1) + ' (' + label + ') ต้องเป็นจำนวนเต็มไม่เกิน 100,000');
    if (!isFinite(h) || h <= 0 || h > 24)
      throw apiError_('VALIDATION_FAILED', 'ชั่วโมง/วันของกลุ่มที่ ' + (i + 1) + ' (' + label + ') ต้องอยู่ระหว่าง 0–24');
    if (!isFinite(d) || d <= 0 || d > 365 || Math.floor(d) !== d)
      throw apiError_('VALIDATION_FAILED', 'วันทำงาน/ปีของกลุ่มที่ ' + (i + 1) + ' (' + label + ') ต้องเป็นจำนวนเต็ม 1–365');
    out.push({ t:txt_(String(g.t || 'กลุ่มที่ ' + (i + 1)), 80).trim(), n:n, h:Math.round(h * 100) / 100, d:d });
  });
  if (out.length) {
    var s = staffGroupsTotals_(out);
    if (s.avg < 100) throw apiError_('VALIDATION_FAILED', 'ชั่วโมงเฉลี่ยของ ' + label + ' ต่ำกว่า 100 ชั่วโมง/คน/ปี ผิดปกติ กรุณาตรวจสอบ');
  }
  return out;
}
function staffGroupsTotals_(groups) {
  var people = 0, hours = 0;
  groups.forEach(function (g) { people += g.n; hours += g.n * g.h * g.d; });
  return { people:people, hours:hours, avg:people ? Math.round(hours / people) : 0 };
}

function orgHeadcountList_() {
  var u = me_();
  var rows = orgHeadcountInScope_(u, readAll_('OrgHeadcount'));
  var totalPeople = 0, totalHours = 0;
  var out = rows.map(function (r) {
    var hpy = orgHoursPerYear_(r);
    totalPeople += r.headcount;
    totalHours  += r.headcount * hpy;
    return { faculty:r.faculty, orgUnit:r.orgUnit, headcount:r.headcount,
             hoursPerYear:r.hoursPerYear, effectiveHoursPerYear:hpy,
             effectiveYear:r.effectiveYear, updatedAt:r.updatedAt, updatedBy:r.updatedBy,
             staffGroups:r.staffGroups || [] };
  }).sort(function (a, b) {
    return a.faculty === b.faculty ? (a.orgUnit < b.orgUnit ? -1 : 1) : (a.faculty < b.faculty ? -1 : 1);
  });
  /* configured นับเฉพาะหน่วยงานที่กรอกจำนวนคนแล้วจริง ๆ หน้าจอใช้ค่านี้บอกความครบถ้วน
     เพราะแถวที่มีอยู่แต่จำนวนคนเป็น 0 ไม่ได้ช่วยให้คำนวณดัชนีได้เลย */
  /* facReport: ตัวหารของดัชนีระดับคณะ (รวมทุกหน่วยงานในคณะ) ส่งเป็นตัวเลขรวมเท่านั้น ไม่ส่งรายแถวของหน่วยงานอื่น */
  var facPeople = 0, facHours = 0;
  if (ROLES[u.role].facReport) {
    readAll_('OrgHeadcount').forEach(function (r) {
      if (!sameFaculty_(r.faculty, u.faculty) || !(r.headcount > 0)) return;
      facPeople += r.headcount; facHours += r.headcount * orgHoursPerYear_(r);
    });
  }
  return { rows:out, scope:ROLES[u.role].scope, faculty:u.faculty, orgUnit:u.orgUnit,
           facultyHeadcount:facPeople, facultyHoursPerYear:facHours,
           units:out.length, configured:out.filter(function (r) { return r.headcount > 0; }).length,
           totalHeadcount:totalPeople, totalHoursPerYear:totalHours,
           defaultHoursPerYear:defaultHoursPerYear_(),
           hoursPerDay:Number(CONFIG.HOURS_PER_DAY) || 7, workDaysPerYear:Number(CONFIG.WORK_DAYS_PER_YEAR) || 240,
           canEdit:canEditHeadcount_(u) };
}

/* บันทึกทีละหลายแถวในคำสั่งเดียว เพราะผู้ดูแลกรอกทั้งตารางแล้วกดบันทึกครั้งเดียว
   ถ้าแยกเป็นคำสั่งละแถว 43 หน่วยงานจะกลายเป็น 43 คำขอ ชนเพดานอัตราการเรียกและกินโควตาเวลา
   ทั้งชุดถูกตรวจสิทธิ์และตรวจค่าให้ครบก่อน จึงค่อยเขียน — ไม่มีสภาพเขียนไปได้ครึ่งทางแล้วล้ม */
function orgHeadcountSave_(p) {
  var u = me_();
  if (!canEditHeadcount_(u)) {
    audit_(u, 'ถูกปฏิเสธสิทธิ์', 'orgHeadcount', 'บทบาท ' + u.role);
    throw apiError_('FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขทะเบียนจำนวนบุคลากร');
  }
  var input = (p && p.rows) || [];
  if (!Array.isArray(input) || !input.length)
    throw apiError_('VALIDATION_FAILED', 'ไม่มีรายการที่จะบันทึก');
  if (input.length > 200)
    throw apiError_('VALIDATION_FAILED', 'บันทึกได้ครั้งละไม่เกิน 200 หน่วยงาน');

  var clean = input.map(function (r, i) {
    var faculty = canonUnit_(txt_(r && r.faculty, 200));   /* เก็บด้วยชื่อตามผังปัจจุบันเสมอ */
    /* orgUnit ว่างได้ = แถวระดับ "ทั้งคณะ/หน่วยงาน" ซึ่งเป็นระดับที่ดัชนีถูกใช้จริง
       (บทบาทที่ดูดัชนีได้มีเฉพาะขอบเขตคณะและทั้งมหาวิทยาลัย ไม่มีขอบเขตหน่วยงานย่อย)
       แถวหน่วยงานย่อยยังกรอกได้ แต่ห้ามปนกับแถวระดับคณะในคณะเดียวกัน — ดูการตรวจด้านล่าง */
    var orgUnit = txt_(r && r.orgUnit, 200).trim();
    if (!faculty)
      throw apiError_('VALIDATION_FAILED', 'แถวที่ ' + (i + 1) + ' ต้องระบุคณะ/หน่วยงาน');
    if (!canEditHeadcount_(u, faculty))
      throw apiError_('FORBIDDEN', 'แก้ไขได้เฉพาะหน่วยงานในคณะของท่าน (' + u.faculty + ')');
    var year = txt_(r && r.effectiveYear, 10).trim();
    if (year && !/^\d{4}$/.test(year))
      throw apiError_('VALIDATION_FAILED', 'ปีที่มีผลของ ' + orgUnit + ' ต้องเป็นตัวเลขปี 4 หลัก');
    /* คณะกรอกวิธีคิดเวลาการทำงานเป็นกลุ่มบุคลากร → ระบบคำนวณจำนวนคนและชั่วโมงเฉลี่ยเอง
       ค่าที่ส่งมาในช่อง headcount/hoursPerYear ถูกแทนที่ด้วยผลคำนวณ ตัวเลขในทะเบียนจึงตรงกับวิธีคิดเสมอ */
    var groups = cleanStaffGroups_(r && r.staffGroups, orgUnit || faculty);
    if (groups && groups.length) {
      var gs = staffGroupsTotals_(groups);
      if (gs.people > 100000)
        throw apiError_('VALIDATION_FAILED', 'จำนวนบุคลากรรวมของ ' + (orgUnit || faculty) + ' เกิน 100,000 คน กรุณาตรวจสอบ');
      return { faculty:faculty, orgUnit:orgUnit, headcount:gs.people, hoursPerYear:gs.avg,
               effectiveYear:year, staffGroups:groups };
    }
    return { faculty:faculty, orgUnit:orgUnit, staffGroups:groups,
             headcount:boundedInt_(r.headcount === '' || r.headcount === undefined ? 0 : r.headcount, 0, 100000, 'จำนวนบุคลากรของ ' + orgUnit),
             /* 0 = ไม่ระบุ ใช้ค่ามาตรฐานกลาง จึงต้องยอมรับ 0 แต่ไม่ยอมรับค่าที่ต่ำจนดัชนีพุ่งผิดปกติ */
             hoursPerYear:(function () {
               var v = r.hoursPerYear === '' || r.hoursPerYear === undefined || r.hoursPerYear === null ? 0 : boundedInt_(r.hoursPerYear, 0, 8760, 'ชั่วโมงทำงาน/ปีของ ' + orgUnit);
               if (v > 0 && v < 100) throw apiError_('VALIDATION_FAILED', 'ชั่วโมงทำงาน/ปีของ ' + orgUnit + ' ต่ำผิดปกติ กรุณาตรวจสอบ');
               return v;
             })(),
             effectiveYear:year };
  });

  /* คีย์ซ้ำในคำขอเดียวกันต้องถูกปฏิเสธ ไม่ใช่ปล่อยให้แถวหลังทับแถวหน้าเงียบ ๆ
     ผู้ดูแลจะไม่มีทางรู้เลยว่าค่าที่ตนกรอกไว้แถวหนึ่งหายไปไหน */
  var seen = {};
  clean.forEach(function (r) {
    var k = orgKey_(r.faculty, r.orgUnit);
    if (seen[k]) throw apiError_('VALIDATION_FAILED', 'มีหน่วยงานซ้ำในรายการ: ' + r.faculty + ' · ' + r.orgUnit);
    seen[k] = 1;
  });

  var sh = sheet_('OrgHeadcount');
  var head = headers_(sh);
  /* คัดลอกแถวออกจากแคชก่อนแก้ ห้ามแก้ object ที่ readAll_ คืนมาโดยตรง
     เคยเกิดบั๊กแบบเดียวกันมาแล้วใน scoped_ ที่แก้แถวในแคชแล้วค่าที่ถูกแก้ไหลไปเขียนทับข้อมูลจริง
     และการคัดลอกทีละฟิลด์ยังกันไม่ให้ field แปลกปลอมจากชีตไหลกลับลงไปด้วย */
  var existing = readAll_('OrgHeadcount').map(function (r) {
    return { faculty:r.faculty, orgUnit:r.orgUnit, headcount:r.headcount,
             hoursPerYear:r.hoursPerYear, effectiveYear:r.effectiveYear,
             updatedAt:r.updatedAt, updatedBy:r.updatedBy,
             staffGroups:JSON.stringify(r.staffGroups || []) };
  });
  var index = {};
  existing.forEach(function (r, i) { index[orgKey_(r.faculty, r.orgUnit)] = i; });

  var stamp = now_(), added = 0, changed = 0, before = {}, after = {};
  clean.forEach(function (r) {
    var k = orgKey_(r.faculty, r.orgUnit), i = index[k];
    if (i === undefined) {
      existing.push({ faculty:r.faculty, orgUnit:r.orgUnit, headcount:r.headcount,
                      hoursPerYear:r.hoursPerYear, effectiveYear:r.effectiveYear,
                      updatedAt:stamp, updatedBy:u.email,
                      staffGroups:JSON.stringify(r.staffGroups || []) });
      index[k] = existing.length - 1;
      added++;
      after[r.faculty + ' · ' + r.orgUnit] = r.headcount;
      return;
    }
    var old = existing[i];
    /* staffGroups = null แปลว่าผู้เรียกไม่ได้ส่งมา → คงวิธีคิดเดิมไว้ ส่วน [] แปลว่าล้างแล้วกลับไปกรอกตัวเลขเอง */
    var newGroups = r.staffGroups === null ? old.staffGroups : JSON.stringify(r.staffGroups);
    /* ถ้าคงวิธีคิดเดิมที่มีกลุ่มอยู่ ตัวเลขต้องมาจากกลุ่มเสมอ ไม่ใช่ตัวเลขที่ส่งมา มิฉะนั้นทะเบียนจะขัดกับวิธีคิดของตัวเอง */
    if (r.staffGroups === null) {
      var kept = []; try { kept = JSON.parse(old.staffGroups || '[]'); } catch (ek) { kept = []; }
      if (Array.isArray(kept) && kept.length) {
        var kt = staffGroupsTotals_(kept);
        r.headcount = kt.people; r.hoursPerYear = kt.avg;
      }
    }
    if (old.headcount === r.headcount && old.hoursPerYear === r.hoursPerYear &&
        String(old.effectiveYear) === String(r.effectiveYear) && old.staffGroups === newGroups) return;   /* ไม่เปลี่ยน ไม่ต้องแตะแถว */
    before[r.faculty + ' · ' + r.orgUnit] = old.headcount;
    after[r.faculty + ' · ' + r.orgUnit]  = r.headcount;
    old.headcount = r.headcount; old.hoursPerYear = r.hoursPerYear;
    old.effectiveYear = r.effectiveYear; old.updatedAt = stamp; old.updatedBy = u.email;
    old.staffGroups = newGroups;
    changed++;
  });

  /* ห้ามให้คณะเดียวกันมีทั้งแถวระดับคณะ (orgUnit ว่าง) และแถวหน่วยงานย่อยที่มีคนพร้อมกัน
     ถ้าปนกัน การรวมยอดจะนับคนซ้ำสองรอบ แล้ว IFR/PDFR/ISR จะต่ำกว่าความจริงโดยไม่มีใครสังเกตเห็น
     ตรวจจากสภาพสุดท้ายของทั้งตาราง ไม่ใช่เฉพาะแถวที่ส่งมา เพราะแถวที่ทำให้ปนอาจมีอยู่ในชีตอยู่ก่อนแล้ว */
  var levelMix = {};
  existing.forEach(function (r) {
    if (!(r.headcount > 0)) return;
    var f = String(r.faculty || '').trim();
    if (!levelMix[f]) levelMix[f] = { whole:0, sub:0 };
    if (String(r.orgUnit || '').trim()) levelMix[f].sub++; else levelMix[f].whole++;
  });
  Object.keys(levelMix).forEach(function (f) {
    if (levelMix[f].whole && levelMix[f].sub)
      throw apiError_('VALIDATION_FAILED', f + ' มีจำนวนบุคลากรทั้งระดับทั้งหน่วยงานและระดับหน่วยงานย่อยพร้อมกัน ' +
        'การรวมยอดจะนับคนซ้ำ กรุณากรอกอย่างใดอย่างหนึ่ง แล้วตั้งอีกแบบเป็น 0');
  });

  if (added || changed) {
    /* เขียนกลับทั้งช่วงข้อมูลในครั้งเดียว โดยเรียงช่องตามหัวคอลัมน์จริงของชีตเสมอ (dehydrate_)
       ถ้าเขียนตามลำดับใน SHEETS แทน การสลับคอลัมน์ด้วยมือครั้งเดียวจะทำให้ข้อมูลเลื่อนทั้งตาราง */
    var body = existing.map(function (r) { return dehydrate_(r, head); });
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, head.length).clearContent();
    if (body.length) sh.getRange(2, 1, body.length, head.length).setValues(body);
    invalidate_('OrgHeadcount');
    CURRENT_BEFORE_HASH = hashObject_(before);
    CURRENT_AFTER_HASH  = hashObject_(after);
    CURRENT_CHANGES     = diffForAudit_(before, after);
  }
  audit_(u, 'แก้ไขทะเบียนจำนวนบุคลากร', 'OrgHeadcount',
    'เพิ่ม ' + added + ' · แก้ไข ' + changed + ' · ส่งมา ' + clean.length + ' หน่วยงาน');
  return { added:added, changed:changed, unchanged:clean.length - added - changed, list:orgHeadcountList_() };
}

/* ============================================================
 *  เปรียบเทียบดัชนีความปลอดภัยรายคณะ (IFR / ISR / PDFR) — รุ่น 2.8.1
 *  ------------------------------------------------------------
 *  คืนเฉพาะตัวเลขรวมรายคณะรายเดือน ไม่มีเรื่อง เนื้อหา ผู้รายงาน หรือรายการรายเรื่องใด ๆ
 *  จึงเปิดให้ผู้บริหารที่มีสิทธิ์ดูดัชนี (safetyIndex) และผู้ดูแลระบบเห็นทุกคณะได้ เพื่อเทียบกัน
 *  เกณฑ์การนับต้องตรงกับ safetyIndex() ใน Index.html ทุกข้อ:
 *    - ไม่นับเรื่องที่ยกเลิก และไม่นับเหตุการณ์เกือบเกิดอุบัติเหตุ (kind = near)
 *    - IFR นับอุบัติเหตุที่ injuryAxis ≥ 2 · ISR รวม daysOff ของเรื่องเหล่านั้น
 *    - PDFR นับอุบัติเหตุที่ damageAxis ≥ 2
 *  ตัวหาร (ชั่วโมงทำงาน/ปี) มาจาก OrgHeadcount รวมทุกแถวของคณะนั้น — หน้าจอคิดตามสัดส่วนเดือนเอง
 * ============================================================ */
var FACULTY_INDEX_MIN_INJURY = 2;
var FACULTY_INDEX_MIN_DAMAGE = 2;
function canCompareFaculties_(u) {
  if (!u || !u.registered || !isRole_(u.role)) return false;
  return isSystemAdmin_(u) || !!ROLES[u.role].can.safetyIndex;
}
function reportFacultyIndex_() {
  var u = me_();
  if (!canCompareFaculties_(u)) {
    audit_(u, 'ถูกปฏิเสธสิทธิ์', 'facultyIndex', 'บทบาท ' + u.role);
    throw apiError_('FORBIDDEN', 'ไม่มีสิทธิ์ดูการเปรียบเทียบดัชนีความปลอดภัยรายคณะ');
  }
  var fac = {};
  var get = function (name) {
    name = canonUnit_(name) || 'ไม่ระบุคณะ/หน่วยงาน';
    if (!fac[name]) fac[name] = { faculty:name, headcount:0, hoursPerYear:0, months:{} };
    return fac[name];
  };
  readAll_('OrgHeadcount').forEach(function (r) {
    if (!(r.headcount > 0)) return;
    var f = get(r.faculty);
    f.headcount += r.headcount;
    f.hoursPerYear += r.headcount * orgHoursPerYear_(r);
  });
  readAll_('Incidents').forEach(function (x) {
    if (x.status === CANCELLED || x.kind === 'near') return;
    var ym = String(x.date || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) return;
    var inj = (Number(x.injuryAxis) || 1) >= FACULTY_INDEX_MIN_INJURY;
    var pd  = (Number(x.damageAxis) || 1) >= FACULTY_INDEX_MIN_DAMAGE;
    if (!inj && !pd) return;
    var f = get(x.faculty || x.unit);
    var m = f.months[ym] || (f.months[ym] = { inj:0, lost:0, pd:0 });
    if (inj) { m.inj++; m.lost += Number(x.daysOff) || 0; }
    if (pd) m.pd++;
  });
  var rows = Object.keys(fac).sort().map(function (k) { return fac[k]; });
  return { faculties:rows, ownFaculty:canonUnit_(u.faculty),
           defaultHoursPerYear:defaultHoursPerYear_(),
           generatedAt:now_() };
}

/* คณบดีทำหน้าที่ตรวจสอบผลการติดตามแทนได้เฉพาะคณะที่ยังไม่มีรองคณบดี (กำกับดูแล) ที่ใช้งานอยู่
   กติกาเดียวกันนี้ใช้ทั้งตอนตรวจสอบ (advanceStatus_) และตอนส่งเรื่องกลับ (returnIncident_)
   จึงต้องอยู่ที่เดียว ถ้าสองที่เขียนแยกกันแล้วแก้ไม่พร้อมกัน จะเกิดช่องให้ข้ามหน้าที่กันได้
   คืน true เมื่อผู้เรียกเป็นคณบดีที่ทำแทนจริง เพื่อให้ผู้เรียกไปติดธง reviewBySub ต่อ */
function assertDeanMayReview_(u, r) {
  if (u.role !== 'dean') return false;
  var hasSup = readAll_('Users').some(function (x) {
    return x.active && x.role === 'deputy_dean_sup' && sameFaculty_(x.faculty, r.faculty);
  });
  if (hasSup) throw apiError_('FORBIDDEN',
    'คณะนี้มีรองคณบดี (กำกับดูแล) อยู่แล้ว การตรวจสอบผลการติดตามเป็นหน้าที่ของบทบาทดังกล่าว');
  return true;
}

/* ส่งเรื่องกลับขั้นก่อนหน้า — ทางเลือกที่ถูกต้องแทนการยกเลิกทั้งเรื่อง
   ดู RETURN_MAP ด้านบนสำหรับเหตุผลและตารางขั้นที่อนุญาต
   เหตุผลเป็นช่องบังคับ และบันทึกทั้งในไทม์ไลน์ของเรื่องและในบันทึกร่องรอย
   ข้อมูลเดิมทั้งหมดคงอยู่ครบ ทั้งมาตรการ ประวัติการติดตาม และบันทึกทุกขั้นที่ผ่านมา */
function returnIncident_(id, note) {
  var u = me_();
  var r = notCancelled_(findScoped_(u, id));
  var back = RETURN_MAP[r.status];
  if (!back) throw apiError_('CONFLICT',
    'ขั้น "' + (STATUS_LABEL[r.status] || r.status) + '" ส่งเรื่องกลับไม่ได้ ' +
    'ส่งกลับได้เฉพาะขั้นที่รอการตรวจสอบผลการติดตาม และขั้นที่รอคณบดี / ผู้อำนวยการกอง รับทราบ');
  need_(u, back.cap);
  /* ขั้นรอตรวจสอบ คณบดีเข้ามาส่งกลับแทนได้เฉพาะคณะที่ยังไม่มีรองคณบดี (กำกับดูแล)
     ใช้กติกาเดียวกับการตรวจสอบ เพื่อไม่ให้ส่งกลับกลายเป็นช่องทางข้ามหน้าที่ของรองคณบดี */
  var bySub = (r.status === 'monitoring') ? assertDeanMayReview_(u, r) : false;
  note = requiredNote_(note, 'note', 2000);

  var from = STATUS_LABEL[r.status] || r.status;
  r.status = back.to;
  /* กลับไปขั้นกำหนดมาตรการแปลว่ายังไม่ได้อยู่ระหว่างติดตาม สถานะมาตรการจึงกลับเป็นค่าว่าง
     ประวัติการติดตาม (monitorLog) และสถานะแล้วเสร็จของแต่ละมาตรการคงอยู่ครบ ไม่ถูกล้าง
     เพราะเป็นหลักฐานว่าดำเนินการอะไรไปแล้วบ้างก่อนถูกส่งกลับ */
  r.monitor = (back.to === 'capa') ? '' : 'inprogress';
  r.log.push({ t:back.act + (bySub ? ' (คณบดี / ผู้อำนวยการกอง ดำเนินการแทนรองคณบดี (กำกับดูแล))' : '') +
                 ' — ส่งกลับจากขั้น "' + from + '" · เหตุผล: ' + note,
               by:u.name + ' (' + u.position + ')', d:now_(), hi:1 });
  updateIncident_(r);
  audit_(u, 'ส่งเรื่องกลับขั้นก่อนหน้า', id,
    from + ' → ' + (STATUS_LABEL[back.to] || back.to) + ' · เหตุผล ' + note.length + ' อักขระ');
  return { status:back.to, from:from, hint:back.hint };
}

/* บันทึกการส่งออกข้อมูลลง Audit log
   การส่งออกเป็นการนำข้อมูลทั้งชุดออกนอกระบบ จึงต้องมีร่องรอยเช่นเดียวกับการแก้ไข
   ไม่ผูกกับสิทธิ์ใดเพิ่ม เพราะผู้ใช้ส่งออกได้เฉพาะข้อมูลที่ตนเองเห็นอยู่แล้ว */
function logExport_(kind, count) {
  var u = me_();
  audit_(u, 'ส่งออกข้อมูล', txt_(kind, 60), 'จำนวน ' + (Number(count) || 0) + ' รายการ');
  return true;
}

function adminListAudit_(limit) {
  var u = me_();
  need_(u, 'admin');
  var all = readAll_('Audit');
  return all.slice(-(Number(limit) || 200)).reverse();
}

/* ============================================================
 *  ห่วงโซ่ลายเซ็นของบันทึกร่องรอย (Audit HMAC chain)
 * ------------------------------------------------------------
 *  แหล่งความจริงของห่วงโซ่คือ "ชีต Audit" เท่านั้น prevEntryHash ของรายการใหม่
 *  ต้องอ่านจาก entryHash ของแถวท้ายในชีตจริงเสมอ ห้ามอ่านจาก Script Property
 *
 *  บั๊กที่เคยเกิด (v2.6.5): prevEntryHash อ่านจาก Property AUDIT_LAST_HASH ซึ่งอยู่คนละที่กับชีต
 *  พอชีต Audit ถูกล้างหรือถูกลบแถว (เช่นตอนติดตั้งใหม่ หรือย้ายไปฐานข้อมูลชุดใหม่) ค่าใน Property
 *  ยังค้างอยู่ รายการแรกของชีตใหม่จึงชี้ไปยังแฮชที่ไม่มีอยู่จริง verifyAuditChain_ ฟ้อง
 *  "ลำดับที่ 1 ไม่ผ่านการตรวจความถูกต้อง" ทันที และในทางกลับกัน ถ้า Property หายไประหว่างทาง
 *  (ล้าง Script Properties / คัดลอกโปรเจกต์ใหม่) รายการถัดไปจะได้ prevEntryHash ว่างกลางโซ่
 *  แล้วเขียนต่อไปเงียบ ๆ เหมือนไม่มีอะไรเกิดขึ้น ทั้งสองอาการเกิดจากสาเหตุเดียวกัน
 *
 *  Script Property เปลี่ยนบทบาทเป็น "พยานภายนอก" ไม่ใช่ต้นทางของห่วงโซ่อีกต่อไป
 *    AUDIT_HMAC_KEY     กุญแจลงลายเซ็น ห้ามลบ ลบแล้วประวัติเดิมพิสูจน์ไม่ได้ตลอดไป
 *    AUDIT_KEY_CREATED  วันเวลาที่สร้างกุญแจ ใช้แยกแยะว่าลายเซ็นไม่ตรงเพราะข้อมูลถูกแก้ หรือเพราะกุญแจถูกสร้างใหม่
 *    AUDIT_CHAIN_START  ค่า prevEntryHash ที่แถวแรกในชีตได้รับอนุญาตให้เป็น ปกติว่าง
 *                       จะมีค่าเมื่อย้ายรายการเก่าออกไปเก็บถาวรตามรอบ retention
 *    AUDIT_LAST_HASH    entryHash ของรายการล่าสุดที่ระบบเขียน ใช้จับกรณีมีคนลบ "แถวท้าย" ทิ้ง
 *                       ซึ่งเป็นการแก้ไขชนิดเดียวที่ตัวห่วงโซ่เองตรวจไม่พบ
 *    AUDIT_TAMPER       ธงที่ auditWitness_ จดไว้เมื่อพบว่าแถวท้ายหายไป และ "ยังไม่ได้สะสาง"
 *    AUDIT_TAMPER_RESOLVED  ธงเดิมที่สะสางแล้ว เก็บเป็นประวัติพร้อมใคร/เมื่อไร/เหตุผล/ชีตเก็บถาวร
 *                       (v2.6.6) เดิมการซ่อมลบ AUDIT_TAMPER ทิ้งเฉย ๆ ผู้ตรวจจึงแยกไม่ออกว่า
 *                       "ไม่เคยเกิด" กับ "เคยเกิดแล้วสะสางแล้ว" ต่างกันอย่างไร
 * ============================================================ */

/* entryHash ของแถวท้ายในชีต Audit — อ่านจากเซลล์จริงทุกครั้ง ไม่ผ่าน READ_CACHE
   เพราะภายในคำขอเดียวอาจมีการเขียน Audit หลายรายการติดกัน ค่าที่แคชไว้จะเก่าทันที */
function auditTailHash_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return '';
  var col = headers_(sh).indexOf('entryHash') + 1;
  if (col < 1) return '';            /* ชีตรุ่นเก่ายังไม่มีคอลัมน์นี้ ให้เริ่มโซ่ใหม่ */
  return String(sh.getRange(last, col).getValue() || '');
}
/* แถวท้ายที่อ่านได้ว่าง ทั้งที่ชีตมีรายการอยู่ (รุ่น 2.8.40)
   เกิดจริงเมื่อหลายคำขอเขียน Audit ในวินาทีเดียวกัน (เช่น เปิดหน้าจัดการผู้ใช้ = ดูทะเบียน + ตรวจความพร้อม + สุขภาพระบบ พร้อมกัน)
   คำขอที่อ่านชีตไปก่อนได้ lock อาจได้ค่าที่ค้างจากการอ่านรอบก่อน แถวใหม่จึงระบุ prevEntryHash ว่าง และห่วงโซ่ "ขาด" ทั้งที่ไม่มีใครแก้ชีต */
function auditTailFresh_() {
  try { SpreadsheetApp.flush(); } catch (e) {}
  var sh = db_().getSheetByName('Audit');
  if (!sh) return { rows:0, hash:'' };
  var last = sh.getLastRow();
  if (last < 2) return { rows:0, hash:'' };
  var col = headers_(sh).indexOf('entryHash') + 1;
  if (col < 1) return { rows:last - 1, hash:'' };
  var from = Math.max(2, last - 9), vals = sh.getRange(from, col, last - from + 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (String(vals[i][0] || '')) return { rows:last - 1, hash:String(vals[i][0]), row:from + i };
  return { rows:last - 1, hash:'' };
}

/* กุญแจ HMAC สร้างครั้งเดียวตลอดอายุระบบ บันทึกวันที่สร้างไว้เพื่อวินิจฉัยย้อนหลัง */
function auditSecret_(props) {
  var secret = props.getProperty('AUDIT_HMAC_KEY');
  if (secret) return secret;
  secret = Utilities.getUuid() + Utilities.getUuid();
  props.setProperty('AUDIT_HMAC_KEY', secret);
  props.setProperty('AUDIT_KEY_CREATED', now_());
  return secret;
}

/* ตรวจว่ามีใครลบ "แถวท้าย" ของชีต Audit ทิ้งหรือไม่ — ต้องตรวจ ณ ตอนที่กำลังจะเขียนรายการใหม่
   เพราะรายการใหม่จะทับค่าพยาน AUDIT_LAST_HASH ทันที ถ้าไปตรวจตอน verifyAuditChain_ หลักฐานจะหายไปแล้ว
   การลบแถวท้ายเป็นการแก้ไขชนิดเดียวที่ตัวห่วงโซ่เองมองไม่เห็น เพราะส่วนที่เหลือยังต่อกันสนิททุกข้อ
   เมื่อพบ ให้จดไว้ถาวรใน AUDIT_TAMPER (จดครั้งแรกครั้งเดียว ไม่ทับของเดิม) แล้วเขียนรายการใหม่ต่อไปตามปกติ
   ไม่ throw เพราะการกระทำหลักของผู้ใช้สำเร็จไปแล้ว และการปิดระบบไม่ได้ทำให้ร่องรอยที่หายไปกลับมา */
function auditWitness_(props, tail) {
  var witness = props.getProperty('AUDIT_LAST_HASH');
  if (witness === null || String(witness) === String(tail)) return;
  if (props.getProperty('AUDIT_TAMPER')) return;
  /* เก็บเป็น JSON เพื่อให้หน้าตรวจแยกแสดง "วันที่ตรวจพบ" กับ "วันที่สะสาง" ได้คนละช่อง
     ตัวอ่าน (auditTamperParse_) ยังรับรูปแบบข้อความล้วนของรุ่นก่อนได้ ธงเก่าจึงไม่สูญ */
  var info = { at:now_(), expected:String(witness || ''), actual:String(tail || '') };
  info.note = auditTamperText_(info);
  props.setProperty('AUDIT_TAMPER', JSON.stringify(info));
  console.error('AUDIT_TAIL_MISSING ' + info.note);
}

/* ------------------------------------------------------------
 *  วงจรชีวิตของธงการลบแถวท้าย: ตรวจพบ → สะสาง → เก็บเป็นประวัติ
 *
 *  เดิมการซ่อม (adminRepairAuditChain_) ลบ AUDIT_TAMPER ทิ้งไปเลย เกิดผลสองอย่าง
 *  หนึ่ง หลักฐานว่าเคยเกิดอะไรเหลืออยู่แค่ในรายการแรกของห่วงโซ่ใหม่ ซึ่งจะถูกย้ายออกไปเองในการซ่อมครั้งถัดไป
 *  สอง หน้าตรวจแยกไม่ออกระหว่าง "ไม่เคยเกิด" กับ "เคยเกิดและสะสางแล้ว" ทั้งที่สองสถานะนี้
 *  ผู้ดูแลต้องรู้ต่างกัน — ถ้าธงค้างแดงตลอดหลังซ่อม ทุกคนจะเลิกอ่านสีแดงนั้น ซึ่งอันตรายกว่าตัวปัญหาเดิม
 * ------------------------------------------------------------ */
function auditHashBrief_(v) {
  v = String(v || '');
  return v ? v.slice(0, 12) + '…' : '(ไม่มีรายการ)';
}
function auditTamperText_(info) {
  return (info.at || '(ไม่ทราบเวลา)') + ' · รายการล่าสุดที่ระบบเขียนคือ ' + auditHashBrief_(info.expected) +
         ' แต่แถวท้ายของชีตคือ ' + auditHashBrief_(info.actual);
}
/* อ่านค่าธงได้ทั้งรูปแบบ JSON (ตั้งแต่ v2.6.6) และข้อความล้วน (รุ่นก่อนหน้า) — ฟังก์ชันบริสุทธิ์ ทดสอบตรงได้ */
function auditTamperParse_(raw) {
  if (!raw) return null;
  var s = String(raw);
  if (s.charAt(0) === '{') {
    try {
      var o = JSON.parse(s);
      if (o && typeof o === 'object') {
        o.at = String(o.at || '');
        o.note = String(o.note || auditTamperText_(o));
        return o;
      }
    } catch (e) { /* ข้อความที่ขึ้นต้นด้วย { แต่ไม่ใช่ JSON ให้ตกไปใช้รูปแบบเดิม */ }
  }
  return { at:(s.split(' · ')[0] || ''), expected:'', actual:'', note:s };
}
/* ย้ายธงที่ยังค้างไปเป็นประวัติ "สะสางแล้ว" โดยคัดลอกเนื้อธงเดิมทั้งก้อนไว้ใน original
   หลักฐานจึงอยู่สองที่: ที่นี่ และในรายการแรกของห่วงโซ่ใหม่ */
function auditTamperResolve_(props, opts) {
  props = props || PropertiesService.getScriptProperties();
  opts = opts || {};
  var raw = props.getProperty('AUDIT_TAMPER');
  if (!raw) return null;
  var was = auditTamperParse_(raw);
  var record = { at:was.at, note:was.note, original:String(raw), resolvedAt:now_(),
                 resolvedBy:String(opts.by || '-'), reason:String(opts.reason || ''),
                 archive:String(opts.archive || '') };
  props.setProperty('AUDIT_TAMPER_RESOLVED', JSON.stringify(record));
  props.deleteProperty('AUDIT_TAMPER');
  return record;
}
/* สามสถานะ: ค้างอยู่ (ตก) · เคยเกิดและสะสางแล้ว (ผ่าน เป็นข้อมูลประกอบ) · ไม่เคยเกิด (ผ่าน) */
function auditTailWitnessStatus_() {
  var props = PropertiesService.getScriptProperties();
  var open = auditTamperParse_(props.getProperty('AUDIT_TAMPER'));
  if (open) return { ok:false, state:'open',
    detail:'ยังไม่ได้สะสาง · ' + open.note +
           ' · ตรวจสาเหตุก่อน แล้วรัน repairAuditFromEditor("เหตุผล") ใน Apps Script editor' };
  var done = auditTamperParse_(props.getProperty('AUDIT_TAMPER_RESOLVED'));
  if (done) return { ok:true, state:'resolved',
    detail:'ไม่มีร่องรอยที่ค้างอยู่ (ข้อมูลประกอบ) · เคยตรวจพบเมื่อ ' + (done.at || 'ไม่ทราบเวลา') +
           ' · สะสางเมื่อ ' + (done.resolvedAt || '-') + ' โดย ' + (done.resolvedBy || '-') +
           (done.reason ? ' · เหตุผล: ' + done.reason : '') +
           (done.archive ? ' · ของเดิมเก็บที่ ' + done.archive : '') };
  return { ok:true, state:'clean', detail:'ไม่พบร่องรอยการลบรายการท้าย' };
}

/* ------------------------------------------------------------
 *  ป้องกันชีต Audit ไม่ให้ลบแถวด้วยมือ
 *
 *  ห่วงโซ่จับได้ว่า "มีคนแก้" แต่จับได้หลังเกิดเหตุแล้วเสมอ ด่านนี้กันไม่ให้เกิดตั้งแต่แรก
 *  ขอบเขตที่กันได้จริง: บัญชีอื่นที่มีสิทธิ์แก้ไฟล์ฐานข้อมูล (ผู้ดูแลคนอื่น ผู้ที่ได้รับแชร์)
 *  ขอบเขตที่กันไม่ได้: บัญชีเจ้าของไฟล์ ซึ่ง Google ให้สิทธิ์แก้เสมอไม่ว่าตั้งการป้องกันอย่างไร
 *  กรณีหลังยังเหลือ auditWitness_ เป็นตัวจับ และเว็บแอปตั้ง Execute as Me ทุกการเขียนจึงมาจาก
 *  บัญชีเจ้าของ การป้องกันนี้จึงไม่ขวางการทำงานปกติของระบบ
 *
 *  ทุกฟังก์ชันในกลุ่มนี้ห้าม throw เพราะถูกเรียกจากเส้นทางติดตั้งและทริกเกอร์รายเดือน
 *  การตั้งป้องกันไม่สำเร็จไม่ควรทำให้การติดตั้งหรือรอบ retention ล้มทั้งรอบ
 * ------------------------------------------------------------ */
var AUDIT_PROTECT_DESC = 'ห้ามแก้ไขด้วยมือ — ใช้ repairAuditFromEditor() / trimAuditFromEditor() เท่านั้น';

function auditProtection_(sh) {
  var ps = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var i = 0; i < ps.length; i++) if (ps[i].getDescription() === AUDIT_PROTECT_DESC) return ps[i];
  return ps.length ? ps[0] : null;   /* มีการป้องกันอยู่แล้วแต่คำอธิบายต่าง ก็ถือว่าใช้ตัวนั้น */
}
/* บัญชีที่อนุญาตให้แก้ได้: บัญชีที่สคริปต์รันอยู่ และเจ้าของไฟล์ (ถอดสิทธิ์เจ้าของไม่ได้อยู่แล้ว) */
function auditProtectAllowed_(ss) {
  var allow = {};
  try { allow[String(Session.getEffectiveUser().getEmail() || '').toLowerCase()] = 1; } catch (e) {}
  try { var o = ss.getOwner(); if (o) allow[String(o.getEmail() || '').toLowerCase()] = 1; } catch (e2) {}
  delete allow[''];
  return allow;
}
function auditProtectExtraEditors_(ss, p) {
  var allow = auditProtectAllowed_(ss), extra = [];
  /* ระบุบัญชีที่อนุญาตไม่ได้เลย = เทียบไม่ได้ ต้องไม่ถอดใครออกทั้งสิ้น
     มิฉะนั้นจะกลายเป็นการพยายามถอดสิทธิ์เจ้าของไฟล์ ซึ่งล้มเหลวและทำให้การป้องกันตั้งไม่สำเร็จทั้งชุด */
  if (!Object.keys(allow).length) return extra;
  try {
    p.getEditors().forEach(function (u) {
      var e = String(u.getEmail() || '').toLowerCase();
      if (e && !allow[e]) extra.push(e);
    });
  } catch (err) { /* การป้องกันแบบเตือนอย่างเดียวอ่านรายชื่อผู้แก้ไขไม่ได้ ให้ถือว่าไม่มีส่วนเกิน */ }
  return extra;
}
/* ตั้งหรือซ่อมการป้องกัน เรียกซ้ำได้ปลอดภัย (idempotent) */
function auditProtect_() {
  try {
    var sh = sheet_('Audit'), ss = sh.getParent();
    var p = auditProtection_(sh);
    if (!p) p = sh.protect();
    p.setDescription(AUDIT_PROTECT_DESC);
    p.setWarningOnly(false);                      /* ต้องปิดก่อน จึงจะแก้รายชื่อผู้แก้ไขได้ */
    /* เพิ่มบัญชีที่สคริปต์รันอยู่เข้าเป็นผู้แก้ไขเฉพาะเมื่อรู้อีเมลจริง
       บางบริบท Session ไม่คืนอีเมล การส่งผู้ใช้ที่ไม่มีอีเมลเข้าไปทำให้ทั้งชุดล้ม */
    var meEmail = '';
    try { meEmail = String(Session.getEffectiveUser().getEmail() || ''); } catch (eMe) {}
    if (meEmail) { try { p.addEditor(meEmail); } catch (eAdd) {} }
    var extra = auditProtectExtraEditors_(ss, p);
    if (extra.length) p.removeEditors(extra);
    try { if (p.canDomainEdit()) p.setDomainEdit(false); } catch (eDom) {}
    return { ok:true, removed:extra,
      detail:'ป้องกันแล้ว' + (extra.length ? ' · ถอดสิทธิ์แก้ไข ' + extra.length + ' บัญชี: ' + extra.slice(0, 5).join(', ') : '') };
  } catch (e) {
    console.error('AUDIT_PROTECT_FAILED ' + ((e && e.message) || e));
    return { ok:false, removed:[], detail:'ตั้งการป้องกันไม่สำเร็จ: ' + ((e && e.message) || e) };
  }
}
function auditProtectStatus_() {
  try {
    var sh = sheet_('Audit'), ss = sh.getParent();
    var p = auditProtection_(sh);
    if (!p) return { ok:false,
      detail:'ชีต Audit ยังไม่ถูกป้องกัน — บัญชีใดที่แก้ไขไฟล์ฐานข้อมูลได้ก็ลบแถวได้' +
             ' · แก้ด้วยการรัน protectAuditSheetFromEditor() ใน Apps Script editor' };
    if (p.isWarningOnly()) return { ok:false,
      detail:'ป้องกันแบบเตือนอย่างเดียว ยังลบแถวได้ · แก้ด้วยการรัน protectAuditSheetFromEditor()' };
    var extra = auditProtectExtraEditors_(ss, p);
    if (extra.length) return { ok:false,
      detail:'ป้องกันไว้แล้วแต่ยังมีบัญชีที่แก้ไขชีตนี้ได้: ' + extra.slice(0, 5).join(', ') +
             ' · แก้ด้วยการรัน protectAuditSheetFromEditor()' };
    var dom = false;
    try { dom = p.canDomainEdit(); } catch (eDom) {}
    if (dom) return { ok:false,
      detail:'ป้องกันไว้แล้วแต่ทั้งโดเมนยังแก้ไขได้ · แก้ด้วยการรัน protectAuditSheetFromEditor()' };
    return { ok:true, detail:'ป้องกันแล้ว · แก้ไขชีตนี้ได้เฉพาะบัญชีเจ้าของระบบ' };
  } catch (e) {
    return { ok:false, detail:'ตรวจการป้องกันไม่สำเร็จ: ' + ((e && e.message) || e) };
  }
}

function audit_(u, act, target, detail, outcome, errorCode) {
  var lock=LockService.getScriptLock(), acquired=false;
  try {
    if(!CURRENT_WRITE_LOCKED) { acquired=lock.tryLock(5000); if(!acquired) throw new Error('audit lock timeout'); }
    var props=PropertiesService.getScriptProperties();
    var secret=auditSecret_(props);
    var tail=auditTailHash_(sheet_('Audit'));
    var witness=props.getProperty('AUDIT_LAST_HASH');
    /* อ่านซ้ำแบบสด เมื่อแถวท้ายไม่ตรงกับรายการล่าสุดที่ระบบเขียน (2.8.40) */
    if(witness && tail!==witness){
      var fresh=auditTailFresh_();
      if(fresh.hash) tail=fresh.hash;
      /* ชีตยังมีรายการแต่อ่านแถวท้ายไม่ได้ = ค่าค้างจากการอ่าน ไม่ใช่การลบ → ต่อจากรายการล่าสุดที่ระบบเขียน */
      else if(fresh.rows>0) tail=witness;
    }
    auditWitness_(props, tail);
    var entry={ t:now_(), who:(u && u.email) || '-', role:(u && u.role) || '-',
      act:auditCell_(act,200), target:auditCell_(target,200), detail:auditCell_(detail,1000), auditId:Utilities.getUuid(),
      requestId:CURRENT_REQUEST_ID || Utilities.getUuid(), outcome:outcome || 'SUCCESS', errorCode:errorCode || '',
      beforeHash:CURRENT_BEFORE_HASH || '', afterHash:CURRENT_AFTER_HASH || '',
      changes:CURRENT_CHANGES || '', appVersion:APP_VERSION,
      prevEntryHash:tail};
    /* เซ็นบนค่าดิบเสมอ (ไม่กันสูตรตรงนี้) — auditEntryHash_ เป็นผู้กันสูตรเองตอนคำนวณแฮช
       เหตุผล: escFormula_ เติม ' นำหน้าเพื่อบอก Sheets ว่า "นี่คือข้อความล้วน" แต่ Sheets ใช้ '
       เป็นสัญญาณตอนบันทึกเท่านั้น ไม่เก็บตัว ' ไว้ในค่าเซลล์จริง อ่านกลับมาจึงได้ค่าดิบเสมอ
       (เช่น "-" ไม่ใช่ "'-") ถ้าลงลายเซ็นบนค่าที่กันสูตรไปแล้วตรงนี้ ค่าที่อ่านกลับมาตอนตรวจสอบ
       ย้อนหลังจะไม่ตรงกับที่เซ็นไว้ถาวร ทุกแถวที่ who/role เป็น "-" (คำขอที่ยังไม่ระบุตัวตน)
       จะถูกฟ้องว่าโซ่ Audit ขาดทั้งที่ไม่มีการแก้ไขข้อมูลจริง */
    entry.entryHash=auditEntryHash_(entry,secret);
    appendRow_('Audit',entry);
    props.setProperty('AUDIT_LAST_HASH',entry.entryHash);
  } catch (e) {
    /* การบันทึก Audit ล้มเหลว (เช่น lock ชนกันช่วงที่มีการเขียนพร้อมกันหนาแน่น) ต้องไม่ทำให้การกระทำหลักที่สำเร็จไปแล้ว
       (เช่น สร้าง/แก้ไขรายงาน ซึ่งถูก appendRow_/updateIncident_ ไปก่อนหน้าเรียก audit_ เสมอ) กลายเป็นคำตอบว่าล้มเหลวไปด้วย
       ผู้ใช้จะเข้าใจผิดว่าต้องลองใหม่ทั้งที่ข้อมูลถูกบันทึกแล้วจริง จึงบันทึก log ไว้ให้ผู้ดูแลตรวจสอบแทนการ throw ซ้ำ */
    console.error('AUDIT_WRITE_FAILED requestId='+(CURRENT_REQUEST_ID||'-')+' action='+(act||'-')+' '+(e&&e.message||e));
  } finally {
    if(acquired) releaseLockFlushed_(lock);
  }
}

/* Apps Script เก็บการเขียนชีตไว้เป็นชุดแล้วเขียนจริงตอนจบการทำงาน ไม่ใช่ตอนเรียก appendRow/setValues
   ถ้าปล่อย Script Lock ก่อน flush คำขอถัดไปที่รอ lock อยู่จะอ่านชีตก่อนแถวของคำขอแรกถูกเขียนลงจริง
   บั๊กจริงที่เกิด: กด "เริ่มใช้งาน" สองครั้งติดกัน registerSelf_ ของคำขอที่สองมองไม่เห็นแถวของคำขอแรก
   จึงเพิ่มแถว Users ซ้ำอีเมลเดียวกัน — ทุกจุดที่ปล่อย Script Lock หลังเขียนชีตต้องผ่านฟังก์ชันนี้ */
function releaseLockFlushed_(lock) {
  if (!lock || !lock.hasLock()) return;
  try { SpreadsheetApp.flush(); }
  catch (e) { console.error('FLUSH_BEFORE_UNLOCK_FAILED requestId=' + (CURRENT_REQUEST_ID || '-') + ' ' + (e && e.message || e)); }
  finally { lock.releaseLock(); }
}
function auditCell_(v,max){return escFormula_(txt_(v,max));}
var AUDIT_SIGNED_FIELDS=['t','who','role','act','target','detail','auditId','requestId','outcome','errorCode',
                         'beforeHash','afterHash','changes','appVersion','prevEntryHash'];
function auditEntryHash_(entry,secret){
  /* กันสูตรตรงจุดนี้จุดเดียว แล้วเซ็นบนค่าที่กันสูตรแล้วเสมอ ทั้งตอนเขียน (entry ยังเป็นค่าดิบ)
     และตอนตรวจสอบย้อนหลัง (x คือค่าที่อ่านจากชีต ก็เป็นค่าดิบเช่นกัน เพราะ Sheets ไม่เก็บ '
     ที่ dehydrate_ เติมไว้ตอนเขียน) ทั้งสองฝั่งจึงได้ค่าเดียวกันเสมอไม่ว่าค่าจะขึ้นต้นด้วย
     = + - @ หรือไม่ก็ตาม — escFormula_ เป็นฟังก์ชัน pure และ idempotent เรียกซ้ำได้อย่างปลอดภัย */
  var copy={};AUDIT_SIGNED_FIELDS.slice().sort().forEach(function(k){
    copy[k]=escFormula_(String(entry[k]===undefined||entry[k]===null?'':entry[k]));
  });
  var sig=Utilities.computeHmacSha256Signature(JSON.stringify(copy),secret,Utilities.Charset.UTF_8);
  return sig.map(function(b){var v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');
}
/* ข้อความอธิบายจุดที่ห่วงโซ่ขาด — ต้องบอกได้ว่า "แถวไหนของชีต" และ "ขาดแบบใด"
   ข้อความเดิม ("ลำดับที่ 1 ไม่ผ่านการตรวจความถูกต้อง") บอกแค่ว่าไม่ผ่าน ผู้ดูแลจึงแยกไม่ออกว่า
   เป็นการลบแถว การแทรกแถว การแก้เนื้อหา หรือกุญแจถูกสร้างใหม่ ซึ่งวิธีแก้ต่างกันคนละทาง */
function auditBreakDetail_(sheetRow, okCount, kind, x, expectPrev) {
  var head = 'แถวที่ ' + sheetRow + ' ของชีต Audit' + (x && x.t ? ' (' + x.t + ')' : '') +
             ' · ตรวจผ่านมาแล้ว ' + okCount + ' รายการ';
  var brief = function (v) { v = String(v || ''); return v ? v.slice(0, 12) + '…' : '(ว่าง)'; };
  if (kind === 'LINK') {
    return head + ' · ตัวเชื่อมไม่ตรง: แถวนี้ระบุ prevEntryHash เป็น ' + brief(x && x.prevEntryHash) +
           ' แต่ต้องเป็น ' + brief(expectPrev) +
           ' — เกิดจากมีการลบหรือแทรกแถวในชีต หรือชีตถูกล้างโดยที่ค่าอ้างอิงเดิมยังค้างอยู่' +
           ' หรือมีโปรเจกต์ Apps Script อื่น (เช่น ระบบเดิม) ที่ใช้ฐานข้อมูลเดียวกันยังทำงานอยู่' +
           ' · แก้ด้วยการรัน repairAuditFromEditor() ใน Apps Script editor';
  }
  var born = PropertiesService.getScriptProperties().getProperty('AUDIT_KEY_CREATED') || '';
  return head + ' · ลายเซ็นไม่ตรง: เนื้อหาของแถวนี้ถูกแก้ไขหลังบันทึกแล้ว หรือกุญแจ AUDIT_HMAC_KEY ถูกสร้างใหม่' +
         (born ? ' (กุญแจปัจจุบันสร้างเมื่อ ' + born + ')' : '') +
         ' · หากยืนยันว่าไม่ได้แก้ข้อมูล ให้รัน repairAuditFromEditor() เพื่อเก็บของเดิมเข้าคลังแล้วเริ่มโซ่ใหม่';
}

function verifyAuditChain_(){
  var props=PropertiesService.getScriptProperties();
  var secret=props.getProperty('AUDIT_HMAC_KEY')||'';
  var rows=readAll_('Audit');
  if(!secret) return {ok:true,detail:rows.length?'มี '+rows.length+' รายการจากรุ่นเดิม; รายการใหม่จะเริ่มลงลายเซ็น':'ยังไม่มีรายการ Audit'};

  /* จุดตั้งต้นของห่วงโซ่ ปกติเป็นค่าว่าง จะมีค่าเมื่อย้ายรายการเก่าออกไปเก็บถาวรอย่างเป็นทางการ
     ทำให้ทำรอบ retention ได้โดยไม่ทำให้การตรวจความถูกต้องพังถาวร */
  var prev=String(props.getProperty('AUDIT_CHAIN_START')||''), chained=0;
  for(var i=0;i<rows.length;i++){
    var x=rows[i];
    if(!x.entryHash) continue; /* รายการก่อน v2.2.0 เป็น legacy และไม่มี chain */
    if(String(x.prevEntryHash||'')!==prev)
      return {ok:false,detail:auditBreakDetail_(i+2,chained,'LINK',x,prev)};
    if(auditEntryHash_(x,secret)!==String(x.entryHash))
      return {ok:false,detail:auditBreakDetail_(i+2,chained,'SIGN',x,prev)};
    prev=String(x.entryHash);chained++;
  }
  /* ห่วงโซ่ตรวจการลบ "แถวท้าย" ด้วยตัวเองไม่ได้ เพราะส่วนที่เหลือยังต่อกันสนิท
     auditWitness_ จึงจดไว้ให้ตั้งแต่ตอนเขียน และตรงนี้เทียบพยานกับสภาพชีตปัจจุบันอีกชั้น
     สองด่านนี้ครอบคนละจังหวะ: ด่านแรกจับกรณีมีการเขียนต่อหลังลบ ด่านที่สองจับกรณีลบแล้วยังไม่มีใครเขียนอีกเลย */
  /* ต้องอ่านผ่าน auditTamperParse_ เสมอ ห้ามต่อค่าดิบเข้าไปในข้อความ
     เพราะตั้งแต่ v2.6.6 ธงถูกเก็บเป็น JSON ถ้าต่อค่าดิบ ผู้ดูแลจะเห็น JSON ทั้งก้อนแทนประโยคที่อ่านรู้เรื่อง */
  var flagged=auditTamperParse_(props.getProperty('AUDIT_TAMPER'));
  if(flagged)
    return {ok:false,detail:'พบว่ามีการลบรายการท้ายของชีต Audit เมื่อ '+flagged.note+
      ' · ตรวจสอบสาเหตุก่อน แล้วรัน repairAuditFromEditor("เหตุผล") หากยืนยันว่าเกิดจากการติดตั้ง ไม่ใช่การแก้ไขข้อมูล'};
  var last=String(props.getProperty('AUDIT_LAST_HASH')||'');
  if(last&&last!==prev)
    return {ok:false,detail:'รายการล่าสุดที่ระบบเคยเขียน ('+last.slice(0,12)+'…) ไม่ใช่แถวท้ายของชีต'+
      (chained?'':' และในชีตไม่เหลือรายการที่ลงลายเซ็นเลย')+
      ' — มีการลบรายการท้ายทิ้ง · ตรวจสอบก่อน แล้วรัน repairAuditFromEditor() หากยืนยันว่าเกิดจากการติดตั้ง ไม่ใช่การแก้ไขข้อมูล'};
  return {ok:true,detail:chained+' รายการที่มี HMAC ตรวจความถูกต้อง'};
}

/* ------------------------------------------------------------
 *  ซ่อมห่วงโซ่ — ไม่ทำลายข้อมูล
 *  ย้ายรายการเดิมทั้งหมดไปเก็บในชีต Audit_archive_<เวลา> ในไฟล์เดียวกัน (ป้องกันการแก้ไข)
 *  แล้วเริ่มห่วงโซ่ใหม่ พร้อมบันทึกรายการแรกที่ระบุว่าใครซ่อม เมื่อไร ย้ายไปกี่รายการ และสาเหตุเดิมคืออะไร
 *  ตัวการซ่อมเองจึงถูกบันทึกไว้ในห่วงโซ่ใหม่ ไม่ใช่การลบร่องรอยแบบไร้ที่มา
 *
 *  เรียกจาก Apps Script editor เท่านั้น (ฟังก์ชัน repairAuditFromEditor ด้านล่าง)
 *  ตั้งใจไม่เปิดเป็น API action เพราะการเริ่มห่วงโซ่ใหม่ต้องเป็นการตัดสินใจของผู้ดูแลที่หน้าเครื่อง
 *  ไม่ใช่ปุ่มที่กดผิดได้จากหน้าเว็บ
 * ------------------------------------------------------------ */
function adminRepairAuditChain_(confirm, reason) {
  var u = me_(); need_(u, 'admin');
  if (String(confirm) !== 'REPAIR')
    throw apiError_('BAD_REQUEST', 'ต้องยืนยันด้วยคำว่า REPAIR ก่อนเริ่มห่วงโซ่บันทึกร่องรอยใหม่');
  var why = String(reason || '').trim() || 'ซ่อมห่วงโซ่จาก Apps Script editor (ไม่ได้ระบุเหตุผล)';

  var before = verifyAuditChain_();
  var sh = sheet_('Audit'), ss = sh.getParent();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  var moved = Math.max(0, sh.getLastRow() - 1), archive = '';

  if (moved > 0) {
    archive = 'Audit_archive_' + stamp;
    var copy = sh.copyTo(ss);
    copy.setName(archive);
    /* copyTo คัดลอกการป้องกันของชีตต้นทางติดมาด้วย ถ้าไม่ถอดออกก่อน ชีตเก็บถาวรจะมีการป้องกันซ้อนสองชุด
       และชุดที่ติดมามีคำอธิบายว่าให้ใช้ repairAuditFromEditor() ซึ่งผิดบริบทของชีตเก็บถาวร */
    try {
      copy.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (old) { old.remove(); });
    } catch (inheritErr) { console.error('AUDIT_ARCHIVE_UNPROTECT_FAILED ' + inheritErr); }
    try { copy.protect().setDescription('สำเนาบันทึกร่องรอยก่อนเริ่มห่วงโซ่ใหม่ ' + stamp).setWarningOnly(true); }
    catch (protectErr) { console.error('AUDIT_ARCHIVE_PROTECT_FAILED ' + protectErr); }
    sh.deleteRows(2, moved);
  }

  var props = PropertiesService.getScriptProperties();
  /* สะสางธงแทนการลบทิ้ง เนื้อธงเดิมถูกเก็บไว้ทั้งก้อนใน AUDIT_TAMPER_RESOLVED
     ต้องทำก่อนเรียก audit_ ด้านล่าง เพราะรายการแรกของโซ่ใหม่ต้องอ้างถึงธงที่สะสางได้
     ลำดับนี้ยังทำให้ auditWitness_ ไม่ตั้งธงซ้ำ เพราะ AUDIT_LAST_HASH ถูกลบไปแล้วก่อนเขียน */
  var resolved = auditTamperResolve_(props, { by:(u && u.email) || '-', reason:why, archive:archive });
  props.deleteProperty('AUDIT_LAST_HASH');
  props.deleteProperty('AUDIT_CHAIN_START');
  invalidate_('Audit');
  SpreadsheetApp.flush();

  audit_(u, 'เริ่มห่วงโซ่บันทึกร่องรอยใหม่', archive || '(ไม่มีรายการเดิม)',
    'ย้ายรายการเดิม ' + moved + ' รายการไปเก็บถาวร · เหตุผล: ' + why +
    ' · สาเหตุเดิม: ' + before.detail +
    (resolved ? ' · ธงการลบรายการท้ายที่สะสางไปพร้อมกัน: ' + resolved.note : ''));

  /* การคัดลอกและลบแถวอาจทำให้การป้องกันเดิมหลุด ตั้งใหม่ทุกครั้งหลังซ่อม */
  var guard = auditProtect_();

  var after = verifyAuditChain_();
  return { moved:moved, archive:archive, before:before.detail, ok:after.ok, detail:after.detail,
           tamper:resolved ? resolved.note : '', guard:guard.detail };
}

/* รันจาก Apps Script editor: เลือกฟังก์ชันนี้แล้วกด Run แล้วดูผลใน Execution log */
function repairAuditFromEditor(reason) {
  var r = adminRepairAuditChain_('REPAIR', reason);
  Logger.log([
    r.ok ? 'ซ่อมสำเร็จ — audit-integrity ผ่านแล้ว' : 'ยังไม่ผ่าน: ' + r.detail,
    'ย้ายรายการเดิม : ' + r.moved + ' รายการ',
    'ชีตเก็บถาวร    : ' + (r.archive || '(ไม่มี)'),
    'สาเหตุเดิม     : ' + r.before,
    'ธงที่สะสาง     : ' + (r.tamper || '(ไม่มีธงค้าง)'),
    'การป้องกันชีต  : ' + r.guard,
    'สถานะปัจจุบัน  : ' + r.detail
  ].join('\n'));
  return r;
}

/* ตั้ง/ซ่อมการป้องกันชีต Audit ด้วยตัวเอง — ใช้เมื่อหน้าตรวจฟ้องว่าการป้องกันหลุด */
function protectAuditSheetFromEditor() {
  var u = me_(); need_(u, 'admin');
  var r = auditProtect_();
  audit_(u, 'ตั้งการป้องกันชีตบันทึกร่องรอย', 'Audit', r.detail, r.ok ? 'SUCCESS' : 'FAILED');
  Logger.log(r.detail);
  return r;
}

/* ดูสถานะธงและการป้องกันโดยไม่แก้อะไร — ใช้วินิจฉัยก่อนตัดสินใจซ่อม */
function auditFlagStatus() {
  /* เดิมไม่มีด่านเลย บัญชีใดในโดเมนก็เรียกผ่าน google.script.run แล้วอ่านสถานะห่วงโซ่และแฮชได้ */
  assertEditorOrAdmin_();
  var props = PropertiesService.getScriptProperties();
  var w = auditTailWitnessStatus_(), g = auditProtectStatus_(), chain = verifyAuditChain_();
  var out = ['=== สถานะบันทึกร่องรอย ===',
    'ห่วงโซ่        : ' + (chain.ok ? 'ผ่าน' : 'ไม่ผ่าน') + ' · ' + chain.detail,
    'ธงการลบท้าย   : ' + w.state + ' · ' + w.detail,
    'การป้องกันชีต  : ' + (g.ok ? 'ผ่าน' : 'ต้องแก้') + ' · ' + g.detail,
    'แถวท้ายในชีต   : ' + auditHashBrief_(auditTailHash_(sheet_('Audit'))),
    'AUDIT_LAST_HASH: ' + auditHashBrief_(props.getProperty('AUDIT_LAST_HASH')),
    'AUDIT_CHAIN_START: ' + auditHashBrief_(props.getProperty('AUDIT_CHAIN_START'))].join('\n');
  Logger.log(out);
  return out;
}

/* สะสางธงที่ค้างโดยไม่ตัดห่วงโซ่ — ใช้เมื่อยืนยันแล้วว่าเหตุเกิดจากการติดตั้งหรือการย้ายข้อมูล
   ไม่ใช่การแก้ไขข้อมูล และห่วงโซ่ปัจจุบันตรวจผ่านอยู่แล้ว บังคับให้ระบุเหตุผลเสมอ
   เพราะร่องรอยที่ถูกปิดโดยไม่มีคำอธิบายคือร่องรอยที่หายไปเฉย ๆ */
function resolveAuditTamperFromEditor(reason) {
  var u = me_(); need_(u, 'admin');
  var why = String(reason || '').trim();
  if (!why) throw apiError_('VALIDATION_FAILED',
    'ต้องระบุเหตุผล เช่น resolveAuditTamperFromEditor("ล้างชีตตอนติดตั้งใหม่ 2026-08-29")');
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('AUDIT_TAMPER')) { Logger.log('ไม่มีธงค้างอยู่'); return { resolved:false, detail:'ไม่มีธงค้างอยู่' }; }
  var r = auditTamperResolve_(props, { by:(u && u.email) || '-', reason:why });
  audit_(u, 'สะสางธงการลบรายการท้าย', 'Audit', 'เหตุผล: ' + why + ' · ธงเดิม: ' + r.note);
  Logger.log('สะสางธงแล้วเมื่อ ' + r.resolvedAt + ' · ธงเดิม: ' + r.note);
  return { resolved:true, detail:r.note, resolvedAt:r.resolvedAt };
}

/* ย้ายรายการเก่าออกจากชีต Audit ตามรอบ retention โดยห่วงโซ่ยังตรวจสอบได้
   ต่างจาก repairAuditFromEditor ตรงที่ "ไม่ตัดโซ่" แต่เลื่อนจุดตั้งต้นไปที่แถวแรกที่เหลืออยู่
   ใช้เมื่อชีตโตจนตรวจช้า — เรียกจาก editor เท่านั้น เช่น trimAuditFromEditor(2000) = เก็บ 2000 รายการล่าสุด */
/* ย้ายรายการเก่าออกจากชีต Audit โดยห่วงโซ่ยังตรวจสอบได้
   ต่างจาก repairAuditFromEditor ตรงที่ "ไม่ตัดโซ่" แต่เลื่อนจุดตั้งต้น (AUDIT_CHAIN_START)
   ไปที่ prevEntryHash ของแถวแรกที่เหลืออยู่ ห่วงโซ่จึงต่อเนื่องข้ามการย้ายได้
   actor = ผู้ลงมือ ใช้ระบุใน Audit ว่าเป็นคนสั่งเองหรือทริกเกอร์รายเดือน */
function trimAuditChain_(keep, actor) {
  keep = Math.max(100, Number(keep) || Number(CONFIG.AUDIT_KEEP) || 2000);

  /* ห้ามย้ายขณะที่ห่วงโซ่ยังขาด มิฉะนั้นจุดตั้งต้นใหม่จะไปยึดกับแถวที่ยังพิสูจน์ไม่ได้
     แล้วความผิดปกติเดิมจะถูกกลบหายไปพร้อมกับรายการที่ย้ายออก */
  var chk = verifyAuditChain_();
  if (!chk.ok) return { moved:0, skipped:true, ok:false,
    detail:'ห่วงโซ่ยังไม่ผ่านการตรวจ ต้องซ่อมให้ผ่านก่อนจึงย้ายรายการเก่าได้: ' + chk.detail };

  var sh = sheet_('Audit'), ss = sh.getParent();
  var total = Math.max(0, sh.getLastRow() - 1);
  /* ช่วงผ่อนผัน: ตัวย้ายเองเขียนรายการ Audit หนึ่งแถวทุกครั้งที่ทำงาน ถ้าเทียบกับเพดานตรง ๆ
     เดือนถัดไปยอดจะเกินอยู่ 1 แถวเสมอ แล้วย้ายซ้ำทุกเดือนเดือนละแถว เกิดชีตเก็บถาวรที่มีข้อมูลแถวเดียว
     สะสมปีละ 12 แผ่นโดยไม่ได้ลดภาระอะไรเลย จึงรอให้เกินพอสมควรก่อนจึงย้ายทีเดียว */
  var slack = Math.max(100, Math.floor(keep * 0.25));
  if (total <= keep + slack) return { moved:0, skipped:true, ok:true,
    detail:'มี ' + total + ' รายการ ยังไม่ถึงเกณฑ์ย้าย (' + (keep + slack) + ' รายการ) ไม่ต้องย้าย' };

  var cut = total - keep;                                   /* จำนวนแถวที่จะย้ายออก */
  var head = headers_(sh);
  var prevCol = head.indexOf('prevEntryHash') + 1;
  if (prevCol < 1) return { moved:0, skipped:true, ok:false, detail:'ไม่พบคอลัมน์ prevEntryHash' };
  var anchor = String(sh.getRange(2 + cut, prevCol).getValue() || '');   /* prevEntryHash ของแถวแรกที่เหลือ */

  /* ชื่อชีตซ้ำทำให้ insertSheet โยนข้อผิดพลาดและงานล้มทั้งรอบ เติมลำดับต่อท้ายเมื่อชนกัน
     (เกิดได้เมื่อผู้ดูแลสั่งย้ายเองในวินาทีเดียวกับที่ทริกเกอร์รายเดือนกำลังทำงาน) */
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  var name = 'Audit_archive_' + stamp;
  for (var n = 2; ss.getSheetByName(name); n++) name = 'Audit_archive_' + stamp + '_' + n;
  var arch = ss.insertSheet(name);
  arch.getRange(1, 1, 1, head.length).setValues([head]);
  /* ค่าที่อ่านกลับจากชีตเป็นค่าดิบเสมอ (Sheets ไม่เก็บอัญประกาศที่ escFormula_ เติมไว้)
     ถ้าคัดลอกลงชีตเก็บถาวรตรง ๆ ข้อความที่ขึ้นต้นด้วย = + - @ จะกลายเป็นสูตรที่ทำงานจริงในชีตใหม่
     จึงกันสูตรซ้ำอีกครั้งตอนคัดลอก */
  arch.getRange(2, 1, cut, head.length).setValues(
    sh.getRange(2, 1, cut, head.length).getValues().map(function (row) {
      return row.map(function (v) { return typeof v === 'string' ? escFormula_(v) : v; });
    }));
  try { arch.protect().setDescription('บันทึกร่องรอยที่ย้ายออกตามรอบ retention ' + stamp).setWarningOnly(true); }
  catch (e) { console.error('AUDIT_ARCHIVE_PROTECT_FAILED ' + e); }

  sh.deleteRows(2, cut);
  /* การย้ายออกตามรอบนี้เป็นการลบแถว "หัว" ไม่ใช่แถวท้าย พยาน AUDIT_LAST_HASH จึงยังตรงอยู่
     ไม่ต้องแตะ และไม่เกิดธง AUDIT_TAMPER */
  PropertiesService.getScriptProperties().setProperty('AUDIT_CHAIN_START', anchor);
  PropertiesService.getScriptProperties().setProperty('LAST_AUDIT_ARCHIVE', now_());
  invalidate_('Audit');
  SpreadsheetApp.flush();
  auditProtect_();                     /* การลบแถวหัวอาจทำให้ขอบเขตการป้องกันเดิมหลุด ตั้งใหม่ทุกรอบ */

  audit_(actor, 'ย้ายบันทึกร่องรอยเก่าไปเก็บถาวร', arch.getName(),
    'ย้าย ' + cut + ' รายการ · คงเหลือในชีต ' + keep + ' รายการ');

  var after = verifyAuditChain_();
  return { moved:cut, archive:arch.getName(), ok:after.ok, detail:after.detail };
}

/* เรียกเองจาก Apps Script editor เมื่อต้องการย้ายทันที เช่น trimAuditFromEditor(2000) */
function trimAuditFromEditor(keep) {
  var u = me_(); need_(u, 'admin');
  var r = trimAuditChain_(keep, u);
  Logger.log(r.moved ? ('ย้าย ' + r.moved + ' รายการไปยัง ' + r.archive + '\n' +
                        (r.ok ? 'ห่วงโซ่ยังตรวจผ่าน: ' : 'ผิดพลาด: ') + r.detail)
                     : r.detail);
  return r;
}

/* ทริกเกอร์รายเดือน — ไม่มี Session ของผู้ใช้ จึงไม่เรียก me_()/need_()
   และไม่ throw เมื่อยังไม่ถึงเกณฑ์หรือห่วงโซ่ขาด เพราะทริกเกอร์ที่ throw จะส่งอีเมลแจ้งเจ้าของทุกเดือน
   จนกลายเป็นเสียงรบกวนที่ทุกคนเลิกอ่าน กรณีที่ต้องรู้จริงคือห่วงโซ่ขาด ซึ่งหน้าตรวจความพร้อมรายงานอยู่แล้ว */
function archiveAuditMonthly_() {
  var actor = SYSTEM_ACTOR;
  try {
    var r = trimAuditChain_(Number(CONFIG.AUDIT_KEEP) || 2000, actor);
    Logger.log(r.moved ? ('ย้ายบันทึกร่องรอย ' + r.moved + ' รายการไปยัง ' + r.archive) : r.detail);
    if (!r.ok) console.error('AUDIT_ARCHIVE_SKIPPED ' + r.detail);
    return r;
  } catch (e) {
    console.error('AUDIT_ARCHIVE_FAILED ' + (e && e.stack || e));
    return { moved:0, ok:false, detail:String(e && e.message || e) };
  }
}

/* ============================================================
 *  8. แจ้งเตือนทางอีเมล
 * ============================================================ */
/* ชื่อเรื่องที่ใส่ในอีเมลได้ — แหล่งเดียวของกติกาปิดบังเรื่องอ่อนไหวในอีเมล
   อีเมลส่งถึงบทบาทที่ไม่มีสิทธิ์อ่านเรื่องอ่อนไหว (เช่น คปอ. กองอาคารสถานที่) และค้างอยู่ในกล่องจดหมายถาวร */
function mailTitle_(r) { return isSensitive_(r.cats) ? '(ข้อมูลอ่อนไหว — เปิดดูในระบบ)' : String(r.title || ''); }

function notify_(rec, actor, level) {
  if (level < CONFIG.NOTIFY_LEVEL) return;
  try {
    var all = readAll_('Users').filter(function (x) { return x.active; });
    var users = all.filter(function (x) {
      /* หัวหน้างานของหน่วยงานที่เกิดเหตุคือคนที่ต้องยืนยันข้อเท็จจริงเป็นขั้นถัดไป
         เดิมตกหล่นจากรายชื่อผู้รับแจ้ง ทั้งที่ตารางระดับความรุนแรงวางไว้เป็นลำดับที่สองของสายรายงาน
         จำกัดเฉพาะหน่วยงานที่เกิดเหตุ ไม่ส่งถึงหัวหน้างานทุกหน่วยในคณะ */
      if (x.role === 'supervisor') return sameFaculty_(x.faculty, rec.faculty) && sameOrgUnit_(x.orgUnit, rec.orgUnit);
      if (FACULTY_NOTIFY_ROLES.indexOf(x.role) >= 0) return sameFaculty_(x.faculty, rec.faculty);
      if (UNIVERSITY_NOTIFY_ROLES.indexOf(x.role) < 0) return false;
      return level >= (UNIVERSITY_NOTIFY_MIN_LEVEL[x.role] || CONFIG.NOTIFY_LEVEL);
    });
    /* คณะที่ยังไม่มีผู้ใช้ในบทบาทเหล่านี้เลย (เช่น ยังไม่มี คปอ. หรือยังไม่ได้กำหนดสิทธิ์)
       ต้องไม่ทำให้การแจ้งเตือนเงียบหาย จึงส่งถึงกองอาคารสถานที่และผู้ดูแลระบบแทน */
    if (!users.length) users = all.filter(function (x) { return FALLBACK_NOTIFY_ROLES.indexOf(x.role) >= 0; });
    if (!users.length) { Logger.log('ไม่มีผู้รับการแจ้งเตือนสำหรับ ' + rec.faculty); return; }

    var body = [
      'มีอุบัติการณ์ระดับ ' + level + ' ที่ต้องดำเนินการตามตารางระดับความรุนแรง',
      '',
      'เลขที่      : ' + rec.id,
      'เรื่อง       : ' + mailTitle_(rec),
      'คณะ/หน่วยงาน : ' + rec.faculty + ' / ' + rec.orgUnit,
      'วันเวลา     : ' + rec.date + ' ' + rec.time,
      /* เรื่องอ่อนไหว (คุกคาม/ภาวะวิกฤต) สถานที่และพิกัดระบุตัวบุคคลได้ จึงไม่ใส่ในอีเมล — เปิดดูในระบบ */
      'สถานที่     : ' + (isSensitive_(rec.cats) ? '(ข้อมูลอ่อนไหว — เปิดดูในระบบ)'
                         : rec.place + (rec.mapUrl ? '\nแผนที่      : ' + rec.mapUrl : '')),
      '',
      'ตารางระดับความรุนแรง กำหนดให้แจ้งด้วยวาจาภายใน 1 ชั่วโมง และรายงานเป็นลายลักษณ์อักษรภายใน 24 ชั่วโมง',
      level >= 3 ? 'ระดับนี้ต้องรายงาน ' + SEV_UNI[level] : '',
      '',
      'เปิดเรื่องนี้ในระบบ: ' + appUrl_() + '?incident=' + encodeURIComponent(rec.id)
    ].join('\n');

    MailApp.sendEmail({
      to      : users.map(function (x) { return x.email; }).join(','),
      subject : '[' + CONFIG.SYSTEM_NAME + '] อุบัติการณ์ระดับ ' + level + ' — ' + rec.id,
      body    : body
    });
    /* บันทึกร่องรอยการส่ง (จำนวนและบทบาทผู้รับ ไม่บันทึกอีเมล) เพื่อตรวจย้อนหลังได้ว่าผู้บริหารได้รับแจ้งเมื่อไร */
    var byRole = {};
    users.forEach(function (x) { byRole[x.role] = (byRole[x.role] || 0) + 1; });
    try { audit_(actor && actor.role ? actor : SYSTEM_ACTOR, 'ส่งอีเมลแจ้งเตือน', rec.id,
      'ระดับ ' + level + ' · ผู้รับ ' + users.length + ' คน · ' +
      Object.keys(byRole).map(function (k) { return k + ' ' + byRole[k]; }).join(', ')); } catch (ignore) {}
  } catch (e) {
    Logger.log('ส่งอีเมลไม่สำเร็จ: ' + e.message);
    /* อีเมลส่งไม่ออก (เช่น โควตารายวันเต็ม) ต้องเห็นได้ในบันทึกการใช้งาน ไม่ใช่เงียบหายใน Logger */
    try { audit_(actor && actor.role ? actor : SYSTEM_ACTOR, 'ส่งอีเมลแจ้งเตือนไม่สำเร็จ', rec.id,
      'ระดับ ' + level + ' · ' + String(e && e.message || e).slice(0, 200), 'FAILED', 'MAIL_FAILED'); } catch (ignore2) {}
  }
}

/* ============================================================
 *  8.5 แจ้งเตือนมาตรการแก้ไขที่เกินกำหนด
 *      ติดตั้งทริกเกอร์ด้วยฟังก์ชัน installTriggers_ ครั้งเดียว
 * ============================================================ */
function installTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['notifyOverdueCapa_','cleanupExpiredAttachments_','backupDatabase_','archiveAuditMonthly_','syncAttachmentAccess_','onUsersRegistryEdit_'].indexOf(t.getHandlerFunction())>=0) ScriptApp.deleteTrigger(t);
  });
  /* nearMinute(0): ส่งช่วง 07:45–08:15 น. — ถ้าไม่ระบุ Google สุ่มนาทีในชั่วโมง 08:00–08:59 (รุ่น 2.8.36) */
  ScriptApp.newTrigger('notifyOverdueCapa_').timeBased().everyDays(1).atHour(8).nearMinute(0).create();
  ScriptApp.newTrigger('cleanupExpiredAttachments_').timeBased().everyDays(1).atHour(2).create();
  ScriptApp.newTrigger('backupDatabase_').timeBased().everyDays(1).atHour(1).create();
  /* ย้ายบันทึกร่องรอยเก่าไปเก็บถาวรทุกวันที่ 1 เวลา 03:00 น. — หลังรอบสำรองข้อมูล 01:00 น.
     สำเนาของวันนั้นจึงมีรายการครบก่อนถูกย้ายออกเสมอ */
  ScriptApp.newTrigger('archiveAuditMonthly_').timeBased().onMonthDay(1).atHour(3).create();
  /* ปรับสิทธิ์ใน Drive ตามทะเบียนผู้ใช้ทุกวัน (ผู้แก้ไขทะเบียน + ผู้เปิดไฟล์แนบ) เป็นตาข่ายรองของการนัดทันที */
  ScriptApp.newTrigger('syncAttachmentAccess_').timeBased().everyDays(1).atHour(4).create();
  /* บันทึกร่องรอยทุกการแก้ทะเบียนผู้ใช้ในชีตโดยตรง */
  ScriptApp.newTrigger('onUsersRegistryEdit_').forSpreadsheet(usersDb_()).onEdit().create();
  var msg = 'ตั้งการแจ้งเตือน CAPA 08:00 น. ล้างไฟล์ pending หมดอายุ 02:00 น. สำรองฐานข้อมูล 01:00 น. ' +
            'ย้ายบันทึกร่องรอยเก่าไปเก็บถาวรทุกวันที่ 1 เวลา 03:00 น. ปรับสิทธิ์ทะเบียนผู้ใช้และไฟล์แนบ 04:00 น. ' +
            'และบันทึกร่องรอยการแก้ทะเบียนผู้ใช้ในชีต เรียบร้อย';
  Logger.log(msg);
  return msg;
}

/* ---- สำรองข้อมูลรายวัน ----
   ทำสำเนาทั้งฐานข้อมูลอุบัติการณ์และทะเบียนผู้ใช้ไว้ในโฟลเดอร์ "สำรองข้อมูล"
   เก็บย้อนหลังแยกตามชนิดไฟล์ตาม CONFIG.BACKUP_KEEP วัน
   การกู้คืน: ฐานข้อมูลหลักให้เปลี่ยน Script Property ชื่อ SS_ID
   ส่วนทะเบียนผู้ใช้ให้เปลี่ยน Script Property ชื่อ USERS_SS_ID หรือแก้ CONFIG.USERS_SS_ID
   ขั้นตอนเต็มอยู่ในคู่มือติดตั้ง หัวข้อ "สำรองและกู้คืนข้อมูล" */
function backupFolder_() {
  var props = PropertiesService.getScriptProperties();
  var system = systemFolder_();
  var existing = aliveFolderById_(props.getProperty('BACKUP_FOLDER_ID'));
  if (existing) { moveIntoIfLoose_(existing, system); return existing; }
  var folder = getOrCreateChildFolder_(system, 'สำรองข้อมูล');
  props.setProperty('BACKUP_FOLDER_ID', folder.getId());
  return folder;
}

function backupDatabase_(e) {
  var ss     = db_();
  var users  = usersDb_();
  var folder = backupFolder_();
  var stamp  = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var dbName = CONFIG.DB_NAME + ' สำรอง ' + stamp;
  var userName = String(CONFIG.USERS_DB_NAME || 'NU-Incident-Users') + ' สำรอง ' + stamp;
  var copy   = DriveApp.getFileById(ss.getId()).makeCopy(dbName, folder);
  var usersCopy = DriveApp.getFileById(users.getId()).makeCopy(userName, folder);
  var keep   = Number(CONFIG.BACKUP_KEEP) || 30;
  /* ลบสำเนาเก่าแยกแต่ละชนิด มิฉะนั้นเมื่อมี 2 ไฟล์ต่อวัน ค่า 30 จะเหลือจริงเพียง 15 วัน */
  var files = [], it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); files.push({ f:f, t:f.getDateCreated().getTime() }); }
  var removed = 0;
  [CONFIG.DB_NAME, String(CONFIG.USERS_DB_NAME || 'NU-Incident-Users')].forEach(function(prefix) {
    files.filter(function(x){ return String(x.f.getName()).indexOf(prefix + ' สำรอง ') === 0; })
      .sort(function (a, b) { return b.t - a.t; })
      .slice(keep)
      .forEach(function (x) { try { x.f.setTrashed(true); removed++; } catch (e) {} });
  });
  PropertiesService.getScriptProperties().setProperty('LAST_BACKUP', now_());
  var msg = 'สำรองฐานข้อมูลและทะเบียนผู้ใช้เรียบร้อย: ' + dbName + ' · ' + userName +
    (removed ? ' · ลบสำเนาเก่า ' + removed + ' ไฟล์' : '');
  Logger.log(msg);
  /* เรียกจากทริกเกอร์ (มี event object) ต้องบันทึกร่องรอยเอง เรียกจาก adminBackup_ ผู้เรียกบันทึกพร้อมชื่อผู้ดูแลแล้ว */
  if (e && e.triggerUid) audit_(SYSTEM_ACTOR, 'สำรองฐานข้อมูลอัตโนมัติ', copy.getId(), msg);
  return { message:msg, fileId:copy.getId(), url:copy.getUrl(), usersFileId:usersCopy.getId(),
           usersUrl:usersCopy.getUrl(), at:now_(), keptPerType:keep };
}

function adminBackup_() {
  var u = me_(); need_(u, 'admin');
  var res = backupDatabase_();
  audit_(u, 'สำรองฐานข้อมูล', res.fileId, res.message);
  return res;
}

function cleanupExpiredAttachments_() {
  /* เขียนทับทั้งแถวจากค่าที่อ่านไว้ จึงต้องถือ lock เดียวกับ claimAttachments_ (ใน createIncident_)
     มิฉะนั้นแถวที่เพิ่งถูกผูกกับรายงานระหว่างรอบนี้จะถูกเขียนกลับเป็น expired และไฟล์ถูกทิ้งลงถังขยะ */
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(30000)) { console.error('ATTACHMENT_CLEANUP_SKIPPED lock busy'); return 'ข้ามรอบนี้ ระบบกำลังบันทึกข้อมูลอื่น'; }
  try {
  var sh=sheet_('Attachments');
  if(sh.getLastRow()<2) return 'ไม่มีไฟล์ pending';
  var rows=sh.getDataRange().getValues(), head=rows[0], current=now_(), removed=0;
  for(var i=1;i<rows.length;i++){
    var rec={};head.forEach(function(h,j){rec[h]=rows[i][j];});
    if(rec.status==='pending'&&fmtStamp_(rec.expiresAt)<current){
      try{DriveApp.getFileById(rec.driveFileId).setTrashed(true);}catch(e){console.error('ATTACHMENT_CLEANUP '+rec.attachmentId+' '+e.message);}
      rec.status='expired';rec.uploadToken='';
      /* เขียนผ่าน dehydrate_ เช่นเดียวกับ claimAttachments_ เพื่อไม่ให้ชื่อไฟล์ที่เคยถูกกันสูตรไว้
         กลับมาเป็นสูตรที่ทำงานจริงเมื่อเขียนแถวซ้ำ */
      sh.getRange(i+1,1,1,head.length).setValues([dehydrate_(rec, head)]);
      removed++;
    }
  }
  invalidate_('Attachments');
  } finally { releaseLockFlushed_(lock); }
  if(removed) audit_(SYSTEM_ACTOR,'ล้างไฟล์แนบที่หมดอายุ','Attachments','ย้ายลงถังขยะ '+removed+' ไฟล์');
  return 'หมดอายุ '+removed+' ไฟล์';
}

function notifyOverdueCapa_(e) {
  var today = today_();
  /* กันส่งซ้ำในวันเดียวกัน — ใช้เฉพาะการเรียกจากทริกเกอร์ (มี e) การกด Run เองใน editor ยังส่งได้ตามปกติเพื่อทดสอบ
     รุ่น 2.8.44: อีเมล 2 ฉบับของวันที่ 19–20/10/2569 มาจากโปรเจกต์เดียวกัน (รหัสโปรเจกต์ท้ายอีเมลตรงกัน) สาเหตุมี 2 ข้อ
     (1) audit_ ที่เรียกระหว่างส่งขอ Script Lock ซ้ำแล้วปล่อยเอง ทำให้ lock ของรอบนี้หลุดตั้งแต่ส่งฉบับแรกเสร็จ
     (2) OVERDUE_SENT_DATE เขียนตอนจบ รอบที่สองที่รอ lock อยู่จึงเข้ามาก่อนค่านี้ถูกเขียน และส่งซ้ำ
     แก้: เขียน OVERDUE_SENT_DATE ก่อนส่ง (Script Properties เขียนทันที ไม่รอ flush) และตั้ง CURRENT_WRITE_LOCKED
     ระหว่างถือ lock เพื่อให้ audit_ ใช้ lock เดิมโดยไม่ปล่อย */
  var lock = null, props = PropertiesService.getScriptProperties();
  if (e) {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return 'มีการส่งอีเมลมาตรการเกินกำหนดอยู่แล้ว';
    if (props.getProperty('OVERDUE_SENT_DATE') === today) { releaseLockFlushed_(lock); return 'ส่งอีเมลของวันนี้ไปแล้ว'; }
    props.setProperty('OVERDUE_SENT_DATE', today);
    /* หลายโปรเจกต์ที่ผูกฐานข้อมูลเดียวกันทำงานนาทีเดียวกัน (รุ่น 2.8.43) — จองสิทธิ์ในไฟล์ฐานข้อมูลก่อน ให้ส่งได้โปรเจกต์เดียว */
    if (!claimOverdueRun_(today)) { releaseLockFlushed_(lock); return 'โปรเจกต์อื่นเป็นผู้ส่งอีเมลของวันนี้'; }
    CURRENT_WRITE_LOCKED = true;
  }
  try { return notifyOverdueCapaRun_(today, !e); }
  finally {
    if (e) { CURRENT_WRITE_LOCKED = false; try { releaseLockFlushed_(lock); } catch (ignore) {} }
  }
}
/* จองสิทธิ์ส่งอีเมลมาตรการเกินกำหนดของวันนี้ (รุ่น 2.8.43)
   Script Lock / Script Properties แยกกันต่อโปรเจกต์ ถ้ามีหลายโปรเจกต์ (เช่น สำเนาหรือระบบเดิม) ทำงานพร้อมกัน
   ทุกโปรเจกต์จะเห็นว่ายังไม่มีใครส่ง แล้วส่งซ้ำกัน — จึงเขียนการจองลง Developer Metadata ของไฟล์ฐานข้อมูล (ทุกโปรเจกต์เห็นร่วมกัน)
   รอให้การจองของโปรเจกต์อื่นที่ทำงานพร้อมกันเขียนเสร็จ แล้วให้ผู้จองก่อนเป็นผู้ส่งเพียงโปรเจกต์เดียว
   ถ้าอ่าน/เขียนการจองไม่ได้ ให้ส่งตามเดิม (ส่งซ้ำดีกว่าไม่ส่ง) */
var OVERDUE_CLAIM_KEY = 'nuIncidentOverdueClaim';
function claimOverdueRun_(today) {
  try {
    var ss = db_(), id = String(ScriptApp.getScriptId());
    var read = function () {
      return ss.getDeveloperMetadata().filter(function (m) { return m.getKey() === OVERDUE_CLAIM_KEY; }).map(function (m) {
        var v = {}; try { v = JSON.parse(m.getValue()); } catch (e) {}
        return { m:m, d:v.d, id:v.id, ms:Number(v.ms) || 0 };
      });
    };
    read().forEach(function (c) { if (c.d !== today) { try { c.m.remove(); } catch (ignore) {} } });
    ss.addDeveloperMetadata(OVERDUE_CLAIM_KEY, JSON.stringify({ d:today, id:id, ms:Date.now(), v:APP_VERSION, t:now_() }));
    SpreadsheetApp.flush();
    Utilities.sleep(6000);
    /* ผู้จองก่อนเป็นผู้ส่ง (เวลาเท่ากันใช้รหัสโปรเจกต์ตัดสิน) — โปรเจกต์ที่มาทีหลังจึงไม่ส่งซ้ำแม้รหัสน้อยกว่า */
    var claims = read().filter(function (c) { return c.d === today && c.id; }).sort(function (a, b) {
      return a.ms - b.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
    return !claims.length || claims[0].id === id;
  } catch (e) {
    Logger.log('จองสิทธิ์ส่งอีเมลไม่สำเร็จ: ' + e.message);
    return true;
  }
}

/* รหัสท้ายของโปรเจกต์ Apps Script ที่ส่ง ใช้แยกว่าอีเมลซ้ำมาจากโปรเจกต์ใด (รุ่น 2.8.41) */
function projectTag_() {
  try { return '…' + String(ScriptApp.getScriptId()).slice(-6); } catch (e) { return '-'; }
}
/* คณะที่ได้อีเมลมาตรการเกินกำหนดของวันนี้แล้ว อ่านจาก 300 แถวท้ายของชีต Audit */
function overdueSentFaculties_(today) {
  var out = {};
  try {
    var sh = sheet_('Audit'), last = sh.getLastRow();
    if (last < 2) return out;
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var it = head.indexOf('t'), ia = head.indexOf('act'), ig = head.indexOf('target');
    if (it < 0 || ia < 0 || ig < 0) return out;
    var n = Math.min(300, last - 1);
    sh.getRange(last - n + 1, 1, n, head.length).getValues().forEach(function (r) {
      if (r[ia] === 'ส่งอีเมลมาตรการเกินกำหนด' && fmtStamp_(r[it]).slice(0, 10) === today) out[canonUnit_(r[ig])] = true;
    });
  } catch (e) { Logger.log('อ่านประวัติการส่งไม่สำเร็จ: ' + e.message); }
  return out;
}

function notifyOverdueCapaRun_(today, manual) {
  var rows  = readAll_('Incidents').filter(function (r) {
    return r.status !== 'closed' && r.status !== CANCELLED && r.capa.some(function (c) {
      return !c.done && c.due && String(c.due).slice(0, 10) < today;
    });
  });
  if (!rows.length) return 'ไม่มีมาตรการเกินกำหนด';

  var users = readAll_('Users').filter(function (u) { return u.active; });
  var byFaculty = {};
  rows.forEach(function (r) { var f = canonUnit_(r.faculty); (byFaculty[f] = byFaculty[f] || []).push(r); });
  var appUrl = appUrl_();

  var sent = 0, proj = projectTag_();
  /* อ่านว่าวันนี้คณะใดได้อีเมลแล้วจากชีต Audit ในฐานข้อมูล (รุ่น 2.8.41) — ใช้ร่วมกันทุกโปรเจกต์ที่ผูกฐานข้อมูลนี้
     ตัวกันใน Script Properties (2.8.38) เห็นเฉพาะโปรเจกต์ตัวเอง จึงกันโปรเจกต์อื่นที่ส่งซ้ำไม่ได้ */
  var already = manual ? {} : overdueSentFaculties_(today);   /* กด Run เองใน editor ยังส่งได้เพื่อทดสอบ */
  Object.keys(byFaculty).forEach(function (fac) {
    if (already[canonUnit_(fac)]) { Logger.log('ข้าม ' + fac + ' — ส่งอีเมลของวันนี้ไปแล้ว'); return; }
    var pick = users.filter(function (u) {
      if (OVERDUE_FACULTY_ROLES.indexOf(u.role) >= 0) return sameFaculty_(u.faculty, fac);
      return OVERDUE_UNIVERSITY_ROLES.indexOf(u.role) >= 0;
    });
    if (!pick.length) pick = users.filter(function (u) { return FALLBACK_NOTIFY_ROLES.indexOf(u.role) >= 0; });
    var to = pick.map(function (u) { return u.email; });
    if (!to.length) { Logger.log('ไม่มีผู้รับการแจ้งเตือนของ ' + fac); return; }

    var lines = byFaculty[fac].map(function (r) {
      var late = r.capa.filter(function (c) { return !c.done && c.due && String(c.due).slice(0, 10) < today; });
      /* เรื่องอ่อนไหวส่งเฉพาะจำนวนและวันครบกำหนด ไม่ส่งชื่อเรื่อง ตัวมาตรการ หรือผู้รับผิดชอบ
         เดิมอีเมลนี้ใส่ r.title และเนื้อมาตรการตรง ๆ ทั้งที่อีเมลแจ้งเหตุ (notify_) ปิดบังไว้แล้ว
         ผู้รับกลุ่มนี้มี คปอ. และกองอาคารสถานที่ ซึ่งไม่มีสิทธิ์อ่านเรื่องอ่อนไหวในระบบ */
      /* ลิงก์ตรงไปที่เรื่อง (รุ่น 2.8.13) ผู้รับกดแล้วเปิดหน้ารายละเอียดเพื่อบันทึกผลการติดตามได้ทันที */
      var link = '\n    เปิดเรื่อง: ' + appUrl + '?incident=' + encodeURIComponent(r.id);
      if (isSensitive_(r.cats)) return r.id + ' — ' + mailTitle_(r) + '\n    · มาตรการเกินกำหนด ' + late.length +
        ' รายการ (กำหนดเร็วที่สุด ' + late.map(function (c) { return String(c.due).slice(0, 10); }).sort()[0] + ')' + link;
      return r.id + ' — ' + mailTitle_(r) + '\n' + late.map(function (c) {
        var days = Math.round((new Date(today) - new Date(String(c.due).slice(0, 10))) / 86400000);
        return '    · ' + c.m + ' (ผู้รับผิดชอบ ' + c.who + ', กำหนด ' + String(c.due).slice(0, 10) +
               (days > 0 ? ' · เกิน ' + days + ' วัน' : '') + ')';
      }).join('\n') + link;
    }).join('\n\n');

    try {
      MailApp.sendEmail({
        to: to.join(','),
        subject: '[' + CONFIG.SYSTEM_NAME + '] มาตรการแก้ไขเกินกำหนด ' + byFaculty[fac].length + ' เรื่อง — ' + fac,
        body: ['มาตรการแก้ไขและป้องกันต่อไปนี้เลยวันกำหนดแล้วเสร็จ และยังไม่ได้บันทึกว่าดำเนินการแล้ว', '', lines, '',
               'กรุณาติดตามกับผู้รับผิดชอบ แล้วให้หัวหน้าสำนักงานเลขานุการ/ผู้ได้รับมอบหมาย หรือรองคณบดี (กำกับดูแล)',
               'บันทึกผลการติดตามและติ๊กมาตรการที่แล้วเสร็จในระบบ (ปุ่ม "บันทึกผลการติดตามเพิ่มเติม" ในหน้ารายละเอียด)', '',
               'เปิดระบบ: ' + appUrl, '',
               '— ส่งอัตโนมัติจากระบบรุ่น ' + APP_VERSION + ' · โปรเจกต์ ' + proj].join('\n')
      });
      sent++;
      try { audit_(SYSTEM_ACTOR, 'ส่งอีเมลมาตรการเกินกำหนด', fac,
        byFaculty[fac].length + ' เรื่อง · ผู้รับ ' + to.length + ' คน · โปรเจกต์ ' + proj); } catch (ignore) {}
    } catch (e) {
      Logger.log('ส่งอีเมลเตือนไม่สำเร็จ: ' + e.message);
      try { audit_(SYSTEM_ACTOR, 'ส่งอีเมลมาตรการเกินกำหนดไม่สำเร็จ', fac,
        String(e && e.message || e).slice(0, 200), 'FAILED', 'MAIL_FAILED'); } catch (ignore2) {}
    }
  });
  var out = 'พบ ' + rows.length + ' เรื่องที่มีมาตรการเกินกำหนด ส่งอีเมลแล้ว ' + sent + ' ฉบับ';
  Logger.log(out);
  return out;
}

/* ---- คำสั่งดูแลระบบที่เรียกผ่าน API Gateway ได้ ----
   ผูกกับ API_ACTIONS จึงผ่าน middleware ตรวจสิทธิ์และบันทึก Audit เหมือนคำสั่งอื่น */
function adminInstallTriggers_() {
  var u = me_(); need_(u, 'admin');
  var msg = installTriggers_();
  audit_(u, 'ติดตั้งทริกเกอร์อัตโนมัติ', '', msg);
  return { message:msg, triggers:ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }) };
}

function adminSetupStorage_() {
  var u = me_(); need_(u, 'admin');
  var msg = setupStorage_();
  audit_(u, 'ตรวจโครงสร้างโฟลเดอร์ไฟล์แนบ', '', msg);
  return { message:msg };
}

/* ---- ทดสอบระบบอัตโนมัติ ----
   ตรวจ schema, สัญญา API, สิทธิ์, ขอบเขตข้อมูล และการตั้งค่า แบบอ่านอย่างเดียว ไม่แก้ไขข้อมูลใด ๆ
   จึงรันซ้ำได้ตลอดโดยไม่มีผลข้างเคียง เกาะกับ API_ACTIONS/ROLES/STATUS_CAP/ERROR_STATUS โดยตรง
   เพื่อจับความไม่ตรงกันของสัญญาระบบเอง (เช่น action ที่ชี้ไปยังฟังก์ชันที่ไม่มีอยู่จริง)
   ก่อนที่จะไปโผล่เป็น ReferenceError ตอนโหลดสคริปต์จริงกับผู้ใช้ */
function adminSelfTest_() {
  var u = me_(); need_(u, 'admin');
  var checks = [];
  var add = function (component, ok, detail) { checks.push({ component:component, ok:!!ok, detail:String(detail || '') }); };

  /* schema + การตั้งค่า: systemHealth_ เป็นแหล่งความจริงเดียวของสองหมวดนี้อยู่แล้ว ไม่เขียนตรวจซ้ำที่นี่ */
  systemHealth_().checks.forEach(function (c) { checks.push(c); });

  /* สัญญา API — ทุก action ใน API_ACTIONS ต้องมีฟังก์ชันจริงรองรับ
     ช่องโหว่นี้เคยเกิดจริงกับ admin.selfTest เอง: อ้างฟังก์ชันที่ยังไม่มี ทำให้ทั้งสคริปต์โหลดไม่ขึ้นเลยแม้แต่ action อื่น */
  Object.keys(API_ACTIONS).forEach(function (name) {
    var def = API_ACTIONS[name];
    add('api-contract:' + name, typeof def.fn === 'function',
      typeof def.fn === 'function' ? 'พร้อมใช้งาน' : 'ไม่มีฟังก์ชันรองรับ action นี้');
  });

  /* คำสั่งที่แก้ไขเรื่องเดิมต้องบังคับ expectedVersion ทุกตัว มิฉะนั้นข้าม optimistic locking ได้เงียบ ๆ */
  /* ดึงรายการจาก API_ACTIONS เอง ไม่เขียนรายชื่อซ้ำ — เดิมตกหล่น incident.return ที่เพิ่มภายหลัง */
  Object.keys(API_ACTIONS).filter(function (name) { return /^incident\./.test(name) && API_ACTIONS[name].method === 'PATCH'; })
    .forEach(function (name) {
      var def = API_ACTIONS[name];
      add('api-contract:needsVersion:' + name, !!(def && def.needsVersion),
        def && def.needsVersion ? 'บังคับ expectedVersion' : 'ไม่ได้บังคับ expectedVersion — เขียนทับงานคนอื่นได้เงียบ ๆ');
    });

  /* ทะเบียนรหัสข้อผิดพลาดต้องครอบคลุมรหัสที่ API-SPEC.md ประกาศไว้ว่าใช้งานจริงทั้งหมด */
  var expectedCodes = ['BAD_REQUEST','UNSUPPORTED_API_VERSION','ACTION_NOT_FOUND','AUTH_REQUIRED',
    'ACCOUNT_PENDING','ACCOUNT_INACTIVE','FORBIDDEN','NOT_FOUND','VALIDATION_FAILED','CONFLICT',
    'VERSION_CONFLICT','ATTACHMENT_REJECTED','RATE_LIMITED','LOCK_BUSY','NOT_INSTALLED','INTERNAL_ERROR'];
  var missingCodes = expectedCodes.filter(function (c) { return !ERROR_STATUS[c]; });
  add('api-contract:error-codes', missingCodes.length === 0,
    missingCodes.length ? 'ขาดรหัส ' + missingCodes.join(', ') + ' ใน ERROR_STATUS' : 'ครบตาม API-SPEC.md');

  /* สิทธิ์ — ทุกสถานะใน STATUS_ORDER (ยกเว้น submitted ซึ่งเป็นขั้นเริ่มต้น) ต้องมีสิทธิ์กำกับใน STATUS_CAP
     ขั้นที่ตกหล่นจากตารางนี้จะกลายเป็นขั้นที่ใครก็เดินได้ (ดู advanceStatus_) */
  STATUS_ORDER.slice(1).forEach(function (status) {
    var cap = STATUS_CAP[status];
    add('permission:status-cap:' + status, !!cap, cap ? 'ต้องมีสิทธิ์ ' + cap : 'ไม่มีสิทธิ์กำกับ — ทุกบทบาทเดินขั้นนี้ได้');
  });

  /* สิทธิ์ที่ STATUS_CAP อ้างถึงต้องมีบทบาทใดบทบาทหนึ่งถือครองอยู่จริง มิฉะนั้นไม่มีใครเดินขั้นนั้นได้เลย */
  var allCaps = {};
  Object.keys(ROLES).forEach(function (r) { Object.keys(ROLES[r].can).forEach(function (c) { allCaps[c] = 1; }); });
  Object.keys(STATUS_CAP).forEach(function (status) {
    var cap = STATUS_CAP[status];
    add('permission:cap-reachable:' + cap, !!allCaps[cap],
      allCaps[cap] ? 'มีบทบาทที่ถือสิทธิ์นี้' : 'ไม่มีบทบาทใดใน ROLES ถือสิทธิ์ ' + cap + ' เลย');
  });

  /* ทุกบทบาทต้องมี scope ที่ inScope_/scoped_ รู้จัก มิฉะนั้นแถวของบทบาทนั้นจะถูกกรองผิดแบบเงียบ ๆ */
  var knownScopes = { own:1, orgUnit:1, faculty:1, all:1 };
  Object.keys(ROLES).forEach(function (role) {
    add('permission:role-scope:' + role, !!knownScopes[ROLES[role].scope],
      ROLES[role].scope + (knownScopes[ROLES[role].scope] ? ' (รู้จัก)' : ' (ไม่รู้จัก — inScope_ จะกรองผิด)'));
  });

  /* ขอบเขตข้อมูล — ผู้ดูแลระบบมี scope 'all' ต้องเห็นครบทุกแถวเสมอ ใช้เป็นฐานเปรียบเทียบให้บทบาทอื่น
     อ่านอย่างเดียวผ่าน scoped_ ตัวเดียวกับที่ทุก action อื่นใช้ ไม่เขียนเงื่อนไขกรองซ้ำ */
  var totalIncidents = readAll_('Incidents').length;
  var adminVisible = scoped_(u, readAll_('Incidents')).length;
  add('data-scope:admin-sees-all', adminVisible === totalIncidents, adminVisible + ' / ' + totalIncidents + ' แถว');

  /* ประเภทข้อมูลอ่อนไหวต้องมีรายการกำหนดไว้ มิฉะนั้น isSensitive_ จะไม่ปิดบังอะไรเลย */
  add('data-scope:sensitive-categories', Array.isArray(SENSITIVE_CATS) && SENSITIVE_CATS.length > 0,
    (SENSITIVE_CATS || []).length + ' ประเภท');

  var ready = checks.every(function (x) { return x.ok; });
  audit_(u, 'ทดสอบระบบอัตโนมัติ', '', (ready ? 'ผ่านทั้งหมด' : 'พบปัญหา') + ' ' + checks.length + ' รายการตรวจ');
  return { ready:ready, version:APP_VERSION, checks:checks };
}

/* ============================================================
 *  9. ตัวช่วยดูแลระบบ (รันจากหน้า Editor)
 * ============================================================ */

/* ฟังก์ชันนี้ "ต้องไม่" ลงท้ายด้วย _ เพราะช่อง Run ของ Apps Script Editor
   ไม่แสดงชื่อฟังก์ชันที่ลงท้ายด้วย _ จึงรัน setup_ จาก Editor ไม่ได้เลย
   จึงเป็นข้อยกเว้นเดียวของกติกา "เปิดเฉพาะ api() และ doGet()"
   และกันการเรียกจาก Browser ด้วยการบังคับว่าผู้เรียกต้องเป็นเจ้าของสคริปต์เอง
   ขั้นตอน: เลือก setupFromEditor → Run → อนุญาตสิทธิ์ → ดูลิงก์ใน Execution log */
/* ---- ใส่ dropdown ให้ชีตทะเบียนผู้ใช้ (รันจาก Apps Script Editor ครั้งเดียว) ----
   จุดประสงค์คือกันการพิมพ์บทบาทผิดตั้งแต่ตอนกรอกในชีต ซึ่งเป็นเส้นทางที่ไม่ผ่านการตรวจของหน้าเว็บ
   รายชื่อบทบาทดึงจาก ROLES โดยตรง จึงไม่มีวันหลุดจากกันเมื่อเพิ่มบทบาทใหม่ในอนาคต
   ส่วนรายชื่อหน่วยงานไม่ได้เก็บไว้ในไฟล์นี้โดยตั้งใจ (แหล่งความจริงอยู่ที่ ORG ใน Index.html)
   จึงอ่านจากคอลัมน์ A ของแท็บ "หน่วยงาน" ซึ่งตรงกับแม่แบบนำเข้า */
var ROLE_REF_SHEET_NAME = 'บทบาท';
var UNIT_REF_SHEET_NAME = 'หน่วยงาน';

function setupUsersDropdownsFromEditor() {
  assertEditor_();

  var sh   = sheet_('Users');
  var ss   = sh.getParent();
  var head = headers_(sh);
  var roleRef = ss.getSheetByName(ROLE_REF_SHEET_NAME) || ss.insertSheet(ROLE_REF_SHEET_NAME);
  var unitRef = ss.getSheetByName(UNIT_REF_SHEET_NAME) || ss.insertSheet(UNIT_REF_SHEET_NAME);

  /* คอลัมน์ A ของแท็บบทบาทเขียนทับทุกครั้งให้ตรงกับ ROLES ปัจจุบัน
     คอลัมน์ A ของแท็บหน่วยงานเป็นรายชื่อทางการ ผู้ดูแลเป็นผู้ปรับเมื่อโครงสร้างเปลี่ยน */
  var roles = Object.keys(ROLES);
  roleRef.getRange(1, 1).setValue('role').setFontWeight('bold');
  if (roleRef.getLastRow() > 1) roleRef.getRange(2, 1, roleRef.getLastRow() - 1, 1).clearContent();
  roleRef.getRange(2, 1, roles.length, 1).setValues(roles.map(function (r) { return [r]; }));
  roleRef.setColumnWidth(1, 200);
  if (!String(unitRef.getRange(1, 1).getValue() || '').trim())
    unitRef.getRange(1, 1).setValue('ชื่อหน่วยงาน (ใช้ในคอลัมน์ faculty และ unit)').setFontWeight('bold');
  unitRef.setColumnWidth(1, 420);

  var rows = Math.max(200, sh.getMaxRows() - 1);
  if (sh.getMaxRows() < rows + 1) sh.insertRowsAfter(sh.getMaxRows(), rows + 1 - sh.getMaxRows());
  var done = [];

  /* บทบาท: บังคับให้เลือกจากรายการเท่านั้น ค่าที่ระบบเขียนเอง (reporter) อยู่ในรายการอยู่แล้ว */
  var roleCol = head.indexOf('role') + 1;
  if (roleCol > 0) {
    sh.getRange(2, roleCol, rows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInRange(roleRef.getRange(2, 1, roles.length, 1), true)
        .setAllowInvalid(false)
        .setHelpText('เลือกบทบาทจากรายการ · faculty_admin = ผู้ดูแลระดับคณะ (เห็นเฉพาะคณะของตนเอง)')
        .build());
    done.push('role (' + roles.length + ' บทบาท รวม faculty_admin)');
  }

  /* active: ใช้ checkbox เพราะระบบเขียนค่าเป็น boolean ไม่ใช่ข้อความ TRUE/FALSE */
  var activeCol = head.indexOf('active') + 1;
  if (activeCol > 0) {
    sh.getRange(2, activeCol, rows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireCheckbox()
        .setHelpText('ติ๊ก = เปิดใช้งานทันที · ไม่ติ๊กและ approvedAt ว่าง = รออนุมัติ · ไม่ติ๊กและมี approvedAt = ระงับการใช้งาน')
        .build());
    done.push('active (checkbox)');
  }

  /* หน่วยงาน: เตือนอย่างเดียว ไม่ปฏิเสธ เพราะทะเบียนเดิมอาจมีชื่อที่ยังไม่ได้ปรับให้ตรง
     ถ้าตั้งเป็นปฏิเสธ การแก้ชื่อเก่าให้ถูกต้องจะทำได้ยากกว่าเดิม */
  var units = unitRef.getLastRow() > 1
    ? unitRef.getRange(2, 1, unitRef.getLastRow() - 1, 1).getValues()
        .filter(function (r) { return String(r[0] || '').trim(); }).length
    : 0;
  if (units) {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(unitRef.getRange(2, 1, units, 1), true)
      .setAllowInvalid(true)
      .setHelpText('ต้องตรงกับชื่อหน่วยงานทางการทุกตัวอักษร มิฉะนั้นรายงานจะไม่ถึงผู้รับผิดชอบ')
      .build();
    ['faculty', 'unit'].forEach(function (name) {
      var col = head.indexOf(name) + 1;
      if (col > 0) { sh.getRange(2, col, rows, 1).setDataValidation(rule); done.push(name); }
    });
  }

  var msg = 'ใส่ dropdown เรียบร้อย: ' + (done.join(' · ') || 'ไม่พบคอลัมน์ที่รองรับ') +
    '\nชีต: ' + ss.getUrl() + ' · แท็บ ' + sh.getName() +
    (units ? '' : '\nยังไม่ได้ใส่ dropdown ของคณะ — วางรายชื่อหน่วยงานทางการลงคอลัมน์ A ของแท็บ "' +
      UNIT_REF_SHEET_NAME + '" แล้วรันฟังก์ชันนี้อีกครั้ง');
  Logger.log(msg);
  return msg;
}

function setupFromEditor() {
  assertEditor_();
  var active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  var out = setup_() + '\n\n' + setupUsersDropdownsFromEditor() + '\n\n' + installTriggers_() +
    '\n\n' + syncRegistryEditors_() +
    '\n\nผู้ดูแลระบบที่ตรวจสอบแล้ว: ' +
    (String(CONFIG.FIRST_ADMIN || '').trim().toLowerCase() || active);
  Logger.log(out);
  return out;
}

/* ตรวจการติดตั้งจาก Editor โดยไม่แก้ข้อมูล ใช้ยืนยันก่อน Deploy เวอร์ชันใหม่ */
function verifyInstallationFromEditor() {
  assertEditor_();
  var active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();

  var props = PropertiesService.getScriptProperties();
  var main = db_();
  var users = usersDb_();
  var sh = configuredUsersSheet_(users);
  var have = headers_(sh);
  var missing = SHEETS.Users.filter(function(h){ return have.indexOf(h) < 0; });
  var first = readAll_('Users').filter(function(x){
    return String(x.email || '').trim().toLowerCase() ===
      (String(CONFIG.FIRST_ADMIN || active).trim().toLowerCase());
  })[0] || null;
  var checks = [
    {name:'ฐานข้อมูลหลัก', ok:!!props.getProperty('SS_ID'), detail:main.getUrl()},
    {name:'ทะเบียนผู้ใช้แยกไฟล์', ok:main.getId() !== users.getId(), detail:users.getUrl()},
    {name:'หัวคอลัมน์ Users', ok:missing.length === 0, detail:missing.length ? 'ขาด ' + missing.join(', ') : 'ครบ 10 คอลัมน์'},
    {name:'ผู้ดูแลคนแรก', ok:!!(first && first.active && first.role === 'admin'),
      detail:first ? first.email + ' · role=' + first.role + ' · active=' + first.active : 'ไม่พบบัญชี'}
  ];
  var out = ['=== ผลตรวจการติดตั้ง v' + APP_VERSION + ' ==='].concat(checks.map(function(c){
    return (c.ok ? 'ผ่าน' : 'ไม่ผ่าน') + ' · ' + c.name + ' · ' + c.detail;
  })).join('\n');
  Logger.log(out);
  return out;
}

/* เดิมชื่อ showLinks_ — ซ่อนจากเมนู Run เช่นกัน */
function showLinksFromEditor() {
  assertEditorOrAdmin_();
  var props = PropertiesService.getScriptProperties();
  var out = 'โฟลเดอร์ระบบ : ' + systemFolder_().getUrl() + '\n'
          + 'Google Sheet : ' + SpreadsheetApp.openById(props.getProperty('SS_ID')).getUrl() + '\n'
          + 'ทะเบียนสิทธิ์ : ' + usersDb_().getUrl() + ' · แท็บ ' + configuredUsersSheet_(usersDb_()).getName() + '\n'
          + 'โฟลเดอร์ภาพ  : ' + DriveApp.getFolderById(props.getProperty('ATT_FOLDER_ID')).getUrl();
  Logger.log(out);
  return out;
}

