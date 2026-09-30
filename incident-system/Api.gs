/* ============================================================
 * API Gateway v1 — จุดเรียกสาธารณะเพียงจุดเดียวจาก Index.html
 * ฟังก์ชันงานทั้งหมดลงท้าย _ จึงไม่เปิดให้ google.script.run เรียกข้าม middleware
 * ============================================================ */
var API_VERSION = 'v1';
var CURRENT_REQUEST_ID = '';
var CURRENT_EXPECTED_VERSION = null;
var CURRENT_BEFORE_HASH = '';
var CURRENT_AFTER_HASH = '';
var CURRENT_CHANGES = '';
/* มีค่าเมื่อหน้าเว็บต้องใช้ Google ID token: ทั้ง doPost() จากเว็บภายนอก และ fallback
   ผ่าน google.script.run ในกรณี Session ไม่คืนอีเมล เส้นทางปกติยังใช้ Session ตามเดิม */
var CURRENT_ID_TOKEN = '';
var CURRENT_VERIFIED_EMAIL = '';
var CURRENT_WRITE_LOCKED = false;

/* needsVersion : คำสั่งที่แก้ไขเรื่องเดิม ต้องส่ง expectedVersion มาด้วยเสมอ
                   ถ้าไม่บังคับที่นี่ ผู้เรียกที่ไม่ส่งค่ามาจะข้าม optimistic locking ไปได้ทั้งดุ้น
   auditRead    : คำสั่งอ่านที่ต้องทิ้งร่องรอย (ทะเบียนผู้ใช้ บันทึกตรวจสอบ สุขภาพระบบ)
                  บันทึกที่ gateway จุดเดียว ไม่ต้องให้แต่ละ service จำเอง */
var API_ACTIONS = {
  'auth.config':                { fn:getAuthConfig_,         method:'GET'  },
  'auth.diagnose':              { fn:diagnose_,              method:'GET'  },
  'auth.bootstrap':             { fn:getBootstrap_,          method:'GET'  },
  'auth.register':              { fn:registerSelf_,          method:'POST' },
  'incident.list':              { fn:refresh_,               method:'GET'  },
  'admin.backup':               { fn:adminBackup_,           method:'POST' },
  'admin.selfTest':             { fn:adminSelfTest_,         method:'POST' },
  'incident.create':            { fn:createIncident_,        method:'POST' },
  'incident.assess':            { fn:assessIncident_,        method:'PATCH', needsVersion:1 },
  'incident.transition':        { fn:advanceStatus_,         method:'PATCH', needsVersion:1 },
  'incident.suggest':           { fn:addSuggestion_,         method:'PATCH', needsVersion:1 },
  'incident.reportUniversity':  { fn:reportToUniversity_,    method:'PATCH', needsVersion:1 },
  'incident.cancel':            { fn:cancelIncident_,        method:'PATCH', needsVersion:1 },
  /* ส่งเรื่องกลับขั้นก่อนหน้าแทนการยกเลิกทั้งเรื่อง — ดู RETURN_MAP ใน Code.gs
     เป็นการแก้ไขเรื่องเดิม จึงต้องส่ง expectedVersion และจับ Script Lock เหมือนคำสั่งแก้ไขอื่น */
  'incident.return':            { fn:returnIncident_,        method:'PATCH', needsVersion:1 },
  /* แก้ไขข้อมูลที่ผู้รายงานกรอก — ช่องที่แก้ได้กำหนดที่ EDIT_FIELDS ใน Code.gs จุดเดียว */
  'incident.edit':              { fn:editIncident_,          method:'PATCH', needsVersion:1 },
  'attachment.upload':          { fn:uploadAttachment_,      method:'POST' },
  /* ทะเบียนจำนวนบุคลากรรายหน่วยงาน — ตัวหารของ IFR/PDFR/ISR
     อ่านได้ทุกบัญชีที่ใช้งานอยู่ (เป็นตัวเลขบริหารจัดการ ไม่ใช่ข้อมูลรายบุคคล) แต่เห็นเฉพาะในขอบเขตของตน
     การบันทึกใช้ method PATCH เพื่อให้จับ Script Lock ก่อนเขียนทับทั้งตาราง กันสองคนบันทึกพร้อมกันแล้วทับกัน
     ไม่ตั้ง needsVersion เพราะทะเบียนนี้ไม่มีคอลัมน์ version รายแถวแบบชีต Incidents */
  'org.headcount.list':         { fn:orgHeadcountList_,      method:'GET'  },
  'org.headcount.save':         { fn:orgHeadcountSave_,      method:'PATCH'},
  'admin.user.list':            { fn:adminListUsers_,        method:'GET',   auditRead:'ดูทะเบียนผู้ใช้และสิทธิ์' },
  'admin.user.update':          { fn:adminSaveUser_,         method:'PATCH'},
  'admin.readiness':            { fn:adminCheckUsers_,       method:'POST' },
  'admin.installTriggers':      { fn:adminInstallTriggers_,  method:'POST' },
  'admin.setupStorage':         { fn:adminSetupStorage_,     method:'POST' },
  'export.log':                 { fn:logExport_,             method:'POST' },
  'audit.list':                 { fn:adminListAudit_,        method:'GET',   auditRead:'ดูบันทึกร่องรอยการตรวจสอบ' },
  'system.health':              { fn:systemHealth_,          method:'GET',   auditRead:'ตรวจสุขภาพระบบ' }
};

