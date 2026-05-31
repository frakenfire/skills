/******************************************************
 * 파일명: 00_공통설정_유틸.gs
 * 역할: 온보딩 자동화 전체 공통 설정 + 유틸 함수
 *
 * 현재 온보딩 대상자 시트 구조 기준:
 * - D+3 / D+7: 설문 발송여부, 설문 완료만 관리
 * - D+30 / D+60 / D+90:
 *   예정일, 미션 발송여부, 설문 발송여부, 평가 완료, 설문 완료
 * - 퇴사/퇴직/휴직/마스터 누락자는 퇴사·휴직 체크(AF) 기준으로 마감 처리
 *
 * 주의:
 * - Google Form URL은 메일 템플릿 시트 D열 `설문 링크`를 우선 사용한다.
 * - CFG.SURVEY_URLS는 메일 템플릿 D열이 비어 있을 때만 쓰는 fallback이다.
 * - 메일 HTML 색상/디자인은 메일 템플릿 시트 C열 `본문 템플릿`에서 관리한다.
 ******************************************************/

const CFG = {
  TZ: 'Asia/Seoul',

  SHEET_MAIN:       '온보딩 대상자',
  SHEET_EMP_MASTER: '직원 마스터 시트 (연동)',
  SHEET_META:       '부서 메타 데이터',
  SHEET_COMM:       '소통 창고',
  SHEET_RESPONSES:  '설문 응답_통합',
  SHEET_SCHEDULE:   '설문 발송 스케줄',
  SHEET_TEMPLATE:   '메일 템플릿',

  /******************************************************
   * 운영 라운드
   ******************************************************/
  SURVEY_ROUNDS: ['D3', 'D7', 'D30', 'D60', 'D90'],
  MISSION_ROUNDS: ['START', 'D30', 'D60', 'D90'],

  ROUNDS: ['D3', 'D7', 'D30', 'D60', 'D90'],

  ROUND_DAYS: {
    D3: 3,
    D7: 7,
    D30: 30,
    D60: 60,
    D90: 90,
  },

  ROUND_LABELS: {
    D3: 'D+3',
    D7: 'D+7',
    D30: 'D+30',
    D60: 'D+60',
    D90: 'D+90',
  },

  ROUND_TITLES: {
    D3:  '입사 3일차 첫 적응 체크',
    D7:  '입사 7일차 적응 체크',
    D30: '입사 1개월차 생산성 체크',
    D60: '입사 2개월차 실행 병목 체크',
    D90: '입사 3개월차 전환 리뷰',
  },

  ROUND_LEADER_NOTICE_BEFORE: {
    D3: 0,
    D7: 0,
    D30: 3,
    D60: 3,
    D90: 15,
  },

  /******************************************************
   * fallback 전용 설문 URL
   * 실제 운영 링크는 `메일 템플릿` 탭 D열 `설문 링크` 값을 우선 사용한다.
   ******************************************************/
  SURVEY_URLS: {
    D3:   'https://docs.google.com/forms/d/e/1FAIpQLScG9wJG92HWallqdUA5a3509c3R8PfO3jnesUuNkjITNqwQsw/viewform',
    D7:   '',
    D30:  'https://docs.google.com/forms/d/e/1FAIpQLSei_-lGMwxcQ1rz74Vao5wR2OnA3imsjAGtWMw0BPiEXNI86Q/viewform',
    D60:  'https://docs.google.com/forms/d/e/1FAIpQLSd5lBQkiYUgWGzJj6Zlq465qVnvx2zybgP6WykpBpdQ3dEjpw/viewform',
    D90:  'https://docs.google.com/forms/d/e/1FAIpQLSelyex98mnGmVysTyw8iIWRxQOX31NKPvIFNCGz_ZOKoQfyKA/viewform',
    COMM: 'https://docs.google.com/forms/d/e/1FAIpQLScQzEZSIiN_vmCtM0s87bcTfnFi9bsbtXwEIH2ArtNsnxPYuA/viewform',
  },

  REMIND_START_AFTER_DAYS: 2,

  /******************************************************
   * 온보딩 대상자 컬럼 인덱스
   * 기준: 0-based index
   *
   * 현재 실제 헤더:
   * A 순서
   * B 사번
   * C 성명
   * D 본부
   * E 팀
   * F 파트
   * G 이메일
   * H 직책
   * I 입사일
   * J 부서장
   * K 부서장 이메일
   * L 시작안내 발송여부
   * M D+3 설문 발송여부
   * N D+3 설문 완료
   * O D+7 설문 발송여부
   * P D+7 설문 완료
   * Q D+30 예정일
   * R D+30 발송여부
   * S D+30 설문 발송여부
   * T D+30 평가 완료
   * U D+30 설문 완료
   * V D+60 예정일
   * W D+60 발송여부
   * X D+60 설문 발송여부
   * Y D+60 평가 완료
   * Z D+60 설문 완료
   * AA D+90 예정일
   * AB D+90 발송여부
   * AC D+90 설문 발송여부
   * AD D+90 평가 완료
   * AE D+90 설문 완료
   * AF 퇴사·휴직 체크
   * AG 메모
   * AH 제외여부
   * AI 마감상태
   ******************************************************/
  COL: {
    NO:           0,
    EMP_ID:       1,
    NAME:         2,
    ORG:          3,
    TEAM:         4,
    PART:         5,
    EMAIL:        6,
    TITLE:        7,
    JOIN_DATE:    8,
    LEADER:       9,
    LEADER_EMAIL: 10,

    START_GUIDE:  11,

    D3_SURVEY_SENT: 12,
    D3_SURVEY_DONE: 13,

    D7_SURVEY_SENT: 14,
    D7_SURVEY_DONE: 15,

    D30_DUE:          16,
    D30_MISSION_SENT: 17,
    D30_SURVEY_SENT:  18,
    D30_EVAL_DONE:    19,
    D30_SURVEY_DONE:  20,

    D60_DUE:          21,
    D60_MISSION_SENT: 22,
    D60_SURVEY_SENT:  23,
    D60_EVAL_DONE:    24,
    D60_SURVEY_DONE:  25,

    D90_DUE:          26,
    D90_MISSION_SENT: 27,
    D90_SURVEY_SENT:  28,
    D90_EVAL_DONE:    29,
    D90_SURVEY_DONE:  30,

    CLOSE_CHECK: 31,
    NOTE:        32,
    EXCLUDED:    33,
    CLOSE_STATUS: 34,

    // backward compatibility aliases
    D3_SENT:  12,
    D3_RESP:  13,
    D7_SENT:  14,
    D7_RESP:  15,

    D30_SENT: 17,
    D30_DONE: 19,
    D30_RESP: 20,

    D60_SENT: 22,
    D60_DONE: 24,
    D60_RESP: 25,

    D90_SENT: 27,
    D90_DONE: 29,
    D90_RESP: 30,
  },

  /******************************************************
   * 상태값
   ******************************************************/
  STATUS: {
    PENDING:      '설문 예정',
    SENT:         '완료',
    NOT_SENT:     '발송 전',
    SEND_FAILED:  '발송 실패',
    RESPONDED:    '완료',
    NOT_EVALUATED:'미평가',
    RISK:         '리스크 감지',
    ASSIGNED:     '담당 배정',
    IN_PROGRESS:  '처리 중',
    DONE:         '완료',
    ON_HOLD:      '보류',
    RETIRED:      '퇴직',
    LEAVE:        '휴직',
  },

  SEND_STATUS_VALUES: ['완료', '발송 전', '발송 실패'],
  EVAL_STATUS_VALUES: ['완료', '미평가'],
  FINAL_EVAL_STATUS_VALUES: ['합격', '연장', '불합격', '완료', '미평가'],

  DONE_VALUES: [
    '완료',
    '응답완료',
    '응답 완료',
    '제출완료',
    '제출 완료',
    '합격',
    '연장',
    '불합격',
    '전환완료',
    '전환 완료',
    'Y',
    'y',
  ],

  CLOSED_VALUES: [
    '합격',
    '연장',
    '불합격',
    '완료',
  ],

  EMP_MASTER_ACTIVE_VALUES: ['재직', '수습'],
  EMP_MASTER_CLOSE_VALUES: ['퇴사', '퇴직', '휴직', '퇴사예정'],

  COLORS: {
    PRIMARY:       '#114e48',
    PRIMARY_HOVER: '#0d3f3a',
    PRIMARY_LIGHT: 'rgba(17,78,72,0.06)',
    ORANGE:        '#ff4b00',
    BLUE:          '#224289',
    MINT:          '#00b3ba',
    GRAY:          '#333333',
    WHITE:         '#ffffff',
    BG_LIGHT:      '#f5f5f5',

    HEADER:        '#114e48',
    CLOSED_ROW:    '#d9d9d9',
    COMPLETE_BG:   '#d9ead3',
    PENDING_BG:    '#fff2cc',
    FAILED_BG:     '#f4cccc',
    WARNING_BG:    '#fce4d6',
    COMPLETE_FONT: '#274e13',
    PENDING_FONT:  '#7f6000',
    FAILED_FONT:   '#990000',
    WARNING_FONT:  '#c00000',
  },
};

