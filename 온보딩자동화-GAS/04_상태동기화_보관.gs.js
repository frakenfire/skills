/******************************************************
 * 파일명: 04_수습상태정합성점검.gs
 *
 * 역할
 * - 온보딩 대상자 시트의 과거 데이터 미정리 상태 자동 정리
 * - 직원 마스터 시트(연동) 기준 "재직" 또는 "수습"인 사람만 처리
 * - 재직/수습자가 아닌 사람은 자동 수정하지 않고 로그만 남김
 * - 예정일 경과 미처리 후보 로그 기록
 *
 * 핵심 규칙
 * - 직원 마스터 시트 기준 재직구분 = "재직" 또는 "수습"인 사람만 처리
 * - 입사일이 오늘 기준 90일 이전인데
 *   시작 안내 / D+30 발송여부 / D+60 발송여부 / D+90 발송여부 중 하나라도
 *   빈값 / 발송 전 / 발송 실패 / 실패 / 미완료면
 *   -> 미션 발송 상태 4개 셀만 완료로 자동 정리
 * - 재직/수습자가 아니면 자동 수정하지 않음
 * - 설문 발송여부/설문 완료 열은 건드리지 않음
 * - D+3/D+7 설문 열은 건드리지 않음
 * - 퇴사·휴직마감체크는 참고 로그용으로만 읽고 자동 수정 기준으로 쓰지 않음
 * - 웹훅/채팅 알림 없음
 * - 결과는 수습상태정합성_로그 시트에만 남김
 *
 * 처음 1회 실행할 것
 * - installProbationConsistencyCheckTriggers()
 *
 * 수동 실행
 * - inspectProbationConsistencyForActiveRow()
 * - runProbationConsistencyCheck()
 *
 * 중지
 * - removeProbationConsistencyCheckTriggers()
 ******************************************************/

const CONSISTENCY_CFG = {
  MAIN_SHEET: '온보딩 대상자',
  LOG_SHEET: '수습상태정합성_로그',
  START_ROW: 2,
  LEGACY_DAYS: 90,

  ACTIVE_EMPLOYEE_STATUSES: ['재직', '수습'],

  EMP_MASTER_SHEET_CANDIDATES: [
    '직원 마스터 시트 (연동)',
    '직원 마스터 시트',
    '재직자명부',
    '직원명부',
    '직원 마스터'
  ]
};

/******************************************************
 * 1. 실제 정합성 점검
 ******************************************************/
function runProbationConsistencyCheck() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(20000)) {
    Logger.log('[CONSISTENCY][SKIP] 다른 실행이 진행 중이라 종료');
    return null;
  }

  const stats = {
    scannedRows: 0,
    autoFixedLegacy: 0,
    loggedNotActive: 0,
    loggedOverdue: 0,
    skippedNoJoinDate: 0,
    skippedMasterLoadFail: 0
  };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONSISTENCY_CFG.MAIN_SHEET);
    const logSh = getOrCreateConsistencyLogSheet_();

    if (!sh) {
      throw new Error('시트 없음: ' + CONSISTENCY_CFG.MAIN_SHEET);
    }

    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();

    if (lastRow < CONSISTENCY_CFG.START_ROW) {
      Logger.log('[CONSISTENCY] 데이터 없음');
      return stats;
    }

    const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
    const head = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(String);
    const idx = getConsistencyIndexes_(head);

    validateConsistencyIndexes_(idx);

    const masterMap = Consistency_buildEmpMasterStatusMap_();

    if (!masterMap.loaded) {
      stats.skippedMasterLoadFail++;
      Logger.log('[CONSISTENCY][MASTER][FAIL] ' + masterMap.error);
      throw new Error(masterMap.error || '직원 마스터 로드 실패');
    }

    const today = Consistency_parseDateOnly_(new Date());
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cutoff.setDate(cutoff.getDate() - CONSISTENCY_CFG.LEGACY_DAYS);

    const logRows = [];

    for (let i = CONSISTENCY_CFG.START_ROW; i <= lastRow; i++) {
      const row = values[i - 1];
      const info = getConsistencyRowInfo_(row, idx, masterMap);

      if (!info.empId && !info.name) continue;

      stats.scannedRows++;

      const result = evaluateConsistencyRow_(row, idx, info, today, cutoff);

      if (result.action === 'SKIP_NO_JOIN_DATE') {
        stats.skippedNoJoinDate++;
        if (result.log) logRows.push(buildConsistencyLogRow_(i, info, result));
        continue;
      }

      if (result.action === 'SKIP_NOT_ACTIVE') {
        stats.loggedNotActive++;
        if (result.log) logRows.push(buildConsistencyLogRow_(i, info, result));
        continue;
      }

      if (result.action === 'LOG_OVERDUE') {
        stats.loggedOverdue++;
        if (result.log) logRows.push(buildConsistencyLogRow_(i, info, result));
        continue;
      }

      if (result.action === 'AUTO_FIX_LEGACY_COMPLETE') {
        // 중요:
        // 행 전체 setValues 금지.
        // 수식 열 보호를 위해 필요한 4개 셀만 직접 쓴다.
        sh.getRange(i, idx.startGuide + 1).setValue('완료');
        sh.getRange(i, idx.send1 + 1).setValue('완료');
        sh.getRange(i, idx.send2 + 1).setValue('완료');
        sh.getRange(i, idx.send3 + 1).setValue('완료');

        stats.autoFixedLegacy++;
        logRows.push(buildConsistencyLogRow_(i, info, result));
      }
    }

    if (logRows.length) {
      logSh
        .getRange(logSh.getLastRow() + 1, 1, logRows.length, logRows[0].length)
        .setValues(logRows);
    }

    if (typeof CalendarCleanup_run_ === 'function') {
      try {
        stats.calendarCleanup = CalendarCleanup_run_(false, { today: today });
      } catch (calendarErr) {
        stats.calendarCleanupError = calendarErr.message;
        Logger.log('[CONSISTENCY][CALENDAR_CLEANUP][ERROR] ' + calendarErr.message);
      }
    }

    Logger.log('[CONSISTENCY][RESULT] ' + JSON.stringify(stats, null, 2));
    return stats;

  } finally {
    lock.releaseLock();
  }
}