function api(req) {
  var started = new Date().getTime();
  CURRENT_REQUEST_ID = requestId_(req && req.requestId);
  CURRENT_EXPECTED_VERSION = req && req.expectedVersion !== undefined ? Number(req.expectedVersion) : null;
  CURRENT_BEFORE_HASH = '';
  CURRENT_AFTER_HASH = '';
  CURRENT_CHANGES = '';
  /* รับเฉพาะโทเคนที่เป็นสตริงขนาดสมเหตุสมผล validateApiRequest_ ยังปฏิเสธค่าผิดรูปอีกชั้น */
  CURRENT_ID_TOKEN = (req && typeof req.idToken === 'string' && req.idToken.length <= 5000) ? req.idToken : '';
  try {
    /* นับอัตราก่อนตรวจรูปแบบคำขอ คำขอผิดรูปที่ยิงรัวต้องถูกจำกัดด้วย
       เดิมตรวจรูปแบบก่อน คำขอเสียทุกครั้งจึงเขียนบันทึก "API ล้มเหลว" ลง Audit ได้ไม่จำกัด */
    enforceRateLimit_(req && typeof req.action === 'string' && own_(API_ACTIONS, req.action) ? req.action : '*');
    validateApiRequest_(req);
    var def = API_ACTIONS[req.action];
    /* ไม่ส่ง expectedVersion มา = เขียนทับงานของคนอื่นได้เงียบ ๆ จึงปฏิเสธตั้งแต่ประตูหน้า
       หน้าจอส่งค่านี้ให้อยู่แล้วทุกคำสั่งที่แก้ไขเรื่องเดิม (ดู incidentVersionFor ใน Index.html) */
    if (def.needsVersion && !(CURRENT_EXPECTED_VERSION > 0))
      throw apiError_('BAD_REQUEST', 'คำสั่งนี้ต้องอ้างอิงเวอร์ชันของข้อมูลที่กำลังแก้ไข กรุณาโหลดหน้าเว็บใหม่แล้วลองอีกครั้ง');
    var args = normalizeActionArgs_(req.action, req.payload || {});
    var run = function () { return def.fn.apply(null, args); };
    var data;
    if (def.method === 'PATCH' || req.action === 'auth.register') {
      var lock = LockService.getScriptLock();
      try { lock.waitLock(20000); CURRENT_WRITE_LOCKED=true; data = run(); }
      catch(lockErr){
        if(lockErr&&lockErr.apiCode) throw lockErr;
        if(!lock.hasLock()) throw apiError_('LOCK_BUSY','ระบบกำลังประมวลผลคำขออื่น กรุณาลองใหม่ใน 2-3 วินาที');
        throw lockErr;
      }
      finally { CURRENT_WRITE_LOCKED=false; releaseLockFlushed_(lock); }
    } else data = run();
    /* บันทึกการอ่านที่ต้องมีร่องรอย หลังจากรู้แล้วว่าคำสั่งผ่านสิทธิ์และทำงานสำเร็จ
       ใช้ me_() ซึ่งอ่านจากแคชภายในคำสั่งเดียวกัน จึงไม่เพิ่มการอ่านชีต */
    if (def.auditRead) audit_(me_(), def.auditRead, req.action, '');
    return apiSuccess_(data, started);
  } catch (e) {
    var err = classifyError_(e);
    console.error('API_ERROR requestId='+CURRENT_REQUEST_ID+' action='+(req&&req.action||'-')+' code='+err.code+' detail='+String(e&&e.stack||e&&e.message||e));
    /* คำขอที่ถูกจำกัดอัตราซ้ำ ๆ บันทึกลง Audit เฉพาะครั้งแรกของหน้าต่างเวลา ไม่ให้ Audit ท่วม */
    if (!(e && e.skipAudit)) try {
      var actor = { email:'-', role:'-' };
      try { actor = me_(); } catch (ignore) {}
      audit_(actor, 'API ล้มเหลว', req && req.action || '', 'รหัส '+err.code, 'FAILED', err.code);
    } catch (ignore2) {}
    return apiFailure_(err, started);
  } finally {
    CURRENT_EXPECTED_VERSION = null;
    CURRENT_BEFORE_HASH = '';
    CURRENT_AFTER_HASH = '';
    CURRENT_CHANGES = '';
    CURRENT_ID_TOKEN = '';
    CURRENT_VERIFIED_EMAIL = '';
    CURRENT_WRITE_LOCKED = false;
  }
}

