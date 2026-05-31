/******************************************************
 * 파일명: 01_인원동기화.gs
 *
 * 역할
 * - 직원 마스터 시트(연동) 내용을 온보딩 대상자 시트로 동기화
 * - 사번 기준으로 기존 행은 핵심 인적정보만 갱신
 * - 없는 사람은 신규 추가
 * - 신규 추가 시 시작 안내 / D+30·60·90 예정일 / 발송·평가 기본값 세팅
 *
 * 중요 보호 규칙
 * - 번호(A열)는 수식 자동 채번이므로 직접 쓰지 않음
 * - D+3/D+7/D+30/D+60/D+90 설문 완료 열은 수식 자동 판정이므로 직접 쓰지 않음
 * - 퇴사·휴직 체크(AF)는 수식/운영 판정 영역이므로 직접 쓰지 않음
 * - 기존 행의 발송여부/평가완료 상태는 초기화하지 않음
 *
 * 처음 1회 실행
 * - installRosterTriggers()
 *
 * 수동 실행
 * - refreshProbationRosterOnly()
 * - previewProbationRosterSync()
 * - cleanupBrokenFormulaRowsOnly()
 *
 * 중지
 * - removeRosterTriggers()
 ******************************************************/

const PROB_ROSTER = {
  MASTER_SHEET: '직원 마스터 시트 (연동)',
  MAIN_SHEET: '온보딩 대상자',
  META_SHEET: '부서 메타 데이터',

  MASTER_HEADER_ROW: 1,
  MASTER_START_ROW: 6,

  MAIN_HEADER_ROW: 1,
  MAIN_START_ROW: 2,

  META_HEADER_ROW: 1,
  META_START_ROW: 2,

  ACTIVE_VALUES: ['재직', '수습'],

  MASTER_HEADERS: {
    empId: '사번',
    name: '성명',
    status: '재직구분',
    join: '입사일',
    hq: '본부',
    team: '팀',
    part: '파트',
    email: '이메일',
    position: '직책'
  },

  MAIN_HEADERS: {
    seq: '번호',
    empId: '사번',
    name: '성명',
    hq: '본부',
    team: '팀',
    part: '파트',
    email: '이메일',
    position: '직책',
    join: '입사일',
    leader: '온보딩 리더',
    leaderEmail: '리더 이메일',

    startGuide: '시작 안내',

    d3SurveySent: 'D+3 설문 발송여부',
    d3SurveyDone: 'D+3 설문 완료',

    d7SurveySent: 'D+7 설문 발송여부',
    d7SurveyDone: 'D+7 설문 완료',

    d30Due: 'D+30 예정일',
    d30MissionSent: 'D+30 발송여부',
    d30SurveySent: 'D+30 설문 발송여부',
    d30EvalDone: 'D+30 평가 완료',
    d30SurveyDone: 'D+30 설문 완료',

    d60Due: 'D+60 예정일',
    d60MissionSent: 'D+60 발송여부',
    d60SurveySent: 'D+60 설문 발송여부',
    d60EvalDone: 'D+60 평가 완료',
    d60SurveyDone: 'D+60 설문 완료',

    d90Due: 'D+90 예정일',
    d90MissionSent: 'D+90 발송여부',
    d90SurveySent: 'D+90 설문 발송여부',
    d90EvalDone: 'D+90 평가 완료',
    d90SurveyDone: 'D+90 설문 완료',

    note: '비고',
    namecard: '명함',
    closeCheck: '퇴사·휴직마감체크'
  },

  MAIN_HEADER_ALIASES: {
    seq: ['번호', '순서'],
    leader: ['온보딩 리더', '부서장', '리더'],
    leaderEmail: ['리더 이메일', '부서장 이메일', '온보딩 리더 이메일'],
    startGuide: ['시작 안내', '시작안내', '시작 안내 발송여부', '시작안내 발송여부'],
    note: ['비고', '메모'],
    closeCheck: ['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크']
  },

  META_HEADERS: {
    hq: '본부',
    team: '팀',
    teamLeadName: '팀장 성명',
    teamLeadEmail: '팀장 이메일',
    hqLeadName: '본부장 성명',
    hqLeadEmail: '본부장 이메일'
  },

  DEFAULTS: {
    sendReady: '발송 전',
    evalReady: '미평가'
  }
};

