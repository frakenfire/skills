/******************************************************
 * Harness_getSS()
 ******************************************************/
function Harness_getSS() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {
    // API Executable fallback
  }
  return SpreadsheetApp.openById('1dcrCO1bOQqFTjgYTO84i2mcrGbzyfKOmMlzVfIDs_Kg');
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'runHarness') {
      const res = Harness_onboardingSystem_dryRun();
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    } else if (payload.action === 'installTriggers') {
      const LEGACY_SHOULD_BE_GONE = typeof AUTOMATION_LEGACY_TIME_HANDLERS_ !== 'undefined'
        ? AUTOMATION_LEGACY_TIME_HANDLERS_ : ['sendDailyReminders'];
      ScriptApp.getProjectTriggers().forEach(t => {
        if (LEGACY_SHOULD_BE_GONE.indexOf(t.getHandlerFunction()) >= 0) {
          ScriptApp.deleteTrigger(t);
        }
      });
      installRosterTriggers();
      installOnboardingSurveyTrigger();
      installOnboardingMissionGuideTrigger();
      installProbationConsistencyCheckTriggers();
      if (typeof installCommunicationTrigger === 'function') {
        installCommunicationTrigger();
      }
      if (typeof installSurveyFormSubmitTrigger === 'function') {
        installSurveyFormSubmitTrigger();
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'All triggers installed headlessly' })).setMimeType(ContentService.MimeType.JSON);
    } else if (payload.action === 'getD7Url') {
      const ss = Harness_getSS();
      const sh = ss.getSheetByName('메일 템플릿');
      const data = sh.getDataRange().getValues();
      return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data })).setMimeType(ContentService.MimeType.JSON);
    } else if (payload.action === 'testSurveySubmitCard') {
      const mockEvent = {
        values: [new Date().toString(), 'tester@example.com', '하네스 테스터'],
        namedValues: {
          '타임스탬프': [new Date().toString()],
          '이름 (성함)': ['하네스 테스터'],
          '이메일 주소': ['tester@example.com']
        },
        range: {
          getSheet: function() {
            return {
              getName: function() { return '설문지 응답_하네스테스트(D+30)'; },
              getSheetId: function() { return 0; }
            };
          }
        }
      };
      
      try {
        if (typeof onSurveySubmit === 'function') {
          onSurveySubmit(mockEvent);
          return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Test card sent successfully' })).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'onSurveySubmit is not defined' })).setMimeType(ContentService.MimeType.JSON);
        }
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('{}');
}

/******************************************************
 * Harness_cleanupLegacyTriggers()
 *
 * 목적: 레거시 트리거 삭제 대상을 dry-run으로 확인한다.
 * 제약: 사용자 승인 없이 실제 트리거를 삭제하지 않는다.
 ******************************************************/
function Harness_cleanupLegacyTriggers() {
  const LEGACY = typeof AUTOMATION_LEGACY_TIME_HANDLERS_ !== 'undefined'
    ? AUTOMATION_LEGACY_TIME_HANDLERS_
    : [
        'sendDailyReminders',
        'runProbationConsistencyCheck',
        'runProbationAutomation',
        'runOnboardingOpsControl',
        'notifyChatForTodayReviews',
        'sendReviewIncompleteReminderBySchedule',
        'sendSurveyBySchedule',
        'runOnboardingAutomation',
        'runOnboardingFormFullSetup',
        'createAllForms',
        'createMissingForms',
        'createD7OnboardingFormOnly',
        'installMissingFormTriggers',
        'installFormTriggers',
        'finalizeSystem',
        'setupSheets',
        'setScriptProperties',
        'sendTestNotification',
        'checkReminders',
        'monitorProbationAutomationHealth',
        'onEdit_Trigger',
        'onSurveyResponse_D3',
        'onSurveyResponse_D7',
        'onSurveyResponse_D30',
        'onSurveyResponse_D60',
        'onSurveyResponse_D90',
      ];

  const wouldDelete = [];
  const kept    = [];

  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (LEGACY.indexOf(fn) >= 0) {
      wouldDelete.push(fn + ' (' + t.getUniqueId() + ')');
    } else {
      kept.push(fn);
    }
  });

  const msg = `레거시 트리거 삭제 후보(dry-run): ${wouldDelete.length}건\n삭제 후보: ${wouldDelete.join(', ') || '없음'}\n유지: ${kept.join(', ') || '없음'}`;
  Logger.log(msg);
  console.log(msg);
  Harness_getSS().toast(msg, 'Harness_cleanupLegacyTriggers', 10);
  return { dryRun: true, wouldDelete, kept };
}