/* ---- สะพาน HTTP สำหรับหน้าเว็บที่ไม่ได้ served จาก Apps Script เอง เช่น server ของมหาวิทยาลัย ----
   หน้าเว็บที่ served จาก Apps Script (ผ่าน doGet ปกติ) ยังคุยผ่าน google.script.run เหมือนเดิม ไม่ผ่านทางนี้
   รับ/ส่ง envelope แบบเดียวกับ RPC ทุกประการ ต่างกันแค่ชั้นขนส่ง จึงไม่มี business logic ซ้ำในไฟล์นี้เลย
   ผู้เรียกต้องส่ง Content-Type: text/plain เพื่อให้ browser ไม่ยิง CORS preflight (OPTIONS) ที่ Apps Script ไม่รองรับ
   การยืนยันตัวตนใช้ payload.idToken (Google ID token จาก Google Identity Services) แทน Session.getActiveUser()
   เพราะทางนั้นใช้ได้เฉพาะหน้าเว็บที่ served จาก Apps Script เท่านั้น ดู verifyIdToken_ ใน Code.gs
   หมายเหตุสำคัญ: HTTP status ของการตอบกลับจาก Apps Script เป็น 200 เสมอไม่ว่าคำสั่งจะสำเร็จหรือไม่
   ผู้เรียกต้องอ่านผลจริงจาก field "ok"/"status" ใน body เท่านั้น อย่าอิง HTTP status code */
function doPost(e) {
  var started = new Date().getTime();
  var req;
  try {
    var body=(e && e.postData && e.postData.contents) || '';
    if(body.length>36*1024*1024) throw apiError_('BAD_REQUEST','ข้อมูลคำขอมีขนาดใหญ่เกินกำหนด');
    req = JSON.parse(body);
  } catch (parseErr) {
    var safeErr=parseErr&&parseErr.apiCode?parseErr:apiError_('BAD_REQUEST', 'เนื้อหาคำขอไม่ใช่ JSON ที่ถูกต้อง');
    return jsonOutput_(apiFailure_(classifyError_(safeErr), started));
  }
  return jsonOutput_(api(req));
}
function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---- ข้อจำกัดอัตราการเรียกต่อผู้ใช้ต่อหน้าต่างเวลา ----
   กันการยิงคำสั่งรัวจนกินโควตาเวลาทำงานของบัญชีที่ Deploy ทั้งระบบ
   นับด้วย CacheService เป็นแบบ fixed window จึงเป็นการกันแบบหยาบ ไม่ใช่ security control
   ตัวเลขตั้งให้สูงกว่าการใช้งานปกติมาก ผู้ใช้ทั่วไปจะไม่ชน */
var RATE_LIMITS = {
  'auth.config':       { max:60,  windowSec:3600 },
  'auth.diagnose':     { max:60,  windowSec:3600 },
  'incident.create':   { max:30,  windowSec:3600 },
  'admin.backup':      { max:12,  windowSec:3600 },
  'attachment.upload': { max:120, windowSec:3600 },
  'auth.register':     { max:10,  windowSec:3600 },
  /* การบันทึกทะเบียนบุคลากรเขียนทับทั้งตารางในครั้งเดียว จึงไม่ควรถูกยิงรัว ๆ */
  'org.headcount.save':{ max:60,  windowSec:3600 },
  'export.log':        { max:60,  windowSec:3600 },
  '*':                 { max:900, windowSec:3600 }
};

/* ค้นตาราง config ด้วย hasOwnProperty เสมอ — action อย่าง "constructor" ได้ค่าจาก Object.prototype
   ถ้าใช้ TABLE[action] ตรง ๆ จะผ่านด่าน ACTION_NOT_FOUND แล้วไปพังเป็น INTERNAL_ERROR ข้างใน */
function own_(table, key) { return Object.prototype.hasOwnProperty.call(table, String(key)); }

function enforceRateLimit_(action) {
  var cfg = own_(RATE_LIMITS, action) ? RATE_LIMITS[action] : RATE_LIMITS['*'];
  var email;
  try { email = currentEmail_(); }
  catch (e) {
    /* auth.config ต้องเรียกได้แม้ Session ไม่เปิดเผยอีเมล เพื่อให้หน้า Login รับ OAuth Client ID
       ใช้ temporary key ที่ไม่เปิดเผยตัวตนเป็น rate-limit key แทนการปล่อยคำขอสาธารณะโดยไม่จำกัด */
    try { email = 'anonymous:' + Session.getTemporaryActiveUserKey(); }
    catch (ignore) { email = 'anonymous'; }
  }
  try {
    var cache  = CacheService.getScriptCache();
    var bucket = Math.floor(new Date().getTime() / (cfg.windowSec * 1000));
    var key    = 'rl_' + action + '_' + bucket + '_' + String(email).toLowerCase();
    var n      = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(n), cfg.windowSec + 60);
    if (n > cfg.max) {
      var limited = apiError_('RATE_LIMITED',
        'เรียกใช้คำสั่งนี้ถี่เกินกำหนด กรุณารอสักครู่แล้วลองใหม่ หากจำเป็นต้องใช้งานปริมาณมากกรุณาแจ้งผู้ดูแลระบบ');
      limited.skipAudit = n > cfg.max + 1;
      throw limited;
    }
  } catch (e2) {
    if (e2 && e2.apiCode === 'RATE_LIMITED') throw e2;      /* ปัญหาของ Cache เองต้องไม่ทำให้ระบบใช้ไม่ได้ */
  }
}