/******************************************************
 * 1. 실제 동기화
 ******************************************************/
function refreshProbationRosterOnly() {
  return ProbRoster_sync_(false);
}

/******************************************************
 * 2. 미리보기
 * - 실제 시트 쓰기 없음
 ******************************************************/
function previewProbationRosterSync() {
  return ProbRoster_sync_(true);
}

/******************************************************
 * 3. 메인 동기화 로직
 ******************************************************/
function ProbRoster_sync_(isPreview) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(20000)) {
    Logger.log('[ROSTER][SKIP] 다른 실행이 진행 중이라 종료');
    return null;
  }

  const stats = {
    preview: !!isPreview,
    scannedSource: 0,
    activeSource: 0,
    updated: 0,
    appended: 0,
    skippedInactive: 0,
    skippedNoEmpId: 0,
    skippedNoJoinDate: 0,
    cleanedBrokenRows: 0,
    details: []
  };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const masterSh = ss.getSheetByName(PROB_ROSTER.MASTER_SHEET);
    const mainSh = ss.getSheetByName(PROB_ROSTER.MAIN_SHEET);
    const metaSh = ss.getSheetByName(PROB_ROSTER.META_SHEET);

    if (!masterSh) throw new Error('직원 마스터 시트를 찾을 수 없습니다: ' + PROB_ROSTER.MASTER_SHEET);
    if (!mainSh) throw new Error('온보딩 대상자 시트를 찾을 수 없습니다: ' + PROB_ROSTER.MAIN_SHEET);
    if (!metaSh) throw new Error('부서 메타 데이터 시트를 찾을 수 없습니다: ' + PROB_ROSTER.META_SHEET);

    const masterHeaders = getHeaderArray_(masterSh, PROB_ROSTER.MASTER_HEADER_ROW);
    const mainHeaders = getHeaderArray_(mainSh, PROB_ROSTER.MAIN_HEADER_ROW);
    const metaHeaders = getHeaderArray_(metaSh, PROB_ROSTER.META_HEADER_ROW);

    const MH = headerFinder_(masterHeaders);
    const TH = headerFinder_(mainHeaders, PROB_ROSTER.MAIN_HEADER_ALIASES);
    const EH = headerFinder_(metaHeaders);

    validateHeaders_('MASTER', MH, Object.values(PROB_ROSTER.MASTER_HEADERS));
    const mainRequiredHeaderKeys = Object.keys(PROB_ROSTER.MAIN_HEADERS)
      .filter(function(key) {
        return key !== 'namecard';
      });
    validateHeaders_(
      'MAIN',
      TH,
      mainRequiredHeaderKeys.map(function(key) {
        return PROB_ROSTER.MAIN_HEADERS[key];
      })
    );
    validateHeaders_('META', EH, Object.values(PROB_ROSTER.META_HEADERS));

    const masterValues = readBodyValues_(masterSh, PROB_ROSTER.MASTER_START_ROW);
    const mainValues = readBodyValues_(mainSh, PROB_ROSTER.MAIN_START_ROW);
    const metaValues = readBodyValues_(metaSh, PROB_ROSTER.META_START_ROW);

    const leaderRows = buildLeaderMetaMap_(metaValues, EH);
    const existingByEmpId = buildExistingMainIndex_(mainValues, TH);

    if (!isPreview) {
      stats.cleanedBrokenRows = cleanupBrokenRowsInternal_(mainSh, mainValues, TH);
    }

    let lastUsedRow = findLastUsedRow_(mainValues, TH);

    masterValues.forEach(function(r) {
      stats.scannedSource++;

      const empId = ProbRoster_normalizeEmpId_(r[MH(PROB_ROSTER.MASTER_HEADERS.empId)]);
      const status = str_(r[MH(PROB_ROSTER.MASTER_HEADERS.status)]);

      if (!empId) {
        stats.skippedNoEmpId++;
        return;
      }

      if (PROB_ROSTER.ACTIVE_VALUES.indexOf(status) < 0) {
        stats.skippedInactive++;
        return;
      }

      stats.activeSource++;

      const item = {
        empId: empId,
        name: str_(r[MH(PROB_ROSTER.MASTER_HEADERS.name)]),
        hq: str_(r[MH(PROB_ROSTER.MASTER_HEADERS.hq)]),
        team: str_(r[MH(PROB_ROSTER.MASTER_HEADERS.team)]),
        part: str_(r[MH(PROB_ROSTER.MASTER_HEADERS.part)]),
        email: ProbRoster_normalizeEmail_(r[MH(PROB_ROSTER.MASTER_HEADERS.email)]),
        position: str_(r[MH(PROB_ROSTER.MASTER_HEADERS.position)]),
        join: ProbRoster_parseDateOnly_(r[MH(PROB_ROSTER.MASTER_HEADERS.join)]),
        status: status
      };

      if (!item.join) {
        stats.skippedNoJoinDate++;
      }

      const leader = resolveLeader_(leaderRows, item.hq, item.team);

      if (existingByEmpId[empId]) {
        const target = existingByEmpId[empId];

        stats.updated++;
        stats.details.push({
          action: 'UPDATE',
          rowNo: target.rowNo,
          empId: item.empId,
          name: item.name,
          status: item.status,
          leader: leader.name,
          leaderEmail: leader.email
        });

        if (!isPreview) {
          updateExistingOnboardingRow_(mainSh, target.rowNo, TH, item, leader);
        }

        return;
      }

      lastUsedRow++;

      stats.appended++;
      stats.details.push({
        action: 'APPEND',
        rowNo: lastUsedRow,
        empId: item.empId,
        name: item.name,
        status: item.status,
        leader: leader.name,
        leaderEmail: leader.email,
        d30Due: item.join ? formatDate_(addDays_(item.join, 29)) : '',
        d60Due: item.join ? formatDate_(addDays_(item.join, 60)) : '',
        d90Due: item.join ? formatDate_(addDays_(item.join, 77)) : ''
      });

      if (!isPreview) {
        appendNewOnboardingRow_(mainSh, lastUsedRow, TH, item, leader);
      }
    });

    if (!isPreview) {
      applyProbationSeqFormula_(mainSh);

      if (typeof CalendarCleanup_run_ === 'function') {
        try {
          stats.calendarCleanup = CalendarCleanup_run_(false);
        } catch (calendarErr) {
          stats.calendarCleanupError = calendarErr.message;
          Logger.log('[ROSTER][CALENDAR_CLEANUP][ERROR] ' + calendarErr.message);
        }
      }
    }

    Logger.log('[ROSTER][RESULT] ' + JSON.stringify(stats, null, 2));
    return stats;

  } finally {
    lock.releaseLock();
  }
}

