/* ============================================================
 *  Tests.gs — ชุดทดสอบที่รันจาก Apps Script Editor
 *  ใช้กับ Code.gs / Api.gs / Index.html รุ่น 2.8.10
 *
 *  วิธีใช้ : เลือกฟังก์ชันจากช่องดรอปดาวน์ด้านบนแล้วกด Run
 *            ผลลัพธ์อ่านได้ที่ Execution log (Ctrl+Enter)
 *
 *    runUnitTests()   ตรรกะล้วน ไม่แตะ Google Sheets และ Drive เลย
 *                     รันได้ทันทีหลังวางไฟล์ครบ ยังไม่ต้อง setupFromEditor
 *    runInstallCheck() ตรวจการติดตั้งจริง ต้องรันหลัง setupFromEditor แล้ว
 *    runSelfTest()    รันทั้งสองชุดต่อกัน ใช้เป็นด่านสุดท้ายก่อน Deploy
 *
 *  เรียกได้เฉพาะเจ้าของสคริปต์จาก Editor หรือผู้ดูแลระบบ (assertEditorOrAdmin_ ใน Code.gs)
 *  เพราะฟังก์ชันที่ไม่ลงท้าย _ เรียกจากเบราว์เซอร์ผ่าน google.script.run ได้ทุกตัว
 *  และผลตรวจการติดตั้งมีอีเมลผู้ดูแลกับสถานะภายในของระบบ
 *
 *  ทุกฟังก์ชันเป็นการอ่านอย่างเดียว ไม่เขียนลงชีต ไม่สร้างไฟล์ ไม่ส่งอีเมล
 *  และไม่บันทึกลง Audit จึงรันซ้ำได้ไม่จำกัดโดยข้อมูลจริงไม่เปลี่ยน
 * ============================================================ */

var T_RESULTS = [];

function t_(name, fn) {
  try {
    var detail = fn();
    T_RESULTS.push({ ok:true, name:name, detail:String(detail === undefined ? 'ผ่าน' : detail) });
  } catch (e) {
    T_RESULTS.push({ ok:false, name:name, detail:String((e && e.message) || e) });
  }
}
function eq_(actual, expected, label) {
  var a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((label || 'ค่าไม่ตรง') + ' — ได้ ' + a + ' ต้องการ ' + b);
  return 'ได้ ' + a;
}
function ok_(cond, message) {
  if (!cond) throw new Error(message || 'เงื่อนไขไม่เป็นจริง');
  return 'ผ่าน';
}
/* ตรวจว่าฟังก์ชันโยนข้อผิดพลาดรหัสที่คาดไว้ ใช้กับด่านตรวจ input ทุกตัว
   ถ้าไม่โยนเลยแปลว่าด่านนั้นเปิดช่องให้ข้อมูลที่ไม่ถูกต้องผ่านเข้าไปได้ */
function throws_(code, fn) {
  try { fn(); }
  catch (e) {
    var got = (e && e.apiCode) || classifyError_(e).code;
    if (got !== code) throw new Error('โยนรหัส ' + got + ' แต่ต้องการ ' + code);
    return 'โยน ' + code + ' ตามที่ควร';
  }
  throw new Error('ไม่โยนข้อผิดพลาดเลย ทั้งที่ต้องได้ ' + code);
}

function report_(title) {
  var pass = T_RESULTS.filter(function (r) { return r.ok; }).length;
  var fail = T_RESULTS.length - pass;
  var lines = ['', '=== ' + title + ' — ' + APP_VERSION + ' ===',
               'ผ่าน ' + pass + ' / ' + T_RESULTS.length + (fail ? '  ตก ' + fail + ' รายการ' : '  ผ่านทั้งหมด'), ''];
  T_RESULTS.forEach(function (r) { lines.push((r.ok ? '  ผ่าน  ' : '  ตก    ') + r.name + ' : ' + r.detail); });
  if (fail) {
    lines.push('', '--- เฉพาะรายการที่ตก ---');
    T_RESULTS.filter(function (r) { return !r.ok; })
      .forEach(function (r) { lines.push('  ' + r.name + ' : ' + r.detail); });
  }
  var text = lines.join('\n');
  Logger.log(text);
  var out = { ok:fail === 0, total:T_RESULTS.length, passed:pass, failed:fail, results:T_RESULTS.slice() };
  T_RESULTS = [];
  return out;
}

/* ============================================================
 *  ชุดที่ 1 — ตรรกะล้วน (ไม่แตะ Sheets/Drive)
 * ============================================================ */
function runUnitTests() {
  assertEditorOrAdmin_();
  T_RESULTS = [];
  unitApiContract_();
  unitInputValidation_();
  unitPermissions_();
  unitSeverity_();
  unitTextSafety_();
  unitDataShape_();
  unitHeadcount_();
  unitStructure_();
  return report_('ทดสอบตรรกะ');
}