function validateApiRequest_(req) {
  if (!req || typeof req !== 'object') throw apiError_('BAD_REQUEST', 'รูปแบบคำขอไม่ถูกต้อง');
  var reqKeys=Object.keys(req), allowedReq={apiVersion:1,action:1,requestId:1,payload:1,expectedVersion:1,idToken:1};
  if(reqKeys.some(function(k){return !allowedReq[k];})) throw apiError_('BAD_REQUEST','คำขอมี field ที่ไม่รองรับ');
  if(typeof req.action!=='string'||req.action.length>80) throw apiError_('BAD_REQUEST','action ไม่ถูกต้อง');
  if(req.idToken!==undefined&&(typeof req.idToken!=='string'||req.idToken.length>5000)) throw apiError_('BAD_REQUEST','idToken ไม่ถูกต้อง');
  if(req.expectedVersion!==undefined&&(!isFinite(Number(req.expectedVersion))||
      Math.floor(Number(req.expectedVersion))!==Number(req.expectedVersion)||Number(req.expectedVersion)<1))
    throw apiError_('BAD_REQUEST','expectedVersion ไม่ถูกต้อง');
  if (req.apiVersion !== API_VERSION) throw apiError_('UNSUPPORTED_API_VERSION', 'รองรับ API เวอร์ชัน ' + API_VERSION + ' เท่านั้น');
  if (!own_(API_ACTIONS, req.action)) throw apiError_('ACTION_NOT_FOUND', 'ไม่พบคำสั่งที่ร้องขอ');
  if (req.payload !== undefined && (req.payload === null || typeof req.payload !== 'object' || Array.isArray(req.payload)))
    throw apiError_('VALIDATION_FAILED', 'payload ต้องเป็น object');
  validatePayloadShape_(req.action,req.payload||{});
}

var API_PAYLOAD_FIELDS={
  'auth.config':[], 'auth.diagnose':[], 'auth.bootstrap':[], 'auth.register':['name','position','unit','faculty','orgUnit'], 'incident.list':['since'],
  'incident.create':['title','kind','cats','unit','subUnit','mapUrl','date','time','place','detail','activity','course','injuryAxis','damageBaht','parts','treat','daysOff','assets','firstAid','involved','files','anon'],
  'incident.assess':['incidentId','injuryAxis','damageBaht','damageAxis','daysOff','note'],
  'incident.transition':['incidentId','to','data'], 'incident.suggest':['incidentId','note','kind'],
  'incident.reportUniversity':['incidentId'], 'incident.cancel':['incidentId','note'],
  'incident.return':['incidentId','note'], 'incident.edit':['incidentId','fields','note'],
  'attachment.upload':['name','mime','data'], 'admin.user.list':[],
  'org.headcount.list':[], 'org.headcount.save':['rows'],
  'admin.user.update':['email','name','position','faculty','orgUnit','unit','role','active'],
  'admin.readiness':['officialUnits'], 'admin.installTriggers':[], 'admin.setupStorage':[],
  'admin.backup':[], 'admin.selfTest':[], 'export.log':['kind','count'], 'audit.list':['limit'], 'system.health':[]
};
/* capaNote ถูกถอดออกในรุ่น 2.7.2 — ช่องนี้มีคำสั่งของตัวเองคือ incident.suggest ซึ่งบังคับสิทธิ์ suggest
   การปล่อยให้แนบมากับ incident.transition ได้ ทำให้บทบาทที่ไม่มีสิทธิ์นั้นเขียนทับข้อเสนอแนะได้
   deputyNote ไม่เคยอยู่ในรายการนี้อยู่แล้ว ทั้งสองช่องจึงเข้าทางเดียวกันแล้ว
   การผูกช่องที่เหลือไว้กับขั้นของมันอยู่ที่ STEP_FIELDS ใน advanceStatus_ */