/******************************************************
 * 4. 기존 행 갱신
 * - 인적정보와 리더 정보만 갱신
 * - 발송여부/평가완료/설문완료/퇴사체크는 기존값 유지
 ******************************************************/
function updateExistingOnboardingRow_(sh, rowNo, H, item, leader) {
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.empId, item.empId);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.name, item.name);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.hq, item.hq);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.team, item.team);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.part, item.part);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.email, item.email);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.position, item.position);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.join, item.join || '');

  if (leader.name) {
    setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.leader, leader.name);
  }

  if (leader.email) {
    setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.leaderEmail, leader.email);
  }

  fillDueDateIfEmpty_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d30Due, item.join, 29);
  fillDueDateIfEmpty_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d60Due, item.join, 60);
  fillDueDateIfEmpty_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d90Due, item.join, 77);
}

/******************************************************
 * 5. 신규 행 추가
 * - 수식 열 직접 쓰기 금지
 ******************************************************/
function appendNewOnboardingRow_(sh, rowNo, H, item, leader) {
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.empId, item.empId);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.name, item.name);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.hq, item.hq);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.team, item.team);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.part, item.part);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.email, item.email);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.position, item.position);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.join, item.join || '');

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.leader, leader.name || '');
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.leaderEmail, leader.email || '');

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.startGuide, PROB_ROSTER.DEFAULTS.sendReady);

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d3SurveySent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d7SurveySent, PROB_ROSTER.DEFAULTS.sendReady);

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d30Due, item.join ? addDays_(item.join, 29) : '');
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d30MissionSent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d30SurveySent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d30EvalDone, PROB_ROSTER.DEFAULTS.evalReady);

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d60Due, item.join ? addDays_(item.join, 60) : '');
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d60MissionSent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d60SurveySent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d60EvalDone, PROB_ROSTER.DEFAULTS.evalReady);

  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d90Due, item.join ? addDays_(item.join, 77) : '');
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d90MissionSent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d90SurveySent, PROB_ROSTER.DEFAULTS.sendReady);
  setCellByHeader_(sh, rowNo, H, PROB_ROSTER.MAIN_HEADERS.d90EvalDone, PROB_ROSTER.DEFAULTS.evalReady);
}