/******************************************************
 * 2. 현재 선택 행 점검
 * - 실제 수정 없음
 ******************************************************/
function inspectProbationConsistencyForActiveRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONSISTENCY_CFG.MAIN_SHEET);

  if (!sh) {
    throw new Error('시트 없음: ' + CONSISTENCY_CFG.MAIN_SHEET);
  }

  const rowNo = sh.getActiveCell().getRow();

  if (rowNo < CONSISTENCY_CFG.START_ROW) {
    throw new Error('헤더 행은 점검할 수 없습니다.');
  }

  const values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(String);
  const idx = getConsistencyIndexes_(head);

  validateConsistencyIndexes_(idx);

  const masterMap = Consistency_buildEmpMasterStatusMap_();

  if (!masterMap.loaded) {
    throw new Error(masterMap.error || '직원 마스터 로드 실패');
  }

  const row = values[rowNo - 1];
  const info = getConsistencyRowInfo_(row, idx, masterMap);

  const today = Consistency_parseDateOnly_(new Date());
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - CONSISTENCY_CFG.LEGACY_DAYS);

  const result = evaluateConsistencyRow_(row, idx, info, today, cutoff);

  Logger.log(JSON.stringify({
    row: rowNo,
    empId: info.empId,
    name: info.name,
    email: info.email,
    empStatus: info.empStatus,
    closeCheck: info.closeCheck,
    joinDate: info.joinDate ? Consistency_formatDate_(info.joinDate) : '',
    startGuide: info.startGuide,
    d30Send: info.send1,
    d60Send: info.send2,
    d90Send: info.send3,
    d30Done: info.done1,
    d60Done: info.done2,
    d90Done: info.done3,
    action: result.action,
    reason: result.reason
  }, null, 2));

  return result;
}

/******************************************************
 * 3. 트리거 설치/삭제/확인
 ******************************************************/
function installProbationConsistencyCheckTriggers() {
  const handlers = ['runProbationConsistencyCheck'];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('runProbationConsistencyCheck')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('[CONSISTENCY][TRIGGER] 설치 완료 / every 6 hours');
}

function removeProbationConsistencyCheckTriggers() {
  const handlers = ['runProbationConsistencyCheck'];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  Logger.log('[CONSISTENCY][TRIGGER] 제거 완료');
}

/******************************************************
 * 4. 헤더 매핑
 ******************************************************/
function getConsistencyIndexes_(head) {
  const H = function(candidates) {
    return Consistency_firstHeaderIndex_(
      head,
      Array.isArray(candidates) ? candidates : [candidates]
    );
  };

  return {
    empId: H('사번'),
    name: H('성명'),
    email: H('이메일'),
    join: H('입사일'),
    note: H(['비고', '메모']),
    closeCheck: H(['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크']),

    startGuide: H(['시작 안내', '시작안내', '시작 안내 발송여부', '시작안내 발송여부']),

    end1: H('D+30 예정일'),
    send1: H('D+30 발송여부'),
    done1: H('D+30 평가 완료'),

    end2: H('D+60 예정일'),
    send2: H('D+60 발송여부'),
    done2: H('D+60 평가 완료'),

    end3: H('D+90 예정일'),
    send3: H('D+90 발송여부'),
    done3: H('D+90 평가 완료')
  };
}