var TRANSITION_FIELDS=['confirmNote','meetDate','meetPlace','causes','investNote','capa','monitorNote','reviewNote','reviewBySub','ackNote','closeNote'];
function validatePayloadShape_(action,p){
  var allow=own_(API_PAYLOAD_FIELDS,action)?API_PAYLOAD_FIELDS[action]:[];
  var extra=Object.keys(p).filter(function(k){return allow.indexOf(k)<0;});
  if(extra.length) throw apiError_('VALIDATION_FAILED','payload มี field ที่ไม่รองรับ: '+extra.join(', '));
  if(action==='incident.transition'){
    if(!p.data||typeof p.data!=='object'||Array.isArray(p.data)) throw apiError_('VALIDATION_FAILED','data ของการเปลี่ยนสถานะต้องเป็น object');
    var dataExtra=Object.keys(p.data).filter(function(k){return TRANSITION_FIELDS.indexOf(k)<0;});
    if(dataExtra.length) throw apiError_('VALIDATION_FAILED','data มี field ที่ไม่รองรับ: '+dataExtra.join(', '));
  }
  /* rows เป็น array ของ object จึงต้องตรวจรูปร่างข้างในเองที่นี่ เหมือนที่ทำกับ data ของ incident.transition
     ถ้าปล่อยผ่าน ผู้เรียกจะยัด field ที่ระบบไม่ได้ตั้งใจรับ (เช่น updatedBy) ลงชีตได้โดยตรง */
  if(action==='org.headcount.save'){
    if(!Array.isArray(p.rows)) throw apiError_('VALIDATION_FAILED','rows ต้องเป็นรายการของหน่วยงาน');
    if(!p.rows.length) throw apiError_('VALIDATION_FAILED','ไม่มีรายการที่จะบันทึก');
    if(p.rows.length>200) throw apiError_('VALIDATION_FAILED','บันทึกได้ครั้งละไม่เกิน 200 หน่วยงาน');
    var rowAllow=['faculty','orgUnit','headcount','hoursPerYear','effectiveYear'];
    p.rows.forEach(function(r,i){
      if(!r||typeof r!=='object'||Array.isArray(r)) throw apiError_('VALIDATION_FAILED','แถวที่ '+(i+1)+' ต้องเป็น object');
      var bad=Object.keys(r).filter(function(k){return rowAllow.indexOf(k)<0;});
      if(bad.length) throw apiError_('VALIDATION_FAILED','แถวที่ '+(i+1)+' มี field ที่ไม่รองรับ: '+bad.join(', '));
    });
  }
  var size=JSON.stringify(p).length, max=action==='attachment.upload'?36*1024*1024:256*1024;
  if(size>max) throw apiError_('BAD_REQUEST','ข้อมูลคำขอมีขนาดใหญ่เกินกำหนด');
}

/* แปลง payload ตามชื่อ field เป็นพารามิเตอร์ของ service เพียงจุดเดียว
   ห้ามใส่ business logic ที่นี่ และห้ามเปิดช่องส่งพารามิเตอร์ดิบจาก Browser อีก
   (adapter legacyArgs ถูกถอดออกใน v2.0.2 หน้าจอส่ง payload ตามชื่อ field ครบทุกคำสั่งแล้ว) */
function normalizeActionArgs_(action, p) {
  if (p.legacyArgs !== undefined) throw apiError_('BAD_REQUEST', 'รูปแบบคำขอนี้ไม่รองรับแล้ว กรุณาโหลดหน้าเว็บใหม่');
  switch (action) {
    case 'auth.config': case 'auth.diagnose': case 'auth.bootstrap': case 'admin.user.list': case 'system.health':
    case 'admin.installTriggers': case 'admin.setupStorage': case 'org.headcount.list':
    case 'admin.backup': case 'admin.selfTest': return [];
    case 'org.headcount.save': return [p];
    case 'incident.list': return [p.since || ''];
    case 'auth.register': case 'incident.create': case 'attachment.upload': case 'admin.user.update': return [p];
    case 'incident.assess': return [requiredId_(p.incidentId), p.injuryAxis, p.damageBaht, p.damageAxis, p.daysOff,
      p.note === undefined ? '' : txt_(String(p.note), 1000)];
    case 'incident.transition': return [requiredId_(p.incidentId), requiredText_(p.to, 'to', 30), p.data || {}];
    case 'incident.suggest': return [requiredId_(p.incidentId), requiredText_(p.note, 'note', 5000), p.kind || 'office'];
    case 'incident.reportUniversity': return [requiredId_(p.incidentId)];
    case 'incident.cancel': return [requiredId_(p.incidentId), requiredText_(p.note, 'note', 1000)];
    case 'incident.return': return [requiredId_(p.incidentId), requiredText_(p.note, 'note', 2000)];
    case 'incident.edit': return [requiredId_(p.incidentId), p.fields, requiredText_(p.note, 'note', 1000)];
    case 'admin.readiness': return [Array.isArray(p.officialUnits) ? p.officialUnits : []];
    case 'export.log': return [requiredText_(p.kind, 'kind', 60), nonNegativeInt_(p.count, 'count', 1000000)];
    case 'audit.list': return [nonNegativeInt_(p.limit || 200, 'limit', 1000)];
  }
  return [];
}

/* google.script.run ส่งข้ามไปเบราว์เซอร์ได้เฉพาะ primitive, array และ object ล้วน
   ค่าที่หลุดมาจากเซลล์ในชีตโดยไม่ผ่าน normalize (Date object จากคอลัมน์นอก schema, NaN, undefined)
   ทำให้ envelope ทั้งก้อนกลายเป็น null ที่ฝั่งหน้าจอ ผู้ใช้จึงเห็นเพียง INVALID_RESPONSE
   โดยไม่มี Request ID ให้ตามต่อ ทั้งที่เซิร์ฟเวอร์ทำงานสำเร็จและ Executions ขึ้นว่า Completed
   กรองที่ประตูออกจุดเดียว ครอบทั้ง google.script.run และ doPost โดยไม่ต้องแก้ทุก service
   JSON.stringify แปลง Date เป็นสตริง ทิ้ง undefined/function และเปลี่ยน NaN/Infinity เป็น null */