const AUTOMATION_LOG_HEADERS_ = [
  '실행시각',
  '실행일',
  '작업',
  '라운드',
  '결과',
  '행번호',
  '사번',
  '성명',
  '이메일',
  '기준일',
  '경과일',
  '사유',
];

const AUTOMATION_CURRENT_HANDLERS_ = [
  'refreshProbationRosterOnly',
  'onRosterSheetEdit',
  'onRosterSheetChange',
  'runOnboardingSurveyAutomation',
  'runOnboardingMissionGuideAutomation',
  'runProbationConsistencyCheck',
  'onCommunicationSubmit',
];

const AUTOMATION_LEGACY_TIME_HANDLERS_ = [
  'onSurveyResponse_D3',
  'onSurveyResponse_D7',
  'onSurveyResponse_D30',
  'onSurveyResponse_D60',
  'onSurveyResponse_D90',
  'runProbationAutomation',
  'runOnboardingOpsControl',
  'notifyChatForTodayReviews',
  'sendReviewIncompleteReminderBySchedule',
  'sendDailyReminders',
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
];

/******************************************************
 * 공통 시트 / 날짜 유틸
 ******************************************************/
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function toKST(date) {
  return Utilities.formatDate(date || new Date(), CFG.TZ, 'yyyy-MM-dd');
}

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;

  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }

  return d;
}