function validateConsistencyIndexes_(idx) {
  const required = [
    'empId',
    'name',
    'join',
    'startGuide',
    'end1',
    'send1',
    'end2',
    'send2',
    'end3',
    'send3'
  ];

  required.forEach(function(k) {
    if (idx[k] < 0) {
      throw new Error('필수 컬럼 없음: ' + k);
    }
  });
}

/******************************************************
 * 5. 행 정보 구성
 ******************************************************/
function getConsistencyRowInfo_(row, idx, masterMap) {
  const empId = Consistency_normalizeEmpId_(row[idx.empId]);
  const email = idx.email >= 0 ? Consistency_normalizeEmail_(row[idx.email]) : '';
  const name = Consistency_value_(row[idx.name]);
  const joinDate = Consistency_parseDateOnly_(row[idx.join]);
  const closeCheck = idx.closeCheck >= 0 ? Consistency_value_(row[idx.closeCheck]) : '';

  const empStatus = Consistency_getEmploymentStatus_(empId, email, name, masterMap);

  return {
    empId: empId,
    name: name,
    email: email,
    joinDate: joinDate,
    empStatus: empStatus,
    closeCheck: closeCheck,

    startGuide: Consistency_normalizeStatus_(row[idx.startGuide]),

    send1: Consistency_normalizeStatus_(row[idx.send1]),
    send2: Consistency_normalizeStatus_(row[idx.send2]),
    send3: Consistency_normalizeStatus_(row[idx.send3]),

    done1: idx.done1 >= 0 ? Consistency_normalizeStatus_(row[idx.done1]) : '',
    done2: idx.done2 >= 0 ? Consistency_normalizeStatus_(row[idx.done2]) : '',
    done3: idx.done3 >= 0 ? Consistency_normalizeStatus_(row[idx.done3]) : ''
  };
}

/******************************************************
 * 6. 정합성 판정
 ******************************************************/
function evaluateConsistencyRow_(row, idx, info, today, cutoff) {
  const prevSnapshot = buildSendStatusSnapshot_(
    info.startGuide,
    info.send1,
    info.send2,
    info.send3
  );

  const nextSnapshot = '시작안내=완료 | D+30=완료 | D+60=완료 | D+90=완료';

  if (!info.joinDate) {
    return {
      action: 'SKIP_NO_JOIN_DATE',
      log: false,
      reason: '입사일 없음'
    };
  }

  if (CONSISTENCY_CFG.ACTIVE_EMPLOYEE_STATUSES.indexOf(String(info.empStatus || '').trim()) < 0) {
    return {
      action: 'SKIP_NOT_ACTIVE',
      log: true,
      category: '재직자아님',
      prevSnapshot: prevSnapshot,
      nextSnapshot: prevSnapshot,
      reason: '직원 마스터 기준 재직/수습 아님: ' + String(info.empStatus || '(빈값)')
    };
  }

  const isLegacy = info.joinDate.getTime() <= cutoff.getTime();

  const hasIncompleteSend =
    isIncompleteSendStatus_(info.startGuide) ||
    isIncompleteSendStatus_(info.send1) ||
    isIncompleteSendStatus_(info.send2) ||
    isIncompleteSendStatus_(info.send3);

  const hasCompletionSignal =
    isCompletedSendStatus_(info.send3) ||
    isCompletedEvalStatus_(info.done3) ||
    (
      isCompletedSendStatus_(info.send1) &&
      isCompletedSendStatus_(info.send2) &&
      isCompletedSendStatus_(info.send3)
    );

  if (isLegacy && hasIncompleteSend) {
    return {
      action: 'AUTO_FIX_LEGACY_COMPLETE',
      log: true,
      category: '과거데이터미정리',
      prevSnapshot: prevSnapshot,
      nextSnapshot: nextSnapshot,
      reason: hasCompletionSignal
        ? '재직/수습 + 입사 90일 경과 + 완료 흔적 존재 -> 미션 발송 상태 전체 완료 처리'
        : '재직/수습 + 입사 90일 경과 과거 미정리 -> 미션 발송 상태 전체 완료 처리'
    };
  }

  const overdueReasons = [];

  if (isOverduePending_(row[idx.end1], info.send1, today, 'D+30')) {
    overdueReasons.push('D+30 예정일 경과 미처리');
  }

  if (isOverduePending_(row[idx.end2], info.send2, today, 'D+60')) {
    overdueReasons.push('D+60 예정일 경과 미처리');
  }

  if (isOverduePending_(row[idx.end3], info.send3, today, 'D+90')) {
    overdueReasons.push('D+90 예정일 경과 미처리');
  }

  if (overdueReasons.length > 0) {
    return {
      action: 'LOG_OVERDUE',
      log: true,
      category: '미처리후보',
      prevSnapshot: prevSnapshot,
      nextSnapshot: prevSnapshot,
      reason: overdueReasons.join(' / ')
    };
  }

  return {
    action: 'OK',
    log: false,
    reason: '정상'
  };
}