/* ---- ทะเบียนจำนวนบุคลากร (ตัวหารของ IFR / PDFR / ISR) ---- */
function unitHeadcount_() {
  t_('ชีตทะเบียนจำนวนบุคลากรมีคอลัมน์ครบ', function () {
    var need = ['faculty','orgUnit','headcount','hoursPerYear','effectiveYear','updatedAt','updatedBy','staffGroups'];
    var missing = need.filter(function (c) { return SHEETS.OrgHeadcount.indexOf(c) < 0; });
    return ok_(missing.length === 0, 'ขาดคอลัมน์ ' + missing.join(', '));
  });

  /* ถ้าไม่ระบุชั่วโมงทำงานของหน่วยงานนั้น ต้องได้ค่ามาตรฐานกลาง ไม่ใช่ 0
     ถ้าได้ 0 ตัวหารจะเป็นศูนย์ แล้วดัชนีทั้งหน้าจะกลายเป็น "—" ทั้งที่กรอกจำนวนคนไว้แล้ว */
  t_('ชั่วโมงทำงาน/ปี ที่ไม่ได้ระบุใช้ค่ามาตรฐานกลาง', function () {
    var def = defaultHoursPerYear_();
    eq_(def, CONFIG.HOURS_PER_DAY * CONFIG.WORK_DAYS_PER_YEAR, 'ค่ามาตรฐาน = ชั่วโมง/วัน × วันทำงาน/ปี');
    eq_(CONFIG.HOURS_PER_DAY, 7, 'มาตรฐานรุ่น 2.8.2 คือ 7 ชั่วโมง/วัน');
    eq_(orgHoursPerYear_({ hoursPerYear:0 }), def, 'ไม่ระบุ');
    eq_(orgHoursPerYear_({ hoursPerYear:'' }), def, 'ค่าว่าง');
    eq_(orgHoursPerYear_({}), def, 'ไม่มีฟิลด์เลย');
    return eq_(orgHoursPerYear_({ hoursPerYear:1600 }), 1600, 'ระบุเอง');
  });

  /* ชื่อคณะและหน่วยงานมีช่องว่างได้ทั้งคู่ ถ้าต่อสตริงด้วยช่องว่างเฉย ๆ สองคู่ที่ต่างกันจะได้คีย์เดียวกัน
     แล้วจำนวนคนของหน่วยงานหนึ่งจะไปทับอีกหน่วยงานหนึ่งเงียบ ๆ ตอนบันทึก */
  t_('คีย์หน่วยงานแยกคู่ที่ต่างกันได้แม้ชื่อมีช่องว่าง', function () {
    ok_(orgKey_('คณะ ก', 'งาน ข') !== orgKey_('คณะ ก งาน', 'ข'), 'สองคู่นี้ต้องไม่ได้คีย์เดียวกัน');
    eq_(orgKey_(' คณะ ก ', 'งาน ข'), orgKey_('คณะ ก', 'งาน ข'), 'ช่องว่างหัวท้ายต้องไม่ทำให้คีย์ต่างกัน');
    return ok_(orgKey_('คณะ ก', '') !== orgKey_('คณะ ก', 'งานธุรการ'), 'ระดับคณะกับระดับหน่วยงานย่อยต้องแยกกัน');
  });

  /* สิทธิ์แก้ทะเบียนต้องตรงกันทั้งตอนแสดงปุ่มและตอนบันทึกจริง เพราะใช้ฟังก์ชันเดียวกัน */
  t_('สิทธิ์แก้ไขทะเบียนจำกัดตามบทบาทและคณะ', function () {
    var admin = { registered:true, role:'admin', faculty:'คณะสาธารณสุขศาสตร์' };
    var fadm  = { registered:true, role:'faculty_admin', faculty:'คณะสาธารณสุขศาสตร์' };
    var dean  = { registered:true, role:'dean', faculty:'คณะสาธารณสุขศาสตร์' };
    eq_(canEditHeadcount_(admin, 'คณะแพทยศาสตร์'), true, 'ผู้ดูแลระบบแก้ได้ทุกคณะ');
    eq_(canEditHeadcount_(fadm, 'คณะสาธารณสุขศาสตร์'), false, 'ผู้ดูแลระดับคณะดูได้แต่แก้ไม่ได้ (2.8.8)');
    eq_(canEditHeadcount_(fadm, 'คณะแพทยศาสตร์'), false, 'ผู้ดูแลระดับคณะแก้คณะอื่นไม่ได้');
    /* ตั้งแต่ 2.8.1 แต่ละคณะ/กองกรอกทะเบียนเองได้ (เหมือนรุ่น 2.6.6) แต่เฉพาะคณะของตนเอง */
    var office = { registered:true, role:'office_head', faculty:'คณะสาธารณสุขศาสตร์' };
    var sup    = { registered:true, role:'supervisor', faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ' };
    var vp     = { registered:true, role:'vice_president', faculty:'สำนักงานอธิการบดี' };
    eq_(canEditHeadcount_(dean, 'คณะสาธารณสุขศาสตร์'), false, 'คณบดี/ผอ.กอง ดูได้แต่แก้ไม่ได้ (2.8.8)');
    var dsup = { registered:true, role:'deputy_dean_sup', faculty:'คณะสาธารณสุขศาสตร์' };
    eq_(canEditHeadcount_(dsup, 'คณะสาธารณสุขศาสตร์'), true, 'รองคณบดี (กำกับดูแล) กรอกของคณะตัวเองได้');
    eq_(canEditHeadcount_(dsup, 'คณะแพทยศาสตร์'), false, 'รองคณบดี (กำกับดูแล) แก้คณะอื่นไม่ได้');
    var holders = Object.keys(ROLES).filter(function (r) { return ROLES[r].can.headcount; }).sort();
    eq_(holders, ['deputy_dean_sup','office_head'], 'บทบาทที่กรอกทะเบียนได้');
    eq_(canEditHeadcount_(dean, 'คณะแพทยศาสตร์'), false, 'คณบดีแก้คณะอื่นไม่ได้');
    eq_(canEditHeadcount_(office, 'คณะสาธารณสุขศาสตร์'), true, 'หัวหน้าสำนักงานกรอกของคณะตัวเองได้');
    eq_(canEditHeadcount_(office, 'คณะแพทยศาสตร์'), false, 'หัวหน้าสำนักงานแก้คณะอื่นไม่ได้');
    eq_(canEditHeadcount_(sup, 'คณะสาธารณสุขศาสตร์'), false, 'หัวหน้างานไม่มีสิทธิ์กรอกทะเบียน');
    eq_(canEditHeadcount_(vp), false, 'ผู้บริหารมหาวิทยาลัยดูได้แต่ไม่แก้ทะเบียน');
    eq_(canEditHeadcount_({ registered:true, role:'dean', faculty:'' }), false, 'บัญชีที่ไม่มีคณะแก้ไม่ได้');
    return eq_(canEditHeadcount_({ registered:false, role:'admin' }), false, 'บัญชีที่ยังไม่ลงทะเบียน');
  });

  /* รุ่น 2.8.3 — คณะกรอกวิธีคิดเวลาการทำงานเป็นกลุ่มบุคลากรเอง ระบบคำนวณจำนวนคนและชั่วโมงเฉลี่ยให้ */
  t_('คำนวณชั่วโมงจากกลุ่มบุคลากรที่คณะกรอกเอง', function () {
    var g = cleanStaffGroups_([{ t:'เต็มเวลา', n:40, h:7, d:240 }, { t:'เข้าเวร', n:10, h:8, d:250 },
                               { t:'พาร์ตไทม์', n:6, h:4, d:240 }, { t:'ว่าง', n:0, h:7, d:240 }], 'ทดสอบ');
    eq_(g.length, 3, 'ตัดกลุ่มที่ไม่มีคน');
    var s = staffGroupsTotals_(g);
    eq_(s.people, 56, 'จำนวนคนรวม');
    eq_(s.hours, 92960, 'ชั่วโมงรวม');
    eq_(s.avg, 1660, 'ชั่วโมงเฉลี่ยถ่วงน้ำหนัก');
    eq_(cleanStaffGroups_(undefined, 'x'), null, 'ไม่ส่งมา = คงของเดิม');
    eq_(cleanStaffGroups_([], 'x'), [], 'ส่งว่าง = ล้าง');
    throws_('VALIDATION_FAILED', function () { cleanStaffGroups_([{ n:5, h:30, d:240 }], 'x'); });
    throws_('VALIDATION_FAILED', function () { cleanStaffGroups_([{ n:5, h:7, d:400 }], 'x'); });
    throws_('VALIDATION_FAILED', function () { cleanStaffGroups_([{ n:5, h:1, d:20 }], 'x'); });
    return throws_('VALIDATION_FAILED', function () { cleanStaffGroups_([{ n:5, h:7, d:240, updatedBy:'x' }], 'x'); });
  });

  /* ผังหน่วยงานรุ่น 2.8.5 เปลี่ยนชื่อบางหน่วยงาน ข้อมูลเดิมที่ใช้ชื่อเก่าต้องยังนับเป็นหน่วยงานเดียวกัน */
  t_('ชื่อหน่วยงานเดิมเทียบเท่าชื่อใหม่', function () {
    ok_(sameFaculty_('สำนักงานหอสมุด', 'สำนักหอสมุด'), 'หอสมุด');
    /* ชื่อเดิมที่แยกเป็นสองหน่วยงาน ต้องไม่ถูกรวมเข้าหน่วยงานใดอัตโนมัติ (2.8.10) */
    ok_(!sameFaculty_('กองกลาง สำนักงานอธิการบดี', 'กองกลาง'), 'ชื่อเดิมต้องไม่รวมเข้ากองกลาง');
    ok_(!sameFaculty_('กองกลาง สำนักงานอธิการบดี', 'สำนักงานอธิการบดี'), 'ชื่อเดิมต้องไม่รวมเข้าสำนักงานอธิการบดี');
    ok_(!sameFaculty_('กองกลาง', 'สำนักงานอธิการบดี'), 'กองกลางกับสำนักงานอธิการบดีเป็นคนละหน่วยงาน');
    ok_(Object.keys(UNIT_SPLITS).every(function (k) { return !UNIT_ALIASES[k]; }), 'ชื่อที่แยกต้องไม่อยู่ในตารางจับคู่');
    ok_(sameFaculty_('โรงเรียนอนุบาลและประถมสาธิตมหาวิทยาลัยนเรศวร', 'โรงเรียนอนุบาลและประถมสาธิต มหาวิทยาลัยนเรศวร'), 'โรงเรียนอนุบาล');
    ok_(!sameFaculty_('กองกลาง', 'กองคลัง'), 'หน่วยงานต่างกันต้องไม่เท่ากัน');
    eq_(orgKey_('สำนักงานหอสมุด', ''), orgKey_('สำนักหอสมุด', ''), 'คีย์ทะเบียนบุคลากรต้องเป็นแถวเดียวกัน');
    var cyc = Object.keys(UNIT_ALIASES).filter(function (k) { return UNIT_ALIASES[UNIT_ALIASES[k]]; });
    return ok_(cyc.length === 0, 'ชื่อใหม่ต้องไม่ถูกแปลงซ้ำอีกทอด: ' + cyc.join(', '));
  });

  /* กราฟเปรียบเทียบรายคณะคืนเฉพาะตัวเลขรวม เปิดให้ผู้บริหารที่ดูดัชนีได้และผู้ดูแลระบบ */
  t_('สิทธิ์ดูการเปรียบเทียบดัชนีรายคณะ', function () {
    ['dean','facility','vice_president','assistant_president','vice_president_sup','president','admin'].forEach(function (r) {
      eq_(canCompareFaculties_({ registered:true, role:r }), true, r + ' ต้องดูได้');
    });
    ['reporter','supervisor','office_head','deputy_dean','safety_committee','faculty_admin'].forEach(function (r) {
      eq_(canCompareFaculties_({ registered:true, role:r }), false, r + ' ต้องดูไม่ได้');
    });
    validateApiRequest_({ apiVersion:API_VERSION, action:'report.facultyIndex', payload:{} });
    return throws_('VALIDATION_FAILED', function () {
      validateApiRequest_({ apiVersion:API_VERSION, action:'report.facultyIndex', payload:{ faculty:'x' } });
    });
  });

  t_('ผู้บริหารมหาวิทยาลัยเห็นรายงานภาพรวมทุกระดับ', function () {
    var bad = ['vice_president','assistant_president','vice_president_sup','president'].filter(function (r) {
      return !isRole_(r) || ROLES[r].scope !== 'all' || ROLES[r].level3Only || !ROLES[r].can.safetyIndex;
    });
    return ok_(bad.length === 0, 'บทบาทที่ยังถูกจำกัด: ' + bad.join(', '));
  });

  /* ตัวหารต้องเป็นประชากรกลุ่มเดียวกับตัวตั้งเสมอ ไม่งั้นอัตราที่ได้ไม่มีความหมาย */
  t_('ขอบเขตทะเบียนตรงกับขอบเขตของผู้ใช้', function () {
    var rows = [{ faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'', headcount:120 },
                { faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ', headcount:15 },
                { faculty:'คณะแพทยศาสตร์', orgUnit:'', headcount:900 }];
    eq_(orgHeadcountInScope_({ role:'admin', faculty:'คณะสาธารณสุขศาสตร์' }, rows).length, 3, 'ขอบเขตทั้งมหาวิทยาลัย');
    eq_(orgHeadcountInScope_({ role:'dean', faculty:'คณะสาธารณสุขศาสตร์' }, rows).length, 2, 'ขอบเขตคณะ');
    return eq_(orgHeadcountInScope_({ role:'supervisor', faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ' }, rows).length, 1, 'ขอบเขตหน่วยงาน');
  });

  t_('ด่านตรวจ payload ของการบันทึกทะเบียนกัน field แปลกปลอม', function () {
    var good = { apiVersion:API_VERSION, action:'org.headcount.save',
                 payload:{ rows:[{ faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'', headcount:120 }] } };
    validateApiRequest_(good);
    throws_('VALIDATION_FAILED', function () {
      validateApiRequest_({ apiVersion:API_VERSION, action:'org.headcount.save',
        payload:{ rows:[{ faculty:'ก', updatedBy:'attacker@nu.ac.th' }] } });
    });
    throws_('VALIDATION_FAILED', function () {
      validateApiRequest_({ apiVersion:API_VERSION, action:'org.headcount.save', payload:{ rows:[] } });
    });
    return 'ตรวจ 3 กรณี';
  });
}

/* ---- สัญญา API ---- */
function unitApiContract_() {
  t_('ทุก action มีฟังก์ชันรองรับจริง', function () {
    var bad = Object.keys(API_ACTIONS).filter(function (a) { return typeof API_ACTIONS[a].fn !== 'function'; });
    return ok_(bad.length === 0, 'action ที่ไม่มีฟังก์ชัน: ' + bad.join(', ')) +
           ' (' + Object.keys(API_ACTIONS).length + ' action)';
  });

  t_('ทุก action มีรายการ field ที่อนุญาต', function () {
    var missing = Object.keys(API_ACTIONS).filter(function (a) { return !API_PAYLOAD_FIELDS[a]; });
    return ok_(missing.length === 0, 'ขาดรายการ field ของ: ' + missing.join(', '));
  });

  /* ถ้าคำสั่งแก้ไขเรื่องเดิมไม่บังคับ expectedVersion สองคนแก้พร้อมกันจะทับกันเงียบ ๆ */
  t_('คำสั่งแก้ไขเรื่องเดิมบังคับ expectedVersion', function () {
    /* ดึงจาก API_ACTIONS ทุกคำสั่ง incident.* ที่เป็น PATCH — รายชื่อที่เขียนไว้เองเคยตกหล่น incident.return */
    var must = Object.keys(API_ACTIONS).filter(function (a) { return /^incident\./.test(a) && API_ACTIONS[a].method === 'PATCH'; });
    var bad = must.filter(function (a) { return !(API_ACTIONS[a] && API_ACTIONS[a].needsVersion); });
    return ok_(bad.length === 0, 'ไม่บังคับ expectedVersion: ' + bad.join(', '));
  });

  /* ช่องบันทึกของแต่ละขั้นต้องเข้าได้เฉพาะทางขั้นของตัวเอง
     capaNote มีคำสั่งของตัวเอง (incident.suggest) ที่บังคับสิทธิ์ suggest
     ถ้ายังอยู่ใน TRANSITION_FIELDS บทบาทที่ไม่มีสิทธิ์นั้นจะแนบมากับการเปลี่ยนสถานะแล้วเขียนทับได้ */
  t_('ช่องข้อเสนอแนะไม่เปิดทางให้แก้ผ่านการเปลี่ยนสถานะ', function () {
    ok_(TRANSITION_FIELDS.indexOf('capaNote') < 0, 'capaNote ต้องไม่อยู่ใน TRANSITION_FIELDS');
    ok_(TRANSITION_FIELDS.indexOf('deputyNote') < 0, 'deputyNote ต้องไม่อยู่ใน TRANSITION_FIELDS');
    return throws_('VALIDATION_FAILED', function () {
      validateApiRequest_({ apiVersion:API_VERSION, action:'incident.transition', expectedVersion:1,
        payload:{ incidentId:'IR-2569-001', to:'confirmed', data:{ confirmNote:'ok', capaNote:'แอบเขียน' } } });
    });
  });

  t_('ทะเบียนรหัสข้อผิดพลาดครบ', function () {
    var expected = ['BAD_REQUEST','UNSUPPORTED_API_VERSION','ACTION_NOT_FOUND','AUTH_REQUIRED',
      'ACCOUNT_PENDING','ACCOUNT_INACTIVE','FORBIDDEN','NOT_FOUND','VALIDATION_FAILED','CONFLICT',
      'VERSION_CONFLICT','ATTACHMENT_REJECTED','RATE_LIMITED','LOCK_BUSY','NOT_INSTALLED','INTERNAL_ERROR'];
    var missing = expected.filter(function (c) { return !ERROR_STATUS[c]; });
    return ok_(missing.length === 0, 'ขาดรหัส ' + missing.join(', '));
  });

  t_('classifyError_ ให้รหัสและ HTTP status ตรงกัน', function () {
    eq_(classifyError_(apiError_('FORBIDDEN','ไม่มีสิทธิ์')).status, 403, 'FORBIDDEN');
    eq_(classifyError_(apiError_('VERSION_CONFLICT','ชนกัน')).status, 409, 'VERSION_CONFLICT');
    eq_(classifyError_(apiError_('RATE_LIMITED','ถี่เกิน')).status, 429, 'RATE_LIMITED');
    return 'ตรวจ 3 รหัส';
  });

  /* ข้อผิดพลาดที่ไม่ได้ตั้งใจ ต้องไม่รั่วรายละเอียดภายในออกไปให้ผู้ใช้เห็น */
  t_('ข้อผิดพลาดที่ไม่รู้จักถูกกลบเป็น 500 พร้อมข้อความกลาง', function () {
    var c = classifyError_(new Error('TypeError: cannot read property x of undefined'));
    eq_(c.code, 'INTERNAL_ERROR', 'รหัส');
    return ok_(c.message.indexOf('TypeError') < 0, 'ข้อความภายในรั่วออกไปถึงผู้ใช้');
  });

  t_('requestId_ รับค่าที่ถูกรูปแบบและแทนที่ค่าที่ผิด', function () {
    eq_(requestId_('req-ABC123456789'), 'req-ABC123456789', 'ค่าถูกรูปแบบ');
    return ok_(requestId_('สั้นไป') !== 'สั้นไป', 'ค่าที่ผิดรูปแบบต้องถูกแทนที่ด้วย UUID');
  });
}

/* ---- ด่านตรวจข้อมูลเข้า ---- */
function unitInputValidation_() {
  var good = function (over) {
    var r = { apiVersion:API_VERSION, action:'auth.bootstrap', payload:{} };
    Object.keys(over || {}).forEach(function (k) { r[k] = over[k]; });
    return r;
  };

  t_('คำขอที่ถูกต้องผ่านด่านตรวจ', function () {
    validateApiRequest_(good());
    return 'ผ่าน';
  });
  t_('ปฏิเสธคำขอที่ไม่ใช่ object', function () {
    return throws_('BAD_REQUEST', function () { validateApiRequest_('ไม่ใช่ object'); });
  });
  t_('ปฏิเสธ field แปลกปลอมในคำขอ', function () {
    return throws_('BAD_REQUEST', function () { validateApiRequest_(good({ role:'admin' })); });
  });
  t_('ปฏิเสธ API เวอร์ชันที่ไม่รองรับ', function () {
    return throws_('UNSUPPORTED_API_VERSION', function () { validateApiRequest_(good({ apiVersion:'v9' })); });
  });
  t_('ปฏิเสธคำสั่งที่ไม่มีอยู่', function () {
    return throws_('ACTION_NOT_FOUND', function () { validateApiRequest_(good({ action:'incident.deleteAll' })); });
  });
  t_('ปฏิเสธ payload ที่เป็น array', function () {
    return throws_('VALIDATION_FAILED', function () { validateApiRequest_(good({ payload:[1,2,3] })); });
  });
  /* ถ้าปล่อย field แปลกปลอมผ่าน ผู้เรียกจะยัดค่าที่ระบบไม่ได้ตั้งใจรับเข้าไปได้ */
  t_('ปฏิเสธ field แปลกปลอมใน payload', function () {
    return throws_('VALIDATION_FAILED', function () {
      validateApiRequest_(good({ action:'incident.cancel', payload:{ incidentId:'IR-2569-001', note:'x', role:'admin' } }));
    });
  });
  t_('ปฏิเสธ expectedVersion ที่ไม่ใช่จำนวนเต็มบวก', function () {
    return throws_('BAD_REQUEST', function () { validateApiRequest_(good({ expectedVersion:0 })); });
  });
  t_('ปฏิเสธรูปแบบคำขอรุ่นเก่า legacyArgs', function () {
    return throws_('BAD_REQUEST', function () { normalizeActionArgs_('incident.cancel', { legacyArgs:['IR-2569-001'] }); });
  });

  t_('เลขที่รายงานตรวจรูปแบบถูกต้อง', function () {
    eq_(requiredId_('IR-2569-001'), 'IR-2569-001', 'เลขที่ถูกรูปแบบ');
    throws_('VALIDATION_FAILED', function () { requiredId_('IR-25-1'); });
    throws_('VALIDATION_FAILED', function () { requiredId_("IR-2569-001'; DROP"); });
    return 'ตรวจ 3 กรณี';
  });
  t_('ข้อความที่จำเป็นห้ามว่าง', function () {
    return throws_('VALIDATION_FAILED', function () { requiredText_('   ', 'note', 100); });
  });
  t_('ตัวเลขต้องเป็นจำนวนเต็มไม่ติดลบและไม่เกินเพดาน', function () {
    eq_(nonNegativeInt_(200, 'limit', 1000), 200, 'ค่าปกติ');
    throws_('VALIDATION_FAILED', function () { nonNegativeInt_(-1, 'limit', 1000); });
    throws_('VALIDATION_FAILED', function () { nonNegativeInt_(5000, 'limit', 1000); });
    throws_('VALIDATION_FAILED', function () { nonNegativeInt_(1.5, 'limit', 1000); });
    return 'ตรวจ 4 กรณี';
  });

  /* โดเมนย่อยต้องผ่าน แต่โดเมนที่แค่ลงท้ายคล้ายกันต้องไม่ผ่าน มิฉะนั้น evilnu.ac.th จะเข้าระบบได้ */
  t_('การตรวจโดเมนครอบคลุมโดเมนย่อยแต่กันโดเมนหลอก', function () {
    eq_(domainOk_('someone@nu.ac.th'), true, 'โดเมนหลัก');
    eq_(domainOk_('student@grad.nu.ac.th'), true, 'โดเมนย่อย');
    eq_(domainOk_('attacker@evilnu.ac.th'), false, 'โดเมนที่ลงท้ายคล้ายกัน');
    eq_(domainOk_('someone@gmail.com'), false, 'โดเมนภายนอก');
    eq_(domainOk_('ไม่มีเครื่องหมายแอท'), false, 'ไม่ใช่อีเมล');
    return 'ตรวจ 5 กรณี';
  });
}

/* ---- สิทธิ์และลำดับสถานะ ---- */
function unitPermissions_() {
  /* เคยเกิดจริงในรุ่นก่อน: สถานะ assessed ตกหล่นจากตาราง ทำให้ผู้รายงาน
     ดันเรื่องของตัวเองข้ามขั้นประเมินระดับได้ ตัวเลขดัชนีจึงเชื่อถือไม่ได้ */
  t_('ทุกสถานะมีสิทธิ์กำกับครบ', function () {
    var missing = STATUS_ORDER.slice(1).filter(function (s) { return !STATUS_CAP[s]; });
    return ok_(missing.length === 0, 'สถานะที่ไม่มีสิทธิ์กำกับ (ใครก็เดินได้): ' + missing.join(', '));
  });

  t_('ทุกสิทธิ์ในตารางสถานะมีบทบาทถือครองจริง', function () {
    var all = {};
    Object.keys(ROLES).forEach(function (r) { Object.keys(ROLES[r].can).forEach(function (c) { if (ROLES[r].can[c]) all[c] = 1; }); });
    var orphan = Object.keys(STATUS_CAP).filter(function (s) { return !all[STATUS_CAP[s]]; });
    return ok_(orphan.length === 0, 'ไม่มีบทบาทใดเดินขั้นเหล่านี้ได้: ' + orphan.join(', '));
  });

  t_('ทุกบทบาทมีขอบเขตที่ระบบรู้จัก', function () {
    var known = { own:1, orgUnit:1, faculty:1, all:1 };
    var bad = Object.keys(ROLES).filter(function (r) { return !known[ROLES[r].scope]; });
    return ok_(bad.length === 0, 'ขอบเขตไม่รู้จัก: ' + bad.join(', ')) + ' (' + Object.keys(ROLES).length + ' บทบาท)';
  });

  t_('ลำดับสถานะเดินจากต้นถึงปิดเรื่องได้ครบ', function () {
    var s = STATUS_ORDER[0], n = 0;
    while (NEXT_STATUS[s] && n < 50) { s = NEXT_STATUS[s]; n++; }
    eq_(s, 'closed', 'ปลายทาง');
    return eq_(n, STATUS_ORDER.length - 1, 'จำนวนขั้น');
  });

  /* บั๊กจริงที่เคยเกิด (พบ 2026-09-25): ขั้นติดตามมาตรการเข้าได้จาก 'capa' เท่านั้น
     พอบันทึกรอบแรกสถานะกลายเป็น 'monitoring' หน้าจอติ๊กมาตรการก็เปิดไม่ได้อีกเลย
     มาตรการที่ยังไม่เสร็จในวันนั้นค้างเป็น done=false ตลอดไป แล้วชนด่าน "ต้องดำเนินมาตรการให้ครบ"
     ทั้งขั้นตรวจสอบและขั้นปิดเรื่อง เรื่องจึงปิดไม่ได้ถาวร ทางออกเดียวคือยกเลิกรายงานหรือแก้ชีตด้วยมือ
     ตั้งแต่ 2.7.1 ขั้นนี้บันทึกซ้ำได้โดยสถานะไม่ขยับ — ล็อกพฤติกรรมนี้ไว้ */
  t_('ขั้นติดตามมาตรการต้องบันทึกซ้ำได้โดยสถานะไม่ขยับ', function () {
    eq_(NEXT_STATUS['capa'], 'monitoring', 'ขั้นถัดไปจากกำหนดมาตรการ');
    eq_(NEXT_STATUS['monitoring'], 'reviewed', 'ขั้นถัดไปจากติดตามมาตรการ');
    /* เงื่อนไขที่ advanceStatus_ ใช้ผ่อนปรน: to เป็น monitoring และสถานะปัจจุบันเป็น monitoring */
    var repeatable = function (from, to) { return to === 'monitoring' && from === 'monitoring'; };
    eq_(repeatable('monitoring', 'monitoring'), true, 'บันทึกซ้ำที่ขั้นเดิมได้');
    eq_(repeatable('capa', 'monitoring'), false, 'เข้าขั้นครั้งแรกยังใช้กติกาลำดับขั้นตามปกติ');
    eq_(repeatable('reviewed', 'reviewed'), false, 'ขั้นอื่นห้ามบันทึกซ้ำ');
    return ok_(STATUS_CAP['monitoring'] === 'monitor', 'การบันทึกซ้ำยังต้องมีสิทธิ์ monitor กำกับ');
  });

  /* การส่งเรื่องกลับต้องเปิดเฉพาะขั้นที่มีการอนุมัติค้างอยู่ และผู้ส่งกลับต้องเป็นเจ้าของขั้นนั้น
     ถ้าเปิดกว้างกว่านี้ จะกลายเป็นช่องให้ย้อนสถานะหนีด่านตรวจ เช่นถอนการปิดเรื่องที่เข้าสถิติไปแล้ว */
  t_('ตารางการส่งเรื่องกลับถูกจำกัดไว้เฉพาะขั้นที่ควร', function () {
    eq_(Object.keys(RETURN_MAP).sort(), ['monitoring','reviewed'], 'ขั้นที่ส่งกลับได้');
    eq_(RETURN_MAP.monitoring.to, 'capa', 'รอตรวจสอบ → กำหนดมาตรการ');
    eq_(RETURN_MAP.reviewed.to, 'monitoring', 'รอรับทราบ → ติดตามมาตรการ');
    ok_(!RETURN_MAP.closed && !RETURN_MAP.acknowledged, 'ปิดเรื่องและรับทราบแล้วต้องส่งกลับไม่ได้');
    ok_(!RETURN_MAP[CANCELLED], 'เรื่องที่ยกเลิกแล้วต้องส่งกลับไม่ได้');
    /* ปลายทางทุกอันต้องเป็นขั้นที่อยู่ก่อนหน้าจริงในลำดับ ไม่ใช่กระโดดข้าม */
    Object.keys(RETURN_MAP).forEach(function (from) {
      ok_(STATUS_ORDER.indexOf(RETURN_MAP[from].to) < STATUS_ORDER.indexOf(from),
        'ปลายทางของ ' + from + ' ต้องอยู่ก่อนหน้าในลำดับขั้น');
    });
    return 'ตรวจ ' + Object.keys(RETURN_MAP).length + ' เส้นทาง';
  });

  t_('ผู้ส่งเรื่องกลับต้องเป็นเจ้าของขั้นที่เรื่องกำลังรออยู่', function () {
    /* ขั้นรอตรวจสอบเป็นของผู้มีสิทธิ์ review ขั้นรอรับทราบเป็นของผู้มีสิทธิ์ ack
       ต้องเป็นสิทธิ์เดียวกับที่ STATUS_CAP กำหนดให้เดินหน้าในขั้นนั้น ไม่ใช่สิทธิ์อื่น */
    eq_(RETURN_MAP.monitoring.cap, STATUS_CAP['reviewed'], 'สิทธิ์ส่งกลับจากขั้นรอตรวจสอบ');
    eq_(RETURN_MAP.reviewed.cap, STATUS_CAP['acknowledged'], 'สิทธิ์ส่งกลับจากขั้นรอรับทราบ');
    var holders = Object.keys(ROLES).filter(function (r) { return ROLES[r].can[RETURN_MAP.reviewed.cap]; });
    return ok_(holders.length > 0, 'ต้องมีบทบาทที่ถือสิทธิ์นี้จริง') + ' (' + holders.join(', ') + ')';
  });

  t_('ยกเลิกอยู่นอกลำดับขั้นและออกไม่ได้', function () {
    ok_(STATUS_ORDER.indexOf(CANCELLED) < 0, 'cancelled ไม่ควรอยู่ใน STATUS_ORDER');
    return ok_(!NEXT_STATUS[CANCELLED], 'cancelled ต้องไม่มีขั้นถัดไป');
  });

  /* ผู้รายงานต้องทำได้อย่างเดียวคือสร้างเรื่อง เดินขั้นอื่นเองไม่ได้แม้แต่เรื่องของตัวเอง */
  t_('ผู้รายงานมีสิทธิ์สร้างเรื่องเท่านั้น', function () {
    var can = ROLES.reporter.can;
    eq_(can.create, 1, 'สร้างเรื่อง');
    var forbidden = ['confirm','assess','investigate','capa','close','cancel','admin','exportAll'];
    var leaked = forbidden.filter(function (c) { return can[c]; });
    return ok_(leaked.length === 0, 'ผู้รายงานได้สิทธิ์เกิน: ' + leaked.join(', '));
  });

  t_('ขอบเขตของผู้รายงานจำกัดเฉพาะเรื่องตัวเอง', function () {
    return eq_(ROLES.reporter.scope, 'own', 'ขอบเขตผู้รายงาน');
  });

  t_('หัวหน้างานเห็นเฉพาะหน่วยงานตัวเอง', function () {
    eq_(ROLES.supervisor.scope, 'orgUnit', 'ขอบเขตหัวหน้างาน');
    var u = { role:'supervisor', faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ', email:'a@nu.ac.th' };
    eq_(inScope_(u, { faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ' }), true, 'หน่วยงานเดียวกัน');
    eq_(inScope_(u, { faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานนโยบายและแผน' }), false, 'ต่างหน่วยงาน');
    eq_(inScope_(u, { faculty:'คณะแพทยศาสตร์', orgUnit:'งานธุรการ' }), false, 'ต่างคณะชื่อหน่วยงานเดียวกัน');
    return 'ตรวจ 3 กรณี';
  });

  /* ชีต Users ถูกตัดช่องว่างตั้งแต่ตอนอ่าน (readSheet_) อยู่แล้ว แต่แถวในชีต Incidents ไม่ถูกตัด
     แถวที่แก้ด้วยมือหรือบันทึกก่อนมีการตัดช่องว่าง จึงหลุดจากขอบเขตของหน่วยงานตัวเองได้
     ตั้งแต่ 2.7.4 inScope_ ใช้ sameFaculty_/sameOrgUnit_ ที่ตัดช่องว่างก่อนเทียบทั้งสองฝั่ง */
  t_('ช่องว่างหัวท้ายไม่ทำให้ขอบเขตเพี้ยน', function () {
    var sup = { role:'supervisor', faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ ', email:'a@nu.ac.th' };
    eq_(inScope_(sup, { faculty:' คณะสาธารณสุขศาสตร์', orgUnit:'งานธุรการ' }), true, 'หัวหน้างาน');
    var head = { role:'office_head', faculty:'คณะสาธารณสุขศาสตร์ ', orgUnit:'', email:'b@nu.ac.th' };
    eq_(inScope_(head, { faculty:'คณะสาธารณสุขศาสตร์', orgUnit:'x' }), true, 'หัวหน้าสำนักงาน');
    return eq_(inScope_(head, { faculty:'คณะแพทยศาสตร์', orgUnit:'x' }), false, 'ต่างคณะยังต้องไม่เห็น');
  });

  t_('ผู้ดูแลระดับคณะแต่งตั้งผู้ดูแลระบบต่อไม่ได้', function () {
    ok_(FACULTY_ADMIN_ASSIGNABLE.indexOf('admin') < 0, 'faculty_admin ไม่ควรแต่งตั้ง admin ได้');
    return ok_(FACULTY_ADMIN_ASSIGNABLE.indexOf('faculty_admin') < 0, 'faculty_admin ไม่ควรแต่งตั้งกันเองต่อเป็นทอด ๆ');
  });

  t_('ผู้ดูแลระบบเห็นได้ทั้งมหาวิทยาลัย', function () {
    eq_(ROLES.admin.scope, 'all', 'ขอบเขต');
    return eq_(ROLES.admin.can.admin, 1, 'สิทธิ์ผู้ดูแล');
  });
}

/* ---- การคำนวณระดับความรุนแรง ---- */
function unitSeverity_() {
  /* ขอบเขตของแต่ละช่วงมูลค่าความเสียหาย ผิดหนึ่งบาทก็เปลี่ยนระดับและเปลี่ยนคนที่ต้องได้รับแจ้ง */
  t_('ช่วงมูลค่าความเสียหายแบ่งระดับถูกต้อง', function () {
    eq_(damageBand_(0), 1, 'ไม่มีความเสียหาย');
    eq_(damageBand_(10000), 2, 'ขอบบนของระดับ 2');
    eq_(damageBand_(10001), 3, 'ขอบล่างของระดับ 3');
    eq_(damageBand_(100000), 3, 'ขอบบนของระดับ 3');
    eq_(damageBand_(100001), 4, 'ขอบล่างของระดับ 4');
    eq_(damageBand_(1000000), 4, 'ขอบบนของระดับ 4');
    eq_(damageBand_(1000001), 5, 'ขอบล่างของระดับ 5');
    return 'ตรวจ 7 จุดขอบเขต';
  });

  t_('ระดับรวมใช้ค่าสูงสุดระหว่างการบาดเจ็บและความเสียหาย', function () {
    eq_(calcLevel_(1, 5), 5, 'ความเสียหายสูงกว่า');
    eq_(calcLevel_(4, 2), 4, 'การบาดเจ็บสูงกว่า');
    eq_(calcLevel_(0, 0), 1, 'ค่าว่างต้องได้อย่างน้อยระดับ 1');
    return 'ตรวจ 3 กรณี';
  });

  t_('ระดับที่ต้องแจ้งเตือนทันทีตั้งไว้ตามระเบียบ', function () {
    ok_(CONFIG.NOTIFY_LEVEL >= 1 && CONFIG.NOTIFY_LEVEL <= 5, 'ค่าต้องอยู่ระหว่าง 1-5');
    return 'ระดับ ' + CONFIG.NOTIFY_LEVEL + ' ขึ้นไปแจ้งเตือนทันที';
  });

  t_('ประเภทข้อมูลอ่อนไหวถูกตรวจจับได้', function () {
    ok_(SENSITIVE_CATS.length > 0, 'ต้องมีรายการประเภทอ่อนไหวอย่างน้อย 1 รายการ');
    eq_(isSensitive_([SENSITIVE_CATS[0]]), true, 'ประเภทอ่อนไหว');
    eq_(isSensitive_(['ลื่นล้ม']), false, 'ประเภททั่วไป');
    eq_(isSensitive_([]), false, 'ไม่ระบุประเภท');
    return 'ตรวจ ' + SENSITIVE_CATS.length + ' ประเภทอ่อนไหว';
  });

  /* บั๊กจริงที่เคยเกิด: validCategory_ ตรวจค่าที่ trim แล้ว แต่ list_/txt_ เก็บค่าดิบ
     ประเภทที่ขึ้นต้นด้วยช่องว่างหนึ่งตัวจึงผ่านด่านตรวจ แต่หลุดการจัดเป็นข้อมูลอ่อนไหวทั้งหมด
     ไฟล์แนบไปอยู่โฟลเดอร์ที่แชร์ทั้งโดเมน อีเมลส่งชื่อเรื่องจริงออกไป และทุกบทบาทอ่านเนื้อหาได้ */
  t_('ช่องว่างหัวท้ายต้องไม่ทำให้หลุดการจัดเป็นข้อมูลอ่อนไหว', function () {
    var s = SENSITIVE_CATS[0];
    eq_(isSensitive_([' ' + s]), true, 'ช่องว่างนำหน้า');
    eq_(isSensitive_(['\t' + s + '  ']), true, 'แท็บนำหน้าและช่องว่างต่อท้าย');
    return eq_(validCategory_(' ' + s), true, 'ยืนยันว่าด่านตรวจยอมรับค่าที่มีช่องว่างนำหน้าจริง');
  });

  /* บั๊กจริงที่เคยเกิด: ('000'+n).slice(-3) ทำให้เรื่องที่ 1000 ได้เลขลำดับ '000'
     เลขที่จะซ้ำกันทุกเรื่องตั้งแต่นั้นไป และการแก้ไขเรื่องหนึ่งจะเขียนทับอีกเรื่องหนึ่ง */
  t_('เลขลำดับในเลขที่รายงานไม่ตัดหลักเมื่อเกินพันเรื่อง', function () {
    eq_(padSeq_(1), '001', 'เรื่องแรก');
    eq_(padSeq_(999), '999', 'เรื่องที่ 999');
    eq_(padSeq_(1000), '1000', 'เรื่องที่ 1000 ต้องไม่กลายเป็น 000');
    return eq_(padSeq_(12345), '12345', 'เลขห้าหลัก');
  });
}

/* ---- ความปลอดภัยของข้อความและลิงก์ ---- */
function unitTextSafety_() {
  /* สระอำ (U+0E33) ต้องไม่ถูกแยกเป็นสองอักขระ ถ้าเปลี่ยนไปใช้ NFKC
     ประเภทอุบัติการณ์ที่มีสระอำจะเทียบกับรายการที่อนุญาตไม่ตรง แล้วส่งรายงานหมวดนั้นไม่ได้เลย */
  t_('ข้อความไทยที่มีสระอำไม่ถูกแยกรูป', function () {
    var s = 'การทำร้ายตนเอง';
    eq_(txt_(s, 200), s, 'ข้อความต้องเหมือนเดิมทุกประการ');
    return eq_(txt_('\u0E33', 10).length, 1, 'สระอำต้องยังเป็นอักขระเดียว');
  });

  t_('อักขระควบคุมถูกตัดออก', function () {
    return eq_(txt_('ก่อน\u0000\u0007หลัง', 100), 'ก่อนหลัง', 'ข้อความหลังตัดอักขระควบคุม');
  });

  t_('ข้อความยาวเกินถูกตัดตามเพดาน', function () {
    var long = new Array(300).join('ก');
    return eq_(txt_(long, 50).length, 50, 'ความยาวหลังตัด');
  });

  t_('ค่าว่างและ null ไม่ทำให้พัง', function () {
    eq_(txt_(null, 100), '', 'null');
    eq_(txt_(undefined, 100), '', 'undefined');
    return eq_(txt_(0, 100), '0', 'เลขศูนย์ต้องไม่กลายเป็นค่าว่าง');
  });

  /* ลิงก์แผนที่รับเฉพาะ https และห้ามมี userinfo เพราะ https://maps.google.com@evil.com หลอกตาได้ */
  t_('ลิงก์แผนที่รับเฉพาะ https ที่ปลอดภัย', function () {
    ok_(url_('https://maps.app.goo.gl/abc123'), 'ลิงก์ https ปกติต้องผ่าน');
    eq_(url_('javascript:alert(1)'), '', 'javascript: ต้องถูกปฏิเสธ');
    eq_(url_('data:text/html,<script>'), '', 'data: ต้องถูกปฏิเสธ');
    eq_(url_('http://maps.google.com/x'), '', 'http ธรรมดาต้องถูกปฏิเสธ');
    eq_(url_('https://maps.google.com@evil.com/x'), '', 'ลิงก์ที่มี userinfo ต้องถูกปฏิเสธ');
    return 'ตรวจ 5 กรณี';
  });

  t_('ชนิดไฟล์แนบมีรายการที่อนุญาตกำกับ', function () {
    var n = Object.keys(ALLOWED_MIME).length;
    ok_(n > 0, 'ต้องมีรายการชนิดไฟล์ที่อนุญาต');
    ok_(!ALLOWED_MIME['text/html'], 'ห้ามอนุญาต text/html');
    ok_(!ALLOWED_MIME['application/x-msdownload'], 'ห้ามอนุญาตไฟล์โปรแกรม');
    return 'อนุญาต ' + n + ' ชนิด';
  });

  t_('เพดานขนาดไฟล์แนบตั้งไว้สมเหตุสมผล', function () {
    return ok_(CONFIG.MAX_FILE_MB > 0 && CONFIG.MAX_FILE_MB <= 50, 'ควรอยู่ระหว่าง 1-50 MB') +
           ' (' + CONFIG.MAX_FILE_MB + ' MB)';
  });
}

/* ---- โครงสร้างข้อมูล ---- */
function unitDataShape_() {
  t_('ชีตทุกใบมีคอลัมน์ที่ระบบต้องใช้', function () {
    var need = { Incidents:['id','status','level','version','faculty','orgUnit','reporterEmail','monitorLog'],
                 Users:['email','role','active','faculty','orgUnit','approvedAt'],
                 Audit:['t','who','act','entryHash','prevEntryHash'],
                 Attachments:['attachmentId','driveFileId','uploadToken','status'] };
    Object.keys(need).forEach(function (sheet) {
      var missing = need[sheet].filter(function (c) { return SHEETS[sheet].indexOf(c) < 0; });
      ok_(missing.length === 0, 'ชีต ' + sheet + ' ขาดคอลัมน์ ' + missing.join(', '));
    });
    return 'ตรวจ 4 ชีต';
  });

  t_('ไม่มีคอลัมน์ซ้ำในชีตใด', function () {
    Object.keys(SHEETS).forEach(function (name) {
      var seen = {}, dup = [];
      SHEETS[name].forEach(function (c) { if (seen[c]) dup.push(c); seen[c] = 1; });
      ok_(dup.length === 0, 'ชีต ' + name + ' มีคอลัมน์ซ้ำ: ' + dup.join(', '));
    });
    return 'ตรวจ ' + Object.keys(SHEETS).length + ' ชีต';
  });

  /* แถวที่บันทึกก่อนมีคอลัมน์ version ต้องอ่านเป็น 1 มิฉะนั้นหน้าจอส่ง expectedVersion ไม่ได้
     แล้วคำสั่งแก้ไขเรื่องเก่าทุกคำสั่งจะถูกปฏิเสธที่ประตูหน้า */
  t_('เรื่องเก่าที่ไม่มีเลขเวอร์ชันอ่านได้เป็น 1', function () {
    eq_(hydrate_({ id:'IR-2569-001', version:'' }).version, 1, 'เวอร์ชันว่าง');
    return eq_(hydrate_({ id:'IR-2569-002', version:7 }).version, 7, 'เวอร์ชันที่มีค่า');
  });

  t_('ฟิลด์ที่เก็บเป็น JSON อ่านกลับเป็นรายการเสมอ', function () {
    var o = hydrate_({ cats:'["ลื่นล้ม"]', files:'ข้อมูลเสียหายไม่ใช่ JSON', involved:'' });
    eq_(o.cats, ['ลื่นล้ม'], 'JSON ที่ถูกต้อง');
    eq_(o.files, [], 'JSON ที่เสียหายต้องกลายเป็นรายการว่าง ไม่ใช่ทำให้พัง');
    return eq_(o.involved, [], 'ค่าว่าง');
  });

  /* เรื่องที่บันทึกก่อนรุ่น 2.7.1 ยังไม่มีคอลัมน์ monitorLog ถ้าอ่านกลับมาไม่เป็นรายการ
     หน้ารายละเอียดจะพังตอนนับจำนวนครั้งที่ติดตาม และบันทึกรอบใหม่ต่อไม่ได้ */
  t_('ประวัติการติดตามมาตรการอ่านกลับเป็นรายการเสมอ', function () {
    ok_(JSON_FIELDS.indexOf('monitorLog') >= 0, 'monitorLog ต้องอยู่ในรายการฟิลด์ JSON');
    eq_(hydrate_({ monitorLog:'' }).monitorLog, [], 'เรื่องเก่าที่ยังไม่มีคอลัมน์นี้');
    var one = hydrate_({ monitorLog:'[{"n":1,"done":2,"total":7}]' }).monitorLog;
    eq_(one.length, 1, 'อ่านประวัติที่มีอยู่');
    return eq_(dehydrate_({ monitorLog:one }, ['monitorLog'])[0], '[{"n":1,"done":2,"total":7}]', 'เขียนกลับลงชีตได้');
  });

  t_('ค่าตัวเลขที่ว่างอ่านเป็นศูนย์ ไม่ใช่ NaN', function () {
    var o = hydrate_({ level:'', injuryAxis:'ไม่ใช่ตัวเลข', damageBaht:'25000' });
    eq_(o.level, 0, 'ระดับว่าง');
    eq_(o.injuryAxis, 0, 'ค่าที่ไม่ใช่ตัวเลข');
    return eq_(o.damageBaht, 25000, 'ตัวเลขในรูปข้อความ');
  });

  t_('แปลงข้อมูลกลับไปเขียนลงชีตได้ครบทุกคอลัมน์', function () {
    var head = SHEETS.Users;
    var row = dehydrate_({ email:'a@nu.ac.th', role:'reporter', active:true }, head);
    eq_(row.length, head.length, 'จำนวนช่องต้องเท่าจำนวนคอลัมน์');
    return eq_(row[head.indexOf('email')], 'a@nu.ac.th', 'ค่าลงตรงคอลัมน์');
  });

  t_('ลายนิ้วมือข้อมูลเปลี่ยนเมื่อเนื้อหาเปลี่ยน', function () {
    var a = hashObject_({ status:'submitted', level:1 });
    var b = hashObject_({ status:'confirmed', level:1 });
    ok_(a !== b, 'ข้อมูลต่างกันต้องได้ลายนิ้วมือต่างกัน');
    return eq_(a, hashObject_({ status:'submitted', level:1 }), 'ข้อมูลเดียวกันต้องได้ค่าเดิม');
  });

  /* บั๊กจริงที่เคยเกิด: audit_ เคยกันสูตร (เติม ' นำหน้า) ก่อนคำนวณแฮชตอนเขียน แต่ Google Sheets
     ไม่เก็บ ' นั้นไว้ในค่าเซลล์จริง — อ่านกลับมาได้ค่าดิบเสมอ ทำให้ verifyAuditChain_ คำนวณแฮชจาก
     ค่าที่ไม่ตรงกับตอนเขียน และฟ้องว่าโซ่ Audit ขาดทุกแถวที่ who/role เป็น "-" (คำขอที่ยังไม่ระบุตัวตน)
     ทั้งที่ไม่มีการแก้ไขข้อมูลจริง แก้โดยย้ายการกันสูตรเข้าไปอยู่ใน auditEntryHash_ เอง เพื่อให้ทั้งฝั่งเขียน
     (entry เป็นค่าดิบ) และฝั่งตรวจสอบย้อนหลัง (x อ่านจากชีต ก็เป็นค่าดิบเช่นกัน) กันสูตรแบบเดียวกันเสมอ */
  /* บั๊กจริงที่เคยเกิด (v2.6.5): getBootstrap_ คืนแถว Users ทั้งแถว ถ้าชีตทะเบียนมีคอลัมน์นอก schema
     ที่เก็บวันที่ไว้ Sheets จะคืนเป็น Date object ซึ่ง google.script.run ส่งข้ามไม่ได้ envelope ทั้งก้อน
     กลายเป็น null ที่ฝั่งหน้าจอ แล้วรายงานเป็น INVALID_RESPONSE โดยไม่มี Request ID ให้ตามต่อ
     apiSafe_ กรองที่ประตูออกจุดเดียว จึงต้องแน่ใจว่ามันไม่ทำให้ envelope ปกติเพี้ยน */
  t_('envelope ต้องผ่านการกรองแล้วยังคงรูปเดิม และค่าที่ส่งข้ามไม่ได้ต้องถูกแปลง', function () {
    var clean = apiSafe_({ ok:true, status:200, data:{ a:1, b:'x', c:[1,2], d:{ e:true } } });
    eq_(clean.ok, true, 'ok ต้องคงค่าเดิม');
    eq_(clean.data.d.e, true, 'ค่าซ้อนชั้นต้องคงอยู่');
    eq_(clean.data.c.length, 2, 'อาร์เรย์ต้องคงอยู่');

    var risky = apiSafe_({ ok:true, data:{ when:new Date(2026, 0, 1), gone:undefined, num:NaN } });
    ok_(typeof risky.data.when === 'string', 'Date ต้องถูกแปลงเป็นข้อความ');
    ok_(!('gone' in risky.data), 'undefined ต้องถูกตัดทิ้ง');
    return ok_(risky.data.num === null, 'NaN ต้องกลายเป็น null');
  });

  t_('แฮชของรายการ Audit ต้องคงที่ไม่ว่าค่าจะขึ้นต้นด้วยอักขระกันสูตรหรือไม่', function () {
    var secret = 'test-secret-key';
    var entry = { t:'2026-01-01 00:00', who:'-', role:'-', act:'ทดสอบ', target:'',
      detail:'', auditId:'x', requestId:'y', outcome:'SUCCESS', errorCode:'',
      beforeHash:'', afterHash:'', changes:'', appVersion:APP_VERSION, prevEntryHash:'' };
    var writeTimeHash = auditEntryHash_(entry, secret);
    /* จำลองค่าที่อ่านกลับจากชีตจริง: เป็น object คนละตัว แต่ค่าแต่ละฟิลด์เป็นค่าดิบเหมือนกันเป๊ะ
       เพราะ Google Sheets ไม่เก็บ ' นำหน้าที่ escFormula_ อาจเติมไว้ตอนเขียน */
    var readBack = {}; Object.keys(entry).forEach(function (k) { readBack[k] = entry[k]; });
    var verifyTimeHash = auditEntryHash_(readBack, secret);
    return eq_(verifyTimeHash, writeTimeHash, 'แฮชตอนเขียนกับตอนตรวจสอบย้อนหลังต้องตรงกันเสมอ แม้ who/role เป็น "-"');
  });

  /* บั๊กจริงที่เคยเกิด (v2.6.5): prevEntryHash ของรายการใหม่อ่านจาก Script Property AUDIT_LAST_HASH
     ซึ่งอยู่คนละที่กับชีต พอชีต Audit ถูกล้างหรือถูกลบแถว ค่าใน Property ยังค้าง รายการแรกของชีตใหม่
     จึงชี้ไปยังแฮชที่ไม่มีอยู่จริง และถ้า Property หายไประหว่างทาง รายการถัดไปจะได้ค่าว่างกลางโซ่
     แก้โดยให้ audit_ อ่าน prevEntryHash จาก entryHash ของแถวท้ายในชีตเสมอ (auditTailHash_) */
  t_('ลายเซ็นต้องผูกกับรายการก่อนหน้าจริง เปลี่ยนตัวเชื่อมแล้วลายเซ็นต้องเปลี่ยน', function () {
    var secret = 'test-secret-key';
    var base = { t:'2026-01-01 00:00', who:'a@nu.ac.th', role:'admin', act:'ทดสอบ', target:'',
      detail:'', auditId:'1', requestId:'r', outcome:'SUCCESS', errorCode:'',
      beforeHash:'', afterHash:'', changes:'', appVersion:APP_VERSION, prevEntryHash:'' };
    var h1 = auditEntryHash_(base, secret);

    var second = {}; Object.keys(base).forEach(function (k) { second[k] = base[k]; });
    second.auditId = '2'; second.prevEntryHash = h1;
    var h2 = auditEntryHash_(second, secret);

    var forged = {}; Object.keys(second).forEach(function (k) { forged[k] = second[k]; });
    forged.prevEntryHash = '';                       /* จำลองอาการโซ่ขาดกลางทาง */
    ok_(auditEntryHash_(forged, secret) !== h2, 'ตัดตัวเชื่อมออกแล้วลายเซ็นต้องไม่ตรงของเดิม');
    ok_(h1 !== h2, 'สองรายการที่ต่างกันต้องได้ลายเซ็นต่างกัน');
    return eq_(auditEntryHash_(second, secret), h2, 'ข้อมูลเดิมต้องได้ลายเซ็นเดิมเสมอ');
  });

  /* ธงที่จดไว้รุ่นก่อน v2.6.6 เป็นข้อความล้วน ตัวอ่านต้องรับได้ทั้งสองรูปแบบ
     ไม่งั้นการอัปเกรดโค้ดจะทำให้ธงที่ค้างอยู่ก่อนหน้ากลายเป็นอ่านไม่ออกและหายไปเงียบ ๆ */
  t_('อ่านธงการลบรายการท้ายได้ทั้งรูปแบบ JSON และข้อความล้วนของรุ่นก่อน', function () {
    var legacy = auditTamperParse_('2026-08-29 08:04 · รายการล่าสุดที่ระบบเขียนคือ 3c56ce0052fc…');
    ok_(legacy.at === '2026-08-29 08:04', 'ต้องแยกเวลาที่ตรวจพบออกจากข้อความเดิมได้');
    var modern = auditTamperParse_(JSON.stringify({ at:'2026-08-29 08:04', expected:'abc123def456789', actual:'' }));
    ok_(modern.note.indexOf('abc123def456') >= 0, 'ต้องประกอบข้อความจากค่าใน JSON ได้');
    ok_(modern.note.indexOf('(ไม่มีรายการ)') >= 0, 'แถวท้ายที่ว่างต้องอ่านออกว่าไม่มีรายการ');
    return ok_(auditTamperParse_('') === null, 'ไม่มีธงต้องคืนค่า null ไม่ใช่ออบเจ็กต์ว่าง');
  });

  /* ธงถูกเก็บเป็น JSON ตั้งแต่ v2.6.6 ทุกจุดที่แสดงผลต้องอ่านผ่าน auditTamperParse_
     ถ้าเผลอต่อค่าดิบ ผู้ดูแลจะเห็น {"at":"...","expected":"..."} แทนประโยคที่อ่านรู้เรื่อง */
  t_('ข้อความจากธงต้องเป็นประโยคที่อ่านได้ ไม่ใช่ JSON ดิบ', function () {
    var note = auditTamperParse_(JSON.stringify({ at:'2026-08-29 08:04', expected:'3c56ce0052fc0', actual:'' })).note;
    ok_(note.indexOf('{') < 0 && note.indexOf('"at"') < 0, 'ต้องไม่มีเศษ JSON ในข้อความ');
    return ok_(note.indexOf('2026-08-29 08:04') >= 0, 'ต้องบอกเวลาที่ตรวจพบ');
  });

  t_('ผู้ตรวจต้องแยกออกว่าโซ่ขาดเพราะตัวเชื่อม หรือเพราะลายเซ็น', function () {
    var row = { t:'2026-01-01 00:00', prevEntryHash:'abcdef0123456789', entryHash:'x' };
    var link = auditBreakDetail_(2, 0, 'LINK', row, '');
    var sign = auditBreakDetail_(9, 7, 'SIGN', row, 'abcdef0123456789');
    ok_(link.indexOf('แถวที่ 2') >= 0, 'ต้องบอกเลขแถวจริงในชีต');
    ok_(link.indexOf('ตัวเชื่อมไม่ตรง') >= 0, 'ต้องระบุว่าเป็นปัญหาตัวเชื่อม');
    ok_(sign.indexOf('ลายเซ็นไม่ตรง') >= 0, 'ต้องระบุว่าเป็นปัญหาลายเซ็น');
    return ok_(sign.indexOf('ตรวจผ่านมาแล้ว 7 รายการ') >= 0, 'ต้องบอกว่าตรวจผ่านมาแล้วกี่รายการ');
  });

  /* บันทึกร่องรอยต้องบอกว่าอะไรเปลี่ยน แต่ห้ามคัดลอกเนื้อหาอ่อนไหวลงไปทั้งดุ้น */
  t_('บันทึกร่องรอยเก็บค่าจริงเฉพาะฟิลด์ที่ปลอดภัย', function () {
    var d = JSON.parse(diffForAudit_({ status:'submitted', detail:'ชื่อผู้บาดเจ็บ ก' },
                                     { status:'confirmed', detail:'ชื่อผู้บาดเจ็บ ข' }));
    eq_(d.status, { before:'submitted', after:'confirmed' }, 'สถานะเก็บค่าจริงได้');
    return eq_(d.detail, { changed:true }, 'รายละเอียดต้องบันทึกแค่ว่าเปลี่ยน ไม่เก็บเนื้อหา');
  });
}

/* ---- โครงสร้างและแหล่งความจริงเดียว (เพิ่มในรุ่น 2.7.4) ----
   ล็อกจุดที่เคยเขียนซ้ำหลายที่แล้วแก้ไม่ครบ และด่านของฟังก์ชันที่เรียกจากเบราว์เซอร์ได้ */
function unitStructure_() {
  /* ชื่อที่ได้ค่าจาก Object.prototype ต้องไม่ผ่านด่านตรวจตาราง config ใดเลย */
  t_('ชื่อคำสั่งและบทบาทจาก Object.prototype ถูกปฏิเสธ', function () {
    ['constructor','toString','hasOwnProperty','__proto__'].forEach(function (k) {
      ok_(!isRole_(k), 'isRole_ ต้องไม่ยอมรับ ' + k);
      ok_(!own_(API_ACTIONS, k), 'own_ ต้องไม่ยอมรับ ' + k);
      throws_('ACTION_NOT_FOUND', function () { validateApiRequest_({ apiVersion:API_VERSION, action:k, payload:{} }); });
    });
    ok_(isRole_('admin') && isRole_('reporter'), 'บทบาทจริงต้องผ่าน');
    return ok_(own_(API_ACTIONS, 'incident.list'), 'action จริงต้องผ่าน');
  });

  t_('ด่านความปลอดภัยที่เพิ่มในรุ่นนี้ยังอยู่ครบ', function () {
    ok_(String(createIncident_).indexOf('date > today_()') >= 0, 'createIncident_ ต้องปฏิเสธวันที่เกิดเหตุในอนาคต');
    ok_(String(verifyIdToken_).indexOf('REQUIRE_HOSTED_DOMAIN') >= 0, 'verifyIdToken_ ต้องตรวจ claim hd');
    ok_(String(diagnose_).indexOf("'SS_ID = '") < 0, 'diagnose_ ต้องไม่เปิดเผยรหัส Spreadsheet');
    var apiSrc = String(api);
    ok_(apiSrc.indexOf('enforceRateLimit_(') < apiSrc.indexOf('validateApiRequest_(req)'), 'ต้องจำกัดอัตราก่อนตรวจรูปแบบคำขอ');
    return ok_(apiSrc.indexOf('skipAudit') >= 0, 'คำขอที่ถูกจำกัดอัตราซ้ำต้องไม่เขียน Audit ทุกครั้ง');
  });

  t_('สิทธิ์เปิดไฟล์แนบ: เฉพาะผู้ดูแลระบบ ผู้ดูแลระบบระดับคณะ หัวหน้าสำนักงาน รองคณบดี (กำกับดูแล) คณบดี', function () {
    var rec = { faculty:'คณะ ก', cats:['ภัยธรรมชาติ'] }, sens = { faculty:'คณะ ก', cats:[SENSITIVE_CATS[0]] };
    var mk = function (role, fac, active) { return { role:role, faculty:fac, active:active !== false }; };
    ['office_head','deputy_dean_sup','dean'].forEach(function (r) {
      ok_(canViewAttachments_(mk(r, 'คณะ ก'), rec), r + ' ของคณะที่เกิดเหตุต้องเปิดได้');
      ok_(canViewAttachments_(mk(r, ' คณะ ก '), sens), r + ' ต้องเปิดเรื่องอ่อนไหวของคณะตนได้');
      ok_(!canViewAttachments_(mk(r, 'คณะ ข'), rec), r + ' ของคณะอื่นต้องเปิดไม่ได้');
    });
    ok_(canViewAttachments_(mk('admin', 'ส่วนกลาง'), rec), 'ผู้ดูแลระบบต้องเปิดได้ทุกคณะ');
    ok_(!canViewAttachments_(mk('admin', 'ส่วนกลาง'), sens), 'ผู้ดูแลระบบไม่มีสิทธิ์อ่านเรื่องอ่อนไหว จึงต้องเปิดไฟล์ไม่ได้');
    ok_(canViewAttachments_(mk('faculty_admin', 'คณะ ก'), rec), 'ผู้ดูแลระบบระดับคณะต้องเปิดไฟล์ของคณะตนได้');
    ok_(!canViewAttachments_(mk('faculty_admin', 'คณะ ข'), rec), 'ผู้ดูแลระบบระดับคณะต้องเปิดไฟล์ของคณะอื่นไม่ได้');
    ok_(!canViewAttachments_(mk('faculty_admin', 'คณะ ก'), sens), 'ผู้ดูแลระบบระดับคณะไม่มีสิทธิ์อ่านเรื่องอ่อนไหว จึงต้องเปิดไฟล์ไม่ได้');
    ok_(!canViewAttachments_(mk('dean', 'คณะ ก', false), rec), 'บัญชีที่ถูกระงับต้องเปิดไม่ได้');
    var others = Object.keys(ROLES).filter(function (r) { return ATTACH_VIEW_ROLES.indexOf(r) < 0; });
    var leak = others.filter(function (r) { return canViewAttachments_(mk(r, 'คณะ ก'), rec); });
    return ok_(leak.length === 0, 'บทบาทอื่นเปิดไฟล์ได้: ' + leak.join(', ')) + ' (ปฏิเสธ ' + others.length + ' บทบาท)';
  });

  t_('ทะเบียนผู้ใช้ในชีต: แชร์เฉพาะผู้ดูแลระบบ และทุกการแก้ถูกบันทึก', function () {
    var src = String(registryEditorEmails_);
    ok_(src.indexOf("x.role === 'admin'") >= 0 && src.indexOf('x.active') >= 0, 'ต้องแชร์เฉพาะ admin ที่ใช้งานอยู่');
    ok_(src.indexOf('faculty_admin') < 0, 'ผู้ดูแลระดับคณะต้องไม่ได้สิทธิ์แก้ทั้งชีต');
    ok_(String(syncRegistryEditors_).indexOf('REGISTRY_EDITORS_MANAGED') >= 0, 'ต้องถอดเฉพาะผู้แก้ไขที่ระบบเพิ่มเอง');
    var edit = String(onUsersRegistryEdit_);
    ok_(edit.indexOf('audit_(') >= 0 && edit.indexOf('scheduleAttachmentSync_') >= 0, 'onEdit ต้องบันทึก Audit และนัดปรับสิทธิ์');
    return ok_(String(installTriggers_).indexOf("'onUsersRegistryEdit_'") >= 0, 'installTriggers_ ต้องติดตั้ง onEdit ของทะเบียน');
  });

  t_('การแก้ไขข้อมูลรายงาน: หัวหน้าสำนักงาน รองคณบดี (กำกับดูแล) ผู้ดูแลระบบ และแก้ได้เฉพาะช่องที่อนุญาต', function () {
    var holders = Object.keys(ROLES).filter(function (r) { return ROLES[r].can.edit; });
    eq_(holders, ['office_head', 'deputy_dean_sup', 'admin'], 'บทบาทที่มีสิทธิ์ edit');
    ['reporter','reporterEmail','anon','faculty','orgUnit','cats','level','status','files','log','version'].forEach(function (k) {
      ok_(!Object.prototype.hasOwnProperty.call(EDIT_FIELDS, k), 'ช่อง ' + k + ' ต้องแก้ผ่าน incident.edit ไม่ได้');
    });
    throws_('VALIDATION_FAILED', function () { cleanEditValue_('date', '2999-01-01'); });
    throws_('VALIDATION_FAILED', function () { cleanEditValue_('title', '   '); });
    throws_('VALIDATION_FAILED', function () { cleanEditValue_('mapUrl', 'javascript:alert(1)'); });
    throws_('VALIDATION_FAILED', function () { cleanEditValue_('kind', 'other'); });
    eq_(cleanEditValue_('time', '08:30'), '08:30', 'เวลาที่ถูกต้อง');
    return ok_(API_ACTIONS['incident.edit'] && API_ACTIONS['incident.edit'].needsVersion, 'incident.edit ต้องบังคับ expectedVersion');
  });

  t_('แก้ผลการประเมินและการติดตามมาตรการ', function () {
    var a = String(assessIncident_);
    ok_(a.indexOf("requiredNote_(note") >= 0, 'แก้ผลการประเมินต้องบังคับเหตุผล');
    ok_(a.indexOf("r.status !== 'closed'") >= 0, 'ต้องแก้ผลการประเมินเรื่องที่ปิดแล้วไม่ได้');
    var s = String(advanceStatus_);
    ok_(s.indexOf('prevDone') >= 0, 'แก้มาตรการต้องคงสถานะแล้วเสร็จเดิม');
    ok_(s.indexOf("x.doneAt>today_()") >= 0, 'วันแล้วเสร็จต้องไม่อยู่ในอนาคต');
    return ok_(s.indexOf('undone') >= 0, 'การยกเลิกสถานะแล้วเสร็จต้องถูกบันทึก');
  });

  t_('ปิดเรื่องระดับ 3 ขึ้นไปต้องรายงานมหาวิทยาลัยก่อน', function () {
    return ok_(String(advanceStatus_).indexOf('SEV_UNI[r.level]&&!r.uniReportAt') >= 0, 'advanceStatus_ ต้องตรวจ uniReportAt ก่อนปิดเรื่อง');
  });

  t_('งานอัตโนมัติที่แก้ข้อมูลบันทึกร่องรอยในนามระบบ', function () {
    ok_(String(backupDatabase_).indexOf('SYSTEM_ACTOR') >= 0, 'backupDatabase_ จากทริกเกอร์ต้องบันทึก Audit');
    ok_(String(cleanupExpiredAttachments_).indexOf('SYSTEM_ACTOR') >= 0, 'cleanupExpiredAttachments_ ต้องบันทึก Audit');
    return ok_(String(cleanupExpiredAttachments_).indexOf('releaseLockFlushed_') >= 0, 'cleanupExpiredAttachments_ ต้องถือ lock');
  });

  /* บั๊กจริง: ดับเบิลคลิก "เริ่มใช้งาน" แล้วได้แถว Users ซ้ำอีเมลเดียวกัน
     เพราะปล่อย Script Lock ก่อนการเขียนชีตถูก flush คำขอที่สองจึงอ่านชีตไม่เห็นแถวของคำขอแรก */
  t_('ทุกจุดปล่อย Script Lock หลัง flush การเขียนชีตแล้ว', function () {
    var srcFlush = String(releaseLockFlushed_);
    ok_(srcFlush.indexOf('SpreadsheetApp.flush()') >= 0 &&
        srcFlush.indexOf('SpreadsheetApp.flush()') < srcFlush.indexOf('releaseLock()'), 'ต้อง flush ก่อน releaseLock');
    var sites = { api:api, createIncident_:createIncident_, audit_:audit_, cleanupExpiredAttachments_:cleanupExpiredAttachments_ };
    var raw = Object.keys(sites).filter(function (k) { return /\.releaseLock\(\)/.test(String(sites[k])); });
    ok_(raw.length === 0, 'ยังปล่อย lock ตรง ๆ โดยไม่ flush ที่: ' + raw.join(', '));
    var reg = String(registerSelf_);
    return ok_(reg.indexOf("readAll_('Users')") >= 0 && reg.indexOf('alreadyRegistered') >= 0,
      'registerSelf_ ต้องตรวจอีเมลซ้ำก่อนเพิ่มแถว') + ' (' + Object.keys(sites).length + ' จุด)';
  });
  t_('หน้าตรวจความพร้อมใช้กติกาโดเมนเดียวกับการเข้าสู่ระบบ', function () {
    ok_(domainOk_('a@grad.' + CONFIG.ALLOWED_DOMAIN), 'โดเมนย่อยต้องเข้าระบบได้');
    ok_(!domainOk_('a@evil' + CONFIG.ALLOWED_DOMAIN), 'โดเมนที่ลงท้ายคล้ายกันต้องไม่ผ่าน');
    var src = String(adminCheckUsers_);
    ok_(src.indexOf('domainOk_(') >= 0, 'adminCheckUsers_ ต้องเรียก domainOk_');
    return ok_(src.indexOf('.slice(-(CONFIG.ALLOWED_DOMAIN') < 0, 'ยังมีการเทียบท้ายอีเมลแบบเดิมค้างอยู่');
  });

  t_('สิทธิ์อ่านเรื่องอ่อนไหวกำหนดที่ธง sensitiveAccess จุดเดียว', function () {
    var holders = Object.keys(ROLES).filter(function (r) { return ROLES[r].sensitiveAccess; }).sort();
    eq_(holders, ['assistant_president','dean','deputy_dean','deputy_dean_sup','office_head','president','vice_president','vice_president_sup'], 'บทบาทที่มีธง');
    var narrow = holders.filter(function (r) { return ['faculty','all'].indexOf(ROLES[r].scope) < 0; });
    ok_(narrow.length === 0, 'ธงนี้ควรอยู่กับบทบาทระดับคณะหรือมหาวิทยาลัยเท่านั้น: ' + narrow.join(', '));
    return ok_(String(scoped_).indexOf("'office_head','deputy_dean_sup'") < 0, 'scoped_ ยังเขียนรายชื่อบทบาทเองอยู่');
  });

  t_('ผู้รับแจ้งเตือนระดับคณะมาจากตารางเดียว', function () {
    var unknown = FACULTY_NOTIFY_ROLES.concat(UNIVERSITY_NOTIFY_ROLES, FALLBACK_NOTIFY_ROLES).filter(function (r) { return !ROLES[r]; });
    ok_(unknown.length === 0, 'บทบาทที่ไม่มีในระบบ: ' + unknown.join(', '));
    ok_(String(notify_).indexOf('FACULTY_NOTIFY_ROLES') >= 0, 'notify_ ต้องใช้ FACULTY_NOTIFY_ROLES');
    ok_(String(notifyOverdueCapa_).indexOf('FACULTY_NOTIFY_ROLES') >= 0, 'notifyOverdueCapa_ ต้องใช้ FACULTY_NOTIFY_ROLES');
    ok_(FALLBACK_NOTIFY_ROLES.every(function (r) { return ROLES[r]; }), 'ผู้รับสำรองต้องเป็นบทบาทที่มีอยู่');
    return ok_([notify_, notifyOverdueCapa_].every(function (f) { return String(f).indexOf('FALLBACK_NOTIFY_ROLES') >= 0; }),
      'ทั้งสองฟังก์ชันต้องใช้ผู้รับสำรองชุดเดียวกัน');
  });

  /* อีเมลเตือนมาตรการเกินกำหนดเคยใส่ชื่อเรื่องและเนื้อมาตรการของเรื่องอ่อนไหวตรง ๆ
     ถึง คปอ. และกองอาคารสถานที่ ซึ่งไม่มีสิทธิ์อ่านเรื่องเหล่านี้ในระบบ */
  t_('อีเมลไม่เปิดเผยชื่อเรื่องอ่อนไหว', function () {
    var s = SENSITIVE_CATS[1];
    ok_(mailTitle_({ title:'ชื่อจริง', cats:[' ' + s] }).indexOf('ชื่อจริง') < 0, 'ช่องว่างนำหน้าต้องไม่หลุดการปิดบัง');
    eq_(mailTitle_({ title:'ลื่นล้ม', cats:['ภัยธรรมชาติ'] }), 'ลื่นล้ม', 'เรื่องทั่วไปต้องเห็นชื่อ');
    var src = String(notifyOverdueCapa_);
    ok_(src.indexOf('isSensitive_(r.cats)') >= 0, 'notifyOverdueCapa_ ต้องแยกเรื่องอ่อนไหว');
    return ok_(src.indexOf("r.id + ' — ' + r.title") < 0, 'ยังมีการใส่ r.title ตรง ๆ ในอีเมล');
  });

  /* ฟังก์ชันที่ไม่ลงท้าย _ ทุกตัวเรียกจากเบราว์เซอร์ได้ Web App รันในนามเจ้าของสคริปต์
     ตัวที่ไม่มีด่านจึงเปิดให้ทุกบัญชีในโดเมนสั่งงานหรืออ่านข้อมูลภายในได้ */
  t_('ฟังก์ชันสาธารณะทุกตัวมีด่านตรวจผู้เรียก', function () {
    var gated = {
      setupFromEditor:setupFromEditor, verifyInstallationFromEditor:verifyInstallationFromEditor,
      setupUsersDropdownsFromEditor:setupUsersDropdownsFromEditor, repairAuditFromEditor:repairAuditFromEditor,
      protectAuditSheetFromEditor:protectAuditSheetFromEditor, auditFlagStatus:auditFlagStatus,
      resolveAuditTamperFromEditor:resolveAuditTamperFromEditor, trimAuditFromEditor:trimAuditFromEditor,
      storageReportFromEditor:storageReportFromEditor, showLinksFromEditor:showLinksFromEditor,
      syncAttachmentAccessFromEditor:syncAttachmentAccessFromEditor,
      runUnitTests:runUnitTests, runInstallCheck:runInstallCheck, runSelfTest:runSelfTest
    };
    var open = Object.keys(gated).filter(function (k) {
      var src = String(gated[k]);
      if (/assertEditor(OrAdmin)?_\(\)|need_\(u, *'admin'\)/.test(src)) return false;
      /* repairAuditFromEditor ส่งต่อให้ adminRepairAuditChain_ ซึ่งตรวจสิทธิ์ admin เอง */
      return !(k === 'repairAuditFromEditor' && /need_\(u, *'admin'\)/.test(String(adminRepairAuditChain_)));
    });
    return ok_(open.length === 0, 'ไม่มีด่าน: ' + open.join(', ')) + ' (' + Object.keys(gated).length + ' ฟังก์ชัน)';
  });

}

/* ============================================================
 *  ชุดที่ 2 — ตรวจการติดตั้งจริง (อ่านจาก Sheets/Drive)
 *  ต้องรันหลัง setupFromEditor แล้วเท่านั้น
 * ============================================================ */
function runInstallCheck() {
  assertEditorOrAdmin_();
  T_RESULTS = [];
  var props = PropertiesService.getScriptProperties();

  t_('ตั้งค่าโดเมนที่อนุญาตแล้ว', function () {
    return ok_(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(CONFIG.ALLOWED_DOMAIN || '')),
      'CONFIG.ALLOWED_DOMAIN ไม่ถูกรูปแบบ') + ' (@' + CONFIG.ALLOWED_DOMAIN + ')';
  });

  t_('ติดตั้งฐานข้อมูลอุบัติการณ์แล้ว', function () {
    var id = props.getProperty('SS_ID');
    ok_(id, 'ยังไม่มี SS_ID — ต้องรัน setupFromEditor ก่อน');
    return SpreadsheetApp.openById(id).getName();
  });

  /* ทะเบียนสิทธิ์ต้องอยู่คนละไฟล์กับข้อมูลอุบัติการณ์ ไม่งั้นคนที่เปิดฐานข้อมูลได้จะแก้สิทธิ์ตัวเองได้ */
  t_('ทะเบียนผู้ใช้แยกไฟล์จากฐานข้อมูล', function () {
    var users = usersDb_();
    ok_(users.getId() !== props.getProperty('SS_ID'), 'ทะเบียนผู้ใช้ยังอยู่ไฟล์เดียวกับฐานข้อมูล');
    return users.getName();
  });

  t_('แท็บทะเบียนผู้ใช้มีคอลัมน์ครบ', function () {
    var sh = sheet_('Users');
    var have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var missing = SHEETS.Users.filter(function (c) { return have.indexOf(c) < 0; });
    return ok_(missing.length === 0, 'ขาดคอลัมน์ ' + missing.join(', ')) +
           ' (' + Math.max(0, sh.getLastRow() - 1) + ' แถว)';
  });

  /* ไม่มีผู้ดูแลที่ใช้งานอยู่ = เข้าหน้าจัดการผู้ใช้ไม่ได้ แก้ได้ทางเดียวคือแก้ชีตด้วยมือ */
  t_('มีผู้ดูแลระบบที่ใช้งานอยู่อย่างน้อย 1 บัญชี', function () {
    var admins = readAll_('Users').filter(function (u) { return u.active && u.role === 'admin'; });
    ok_(admins.length > 0, 'ไม่มีบัญชี admin ที่ active เลย');
    return admins.length + ' บัญชี: ' + admins.map(function (u) { return u.email; }).join(', ');
  });

  /* คอลัมน์ active ที่ว่างไว้ ระบบถือว่าถูกระงับ ผู้ใช้จะเข้าไม่ได้ทั้งที่มีชื่ออยู่ในทะเบียน */
  t_('ไม่มีบัญชีที่เปิดใช้งานค้างไว้โดยไม่ตั้งใจ', function () {
    var users = readAll_('Users');
    var inactive = users.filter(function (u) { return !u.active; });
    ok_(users.length > 0, 'ทะเบียนผู้ใช้ยังไม่มีข้อมูลเลย');
    return users.length + ' บัญชี · ใช้งานได้ ' + (users.length - inactive.length) +
           (inactive.length ? ' · ปิดใช้งาน ' + inactive.length + ' (' +
             inactive.slice(0, 5).map(function (u) { return u.email; }).join(', ') + ')' : '');
  });

  t_('ทุกบัญชีมีบทบาทที่ระบบรู้จัก', function () {
    var bad = readAll_('Users').filter(function (u) { return !ROLES[u.role]; });
    return ok_(bad.length === 0, bad.length + ' บัญชีมีบทบาทที่ไม่รู้จัก: ' +
      bad.slice(0, 5).map(function (u) { return u.email + '=' + u.role; }).join(', '));
  });

  /* ตั้งแต่ 2.7.4 ช่องว่างหัวท้ายไม่ทำให้ขอบเขตเพี้ยนแล้ว (ระบบตัดให้ทุกจุดที่เทียบ)
     ข้อนี้จึงรายงานเป็นข้อมูลความสะอาดของชีต ไม่ทำให้ชุดตรวจตก */
  t_('ชื่อคณะและหน่วยงานไม่มีช่องว่างหัวท้าย (ความสะอาดของข้อมูล)', function () {
    var sh = sheet_('Users');
    if (sh.getLastRow() < 2) return 'ไม่มีข้อมูลให้ตรวจ';
    var values = sh.getDataRange().getValues(), head = values.shift();
    var cols = ['faculty', 'orgUnit', 'unit'].map(function (c) { return head.indexOf(c); });
    var bad = [];
    values.forEach(function (row) {
      cols.forEach(function (i) {
        var v = row[i];
        if (typeof v === 'string' && v !== v.trim()) bad.push(String(row[head.indexOf('email')]));
      });
    });
    return bad.length ? 'ผ่าน · มี ' + bad.length + ' ช่องที่ควรแก้ให้สะอาด เช่น ' + bad.slice(0, 5).join(', ') : 'สะอาดทุกช่อง';
  });

  /* ไม่ใช่ข้อผิดพลาด แต่ต้องรู้ เพราะขั้นยืนยันข้อเท็จจริงจะไม่ตรงสายบังคับบัญชา
     รายงานเป็นข้อมูลประกอบ ไม่ทำให้ชุดทดสอบตก เพราะเป็นเรื่องการแต่งตั้งคน ไม่ใช่ความผิดพลาดของระบบ */
  t_('ความครอบคลุมของหัวหน้างาน (ข้อมูลประกอบ)', function () {
    var users = readAll_('Users').filter(function (u) { return u.active; });
    var sup = {};
    users.forEach(function (u) { if (u.role === 'supervisor') sup[u.orgUnit] = 1; });
    var orphan = {};
    users.forEach(function (u) { if (u.orgUnit && !sup[u.orgUnit]) orphan[u.orgUnit] = (orphan[u.orgUnit] || 0) + 1; });
    var names = Object.keys(orphan);
    if (!names.length) return 'ทุกหน่วยงานมีหัวหน้างานกำกับครบ';
    var people = names.reduce(function (s, k) { return s + orphan[k]; }, 0);
    return names.length + ' หน่วยงานยังไม่มีหัวหน้างาน รวม ' + people + ' คน (' +
      names.slice(0, 6).join(', ') + (names.length > 6 ? ' และอื่น ๆ' : '') +
      ') — ขั้นยืนยันข้อเท็จจริงของกลุ่มนี้จะตกไปที่หัวหน้าสำนักงานเลขานุการคณะแทน';
  });

  t_('มีผู้รับแจ้งเตือนเหตุระดับ ' + CONFIG.NOTIFY_LEVEL + ' ขึ้นไป', function () {
    var roles = {};
    readAll_('Users').filter(function (u) { return u.active; }).forEach(function (u) { roles[u.role] = 1; });
    var need = ['office_head', 'deputy_dean', 'dean'];
    var have = need.filter(function (r) { return roles[r]; });
    return ok_(have.length > 0, 'ไม่มีผู้ถือบทบาท ' + need.join(' / ') + ' เลย เหตุรุนแรงจะไม่มีใครได้รับแจ้ง') +
           ' (' + have.join(', ') + ')';
  });

  /* ทะเบียนที่ยังว่างไม่ใช่ระบบพัง แต่ทำให้ IFR/PDFR/ISR แสดงเป็น "—" ทั้งหน้ารายงาน
     ผู้ดูแลควรเห็นตั้งแต่ตอนตรวจการติดตั้ง ไม่ใช่ไปรู้ตอนผู้บริหารเปิดรายงานแล้วไม่มีตัวเลข */
  t_('ทะเบียนจำนวนบุคลากรพร้อมใช้', function () {
    var rows = readAll_('OrgHeadcount').filter(function (r) { return r.headcount > 0; });
    ok_(rows.length > 0, 'ยังไม่ได้กรอกจำนวนบุคลากรเลย ดัชนี IFR/PDFR/ISR จะยังคำนวณไม่ได้');
    var people = rows.reduce(function (a, r) { return a + r.headcount; }, 0);
    var hours  = rows.reduce(function (a, r) { return a + r.headcount * orgHoursPerYear_(r); }, 0);
    return rows.length + ' หน่วยงาน · ' + people + ' คน · ' + Math.round(hours) + ' ชั่วโมง/ปี';
  });

  /* กรอกทั้งระดับคณะและระดับหน่วยงานย่อยของคณะเดียวกัน = นับคนซ้ำ ดัชนีจะต่ำกว่าความจริง
     การบันทึกผ่านหน้าจอถูกกันไว้แล้ว แต่ชีตยังแก้ด้วยมือได้ จึงต้องตรวจซ้ำที่นี่ */
  t_('ไม่มีคณะใดกรอกจำนวนคนซ้ำสองระดับ', function () {
    var mix = {};
    readAll_('OrgHeadcount').forEach(function (r) {
      if (!(r.headcount > 0)) return;
      if (!mix[r.faculty]) mix[r.faculty] = { whole:0, sub:0 };
      if (r.orgUnit) mix[r.faculty].sub++; else mix[r.faculty].whole++;
    });
    var bad = Object.keys(mix).filter(function (f) { return mix[f].whole && mix[f].sub; });
    return ok_(bad.length === 0, 'นับคนซ้ำสองระดับที่: ' + bad.join(', '));
  });

  t_('โฟลเดอร์เก็บไฟล์แนบเข้าถึงได้', function () {
    return attachRoot_().getName();
  });

  t_('โฟลเดอร์ปลายทางตั้งค่าถูกต้อง', function () {
    if (!CONFIG.PARENT_FOLDER) return 'ไม่ได้กำหนด ใช้ My Drive ของบัญชีที่ติดตั้ง';
    return DriveApp.getFolderById(CONFIG.PARENT_FOLDER).getName();
  });

  t_('การแชร์ไฟล์แนบตั้งค่าถูกต้อง', function () {
    return ok_(['roles', 'domain', 'private'].indexOf(CONFIG.ATTACH_SHARING) >= 0,
      'ATTACH_SHARING ต้องเป็น roles, domain หรือ private') + ' (' + CONFIG.ATTACH_SHARING + ')';
  });

  t_('ติดตั้งงานตามเวลาครบ 4 ตัว', function () {
    var handlers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
    var need = ['notifyOverdueCapa_', 'cleanupExpiredAttachments_', 'backupDatabase_', 'archiveAuditMonthly_',
                'syncAttachmentAccess_', 'onUsersRegistryEdit_'];
    var missing = need.filter(function (h) { return handlers.indexOf(h) < 0; });
    return ok_(missing.length === 0, 'ยังไม่ได้ติดตั้ง: ' + missing.join(', ') +
      ' — กดปุ่มติดตั้งงานตามเวลาในหน้าผู้ดูแลระบบ');
  });

  t_('ห่วงโซ่บันทึกร่องรอยไม่ถูกแก้ไข', function () {
    var r = verifyAuditChain_();
    return ok_(r.ok, r.detail) + ' — ' + r.detail;
  });

  /* การลบ "แถวท้าย" เป็นการแก้ไขชนิดเดียวที่ห่วงโซ่ตรวจเองไม่พบ เพราะส่วนที่เหลือยังต่อกันสนิท
     จึงต้องเทียบกับพยานภายนอกที่ระบบจดไว้ทุกครั้งที่เขียนสำเร็จ */
  /* ตัวตรวจความถูกต้องต้องคำนวณ HMAC ใหม่ทุกแถวเสมอ จะข้ามแถวเก่าไม่ได้เพราะการแก้ไขย้อนหลัง
     จะตรวจไม่พบทันที เวลาที่ใช้จึงโตตามจำนวนแถว และถูกคุมด้วย CONFIG.AUDIT_KEEP เท่านั้น */
  t_('จำนวนรายการในชีตบันทึกร่องรอยไม่เกินเพดานที่ตั้งไว้', function () {
    var keep = Number(CONFIG.AUDIT_KEEP) || 2000;
    var total = Math.max(0, sheet_('Audit').getLastRow() - 1);
    var t0 = new Date().getTime();
    verifyAuditChain_();
    var ms = new Date().getTime() - t0;
    var ceiling = keep + Math.max(100, Math.floor(keep * 0.25));
    ok_(total <= ceiling * 1.5, 'มี ' + total + ' รายการ เกินเกณฑ์ย้าย ' + ceiling +
      ' มานาน — ทริกเกอร์รายเดือนอาจไม่ทำงาน สั่งย้ายทันทีได้ด้วย trimAuditFromEditor()');
    return total + ' รายการ · ตรวจใช้เวลา ' + ms + ' มิลลิวินาที';
  });

  /* สามสถานะ ไม่ใช่สอง: ค้างอยู่ = ตก · เคยเกิดและสะสางแล้ว = ผ่านพร้อมข้อมูลประกอบ · ไม่เคยเกิด = ผ่าน
     ถ้าเหมารวมสองสถานะหลังเป็นสีแดงเหมือนกัน ธงที่สะสางแล้วจะค้างแดงถาวรจนทุกคนเลิกอ่าน */
  t_('ไม่พบร่องรอยการลบรายการท้ายของชีตบันทึกร่องรอย', function () {
    var w = auditTailWitnessStatus_();
    ok_(w.ok, w.detail);
    return w.detail;
  });

  /* ห่วงโซ่จับการแก้ไขได้หลังเกิดเหตุแล้วเสมอ ด่านนี้กันไม่ให้เกิดตั้งแต่แรก
     กันได้เฉพาะบัญชีอื่น ส่วนบัญชีเจ้าของไฟล์ Google ให้สิทธิ์แก้เสมอ ยังต้องพึ่ง auditWitness_ */
  t_('ชีตบันทึกร่องรอยถูกป้องกันการแก้ไขด้วยมือ', function () {
    var g = auditProtectStatus_();
    ok_(g.ok, g.detail);
    return g.detail;
  });

  t_('ค่าอ้างอิงรายการล่าสุดตรงกับแถวท้ายของชีต', function () {
    var last = String(PropertiesService.getScriptProperties().getProperty('AUDIT_LAST_HASH') || '');
    var tail = auditTailHash_(sheet_('Audit'));
    ok_(last === tail, 'AUDIT_LAST_HASH ไม่ตรงกับ entryHash ของแถวท้าย — อาจมีการลบรายการท้ายทิ้ง');
    return last ? last.slice(0, 12) + '…' : 'ยังไม่มีรายการ';
  });

  t_('กุญแจลงลายเซ็นบันทึกร่องรอยมีอยู่และไม่ถูกสร้างใหม่', function () {
    var props = PropertiesService.getScriptProperties();
    ok_(props.getProperty('AUDIT_HMAC_KEY'), 'ยังไม่มี AUDIT_HMAC_KEY — จะสร้างเองเมื่อมีการบันทึกครั้งแรก');
    var born = props.getProperty('AUDIT_KEY_CREATED') || '';
    return born ? 'กุญแจสร้างเมื่อ ' + born : 'กุญแจสร้างก่อนรุ่นที่บันทึกวันที่ (ปกติ)';
  });

  t_('บัญชีที่รันชุดทดสอบนี้เข้าระบบได้', function () {
    var email = Session.getActiveUser().getEmail();
    ok_(email, 'Session ไม่คืนอีเมล — ตรวจการอนุญาตสิทธิ์ของโปรเจกต์');
    var u = readAll_('Users').filter(function (x) { return x.email === String(email).toLowerCase(); })[0];
    ok_(u, 'ไม่พบ ' + email + ' ในทะเบียนผู้ใช้');
    ok_(u.active, 'บัญชี ' + email + ' อยู่ในทะเบียนแต่คอลัมน์ active ไม่ใช่ TRUE');
    return email + ' · บทบาท ' + u.role;
  });

  return report_('ตรวจการติดตั้ง');
}

/* ============================================================
 *  รันทั้งหมด — ใช้เป็นด่านสุดท้ายก่อน Deploy
 * ============================================================ */
function runSelfTest() {
  assertEditorOrAdmin_();
  var unit = runUnitTests();
  var install = runInstallCheck();
  var total = unit.total + install.total, failed = unit.failed + install.failed;
  Logger.log('\n=== สรุปรวม ===\nผ่าน ' + (total - failed) + ' / ' + total +
    (failed ? '\nยังมี ' + failed + ' รายการที่ต้องแก้ก่อนเปิดใช้จริง' : '\nพร้อมเปิดใช้งาน'));
  return { ok:failed === 0, total:total, passed:total - failed, failed:failed, unit:unit, install:install };
}