/******************************************************
 * Harness_onboardingSystem_dryRun()
 *
 * 목적: 온보딩 운영 자동화 전체를 dry-run 방식으로 검증한다.
 * 제약: 시트 쓰기 0건, 메일 발송 0건, 트리거 변경 0건.
 *
 * 실행 방법: Apps Script 편집기에서 함수 선택 → 실행
 *
 * 반환: 콘솔에 JSON 결과 출력 + Logger 출력
 ******************************************************/

function Harness_onboardingSystem_dryRun() {
  const result = {
    ok: true,
    checkedAt: new Date().toISOString(),
    spreadsheetId: Harness_getSS().getId(),
    sections: {},
    failures: [],
    summary: { BLOCKER: 0, WARN: 0, INFO: 0, totalFailures: 0 },
  };

  function fail(severity, area, message, evidence, fixHint) {
    result.failures.push({ severity, area, message, evidence, fixHint });
    result.summary[severity] = (result.summary[severity] || 0) + 1;
    result.summary.totalFailures++;
    if (severity === 'BLOCKER') result.ok = false;
  }

  // ── A. 시트 탭 존재 확인 ──────────────────────────────────────
  result.sections.sheets = Harness_checkSheets_(fail);

  // ── B. 설문 응답_통합!A31 LET 수식 점검 ──────────────────────
  result.sections.surveyFormula = Harness_checkSurveyFormula_(fail);

  // ── C. 대시보드 내부 정합 검산 ───────────────────────────────
  result.sections.dashboard = Harness_checkDashboard_(fail);

  // ── D. Apps Script 현재 함수 존재 확인 ───────────────────────
  result.sections.appsScript = Harness_checkAppsScript_(fail);

  // ── E. 트리거 감사 ───────────────────────────────────────────
  result.sections.triggers = Harness_checkTriggers_(fail);

  // ── F. 운영관제_로그 최신 행 파싱 (더 이상 쓰지 않으므로 제거) ────────
  result.sections.logs = { skipped: true };

  // ── G. previewProbationRosterSync 안전 실행 ─────────────────
  result.sections.rosterPreview = Harness_runPreviewRoster_(fail);

  // ── H. 캘린더 퇴사자 일정 정리 preview ─────────────────────
  result.sections.calendarCleanupPreview = Harness_runPreviewCalendarCleanup_(fail);

  // 결과 출력
  const json = JSON.stringify(result, null, 2);
  Logger.log(json);
  console.log(json);

  // 스프레드시트 토스트 (읽기 전용)
  const ss = Harness_getSS();
  const status = result.ok
    ? '✅ 전체 OK'
    : `❌ BLOCKER ${result.summary.BLOCKER}건`;
  ss.toast(
    `검증 완료 | ${status} | WARN ${result.summary.WARN} | INFO ${result.summary.INFO}`,
    'Harness_dryRun',
    10
  );

  return result;
}