function isOverduePending_(rawDate, sendStatus, today, label) {
  const due = Consistency_parseDateOnly_(rawDate);
  const baseToday = Consistency_parseDateOnly_(today || new Date());

  if (!due || !baseToday) return false;

  const noticeDate = getRoundNoticeDate_(due, label || '');

  if (!noticeDate) return false;

  const dueDay = new Date(
    noticeDate.getFullYear(),
    noticeDate.getMonth(),
    noticeDate.getDate()
  ).getTime();

  const todayDay = new Date(
    baseToday.getFullYear(),
    baseToday.getMonth(),
    baseToday.getDate()
  ).getTime();

  return dueDay < todayDay && isIncompleteSendStatus_(sendStatus);
}

function isIncompleteSendStatus_(status) {
  const v = String(status || '').trim();

  return (
    v === '' ||
    v === '발송 전' ||
    v === '발송 실패' ||
    v === '실패' ||
    v === '미완료'
  );
}

function isCompletedSendStatus_(status) {
  return String(status || '').trim() === '완료';
}

function isCompletedEvalStatus_(status) {
  const v = String(status || '').trim();

  return [
    '완료',
    '합격',
    '불합격',
    '부적합',
    '연장',
    '전환완료',
    '전환 완료'
  ].indexOf(v) >= 0;
}

function buildSendStatusSnapshot_(startGuide, send1, send2, send3) {
  return '시작안내=' + (startGuide || '(빈값)') +
    ' | D+30=' + (send1 || '(빈값)') +
    ' | D+60=' + (send2 || '(빈값)') +
    ' | D+90=' + (send3 || '(빈값)');
}

/******************************************************
 * 7. 로그
 ******************************************************/
function buildConsistencyLogRow_(rowNo, info, result) {
  return [
    new Date(),
    rowNo,
    info.empId,
    info.name,
    info.email || '',
    info.empStatus || '',
    info.closeCheck || '',
    info.joinDate ? Consistency_formatDate_(info.joinDate) : '',
    result.category || '',
    result.action,
    result.prevSnapshot || '',
    result.nextSnapshot || '',
    result.reason || ''
  ];
}

function getOrCreateConsistencyLogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONSISTENCY_CFG.LOG_SHEET);

  const headers = [
    '실행시각',
    '행번호',
    '사번',
    '성명',
    '이메일',
    '재직구분',
    '퇴사·휴직마감체크',
    '입사일',
    '분류',
    '조치',
    '이전상태',
    '변경상태',
    '사유'
  ];

  if (!sh) {
    sh = ss.insertSheet(CONSISTENCY_CFG.LOG_SHEET);
    sh.appendRow(headers);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  } else {
    const currentHeaders = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length))
      .getDisplayValues()[0]
      .slice(0, headers.length)
      .map(String);

    const mismatch = headers.some(function(h, i) {
      return String(currentHeaders[i] || '').trim() !== h;
    });

    if (mismatch) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  return sh;
}

/******************************************************
 * 8. 직원 마스터 조회
 ******************************************************/