function apiSafe_(envelope) {
  try {
    return JSON.parse(JSON.stringify(envelope));
  } catch (e) {
    console.error('API_PAYLOAD_NOT_SERIALIZABLE requestId=' + CURRENT_REQUEST_ID + ' ' + (e && e.message || e));
    /* ยังต้องคืน envelope ที่สมบูรณ์เสมอ มิฉะนั้นหน้าจอจะได้ null แล้วรายงาน INVALID_RESPONSE อีก */
    return { ok:false, status:500, requestId:CURRENT_REQUEST_ID,
      error:{ code:'INTERNAL_ERROR',
              message:'ระบบเตรียมข้อมูลตอบกลับไม่สำเร็จ กรุณาแจ้งผู้ดูแลพร้อม Request ID', fields:{} },
      meta:{ apiVersion:API_VERSION, appVersion:APP_VERSION, serverTime:now_(), durationMs:0 } };
  }
}

function apiSuccess_(data, started) {
  return apiSafe_({ ok:true, status:200, requestId:CURRENT_REQUEST_ID, data:data,
    meta:{ apiVersion:API_VERSION, appVersion:APP_VERSION, serverTime:now_(), durationMs:new Date().getTime()-started } });
}
function apiFailure_(err, started) {
  return apiSafe_({ ok:false, status:err.status, requestId:CURRENT_REQUEST_ID,
    error:{ code:err.code, message:err.message, fields:err.fields || {} },
    meta:{ apiVersion:API_VERSION, appVersion:APP_VERSION, serverTime:now_(), durationMs:new Date().getTime()-started } });
}
function apiError_(code, message, fields) { var e = new Error(message); e.apiCode=code; e.fields=fields||{}; return e; }

/* ทะเบียน error code กลาง — แหล่งความจริงเดียวที่ทั้ง classifyError_, API-SPEC.md และชุดทดสอบอ้างอิง
   code ที่ไม่อยู่ในตารางนี้จะกลายเป็น 500 และข้อความจริงจะถูกกลบด้วยข้อความกลาง */
var ERROR_STATUS = {
  BAD_REQUEST:400, UNSUPPORTED_API_VERSION:400, VALIDATION_FAILED:422, ACTION_NOT_FOUND:404,
  AUTH_REQUIRED:401, ACCOUNT_INACTIVE:403, ACCOUNT_PENDING:403, FORBIDDEN:403, NOT_FOUND:404,
  CONFLICT:409, VERSION_CONFLICT:409, ATTACHMENT_REJECTED:422, RATE_LIMITED:429,
  LOCK_BUSY:503, NOT_INSTALLED:503, INTERNAL_ERROR:500
};

/* ข้อผิดพลาดทุกตัวที่ระบบตั้งใจโยนเอง ต้องมาพร้อม apiCode จาก apiError_
   การเดารหัสจากข้อความภาษาไทยเป็นเพียงตาข่ายรองสำหรับข้อผิดพลาดที่หลุดมาจาก Apps Script เอง
   ห้ามพึ่งพาเป็นทางหลัก เพราะข้อความที่ไม่มีคำใบ้จะกลายเป็น 500 และผู้ใช้จะไม่เห็นสาเหตุจริง */
function classifyError_(e) {
  var msg = String(e && e.message || 'เกิดข้อผิดพลาดภายในระบบ');
  var code = e && e.apiCode ||
    (/ไม่มีสิทธิ์|นอกขอบเขต|จำกัดการเข้าถึง/.test(msg) ? 'FORBIDDEN' :
     /ไม่พบรายงาน|ไม่พบผู้ใช้/.test(msg) ? 'NOT_FOUND' :
     /เปลี่ยนแปลงโดยผู้ใช้อื่น|VERSION_CONFLICT/.test(msg) ? 'VERSION_CONFLICT' :
     /รออนุมัติ|รอผู้ดูแลระบบตรวจสอบ/.test(msg) ? 'ACCOUNT_PENDING' :
     /ระงับการใช้งาน/.test(msg) ? 'ACCOUNT_INACTIVE' :
     /กรุณา|ไม่ถูกต้อง|ต้องเป็น|เกิน/.test(msg) ? 'VALIDATION_FAILED' : 'INTERNAL_ERROR');
  var status = ERROR_STATUS[code] || 500;
  return { code:code, status:status, message:code === 'INTERNAL_ERROR' ? 'ระบบไม่สามารถดำเนินการได้ กรุณาแจ้งผู้ดูแลพร้อม Request ID' : msg, fields:e && e.fields || {} };
}
function requestId_(v) { return /^[A-Za-z0-9_-]{12,80}$/.test(String(v||'')) ? String(v) : Utilities.getUuid(); }
function requiredId_(v) { v=String(v||'').trim(); if (!/^IR-\d{4}-\d{3,}$/.test(v)) throw apiError_('VALIDATION_FAILED','เลขที่รายงานไม่ถูกต้อง',{incidentId:'รูปแบบไม่ถูกต้อง'}); return v; }
function requiredText_(v, field, max) { v=String(v||'').trim(); if (!v) throw apiError_('VALIDATION_FAILED','กรุณากรอกข้อมูลให้ครบถ้วน',(function(){var x={};x[field]='จำเป็นต้องระบุ';return x;})()); return txt_(v,max); }
function nonNegativeInt_(v, field, max) { var n=Number(v); if (!isFinite(n)||n<0||Math.floor(n)!==n||n>max) throw apiError_('VALIDATION_FAILED',field+' ไม่ถูกต้อง'); return n; }