/******************************************************
 * 6. onEdit / 트리거
 ******************************************************/
function onRosterSheetEdit(e) {
  try {
    const editedSheet = e && e.source && e.source.getActiveSheet
      ? e.source.getActiveSheet().getName()
      : '';

    if (editedSheet !== PROB_ROSTER.MASTER_SHEET) return;

    Logger.log('[ROSTER] 마스터 시트 변동 감지 -> 동기화 시작: ' + editedSheet);
    refreshProbationRosterOnly();

  } catch (err) {
    Logger.log('[ROSTER][onEdit][ERROR] ' + err.message);
  }
}

function onRosterSheetChange(e) {
  try {
    Logger.log('[ROSTER] 마스터 시트 구조/행 변경 감지 -> 동기화 시작');
    refreshProbationRosterOnly();
  } catch (err) {
    Logger.log('[ROSTER][onChange][ERROR] ' + err.message);
  }
}

// 구버전 트리거 호환용
function onEdit_Trigger(e) {
  return onRosterSheetEdit(e);
}

function installRosterTriggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const handlers = ['refreshProbationRosterOnly', 'onRosterSheetEdit', 'onRosterSheetChange', 'onEdit_Trigger'];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('refreshProbationRosterOnly')
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp.newTrigger('onRosterSheetEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  ScriptApp.newTrigger('onRosterSheetChange')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  Logger.log('[ROSTER][TRIGGER] 설치 완료 / hourly + onEdit + onChange');
}

function removeRosterTriggers() {
  const handlers = ['refreshProbationRosterOnly', 'onRosterSheetEdit', 'onRosterSheetChange', 'onEdit_Trigger'];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  Logger.log('[ROSTER][TRIGGER] 제거 완료');
}

/******************************************************
 * 7. 깨진 수동값 정리
 * - 수식 열은 직접 건드리지 않음
 ******************************************************/
function cleanupBrokenFormulaRowsOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(PROB_ROSTER.MAIN_SHEET);

  if (!sh) throw new Error('시트 없음: ' + PROB_ROSTER.MAIN_SHEET);

  const mainValues = readBodyValues_(sh, PROB_ROSTER.MAIN_START_ROW);
  const mainHeaders = getHeaderArray_(sh, PROB_ROSTER.MAIN_HEADER_ROW);
  const H = headerFinder_(mainHeaders, PROB_ROSTER.MAIN_HEADER_ALIASES);

  const cleaned = cleanupBrokenRowsInternal_(sh, mainValues, H);
  applyProbationSeqFormula_(sh);

  Logger.log('[ROSTER] cleanupBrokenFormulaRowsOnly / cleaned=' + cleaned);
}