function Consistency_buildEmpMasterStatusMap_() {
  const result = {
    loaded: false,
    error: '',
    byEmpId: {},
    byEmail: {},
    byName: {}
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = null;

  for (let i = 0; i < CONSISTENCY_CFG.EMP_MASTER_SHEET_CANDIDATES.length; i++) {
    const candidate = CONSISTENCY_CFG.EMP_MASTER_SHEET_CANDIDATES[i];
    const found = ss.getSheetByName(candidate);

    if (found) {
      sh = found;
      break;
    }
  }

  if (!sh) {
    result.error = '직원 마스터 시트 없음';
    return result;
  }

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();

  if (lastRow < 2 || lastCol < 1) {
    result.error = '직원 마스터 데이터 없음';
    return result;
  }

  const headers = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function(v) {
    return String(v || '').trim();
  });

  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const empIdCol = Consistency_firstHeaderIndex_(headers, ['사번', 'employee_id', 'EMP_ID']);
  const emailCol = Consistency_firstHeaderIndex_(headers, ['이메일', '메일', 'Email', 'email']);
  const nameCol = Consistency_firstHeaderIndex_(headers, ['성명', '이름', 'name']);
  const statusCol = Consistency_firstHeaderIndex_(headers, ['재직구분', '재직 구분', '상태', '근무상태']);

  if (empIdCol < 0 && emailCol < 0 && nameCol < 0) {
    result.error = '직원 마스터 사번/이메일/성명 컬럼 없음';
    return result;
  }

  if (statusCol < 0) {
    result.error = '직원 마스터 재직구분 컬럼 없음';
    return result;
  }

  for (let r = 0; r < values.length; r++) {
    const row = values[r];

    const empId = empIdCol >= 0 ? Consistency_normalizeEmpId_(row[empIdCol]) : '';
    const email = emailCol >= 0 ? Consistency_normalizeEmail_(row[emailCol]) : '';
    const name = nameCol >= 0 ? Consistency_value_(row[nameCol]) : '';
    const status = Consistency_value_(row[statusCol]);

    if (!empId && !email && !name) continue;

    const item = {
      empId: empId,
      email: email,
      name: name,
      status: status
    };

    if (empId) result.byEmpId[empId] = item;
    if (email) result.byEmail[email] = item;
    if (name) result.byName[name] = item;
  }

  result.loaded = true;

  Logger.log(
    '[CONSISTENCY][MASTER] 로드 완료 / 탭=' +
    sh.getName() +
    ' / 사번=' + Object.keys(result.byEmpId).length +
    ' / 이메일=' + Object.keys(result.byEmail).length +
    ' / 성명=' + Object.keys(result.byName).length
  );

  return result;
}

function Consistency_getEmploymentStatus_(empId, email, name, masterMap) {
  if (!masterMap || !masterMap.loaded) {
    return '마스터확인실패';
  }

  const cleanEmpId = Consistency_normalizeEmpId_(empId);
  const cleanEmail = Consistency_normalizeEmail_(email);
  const cleanName = Consistency_value_(name);

  if (cleanEmpId && masterMap.byEmpId[cleanEmpId]) {
    return masterMap.byEmpId[cleanEmpId].status || '';
  }

  if (cleanEmail && masterMap.byEmail[cleanEmail]) {
    return masterMap.byEmail[cleanEmail].status || '';
  }

  if (cleanName && masterMap.byName[cleanName]) {
    return masterMap.byName[cleanName].status || '';
  }

  return '마스터미확인';
}

function Consistency_firstHeaderIndex_(headers, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const idx = headers.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }

  return -1;
}

/******************************************************
 * 9. 유틸
 ******************************************************/
function Consistency_value_(value) {
  if (value === null || value === undefined) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Consistency_formatDate_(value);
  }

  return String(value || '').trim();
}

function Consistency_normalizeEmpId_(value) {
  if (value === null || value === undefined) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return '';
  }

  return String(value).trim().replace(/\.0$/, '');
}

function Consistency_normalizeEmail_(value) {
  if (value === null || value === undefined) return '';

  return String(value).trim().toLowerCase();
}

function Consistency_normalizeStatus_(value) {
  return String(value || '').trim();
}

function Consistency_parseDateOnly_(value) {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return null;

    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value || '').trim();

  if (!text) return null;

  const normalized = text
    .replace(/\./g, '-')
    .replace(/\//g, '-')
    .replace(/\s+/g, '');

  const m = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(text);

  if (isNaN(fallback.getTime())) return null;

  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

function Consistency_formatDate_(date) {
  if (!date) return '';

  const tz = (
    typeof CFG !== 'undefined' &&
    CFG &&
    CFG.TZ
  )
    ? CFG.TZ
    : Session.getScriptTimeZone();

  return Utilities.formatDate(date, tz || 'Asia/Seoul', 'yyyy-MM-dd');
}

function getRoundNoticeDate_(dueDate, label) {
  const d = Consistency_parseDateOnly_(dueDate);

  if (!d) return null;

  // 현재 03_온보딩미션안내발송.gs는 예정일 당일 기준으로 발송한다.
  // 따라서 정합성 점검도 D+30/D+60/D+90 예정일 자체를 기준일로 본다.
  return d;
}