function hashObject_(o) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(o || {}), Utilities.Charset.UTF_8);
  return bytes.map(function(b){ var v=(b<0?b+256:b).toString(16); return v.length===1?'0'+v:v; }).join('');
}

function diffForAudit_(before, after) {
  var safeValues={status:1,level:1,suggestLevel:1,injuryAxis:1,damageAxis:1,damageBaht:1,daysOff:1,
    meetDate:1,monitor:1,ackAt:1,uniReportAt:1,cancelledAt:1,version:1,faculty:1,orgUnit:1,role:1,active:1};
  var keys={}, out={};
  Object.keys(before||{}).concat(Object.keys(after||{})).forEach(function(k){keys[k]=1;});
  Object.keys(keys).forEach(function(k){
    var a=JSON.stringify(before&&before[k]), b=JSON.stringify(after&&after[k]);
    if(a!==b) out[k]=safeValues[k]?{before:before[k],after:after[k]}:{changed:true};
  });
  return JSON.stringify(out).slice(0,5000);
}

function systemHealth_() {
  var u = me_(); need_(u,'admin');
  var checks = [];
  Object.keys(SHEETS).forEach(function(name){
    var sh=sheet_(name), have=headers_(sh), missing=SHEETS[name].filter(function(h){return have.indexOf(h)<0;});
    checks.push({component:'sheet:'+name,ok:missing.length===0,detail:missing.length?'ขาด '+missing.join(', '):'พร้อม'});
  });
  var activeAdmins=readAll_('Users').filter(function(x){return x.active&&x.role==='admin';}).length;
  checks.push({component:'active-admin',ok:activeAdmins>0,detail:String(activeAdmins)});
  try {
    var mainDb=db_(), usersDb=usersDb_(), separated=mainDb.getId()!==usersDb.getId();
    checks.push({component:'users-registry-separated',ok:separated,
      detail:separated?'ทะเบียนผู้ใช้อยู่คนละ Spreadsheet กับฐานข้อมูลอุบัติการณ์':'ยังอยู่ Spreadsheet เดียวกัน ต้องรัน setupFromEditor ด้วย Code.gs รุ่นปัจจุบัน'});
  } catch (registryErr) {
    checks.push({component:'users-registry-separated',ok:false,detail:String(registryErr&&registryErr.message||registryErr)});
  }
  var auditCheck=verifyAuditChain_();
  checks.push({component:'audit-integrity',ok:auditCheck.ok,detail:auditCheck.detail});
  /* แยกจาก audit-integrity เพราะเป็นคนละคำถาม: ข้อบนถามว่า "ห่วงโซ่ยังต่อกันอยู่ไหม"
     ข้อนี้ถามว่า "เคยมีการลบแถวท้ายหรือไม่ และสะสางแล้วหรือยัง" ซึ่งมีสามสถานะ ไม่ใช่สอง */
  var tailWitness=auditTailWitnessStatus_();
  checks.push({component:'audit-tail-witness',ok:tailWitness.ok,detail:tailWitness.detail});
  var auditGuard=auditProtectStatus_();
  checks.push({component:'audit-sheet-protected',ok:auditGuard.ok,detail:auditGuard.detail});
  checks.push({component:'allowed-domain',ok:/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(CONFIG.ALLOWED_DOMAIN||'')),detail:String(CONFIG.ALLOWED_DOMAIN||'ยังไม่ได้กำหนด')});
  checks.push({component:'authentication-mode',ok:true,detail:CONFIG.OAUTH_CLIENT_ID
    ? 'Session พร้อม Google ID token fallback'
    : 'Session เท่านั้น — หาก Session ไม่คืนอีเมล ให้กำหนด CONFIG.OAUTH_CLIENT_ID'});
  checks.push({component:'attachment-sharing',ok:['roles','domain','private'].indexOf(CONFIG.ATTACH_SHARING)>=0,
    detail:String(CONFIG.ATTACH_SHARING)+(CONFIG.ATTACH_SHARING==='roles'?' · '+ATTACH_VIEW_ROLES.join(', '):'')});
  if (CONFIG.ATTACH_SHARING === 'roles') {
    /* ไม่มี Advanced Drive Service ระบบยังแชร์ได้ แต่ผู้รับจะได้อีเมลแจ้งทุกไฟล์ */
    checks.push({component:'attachment-quiet-share',ok:typeof Drive!=='undefined'&&!!Drive.Permissions,
      detail:typeof Drive!=='undefined'?'Advanced Drive Service พร้อม':'ยังไม่ได้เปิด Advanced Drive Service — วาง appsscript.json ชุดล่าสุด'});
    var lastSync=PropertiesService.getScriptProperties().getProperty('ATTACH_SYNC_LAST')||'';
    checks.push({component:'attachment-access-sync',ok:!!lastSync,detail:lastSync||'ยังไม่เคยปรับสิทธิ์ไฟล์แนบ — รัน syncAttachmentAccessFromEditor'});
  }
  /* โฟลเดอร์ปลายทางที่เข้าไม่ถึงต้องถูกตรวจพบและหยุด ไม่ fallback ไปตำแหน่งอื่น */
  if (CONFIG.PARENT_FOLDER) {
    try { checks.push({component:'drive-parent-folder',ok:true,detail:DriveApp.getFolderById(CONFIG.PARENT_FOLDER).getName()}); }
    catch (e) { checks.push({component:'drive-parent-folder',ok:false,
      detail:'เปิด CONFIG.PARENT_FOLDER ไม่ได้ ระบบจะหยุดเพื่อป้องกันไฟล์ไปอยู่ผิดตำแหน่ง'}); }
  } else {
    checks.push({component:'drive-parent-folder',ok:true,detail:'ไม่ได้กำหนด ใช้ My Drive ของบัญชีเจ้าของระบบ'});
  }
  try { var root=attachRoot_(); checks.push({component:'attachment-folder',ok:true,detail:root.getName()}); }
  catch (e2) { checks.push({component:'attachment-folder',ok:false,detail:'เข้าถึงโฟลเดอร์ไฟล์แนบไม่ได้'}); }
  var firstAdmin=String(CONFIG.FIRST_ADMIN||'').trim();
  checks.push({component:'first-admin-config',ok:!!firstAdmin||activeAdmins>0,
    detail:firstAdmin||'ติดตั้งแล้วและมีผู้ดูแลที่ใช้งานอยู่ '+activeAdmins+' บัญชี'});
  /* ทะเบียนบุคลากรที่ยังว่างไม่ใช่ระบบพัง แต่ทำให้ IFR/PDFR/ISR แสดงเป็น "—" ทั้งหน้า
     ผู้ดูแลจึงควรเห็นสถานะนี้ที่หน้าตรวจความพร้อม ไม่ใช่ไปงงเอาตอนผู้บริหารเปิดรายงาน */
  var hc=readAll_('OrgHeadcount').filter(function(r){return r.headcount>0;});
  var hcHours=hc.reduce(function(a,r){return a+r.headcount*orgHoursPerYear_(r);},0);
  checks.push({component:'org-headcount',ok:hc.length>0,
    detail:hc.length?hc.length+' หน่วยงาน · รวม '+hc.reduce(function(a,r){return a+r.headcount;},0)+' คน · '+
      Math.round(hcHours).toLocaleString('en-US')+' ชั่วโมง/ปี'
     :'ยังไม่ได้กรอกจำนวนบุคลากร ดัชนี IFR/PDFR/ISR จะยังคำนวณไม่ได้'});
  var lastBackup=PropertiesService.getScriptProperties().getProperty('LAST_BACKUP')||'';
  checks.push({component:'backup-last-run',ok:!!lastBackup,detail:lastBackup||'ยังไม่เคยสำรองข้อมูล'});
  var handlers=ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
  checks.push({component:'trigger-overdue-capa',ok:handlers.indexOf('notifyOverdueCapa_')>=0,detail:'daily trigger'});
  checks.push({component:'trigger-attachment-cleanup',ok:handlers.indexOf('cleanupExpiredAttachments_')>=0,detail:'daily trigger'});
  checks.push({component:'trigger-backup',ok:handlers.indexOf('backupDatabase_')>=0,detail:'daily trigger'});
  checks.push({component:'trigger-drive-access-sync',ok:handlers.indexOf('syncAttachmentAccess_')>=0,detail:'daily trigger'});
  checks.push({component:'trigger-users-registry-edit',ok:handlers.indexOf('onUsersRegistryEdit_')>=0,
    detail:'บันทึกร่องรอยเมื่อแก้ทะเบียนผู้ใช้ในชีตโดยตรง'});
  var regSync=PropertiesService.getScriptProperties().getProperty('REGISTRY_SYNC_LAST')||'';
  checks.push({component:'users-registry-editors',ok:!!regSync,detail:regSync||'ยังไม่เคยแชร์ทะเบียนผู้ใช้ให้ผู้ดูแลระบบ — รัน syncAttachmentAccessFromEditor'});
  var lastArchive=PropertiesService.getScriptProperties().getProperty('LAST_AUDIT_ARCHIVE')||'';
  checks.push({component:'trigger-audit-archive',ok:handlers.indexOf('archiveAuditMonthly_')>=0,
    detail:'monthly trigger · คงไว้ในชีต '+(Number(CONFIG.AUDIT_KEEP)||2000)+' รายการ'+
           (lastArchive?' · ย้ายครั้งล่าสุด '+lastArchive:' · ยังไม่เคยถึงเกณฑ์')});
  return {ready:checks.every(function(x){return x.ok;}),version:APP_VERSION,checks:checks};
}