function cleanupBrokenRowsInternal_(sh, values, H) {
  let cleaned = 0;

  const manualHeaders = [
    PROB_ROSTER.MAIN_HEADERS.empId,
    PROB_ROSTER.MAIN_HEADERS.name,
    PROB_ROSTER.MAIN_HEADERS.hq,
    PROB_ROSTER.MAIN_HEADERS.team,
    PROB_ROSTER.MAIN_HEADERS.part,
    PROB_ROSTER.MAIN_HEADERS.email,
    PROB_ROSTER.MAIN_HEADERS.position,
    PROB_ROSTER.MAIN_HEADERS.join,
    PROB_ROSTER.MAIN_HEADERS.leader,
    PROB_ROSTER.MAIN_HEADERS.leaderEmail,
    PROB_ROSTER.MAIN_HEADERS.startGuide,
    PROB_ROSTER.MAIN_HEADERS.d3SurveySent,
    PROB_ROSTER.MAIN_HEADERS.d7SurveySent,
    PROB_ROSTER.MAIN_HEADERS.d30Due,
    PROB_ROSTER.MAIN_HEADERS.d30MissionSent,
    PROB_ROSTER.MAIN_HEADERS.d30SurveySent,
    PROB_ROSTER.MAIN_HEADERS.d30EvalDone,
    PROB_ROSTER.MAIN_HEADERS.d60Due,
    PROB_ROSTER.MAIN_HEADERS.d60MissionSent,
    PROB_ROSTER.MAIN_HEADERS.d60SurveySent,
    PROB_ROSTER.MAIN_HEADERS.d60EvalDone,
    PROB_ROSTER.MAIN_HEADERS.d90Due,
    PROB_ROSTER.MAIN_HEADERS.d90MissionSent,
    PROB_ROSTER.MAIN_HEADERS.d90SurveySent,
    PROB_ROSTER.MAIN_HEADERS.d90EvalDone,
    PROB_ROSTER.MAIN_HEADERS.note,
    PROB_ROSTER.MAIN_HEADERS.namecard
  ];

  for (let i = 0; i < values.length; i++) {
    const rowNo = PROB_ROSTER.MAIN_START_ROW + i;
    const row = values[i];

    const empId = str_(row[H(PROB_ROSTER.MAIN_HEADERS.empId)]);
    const name = str_(row[H(PROB_ROSTER.MAIN_HEADERS.name)]);

    const hasManualValue = manualHeaders.some(function(header) {
      const idx = H(header);
      return idx >= 0 && str_(row[idx]) !== '';
    });

    if (!empId && !name && hasManualValue) {
      manualHeaders.forEach(function(header) {
        const idx = H(header);
        if (idx >= 0) {
          sh.getRange(rowNo, idx + 1).clearContent();
        }
      });

      cleaned++;
    }
  }

  return cleaned;
}

/******************************************************
 * 8. 리더 메타 매핑
 ******************************************************/
function buildLeaderMetaMap_(metaValues, H) {
  return metaValues.map(function(r) {
    return {
      hq: str_(r[H(PROB_ROSTER.META_HEADERS.hq)]),
      team: str_(r[H(PROB_ROSTER.META_HEADERS.team)]),
      teamLeadName: str_(r[H(PROB_ROSTER.META_HEADERS.teamLeadName)]),
      teamLeadEmail: ProbRoster_normalizeEmail_(r[H(PROB_ROSTER.META_HEADERS.teamLeadEmail)]),
      hqLeadName: str_(r[H(PROB_ROSTER.META_HEADERS.hqLeadName)]),
      hqLeadEmail: ProbRoster_normalizeEmail_(r[H(PROB_ROSTER.META_HEADERS.hqLeadEmail)])
    };
  });
}

function resolveLeader_(leaderRows, hq, team) {
  const nhq = normDept_(hq);
  const nteam = normDept_(team);

  const exact = leaderRows.find(function(r) {
    return normDept_(r.hq) === nhq && normDept_(r.team) === nteam;
  });

  if (exact) {
    if (exact.teamLeadName || exact.teamLeadEmail) {
      return {
        name: exact.teamLeadName || exact.hqLeadName || '',
        email: exact.teamLeadEmail || exact.hqLeadEmail || ''
      };
    }

    if (exact.hqLeadName || exact.hqLeadEmail) {
      return {
        name: exact.hqLeadName || '',
        email: exact.hqLeadEmail || ''
      };
    }
  }

  const hqBlank = leaderRows.find(function(r) {
    return normDept_(r.hq) === nhq && normDept_(r.team) === '';
  });

  if (hqBlank) {
    if (hqBlank.teamLeadName || hqBlank.teamLeadEmail) {
      return {
        name: hqBlank.teamLeadName || hqBlank.hqLeadName || '',
        email: hqBlank.teamLeadEmail || hqBlank.hqLeadEmail || ''
      };
    }

    if (hqBlank.hqLeadName || hqBlank.hqLeadEmail) {
      return {
        name: hqBlank.hqLeadName || '',
        email: hqBlank.hqLeadEmail || ''
      };
    }
  }

  const hqAny = leaderRows.find(function(r) {
    return normDept_(r.hq) === nhq && (r.hqLeadName || r.hqLeadEmail);
  });

  if (hqAny) {
    return {
      name: hqAny.hqLeadName || '',
      email: hqAny.hqLeadEmail || ''
    };
  }

  return {
    name: '',
    email: ''
  };
}

/******************************************************
 * 9. 인덱스 / 행 탐색
 ******************************************************/