function getAutomationTriggerAudit_() {
  const counts = {};

  AUTOMATION_CURRENT_HANDLERS_
    .concat(AUTOMATION_LEGACY_TIME_HANDLERS_)
    .forEach(function(handler) {
      counts[handler] = 0;
    });

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const handler = trigger.getHandlerFunction();

    if (Object.prototype.hasOwnProperty.call(counts, handler)) {
      counts[handler]++;
    }
  });

  const managedOk = AUTOMATION_CURRENT_HANDLERS_.every(function(handler) {
    return counts[handler] === 1;
  });

  const noLegacy = AUTOMATION_LEGACY_TIME_HANDLERS_.every(function(handler) {
    return counts[handler] === 0;
  });

  return {
    ok: managedOk && noLegacy,
    counts: counts,
  };
}

function logToSheet(sheetName, rowData) {
  const sh = getSheet(sheetName);
  if (sh) sh.appendRow(rowData);
}


/******************************************************
 * Chat 알림
 ******************************************************/
function notifyChat(message) {
  const props = PropertiesService.getScriptProperties();
  const webhook = props.getProperty('CHAT_WEBHOOK') || '';

  if (!webhook) return;

  const now = Date.now();
  const suppressUntil = Number(props.getProperty('CHAT_SUPPRESS_UNTIL_MS') || 0);
  if (suppressUntil && now < suppressUntil) {
    console.warn('Chat notify suppressed until ' + new Date(suppressUntil).toISOString());
    return;
  }

  try {
    const response = UrlFetchApp.fetch(webhook, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code === 429 || code >= 500) {
      props.setProperty('CHAT_SUPPRESS_UNTIL_MS', String(now + 10 * 60 * 1000));
      console.warn('Chat notify throttled: HTTP ' + code);
    } else if (code >= 400) {
      console.error('Chat notify failed: HTTP ' + code + ' / ' + response.getContentText());
    }
  } catch (e) {
    console.error('Chat notify failed:', e.message);
  }
}

/******************************************************
 * 스프레드시트 맞춤 메뉴 및 통합 트리거 인스톨러
 ******************************************************/
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 온보딩 자동화')
    .addItem('⚡ 6대 트리거 자동 설치/재구축', 'installAllTriggers')
    .addToUi();
}

function installAllTriggers() {
  const ui = SpreadsheetApp.getUi();
  try {
    Logger.log("--- 모든 트리거 설치 프로세스 시작 ---");
    
    // 1. 인원 동기화 트리거 설치
    installRosterTriggers();
    
    // 2. 온보딩 만족도 발송 트리거 설치
    installOnboardingSurveyTrigger();
    
    // 3. 온보딩 미션 안내 발송 트리거 설치
    installOnboardingMissionGuideTrigger();
    
    // 4. 수습 정합성 체크 트리거 설치
    installProbationConsistencyCheckTriggers();

    // 5. 소통창고 폼 제출 트리거 설치
    if (typeof installCommunicationTrigger === 'function') {
      installCommunicationTrigger();
    }
    
    Logger.log("--- 모든 트리거 설치 프로세스 성공적으로 완료 ---");
    ui.alert("✅ 핵심 트리거 설치 성공", "온보딩 자동화 시스템을 위한 모든 활성 트리거가 성공적으로 설치/재구축되었습니다.", ui.ButtonSet.OK);
  } catch (e) {
    Logger.log("트리거 설치 중 에러 발생: " + e.message);
    ui.alert("❌ 트리거 설치 실패", "트리거 설치 도중 에러가 발생했습니다:\n" + e.message, ui.ButtonSet.OK);
  }
}