// ────────────────────────────────────────────────────────────────
// A. 시트 탭 존재 확인
// ────────────────────────────────────────────────────────────────
function Harness_checkSheets_(fail) {
  const section = { checked: [], missing: [], extra: [] };
  try {
    const ss = Harness_getSS();
    const existingNames = ss.getSheets().map(s => s.getName());

    // 필수 탭 목록 (지침서 SSOT 기준)
    const REQUIRED_SHEETS = [
      '온보딩 대상자',
      '직원 마스터 시트 (연동)',
      '부서 메타 데이터',
      '소통 창고',
      '설문 응답_통합',
      '설문 발송 스케줄',
      '메일 템플릿',
      '설문지 응답_D+3',
      '설문지 응답_D+7',
      '설문지 응답_D+30',
      '설문지 응답_D+60',
      '설문지 응답_D+90',
      '온보딩_대시보드',
    ];

    REQUIRED_SHEETS.forEach(name => {
      if (existingNames.indexOf(name) >= 0) {
        section.checked.push(name);
      } else {
        section.missing.push(name);
        fail(
          'BLOCKER',
          'sheets',
          `필수 탭 없음: "${name}"`,
          `존재하는 탭: ${existingNames.join(', ')}`,
          `시트 추가 또는 탭명 오타 수정 필요`
        );
      }
    });

    section.allNames = existingNames;

  } catch (e) {
    fail('BLOCKER', 'sheets', '시트 목록 조회 실패: ' + e.message, '', 'getSheets() 접근 권한 확인');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// B. 설문 응답_통합!A31 LET 수식 점검
// ────────────────────────────────────────────────────────────────
function Harness_checkSurveyFormula_(fail) {
  const section = { sheetExists: false, a31Formula: null, isLet: false, hasAllSources: false };
  try {
    const ss = Harness_getSS();
    const sh = ss.getSheetByName('설문 응답_통합');
    if (!sh) {
      fail('BLOCKER', 'surveyFormula', '설문 응답_통합 탭 없음', '', '탭 생성 필요');
      return section;
    }
    section.sheetExists = true;

    // A31 수식 읽기
    const a31 = sh.getRange('A31');
    const formula = a31.getFormula();
    const value   = a31.getValue();
    section.a31Formula = formula || String(value);

    if (!formula) {
      fail(
        'BLOCKER',
        'surveyFormula',
        'A31에 수식 없음 (정적 값이거나 비어 있음)',
        `A31 값: ${value}`,
        '지침서 기준: A31은 5개 원천 탭을 통합하는 단일 LET 수식이어야 함'
      );
      return section;
    }

    // LET( 수식 여부
    section.isLet = /^=\s*LET\s*\(/i.test(formula);
    if (!section.isLet) {
      fail(
        'BLOCKER',
        'surveyFormula',
        'A31 수식이 LET() 가 아님',
        `수식: ${formula.substring(0, 200)}`,
        '지침서 기준: 단일 LET 수식으로 통합해야 함'
      );
    }

    // 5개 원천 탭 참조 여부
    const SOURCES = [
      '설문지 응답_D+3',
      '설문지 응답_D+7',
      '설문지 응답_D+30',
      '설문지 응답_D+60',
      '설문지 응답_D+90',
    ];
    const missingSources = SOURCES.filter(src => formula.indexOf(src) < 0);
    section.hasAllSources = missingSources.length === 0;
    if (missingSources.length > 0) {
      fail(
        'BLOCKER',
        'surveyFormula',
        `A31 수식이 원천 탭을 참조하지 않음: ${missingSources.join(', ')}`,
        `수식(앞 300자): ${formula.substring(0, 300)}`,
        '5개 원천 탭을 모두 LET 수식 내에서 참조해야 함'
      );
    }

    // A2:AC30 정적 영역 체크 (수식이 없어야 함)
    const staticRange = sh.getRange('A2:AC30');
    const staticFormulas = staticRange.getFormulas();
    const formulaCells = [];
    staticFormulas.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && cell.trim()) formulaCells.push(`R${r+2}C${c+1}`);
      });
    });
    section.staticRangeFormulaCount = formulaCells.length;
    if (formulaCells.length > 0) {
      fail(
        'WARN',
        'surveyFormula',
        `A2:AC30 정적 영역에 수식 ${formulaCells.length}개 발견`,
        `셀: ${formulaCells.slice(0, 5).join(', ')}`,
        '지침서 기준: A2:AC30은 과거 정적값 영역, 수식 쓰기 금지'
      );
    }

  } catch (e) {
    fail('BLOCKER', 'surveyFormula', '수식 점검 실패: ' + e.message, '', '스크립트 실행 권한 확인');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// C. 대시보드 내부 정합 검산
// ────────────────────────────────────────────────────────────────
function Harness_checkDashboard_(fail) {
  const section = { sheetExists: false, rounds: {} };
  try {
    const ss = Harness_getSS();
    const sh = ss.getSheetByName('온보딩_대시보드');
    if (!sh) {
      fail('BLOCKER', 'dashboard', '온보딩_대시보드 탭 없음', '', '탭 생성 필요');
      return section;
    }
    section.sheetExists = true;

    // 대시보드에서 핵심 지표를 읽는다.
    // 구조: 대시보드는 헤더 기반이므로, getDataRange()로 전체 읽어서 파싱
    const data = sh.getDataRange().getValues();

    // 행에서 D+x 패턴 찾기
    const ROUNDS = ['D+3', 'D+7', 'D+30', 'D+60', 'D+90'];

    // 헤더 행 찾기: "응답자수", "대상자수", "응답률" 등이 있는 행
    let headerRowIdx = -1;
    let colMap = {};

    for (let r = 0; r < Math.min(data.length, 20); r++) {
      const row = data[r].map(v => String(v).trim());
      // 핵심 헤더 탐색
      const responderIdx = row.findIndex(v => v === '응답자수');
      const targetIdx    = row.findIndex(v => v === '대상자수');
      const rateIdx      = row.findIndex(v => v === '응답률');
      const scoreIdx     = row.findIndex(v => v === '경험점수');
      const riskIdx      = row.findIndex(v => v === '리스크율');

      if (responderIdx >= 0 && targetIdx >= 0 && rateIdx >= 0) {
        headerRowIdx = r;
        colMap = {
          round:     row.findIndex(v => v === '구간'),
          responder: responderIdx,
          target:    targetIdx,
          rate:      rateIdx,
          score:     scoreIdx,
          risk:      riskIdx,
        };
        break;
      }
    }

    if (headerRowIdx < 0) {
      fail(
        'WARN',
        'dashboard',
        '대시보드 헤더 행 탐색 실패 (응답자수/대상자수/응답률 컬럼 못 찾음)',
        `전체 ${data.length}행 확인, 첫 행: ${JSON.stringify(data[0]).substring(0,100)}`,
        '대시보드 헤더 라벨 확인 필요'
      );
      section.headerNotFound = true;
      return section;
    }

    section.headerRowIdx = headerRowIdx;
    section.colMap = colMap;

    // 각 라운드 데이터 파싱 및 검산
    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r];
      const roundLabel = String(row[colMap.round] || '').trim();
      if (ROUNDS.indexOf(roundLabel) < 0) continue;

      const responder = parseFloat(String(row[colMap.responder]).replace('%', '').replace(',', '')) || 0;
      const target    = parseFloat(String(row[colMap.target]).replace('%', '').replace(',', ''))    || 0;
      const rateRaw   = row[colMap.rate];
      const scoreRaw  = colMap.score >= 0 ? row[colMap.score] : null;
      const riskRaw   = colMap.risk  >= 0 ? row[colMap.risk]  : null;

      // 응답률 검산
      const rateDisplay = typeof rateRaw === 'number'
        ? rateRaw
        : parseFloat(String(rateRaw).replace('%', '')) / 100;
      const expectedRate = target > 0 ? responder / target : 0;
      const rateDiff = Math.abs(rateDisplay - expectedRate);

      const roundResult = {
        responder, target,
        rateDisplay: rateDisplay,
        rateExpected: Math.round(expectedRate * 1000) / 1000,
        rateOk: rateDiff < 0.002,  // 0.2% 오차 허용
      };

      // 소수점 표시 차이 허용 (시트가 % 포맷으로 저장된 경우 이미 비율)
      if (!roundResult.rateOk) {
        // 혹시 rateDisplay가 퍼센트 값(0~100)으로 저장된 경우 재시도
        const rateAlt = rateDisplay / 100;
        if (Math.abs(rateAlt - expectedRate) < 0.002) {
          roundResult.rateOk = true;
          roundResult.rateDisplay = rateAlt;
        }
      }

      if (!roundResult.rateOk && target > 0) {
        fail(
          'WARN',
          'dashboard',
          `[${roundLabel}] 응답률 불일치: 표시=${(rateDisplay*100).toFixed(1)}%, 계산=${(expectedRate*100).toFixed(1)}% (${responder}÷${target})`,
          `rateRaw=${rateRaw}`,
          '대시보드 응답률 수식 참조 셀 확인'
        );
      }

      section.rounds[roundLabel] = roundResult;
    }

    // 기준값과 비교
    const BASELINE = {
      'D+3':  { responder: 0,  target: 83, rateStr: '0.0%' },
      'D+7':  { responder: 0,  target: 83, rateStr: '0.0%' },
      'D+30': { responder: 7,  target: 82, rateStr: '8.5%' },
      'D+60': { responder: 4,  target: 76, rateStr: '5.3%' },
      'D+90': { responder: 19, target: 74, rateStr: '25.7%' },
    };

    ROUNDS.forEach(rnd => {
      const live = section.rounds[rnd];
      const base = BASELINE[rnd];
      if (!live) {
        fail('WARN', 'dashboard', `[${rnd}] 대시보드 라운드 행 없음`, '', '대시보드 구조 확인');
        return;
      }
      if (live.responder !== base.responder) {
        fail('INFO', 'dashboard',
          `[${rnd}] 응답자수 변경: 기준=${base.responder}, 실제=${live.responder}`,
          '데이터 업데이트로 인한 자연 변동',
          '스펙 문서 기준값 업데이트 필요');
      }
      if (live.target !== base.target) {
        fail('INFO', 'dashboard',
          `[${rnd}] 대상자수 변경: 기준=${base.target}, 실제=${live.target}`,
          '신규 입사자 또는 퇴사자 추가로 인한 자연 변동',
          '스펙 문서 기준값 업데이트 필요');
      }
    });

  } catch (e) {
    fail('BLOCKER', 'dashboard', '대시보드 검산 실패: ' + e.message, e.stack || '', '스크립트 실행 권한 확인');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// D. Apps Script 필수 함수 존재 확인
// ────────────────────────────────────────────────────────────────
function Harness_checkAppsScript_(fail) {
  const section = { currentHandlers: {}, legacyHandlers: {} };
  try {
    // AUTOMATION_CURRENT_HANDLERS_ 는 00_공통설정_유틸 에 정의됨
    // 런타임에서 직접 typeof 체크
    const CURRENT = typeof AUTOMATION_CURRENT_HANDLERS_ !== 'undefined'
      ? AUTOMATION_CURRENT_HANDLERS_
      : [
          'refreshProbationRosterOnly',
          'onRosterSheetEdit',
          'onRosterSheetChange',
          'runOnboardingSurveyAutomation',
          'runOnboardingMissionGuideAutomation',
          'runProbationConsistencyCheck',
          'onCommunicationSubmit',
        ];

    const CRITICAL = [
      'getSheet',
      'notifyChat',
      'logToSheet',
      'installAllTriggers',
      'getAutomationTriggerAudit_',
      'previewCalendarCleanupForInactiveEmployees',
      'runCalendarCleanupForInactiveEmployees',
    ];

    const LEGACY_SHOULD_BE_GONE = [
      'sendDailyReminders',
      'sendSurveyBySchedule',
      'runOnboardingAutomation',
      'installMissingFormTriggers',
    ];

    CURRENT.forEach(fn => {
      const exists = typeof eval(fn) === 'function'; // GAS 전역 체크
      section.currentHandlers[fn] = exists;
      if (!exists) {
        fail('BLOCKER', 'appsScript', `현재 핸들러 함수 없음: ${fn}`, '', `${fn} 함수 정의 확인`);
      }
    });

    CRITICAL.forEach(fn => {
      const exists = typeof eval(fn) === 'function';
      if (!exists) {
        fail('BLOCKER', 'appsScript', `공통 유틸 함수 없음: ${fn}`, '', `00_공통설정_유틸.gs 확인`);
      }
    });

    LEGACY_SHOULD_BE_GONE.forEach(fn => {
      let exists = false;
      try {
        exists = typeof eval(fn) === 'function';
      } catch (err) {
        exists = false;
      }
      section.legacyHandlers[fn] = exists;
      if (exists) {
        fail('WARN', 'appsScript',
          `레거시 함수 여전히 존재: ${fn}`,
          'AUTOMATION_LEGACY_TIME_HANDLERS_ 목록에 포함된 함수',
          '트리거에서 제거되었는지 확인, 사용하지 않으면 코드에서도 삭제 고려');
      }
    });


  } catch (e) {
    fail('BLOCKER', 'appsScript', '함수 존재 확인 실패: ' + e.message, '', '');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// E. 트리거 감사
// ────────────────────────────────────────────────────────────────
function Harness_checkTriggers_(fail) {
  const section = { current: [], legacy: [], missing: [] };
  try {
    const REQUIRED_CURRENT = typeof AUTOMATION_CURRENT_HANDLERS_ !== 'undefined'
      ? AUTOMATION_CURRENT_HANDLERS_
      : [
          'refreshProbationRosterOnly',
          'onRosterSheetEdit',
          'onRosterSheetChange',
          'runOnboardingSurveyAutomation',
          'runOnboardingMissionGuideAutomation',
          'runProbationConsistencyCheck',
          'onCommunicationSubmit',
        ];

    const LEGACY_SHOULD_NOT_EXIST = typeof AUTOMATION_LEGACY_TIME_HANDLERS_ !== 'undefined'
      ? AUTOMATION_LEGACY_TIME_HANDLERS_
      : [
          'sendDailyReminders',
          'sendSurveyBySchedule',
          'runOnboardingAutomation',
          'runProbationConsistencyCheck',
          'installMissingFormTriggers',
          'installFormTriggers',
        ];

    const triggers = ScriptApp.getProjectTriggers();
    const triggersByFn = {};

    triggers.forEach(t => {
      const fn = t.getHandlerFunction();
      const type = t.getEventType().toString();
      const info = { fn, type, triggerId: t.getUniqueId() };
      if (!triggersByFn[fn]) triggersByFn[fn] = [];
      triggersByFn[fn].push(info);
      section.current.push(info);
    });

    // 현재 핸들러 누락 확인
    REQUIRED_CURRENT.forEach(fn => {
      if (!triggersByFn[fn]) {
        section.missing.push(fn);
        fail('BLOCKER', 'triggers',
          `필수 트리거 없음: ${fn}`,
          '현재 설치된 트리거에서 찾을 수 없음',
          'installAllTriggers() 또는 해당 개별 install 함수 실행');
      } else if (triggersByFn[fn].length > 1) {
        fail('WARN', 'triggers',
          `중복 트리거: ${fn} (${triggersByFn[fn].length}개)`,
          `트리거 ID: ${triggersByFn[fn].map(t=>t.triggerId).join(', ')}`,
          '중복 트리거 제거 필요');
      }
    });

    // 레거시 트리거 잔존 확인
    LEGACY_SHOULD_NOT_EXIST.forEach(fn => {
      if (triggersByFn[fn]) {
        section.legacy.push(fn);
        fail('BLOCKER', 'triggers',
          `레거시 트리거 잔존: ${fn}`,
          `트리거 ID: ${triggersByFn[fn].map(t=>t.triggerId).join(', ')}`,
          `ScriptApp.getProjectTriggers()에서 해당 트리거 삭제 또는 remove${fn} 함수 실행`);
      }
    });

    section.totalCount = triggers.length;

  } catch (e) {
    fail('BLOCKER', 'triggers', '트리거 감사 실패: ' + e.message, '', 'ScriptApp 접근 권한 확인');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// G. previewProbationRosterSync 안전 실행
// ────────────────────────────────────────────────────────────────
function Harness_runPreviewRoster_(fail) {
  const section = { attempted: false, success: false, result: null };
  try {
    if (typeof previewProbationRosterSync !== 'function') {
      fail('WARN', 'rosterPreview',
        'previewProbationRosterSync 함수 없음',
        '',
        '01_인원동기화.gs 확인');
      return section;
    }

    section.attempted = true;
    // previewProbationRosterSync는 isPreview=true로 호출 → 시트 쓰기 없음
    const previewResult = previewProbationRosterSync();
    section.success = true;
    section.result  = previewResult ? JSON.stringify(previewResult).substring(0, 500) : '(반환값 없음)';

    if (previewResult && previewResult.errors && previewResult.errors.length > 0) {
      fail('WARN', 'rosterPreview',
        `previewProbationRosterSync 오류 ${previewResult.errors.length}건`,
        JSON.stringify(previewResult.errors).substring(0, 300),
        '01_인원동기화.gs 로직 확인');
    }

  } catch (e) {
    section.success = false;
    section.error = e.message;
    fail('WARN', 'rosterPreview',
      'previewProbationRosterSync 실행 실패: ' + e.message,
      e.stack ? e.stack.substring(0, 300) : '',
      '함수 내부 오류 확인');
  }
  return section;
}

// ────────────────────────────────────────────────────────────────
// H. 퇴사/휴직/비재직자 캘린더 정리 preview
// ────────────────────────────────────────────────────────────────
function Harness_runPreviewCalendarCleanup_(fail) {
  const section = { attempted: false, success: false, result: null };
  try {
    if (typeof previewCalendarCleanupForInactiveEmployees !== 'function') {
      fail('WARN', 'calendarCleanupPreview',
        'previewCalendarCleanupForInactiveEmployees 함수 없음',
        '',
        '07_캘린더정리.gs 확인');
      return section;
    }

    section.attempted = true;
    const previewResult = previewCalendarCleanupForInactiveEmployees();
    section.success = true;
    section.result = previewResult ? JSON.stringify(previewResult).substring(0, 1000) : '(반환값 없음)';

    if (previewResult && previewResult.errors && previewResult.errors.length > 0) {
      fail('WARN', 'calendarCleanupPreview',
        `캘린더 정리 preview 오류 ${previewResult.errors.length}건`,
        JSON.stringify(previewResult.errors).substring(0, 500),
        '캘린더 권한, 캘린더 ID, 이벤트 제목 패턴 확인');
    }
  } catch (e) {
    section.success = false;
    section.error = e.message;
    fail('WARN', 'calendarCleanupPreview',
      '캘린더 정리 preview 실행 실패: ' + e.message,
      e.stack ? e.stack.substring(0, 300) : '',
      'CalendarApp 권한 또는 ONBOARDING_CALENDAR_ID 확인');
  }
  return section;
}