function buildExistingMainIndex_(mainValues, H) {
  const map = {};

  for (let i = 0; i < mainValues.length; i++) {
    const rowNo = PROB_ROSTER.MAIN_START_ROW + i;
    const row = mainValues[i];

    const empId = ProbRoster_normalizeEmpId_(row[H(PROB_ROSTER.MAIN_HEADERS.empId)]);

    if (empId) {
      map[empId] = {
        rowNo: rowNo,
        row: row
      };
    }
  }

  return map;
}

function findLastUsedRow_(mainValues, H) {
  let lastUsedRow = PROB_ROSTER.MAIN_START_ROW - 1;

  for (let i = 0; i < mainValues.length; i++) {
    const rowNo = PROB_ROSTER.MAIN_START_ROW + i;
    const row = mainValues[i];

    const empId = str_(row[H(PROB_ROSTER.MAIN_HEADERS.empId)]);
    const name = str_(row[H(PROB_ROSTER.MAIN_HEADERS.name)]);

    if (empId || name) lastUsedRow = rowNo;
  }

  return lastUsedRow;
}

/******************************************************
 * 10. 번호 수식
 ******************************************************/
function applyProbationSeqFormula_(sh) {
  const lastRow = sh.getLastRow();

  if (lastRow >= 2) {
    sh.getRange(2, 1, lastRow - 1, 1).clearContent();
  }

  sh.getRange('A2').setFormula(
    '=ARRAYFORMULA(IF(B2:B="","",MATCH(ROW(B2:B),FILTER(ROW(B2:B),B2:B<>""),0)))'
  );
}

/******************************************************
 * 11. 공통 유틸
 ******************************************************/
function getHeaderArray_(sh, headerRow) {
  return sh.getRange(headerRow, 1, 1, sh.getLastColumn())
    .getDisplayValues()[0]
    .map(function(v) {
      return String(v || '').trim();
    });
}

function headerFinder_(headers, aliasesByKey) {
  return function(header) {
    const candidates = [header];

    if (aliasesByKey && PROB_ROSTER && PROB_ROSTER.MAIN_HEADERS) {
      Object.keys(aliasesByKey).forEach(function(key) {
        if (PROB_ROSTER.MAIN_HEADERS[key] === header) {
          aliasesByKey[key].forEach(function(candidate) {
            if (candidates.indexOf(candidate) < 0) candidates.push(candidate);
          });
        }
      });
    }

    for (let i = 0; i < candidates.length; i++) {
      const idx = headers.indexOf(candidates[i]);
      if (idx >= 0) return idx;
    }

    return -1;
  };
}

function readBodyValues_(sh, startRow) {
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();

  if (lastRow < startRow || lastCol < 1) return [];

  return sh.getRange(
    startRow,
    1,
    lastRow - startRow + 1,
    lastCol
  ).getValues();
}

function validateHeaders_(label, finder, headers) {
  headers.forEach(function(h) {
    if (finder(h) < 0) {
      throw new Error(label + ' 헤더 없음: ' + h);
    }
  });
}

function setCellByHeader_(sh, rowNo, H, header, value) {
  const colIdx = H(header);

  if (colIdx < 0) {
    throw new Error('헤더 없음: ' + header);
  }

  sh.getRange(rowNo, colIdx + 1).setValue(value);
}

function fillDueDateIfEmpty_(sh, rowNo, H, header, joinDate, offsetDays) {
  if (!joinDate) return;

  const colIdx = H(header);

  if (colIdx < 0) {
    throw new Error('헤더 없음: ' + header);
  }

  const cell = sh.getRange(rowNo, colIdx + 1);
  const current = cell.getValue();

  if (current) return;

  cell.setValue(addDays_(joinDate, offsetDays));
}

function normDept_(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

function str_(value) {
  if (value === null || value === undefined) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return formatDate_(value);
  }

  return String(value || '').trim();
}

function ProbRoster_normalizeEmpId_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return '';

  return String(value).trim().replace(/\.0$/, '');
}

function ProbRoster_normalizeEmail_(value) {
  if (value === null || value === undefined) return '';

  return String(value || '').trim().toLowerCase();
}

function ProbRoster_parseDateOnly_(value) {
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

function addDays_(dateObj, days) {
  const d = ProbRoster_parseDateOnly_(dateObj);

  if (!d) return '';

  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);

  return d;
}

function formatDate_(dateObj) {
  if (!dateObj) return '';

  return Utilities.formatDate(
    ProbRoster_parseDateOnly_(dateObj),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}
