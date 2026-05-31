/******************************************************
 * 파일명: 02_온보딩만족도설문발송.gs
 *
 * 역할:
 * - D+3 / D+7 / D+30 / D+60 / D+90 온보딩 만족도·적응 체크 설문 발송
 * - 메일 템플릿 시트 기준 발송
 * - 설문 완료 열은 시트 수식이 관리하므로 Apps Script에서 직접 쓰지 않음
 * - D+3 / D+7은 이미 D+30 단계에 진입한 사람에게 발송하지 않음
 * - 직원 마스터 기준 재직/수습인 사람만 발송
 *
 * 실행 함수:
 * - setupOnboardingSurveyColumnsOnce()
 * - previewOnboardingSurveyAutomation()
 * - previewOnboardingSurveyAutomationForDate(dateText)
 * - runOnboardingSurveyAutomation()
 * - installOnboardingSurveyTrigger()
 * - removeOnboardingSurveyTrigger()
 * - checkOnboardingSurveyTriggerStatus()
 * - QA_checkSurveyPreview(dateText)
 ******************************************************/

const ONBOARDING_SURVEY_CFG = {
  MAIN_SHEET: '온보딩 대상자',
  TEMPLATE_SHEET: '메일 템플릿',
  LOG_SHEET: '온보딩만족도_발송로그',
  RESPONSE_INTEGRATED_SHEET: '설문 응답_통합',

  TRIGGER_HANDLER: 'runOnboardingSurveyAutomation',
  TRIGGER_HOUR: 9,

  REMINDER_START_AFTER_DAYS: 1,

  // 이 날짜보다 이전 예정일은 최초 발송/리마인드 모두 차단한다.
  SURVEY_LAUNCH_DATE: '2026-05-19',

  // 최초 발송이 예정일보다 늦게 잡히는 것을 허용할 최대 일수.
  INITIAL_SEND_MAX_OVERDUE_DAYS: 2,

  EMP_MASTER_SHEET_CANDIDATES: [
    '직원 마스터 시트 (연동)',
    '직원 마스터 시트',
    '재직자명부',
    '직원명부',
    '직원 마스터',
  ],

  ACTIVE_EMPLOYEE_STATUSES: ['재직', '수습'],

  CLOSED_EMPLOYEE_STATUS_REGEX: /퇴사|퇴직|휴직/,

  SEND_DONE: '완료',
  SEND_READY: '발송 전',
  SEND_FAILED: '발송 실패',

  STAGES: [
    {
      key: 'D3',
      label: 'D+3',
      dayOffset: 3,
      templateKeys: ['설문3일차', 'D3', 'D+3', '온보딩만족도_D3', '만족도_D3', '입사3일차', '입사 3일차'],
      sentHeader: 'D+3 설문 발송여부',
      sentHeaderCandidates: ['D+3 설문 발송여부', 'D+3 발송여부', 'D+3 설문 발송일', 'D+3 발송일'],
      responseHeader: 'D+3 설문 완료',
      responseHeaderCandidates: ['D+3 설문 완료', 'D+3 응답여부', 'D+3 응답완료', 'D+3 설문 응답여부'],
      dueHeaderCandidates: [],
    },
    {
      key: 'D7',
      label: 'D+7',
      dayOffset: 7,
      templateKeys: ['설문7일차', 'D7', 'D+7', '온보딩만족도_D7', '만족도_D7', '입사7일차', '입사 7일차'],
      sentHeader: 'D+7 설문 발송여부',
      sentHeaderCandidates: ['D+7 설문 발송여부', 'D+7 발송여부', 'D+7 설문 발송일', 'D+7 발송일'],
      responseHeader: 'D+7 설문 완료',
      responseHeaderCandidates: ['D+7 설문 완료', 'D+7 응답여부', 'D+7 응답완료', 'D+7 설문 응답여부'],
      dueHeaderCandidates: [],
    },
    {
      key: 'D30',
      label: 'D+30',
      dayOffset: 30,
      templateKeys: ['설문1차', 'D30', 'D+30', '온보딩만족도_D30', '만족도_D30', '입사1개월차', '입사 1개월차'],
      dueHeader: 'D+30 예정일',
      dueHeaderCandidates: ['D+30 예정일', 'D+30 설문 예정일', 'D30 예정일'],
      sentHeader: 'D+30 설문 발송여부',
      sentHeaderCandidates: ['D+30 설문 발송여부', 'D+30 설문 발송일', 'D+30 만족도 발송일'],
      responseHeader: 'D+30 설문 완료',
      responseHeaderCandidates: ['D+30 설문 완료', 'D+30 설문 응답여부', 'D+30 만족도 응답여부'],
    },
    {
      key: 'D60',
      label: 'D+60',
      dayOffset: 60,
      templateKeys: ['설문2차', 'D60', 'D+60', '온보딩만족도_D60', '만족도_D60', '입사2개월차', '입사 2개월차'],
      dueHeader: 'D+60 예정일',
      dueHeaderCandidates: ['D+60 예정일', 'D+60 설문 예정일', 'D60 예정일'],
      sentHeader: 'D+60 설문 발송여부',
      sentHeaderCandidates: ['D+60 설문 발송여부', 'D+60 설문 발송일', 'D+60 만족도 발송일'],
      responseHeader: 'D+60 설문 완료',
      responseHeaderCandidates: ['D+60 설문 완료', 'D+60 설문 응답여부', 'D+60 만족도 응답여부'],
    },
    {
      key: 'D90',
      label: 'D+90',
      dayOffset: 90,
      templateKeys: ['설문3차', 'D90', 'D+90', '온보딩만족도_D90', '만족도_D90', '입사3개월차', '입사 3개월차'],
      dueHeader: 'D+90 예정일',
      dueHeaderCandidates: ['D+90 예정일', 'D+90 설문 예정일', 'D90 예정일'],
      sentHeader: 'D+90 설문 발송여부',
      sentHeaderCandidates: ['D+90 설문 발송여부', 'D+90 설문 발송일', 'D+90 만족도 발송일'],
      responseHeader: 'D+90 설문 완료',
      responseHeaderCandidates: ['D+90 설문 완료', 'D+90 설문 응답여부', 'D+90 만족도 응답여부'],
    },
  ],
};

/******************************************************
 * 1. 실제 발송
 ******************************************************/
function runOnboardingSurveyAutomation() {
  return OnboardingSurvey_run_(new Date(), false);
}

/******************************************************
 * 2. 미리보기
 ******************************************************/
function previewOnboardingSurveyAutomation() {
  return OnboardingSurvey_run_(new Date(), true);
}

/******************************************************
 * 3. 특정 날짜 기준 미리보기
 * 예: previewOnboardingSurveyAutomationForDate('2026-05-20')
 ******************************************************/
function previewOnboardingSurveyAutomationForDate(dateText) {
  return OnboardingSurvey_run_(dateText || new Date(), true);
}

/******************************************************
 * 4. 구조 점검
 * - 현재 구조 기준 필수 컬럼 확인
 * - 새 컬럼 생성하지 않음
 * - D+30/D+60/D+90 예정일이 비어 있으면 입사일 기준으로만 보정
 ******************************************************/
function setupOnboardingSurveyColumnsOnce() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(ONBOARDING_SURVEY_CFG.MAIN_SHEET);

  if (!sh) throw new Error('시트 없음: ' + ONBOARDING_SURVEY_CFG.MAIN_SHEET);

  const headerMap = OnboardingSurvey_getHeaderMap_(sh);

  const requiredHeaderGroups = [
    { label: '순번', candidates: ['번호', '순서'] },
    { label: '사번', candidates: ['사번'] },
    { label: '성명', candidates: ['성명'] },
    { label: '이메일', candidates: ['이메일', '메일', 'Email', 'email'] },
    { label: '입사일', candidates: ['입사일'] },
    { label: '퇴사·휴직 체크', candidates: ['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크'] },
    { label: 'D+3 설문 발송여부', candidates: ['D+3 설문 발송여부', 'D+3 발송여부', 'D+3 설문 발송일', 'D+3 발송일'] },
    { label: 'D+3 설문 완료', candidates: ['D+3 설문 완료', 'D+3 응답여부', 'D+3 응답완료', 'D+3 설문 응답여부'] },
    { label: 'D+7 설문 발송여부', candidates: ['D+7 설문 발송여부', 'D+7 발송여부', 'D+7 설문 발송일', 'D+7 발송일'] },
    { label: 'D+7 설문 완료', candidates: ['D+7 설문 완료', 'D+7 응답여부', 'D+7 응답완료', 'D+7 설문 응답여부'] },
    { label: 'D+30 예정일', candidates: ['D+30 예정일', 'D+30 설문 예정일', 'D30 예정일'] },
    { label: 'D+30 발송여부', candidates: ['D+30 발송여부', 'D+30 미션 발송여부', 'D+30 발송일'] },
    { label: 'D+30 설문 발송여부', candidates: ['D+30 설문 발송여부', 'D+30 설문 발송일', 'D+30 만족도 발송일'] },
    { label: 'D+30 평가 완료', candidates: ['D+30 평가 완료', 'D+30 응답완료', 'D+30 완료', 'D+30 평가완료'] },
    { label: 'D+30 설문 완료', candidates: ['D+30 설문 완료', 'D+30 설문 응답여부', 'D+30 만족도 응답여부'] },
    { label: 'D+60 예정일', candidates: ['D+60 예정일', 'D+60 설문 예정일', 'D60 예정일'] },
    { label: 'D+60 설문 발송여부', candidates: ['D+60 설문 발송여부', 'D+60 설문 발송일', 'D+60 만족도 발송일'] },
    { label: 'D+60 설문 완료', candidates: ['D+60 설문 완료', 'D+60 설문 응답여부', 'D+60 만족도 응답여부'] },
    { label: 'D+90 예정일', candidates: ['D+90 예정일', 'D+90 설문 예정일', 'D90 예정일'] },
    { label: 'D+90 설문 발송여부', candidates: ['D+90 설문 발송여부', 'D+90 설문 발송일', 'D+90 만족도 발송일'] },
    { label: 'D+90 설문 완료', candidates: ['D+90 설문 완료', 'D+90 설문 응답여부', 'D+90 만족도 응답여부'] },
  ];

  requiredHeaderGroups.forEach(function(group) {
    if (OnboardingSurvey_firstHeaderIndex_(headerMap, group.candidates) < 0) {
      throw new Error('온보딩 대상자 필수 헤더 없음: ' + group.label + ' / 후보: ' + group.candidates.join(', '));
    }
  });

  OnboardingSurvey_fillDueDates_(sh);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '온보딩 만족도 설문 구조 점검 완료',
    '02_온보딩만족도설문발송',
    5
  );
}

/******************************************************
 * 5. 메인 실행 로직
 ******************************************************/
function OnboardingSurvey_run_(runDate, isPreview) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(20000)) {
    Logger.log('[SURVEY][SKIP] 다른 실행이 진행 중이라 종료');
    return;
  }

  const stats = {
    preview: !!isPreview,
    runDate: '',
    scanned: 0,
    activeTargets: 0,
    initialCandidates: 0,
    reminderCandidates: 0,
    sent: 0,
    reminded: 0,
    failed: 0,
    skipped: 0,
    launchSkipped: 0,
    d30StageSkipped: 0,
    initialOverdueSkipped: 0,
    responseSynced: 0,
    closedSkipped: 0,
    details: [],
  };

  const notifySummary = {
    sent: [],
    reminded: [],
    failed: [],
    errors: [],
  };

  try {
    const today = OnboardingSurvey_parseDateOnly_(runDate || new Date());

    if (!today) {
      Logger.log('[SURVEY][FAIL] 실행일 파싱 실패');
      return stats;
    }

    stats.runDate = OnboardingSurvey_formatDate_(today);

    if (!OnboardingSurvey_isBusinessDay_(today)) {
      Logger.log('[SURVEY][SKIP] 주말 실행 제외 / ' + JSON.stringify(stats));
      return stats;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mainSh = ss.getSheetByName(ONBOARDING_SURVEY_CFG.MAIN_SHEET);
    const templateSh = ss.getSheetByName(ONBOARDING_SURVEY_CFG.TEMPLATE_SHEET);

    if (!mainSh) throw new Error('시트 없음: ' + ONBOARDING_SURVEY_CFG.MAIN_SHEET);
    if (!templateSh) throw new Error('시트 없음: ' + ONBOARDING_SURVEY_CFG.TEMPLATE_SHEET);

    if (!isPreview) {
      setupOnboardingSurveyColumnsOnce();
    }

    const templates = OnboardingSurvey_getTemplates_(templateSh);
    const activeIndex = OnboardingSurvey_buildActiveEmployeeIndex_();

    if (!activeIndex.loaded) {
      throw new Error(activeIndex.error || '직원 마스터 확인 실패');
    }

    // 설문 완료 열은 시트 수식이 관리한다. Apps Script에서 직접 쓰지 않는다.
    stats.responseSynced = isPreview ? 0 : OnboardingSurvey_syncResponsesFromIntegrated_(mainSh);

    const mainValues = mainSh.getDataRange().getValues();
    const headerMap = OnboardingSurvey_getHeaderMap_(mainSh);
    const logRows = [];

    for (let r = 1; r < mainValues.length; r++) {
      const row = mainValues[r];

      const empId = OnboardingSurvey_getByHeader_(row, headerMap, '사번');
      const name = OnboardingSurvey_getByHeader_(row, headerMap, '성명');
      const email = OnboardingSurvey_getByHeader_(row, headerMap, '이메일');

      if (!empId && !name && !email) continue;

      stats.scanned++;

      if (OnboardingSurvey_isClosedRow_(row, headerMap)) {
        stats.closedSkipped++;
        continue;
      }

      const activeCheck = OnboardingSurvey_isActiveEmployee_(activeIndex, empId, email, name);
      if (!activeCheck.ok) {
        stats.skipped++;
        continue;
      }

      if (!email) {
        stats.skipped++;
        continue;
      }

      stats.activeTargets++;

      for (let i = 0; i < ONBOARDING_SURVEY_CFG.STAGES.length; i++) {
        const stage = ONBOARDING_SURVEY_CFG.STAGES[i];

        // D+3/D+7은 이미 D+30 미션/설문/평가 단계에 진입한 사람에게 발송하지 않는다.
        if (
          (stage.key === 'D3' || stage.key === 'D7') &&
          OnboardingSurvey_hasStartedD30Stage_(row, headerMap)
        ) {
          stats.d30StageSkipped++;
          continue;
        }

        const dueDate = OnboardingSurvey_getDueDate_(row, headerMap, stage);
        if (!dueDate) continue;

        if (dueDate.getTime() > today.getTime()) continue;

        if (OnboardingSurvey_isBeforeSurveyLaunch_(dueDate)) {
          stats.launchSkipped++;
          continue;
        }

        const sentCol = OnboardingSurvey_firstHeaderIndex_(
          headerMap,
          stage.sentHeaderCandidates.concat([stage.sentHeader])
        );

        const responseCol = OnboardingSurvey_firstHeaderIndex_(
          headerMap,
          stage.responseHeaderCandidates.concat([stage.responseHeader])
        );

        if (sentCol < 0 || responseCol < 0) {
          const reason = '필수 컬럼 없음: ' + stage.sentHeader + ' / ' + stage.responseHeader;

          stats.failed++;
          notifySummary.failed.push((name || email || empId || '대상자') + ' ' + stage.label + ' / ' + reason);

          logRows.push(OnboardingSurvey_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: email,
            round: stage.label,
            dueDate: OnboardingSurvey_formatDate_(dueDate),
            reason: reason,
          }));

          continue;
        }

        const sentVal = String(row[sentCol] || '').trim();
        const responseVal = String(row[responseCol] || '').trim();

        if (OnboardingSurvey_isDone_(responseVal)) {
          continue;
        }

        let isInitialSend = false;
        let isReminder = false;

        if (!OnboardingSurvey_isSendDone_(sentVal)) {
          isInitialSend =
            OnboardingSurvey_canInitialSendByDueDate_(dueDate, today) ||
            sentVal === ONBOARDING_SURVEY_CFG.SEND_FAILED;

          if (!isInitialSend) {
            stats.initialOverdueSkipped++;
            continue;
          }
        } else {
          isReminder =
            OnboardingSurvey_daysBetween_(dueDate, today) >=
            ONBOARDING_SURVEY_CFG.REMINDER_START_AFTER_DAYS;
        }

        if (!isInitialSend && !isReminder) continue;

        const template = OnboardingSurvey_getTemplateForStage_(templates, stage);

        if (!template) {
          const reason = '메일 템플릿 없음: ' + stage.templateKeys.join(' / ');

          stats.failed++;
          notifySummary.failed.push((name || email || empId || '대상자') + ' ' + stage.label + ' / ' + reason);

          logRows.push(OnboardingSurvey_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: email,
            round: stage.label,
            dueDate: OnboardingSurvey_formatDate_(dueDate),
            reason: reason,
          }));

          if (!isPreview) {
            mainSh.getRange(r + 1, sentCol + 1).setValue(ONBOARDING_SURVEY_CFG.SEND_FAILED);
          }

          continue;
        }

        const formUrl = OnboardingSurvey_getFormUrl_(template, stage);

        if (!formUrl) {
          const reason = '설문 링크 없음: ' + stage.key;

          stats.failed++;
          notifySummary.failed.push((name || email || empId || '대상자') + ' ' + stage.label + ' / ' + reason);

          logRows.push(OnboardingSurvey_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: email,
            round: stage.label,
            dueDate: OnboardingSurvey_formatDate_(dueDate),
            reason: reason,
          }));

          if (!isPreview) {
            mainSh.getRange(r + 1, sentCol + 1).setValue(ONBOARDING_SURVEY_CFG.SEND_FAILED);
          }

          continue;
        }

        const fields = OnboardingSurvey_buildFields_(row, headerMap, stage, dueDate, formUrl);

        let subject = OnboardingSurvey_fill_(template.subject, fields);
        let htmlBody = OnboardingSurvey_fill_(template.body, fields);

        if (isReminder) {
          subject = '[리마인드] ' + subject;
          htmlBody = OnboardingSurvey_buildReminderBody_(stage, name, formUrl, dueDate, htmlBody);
        } else {
          htmlBody = OnboardingSurvey_toHtmlBody_(htmlBody, formUrl);
        }

        const item = {
          rowNo: r + 1,
          empId: empId,
          name: name,
          email: email,
          round: stage.key,
          roundLabel: stage.label,
          dueDate: OnboardingSurvey_formatDate_(dueDate),
          sentValue: sentVal,
          responseValue: responseVal,
          type: isInitialSend ? 'INITIAL' : 'REMINDER',
          subject: subject,
        };

        stats.details.push(item);

        if (isInitialSend) {
          stats.initialCandidates++;
        } else {
          stats.reminderCandidates++;
        }

        if (isPreview) {
          Logger.log('[SURVEY][PREVIEW] ' + JSON.stringify(item));
          continue;
        }

        try {
          GmailApp.sendEmail(email, subject, '', {
            htmlBody: htmlBody,
            name: 'LWC HR팀',
          });

          // 발송여부 열만 쓴다. 설문 완료 열은 절대 쓰지 않는다.
          mainSh.getRange(r + 1, sentCol + 1).setValue(ONBOARDING_SURVEY_CFG.SEND_DONE);

          if (isInitialSend) {
            stats.sent++;
            notifySummary.sent.push((name || email || empId || '대상자') + ' ' + stage.label);
          } else {
            stats.reminded++;
            notifySummary.reminded.push((name || email || empId || '대상자') + ' ' + stage.label);
          }

          logRows.push(OnboardingSurvey_buildLogRow_({
            result: isInitialSend ? '발송성공' : '리마인드성공',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: email,
            round: stage.label,
            dueDate: OnboardingSurvey_formatDate_(dueDate),
            reason: isInitialSend ? '만족도 설문 발송' : '미응답 리마인드 발송',
          }));

          Logger.log('[SURVEY][SENT] ' + JSON.stringify(item));

        } catch (e) {
          stats.failed++;
          notifySummary.failed.push((name || email || empId || '대상자') + ' ' + stage.label + ' / ' + e.message);

          mainSh.getRange(r + 1, sentCol + 1).setValue(ONBOARDING_SURVEY_CFG.SEND_FAILED);

          logRows.push(OnboardingSurvey_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: email,
            round: stage.label,
            dueDate: OnboardingSurvey_formatDate_(dueDate),
            reason: e.message,
          }));

          Logger.log('[SURVEY][FAIL] ' + JSON.stringify(item) + ' / ' + e.message);
        }
      }
    }

    if (logRows.length > 0 && !isPreview) {
      OnboardingSurvey_appendLogs_(logRows);
    }

    if (!isPreview && typeof OpsNotify_surveyResult === 'function') {
      OpsNotify_surveyResult(notifySummary);
    }

    Logger.log('[SURVEY][RESULT] ' + JSON.stringify(stats));
    return stats;

  } catch (e) {
    Logger.log('[SURVEY][ERROR] ' + (e && e.stack ? e.stack : e));

    if (!isPreview && typeof OpsNotify_surveyResult === 'function') {
      notifySummary.errors.push('시스템 설문 / ' + (e && e.message ? e.message : e));
      OpsNotify_surveyResult(notifySummary);
    }

    throw e;

  } finally {
    lock.releaseLock();
  }
}

/******************************************************
 * 6. 설문 완료 동기화
 * - 현재 설문 완료 열은 시트 수식이 담당한다.
 * - Apps Script에서 D+3/D+7/D+30/D+60/D+90 설문 완료 열에 직접 쓰지 않는다.
 ******************************************************/
function OnboardingSurvey_syncResponsesFromIntegrated_(mainSh) {
  Logger.log('[SURVEY][RESPONSE][SKIP] 설문 완료 열은 시트 수식으로 자동 반영. Apps Script 직접 쓰기 없음.');
  return 0;
}

/******************************************************
 * 7. D+30 단계 진입 여부
 * - D+3/D+7을 뒤늦게 보내지 않기 위한 차단 조건
 ******************************************************/
function OnboardingSurvey_hasStartedD30Stage_(row, headerMap) {
  const d30MissionSent = OnboardingSurvey_getByHeader_(row, headerMap, 'D+30 발송여부');
  const d30SurveySent = OnboardingSurvey_getByHeader_(row, headerMap, 'D+30 설문 발송여부');
  const d30EvalDone = OnboardingSurvey_getByHeader_(row, headerMap, 'D+30 평가 완료');
  const d30SurveyDone = OnboardingSurvey_getByHeader_(row, headerMap, 'D+30 설문 완료');

  if (OnboardingSurvey_isSendDone_(d30MissionSent)) return true;
  if (OnboardingSurvey_isSendDone_(d30SurveySent)) return true;
  if (OnboardingSurvey_isDone_(d30SurveyDone)) return true;

  const evalDoneValues = [
    '완료',
    '합격',
    '연장',
    '불합격',
    '부적합',
    '전환완료',
    '전환 완료',
  ];

  if (evalDoneValues.indexOf(String(d30EvalDone || '').trim()) >= 0) return true;

  return false;
}

/******************************************************
 * 8. 템플릿 읽기
 ******************************************************/
function OnboardingSurvey_getTemplates_(templateSh) {
  const values = templateSh.getDataRange().getValues();
  const headerMap = OnboardingSurvey_getHeaderMap_(templateSh);

  const keyCol = headerMap['구분'];
  const subjectCol = headerMap['제목 템플릿'];
  const bodyCol = headerMap['본문 템플릿'];
  const linkCol = headerMap['설문 링크'];

  if (keyCol === undefined || subjectCol === undefined || bodyCol === undefined) {
    throw new Error('메일 템플릿 헤더 없음: 구분 / 제목 템플릿 / 본문 템플릿');
  }

  const templates = {};

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const key = String(row[keyCol] || '').trim();

    if (!key) continue;

    templates[key] = {
      key: key,
      subject: String(row[subjectCol] || ''),
      body: String(row[bodyCol] || ''),
      link: linkCol !== undefined ? String(row[linkCol] || '').trim() : '',
    };
  }

  return templates;
}

function OnboardingSurvey_getTemplateForStage_(templates, stage) {
  for (let i = 0; i < stage.templateKeys.length; i++) {
    const key = stage.templateKeys[i];

    if (templates[key]) {
      return templates[key];
    }
  }

  return null;
}

function OnboardingSurvey_getFormUrl_(template, stage) {
  if (template && template.link) return template.link;

  if (typeof CFG !== 'undefined' && CFG.SURVEY_URLS && CFG.SURVEY_URLS[stage.key]) {
    return CFG.SURVEY_URLS[stage.key];
  }

  return '';
}

/******************************************************
 * 9. 템플릿 치환 필드
 ******************************************************/
function OnboardingSurvey_buildFields_(row, headerMap, stage, dueDate, formUrl) {
  const name = OnboardingSurvey_getByHeader_(row, headerMap, '성명');
  const hq = OnboardingSurvey_getByHeader_(row, headerMap, '본부');
  const team = OnboardingSurvey_getByHeader_(row, headerMap, '팀');
  const leader = OnboardingSurvey_getByAnyHeader_(row, headerMap, ['온보딩 리더', '부서장', '리더']);
  const joinDate = OnboardingSurvey_parseDateOnly_(OnboardingSurvey_getByHeader_(row, headerMap, '입사일'));

  return {
    '성명': name,
    '이름': name,
    '본부': hq,
    '팀': team,
    '부서장': leader,
    '리더': leader,
    '입사일': joinDate ? OnboardingSurvey_formatDate_(joinDate) : '',
    '설문일': dueDate ? OnboardingSurvey_formatDate_(dueDate) : '',
    '예정일': dueDate ? OnboardingSurvey_formatDate_(dueDate) : '',
    '차수': stage.label,
    '구간': stage.label,
    '설문링크': formUrl,
    '설문 링크': formUrl,
  };
}

function OnboardingSurvey_fill_(template, fields) {
  let text = String(template || '');

  Object.keys(fields).forEach(function(key) {
    const value = fields[key] === null || fields[key] === undefined ? '' : String(fields[key]);
    text = text.split('{' + key + '}').join(value);
  });

  return text;
}

/******************************************************
 * 10. 메일 HTML 처리
 ******************************************************/
function OnboardingSurvey_toHtmlBody_(body, formUrl) {
  const text = String(body || '');

  if (text.indexOf('<html') >= 0 || text.indexOf('<table') >= 0 || text.indexOf('<div') >= 0) {
    return text
      .replace('{설문링크}', formUrl || '')
      .replace('{설문 링크}', formUrl || '');
  }

  return text
    .split('\n')
    .join('<br>')
    .replace('{설문링크}', formUrl || '')
    .replace('{설문 링크}', formUrl || '');
}

function OnboardingSurvey_buildReminderBody_(stage, name, formUrl, dueDate, originalHtml) {
  const dueText = dueDate ? OnboardingSurvey_formatDate_(dueDate) : '';

  return [
    '<div style="font-family:Arial,Apple SD Gothic Neo,Noto Sans KR,sans-serif; line-height:1.7; color:#222; max-width:680px;">',
    '<div style="border-top:6px solid #114e48; padding-top:24px;">',
    '<h2 style="margin:0 0 18px 0; font-size:21px; color:#114e48;">',
    stage.label + ' 온보딩 설문 리마인드',
    '</h2>',
    '<p style="font-size:15px; margin:0 0 14px 0;">',
    '<strong>' + OnboardingSurvey_escapeHtml_(name) + '</strong>님, 안녕하세요.',
    '</p>',
    '<p style="font-size:15px; margin:0 0 18px 0;">',
    stage.label + ' 온보딩 만족도·적응 체크 설문 응답이 아직 확인되지 않았습니다.<br>',
    '이 설문은 평가가 아니라, 더 수월하게 적응하실 수 있도록 함께 확인하기 위한 절차입니다.',
    '</p>',
    '<div style="margin:22px 0; padding:16px 18px; background:#f6f8f7; border-left:4px solid #114e48;">',
    '<div style="font-weight:bold; margin-bottom:6px; color:#114e48;">설문 안내</div>',
    '<div style="font-size:14px;">',
    '· 기준 예정일: ' + dueText + '<br>',
    '· 소요 시간: 약 3분<br>',
    '· 응답이 완료되면 리마인드는 중단됩니다.',
    '</div>',
    '</div>',
    '<div style="margin:26px 0;">',
    '<a href="' + formUrl + '" style="display:inline-block; background:#114e48; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:6px; font-size:15px; font-weight:bold;">',
    '지금 설문 작성하기',
    '</a>',
    '</div>',
    '<div style="font-size:12px; color:#666; border-top:1px solid #ddd; padding-top:14px;">',
    '버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣어 주세요.<br>',
    '<span style="color:#224289;">' + formUrl + '</span>',
    '</div>',
    '</div>',
    '</div>',
  ].join('');
}

function OnboardingSurvey_escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/******************************************************
 * 11. 예정일 계산/컬럼 보정
 ******************************************************/
function OnboardingSurvey_fillDueDates_(mainSh) {
  const values = mainSh.getDataRange().getValues();
  const headerMap = OnboardingSurvey_getHeaderMap_(mainSh);

  const joinCol = headerMap['입사일'];

  if (joinCol === undefined) {
    throw new Error('입사일 컬럼 없음');
  }

  const dueStages = ONBOARDING_SURVEY_CFG.STAGES.filter(function(stage) {
    return stage.dueHeader;
  });

  dueStages.forEach(function(stage) {
    const dueCol = OnboardingSurvey_firstHeaderIndex_(
      headerMap,
      stage.dueHeaderCandidates.concat([stage.dueHeader])
    );

    if (dueCol < 0) {
      throw new Error('예정일 컬럼 없음: ' + stage.dueHeader);
    }

    for (let r = 1; r < values.length; r++) {
      const current = values[r][dueCol];
      if (current) continue;

      const joinDate = OnboardingSurvey_parseDateOnly_(values[r][joinCol]);
      if (!joinDate) continue;

      const due = new Date(joinDate);
      due.setDate(due.getDate() + stage.dayOffset);
      due.setHours(0, 0, 0, 0);

      mainSh.getRange(r + 1, dueCol + 1).setValue(due);
    }
  });
}

function OnboardingSurvey_getDueDate_(row, headerMap, stage) {
  const dueIdx = stage.dueHeaderCandidates && stage.dueHeaderCandidates.length > 0
    ? OnboardingSurvey_firstHeaderIndex_(headerMap, stage.dueHeaderCandidates.concat([stage.dueHeader]))
    : -1;

  if (dueIdx >= 0) {
    const due = OnboardingSurvey_parseDateOnly_(row[dueIdx]);
    if (due) return due;
  }

  const joinIdx = headerMap['입사일'];
  if (joinIdx === undefined) return null;

  const joinDate = OnboardingSurvey_parseDateOnly_(row[joinIdx]);
  if (!joinDate) return null;

  const due = new Date(joinDate);
  due.setDate(due.getDate() + stage.dayOffset);
  due.setHours(0, 0, 0, 0);

  return due;
}

/******************************************************
 * 12. 직원 마스터 기준 재직자 인덱스
 ******************************************************/
function OnboardingSurvey_buildActiveEmployeeIndex_() {
  const index = {
    loaded: false,
    error: '',
    byEmpId: {},
    byEmail: {},
    byName: {},
    statusByEmpId: {},
    statusByEmail: {},
    statusByName: {},
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSh = OnboardingSurvey_findSheetByNames_(
    ss,
    ONBOARDING_SURVEY_CFG.EMP_MASTER_SHEET_CANDIDATES
  );

  if (!masterSh) {
    index.error = '직원 마스터 탭 없음';
    return index;
  }

  const values = masterSh.getDataRange().getValues();

  if (values.length < 2) {
    index.error = '직원 마스터 데이터 없음';
    return index;
  }

  const headerMap = OnboardingSurvey_getHeaderMap_(masterSh);

  const empIdCol = OnboardingSurvey_firstHeaderIndex_(headerMap, ['사번', 'employee_id', 'EMP_ID']);
  const emailCol = OnboardingSurvey_firstHeaderIndex_(headerMap, ['이메일', '메일', 'Email', 'email']);
  const nameCol = OnboardingSurvey_firstHeaderIndex_(headerMap, ['성명', '이름', 'name']);
  const statusCol = OnboardingSurvey_firstHeaderIndex_(headerMap, ['재직구분', '재직 구분', '상태', '근무상태']);

  if (empIdCol < 0 && emailCol < 0 && nameCol < 0) {
    index.error = '직원 마스터 사번/이메일/성명 컬럼 없음';
    return index;
  }

  if (statusCol < 0) {
    index.error = '직원 마스터 재직구분 컬럼 없음';
    return index;
  }

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const status = String(row[statusCol] || '').trim();
    const empId = empIdCol >= 0 ? OnboardingSurvey_normalizeEmpId_(row[empIdCol]) : '';
    const email = emailCol >= 0 ? OnboardingSurvey_normalizeEmail_(row[emailCol]) : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';

    if (empId) index.statusByEmpId[empId] = status;
    if (email) index.statusByEmail[email] = status;
    if (name) index.statusByName[name] = status;

    if (ONBOARDING_SURVEY_CFG.ACTIVE_EMPLOYEE_STATUSES.indexOf(status) < 0) continue;

    if (empId) index.byEmpId[empId] = true;
    if (email) index.byEmail[email] = true;
    if (name) index.byName[name] = true;
  }

  index.loaded = true;

  Logger.log(
    '[SURVEY][MASTER] 직원 마스터 로드 완료 / 탭=' +
    masterSh.getName() +
    ' / 사번=' +
    Object.keys(index.byEmpId).length +
    ' / 이메일=' +
    Object.keys(index.byEmail).length
  );

  return index;
}

function OnboardingSurvey_isActiveEmployee_(activeIndex, empId, email, name) {
  if (!activeIndex || !activeIndex.loaded) {
    return {
      ok: false,
      reason: '직원 마스터 확인 실패',
    };
  }

  const cleanEmpId = OnboardingSurvey_normalizeEmpId_(empId);
  const cleanEmail = OnboardingSurvey_normalizeEmail_(email);
  const cleanName = String(name || '').trim();

  const existsByEmpId = cleanEmpId && activeIndex.byEmpId[cleanEmpId];
  const existsByEmail = cleanEmail && activeIndex.byEmail[cleanEmail];
  const existsByName = cleanName && activeIndex.byName[cleanName];

  if (!existsByEmpId && !existsByEmail && !existsByName) {
    return {
      ok: false,
      reason: '직원 마스터 기준 재직자 아님',
    };
  }

  return {
    ok: true,
    reason: '',
  };
}

/******************************************************
 * 13. 완료 / 마감 판정
 ******************************************************/
function OnboardingSurvey_isDone_(value) {
  const status = String(value || '').trim();

  if (!status) return false;

  const doneValues = [
    '완료',
    '응답완료',
    '응답 완료',
    '제출완료',
    '제출 완료',
    'Y',
    'y',
  ];

  return doneValues.indexOf(status) >= 0;
}

function OnboardingSurvey_isSendDone_(value) {
  return String(value || '').trim() === ONBOARDING_SURVEY_CFG.SEND_DONE;
}

function OnboardingSurvey_isClosedRow_(row, headerMap) {
  const note = OnboardingSurvey_getByAnyHeader_(row, headerMap, ['비고', '메모']);
  const closeCheck = OnboardingSurvey_getByAnyHeader_(row, headerMap, ['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크']);
  const d90Eval = OnboardingSurvey_getByHeader_(row, headerMap, 'D+90 평가 완료');

  if (ONBOARDING_SURVEY_CFG.CLOSED_EMPLOYEE_STATUS_REGEX.test(note)) return true;
  if (ONBOARDING_SURVEY_CFG.CLOSED_EMPLOYEE_STATUS_REGEX.test(closeCheck)) return true;

  const closedEvalValues = ['합격', '연장', '불합격', '완료'];
  if (closedEvalValues.indexOf(String(d90Eval || '').trim()) >= 0) return true;

  return false;
}

/******************************************************
 * 14. 트리거 설치/제거/확인
 ******************************************************/
function installOnboardingSurveyTrigger() {
  const removeHandlers = [
    ONBOARDING_SURVEY_CFG.TRIGGER_HANDLER,
  ].concat(typeof AUTOMATION_LEGACY_TIME_HANDLERS_ !== 'undefined'
    ? AUTOMATION_LEGACY_TIME_HANDLERS_
    : ['runOnboardingAutomation', 'sendSurveyBySchedule']);

  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = trigger.getHandlerFunction();

    if (removeHandlers.indexOf(fn) >= 0) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  ScriptApp.newTrigger(ONBOARDING_SURVEY_CFG.TRIGGER_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(ONBOARDING_SURVEY_CFG.TRIGGER_HOUR)
    .create();

  Logger.log(
    '[SURVEY][TRIGGER] 설치 완료 / 삭제=' +
    deleted +
    ' / 매일 ' +
    ONBOARDING_SURVEY_CFG.TRIGGER_HOUR +
    '시'
  );

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '온보딩 만족도 설문 발송 트리거 설치 완료',
    '매일 ' + ONBOARDING_SURVEY_CFG.TRIGGER_HOUR + '시',
    5
  );
}

function removeOnboardingSurveyTrigger() {
  const handler = ONBOARDING_SURVEY_CFG.TRIGGER_HANDLER;
  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  Logger.log('[SURVEY][TRIGGER] 제거 완료 / 삭제=' + deleted);
}

function checkOnboardingSurveyTriggerStatus() {
  const handler = ONBOARDING_SURVEY_CFG.TRIGGER_HANDLER;

  const matched = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === handler;
  });

  Logger.log('[SURVEY][TRIGGER] ' + handler + ' / count=' + matched.length);

  return {
    ok: matched.length > 0,
    count: matched.length,
  };
}

/******************************************************
 * 15. 로그
 ******************************************************/
function OnboardingSurvey_appendLogs_(rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ONBOARDING_SURVEY_CFG.LOG_SHEET);

  if (!sh) {
    sh = ss.insertSheet(ONBOARDING_SURVEY_CFG.LOG_SHEET);
    sh.appendRow([
      '실행시각',
      '결과',
      '행번호',
      '사번',
      '성명',
      '수신자',
      '구간',
      '기준일',
      '사유',
    ]);
  }

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function OnboardingSurvey_buildLogRow_(payload) {
  return [
    new Date(),
    payload.result || '',
    payload.rowNo || '',
    payload.empId || '',
    payload.name || '',
    payload.email || '',
    payload.round || '',
    payload.dueDate || '',
    payload.reason || '',
  ];
}

/******************************************************
 * 16. QA 함수
 * - 실제 발송 없음
 * - 현재 preview 후보를 로그로 확인
 ******************************************************/
function QA_checkSurveyPreview(dateText) {
  const targetDate = dateText || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const result = previewOnboardingSurveyAutomationForDate(targetDate);
  const details = result && result.details ? result.details : [];

  const d3d7Candidates = details.filter(function(item) {
    return item.round === 'D3' || item.round === 'D7';
  });

  Logger.log(JSON.stringify({
    runDate: targetDate,
    totalCandidates: details.length,
    d3d7CandidateCount: d3d7Candidates.length,
    d3d7Candidates: d3d7Candidates,
    allCandidates: details,
    stats: {
      scanned: result.scanned,
      activeTargets: result.activeTargets,
      initialCandidates: result.initialCandidates,
      reminderCandidates: result.reminderCandidates,
      launchSkipped: result.launchSkipped,
      d30StageSkipped: result.d30StageSkipped,
      initialOverdueSkipped: result.initialOverdueSkipped,
      closedSkipped: result.closedSkipped,
      skipped: result.skipped,
      failed: result.failed,
    },
  }, null, 2));

  return result;
}

/******************************************************
 * 17. 공통 유틸
 ******************************************************/
function OnboardingSurvey_getHeaderMap_(sheet) {
  const lastCol = sheet.getLastColumn();

  if (lastCol < 1) throw new Error('헤더 없음: ' + sheet.getName());

  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const map = {};

  headers.forEach(function(header, idx) {
    const key = String(header || '').trim();
    if (key) map[key] = idx;
  });

  return map;
}

function OnboardingSurvey_getByHeader_(row, headerMap, headerName) {
  const idx = headerMap[headerName];

  if (idx === undefined || idx < 0) return '';

  return String(row[idx] || '').trim();
}

function OnboardingSurvey_getByAnyHeader_(row, headerMap, candidates) {
  const idx = OnboardingSurvey_firstHeaderIndex_(headerMap, candidates);

  if (idx < 0) return '';

  return String(row[idx] || '').trim();
}

function OnboardingSurvey_firstHeaderIndex_(headerMap, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const name = candidates[i];

    if (Object.prototype.hasOwnProperty.call(headerMap, name)) {
      return headerMap[name];
    }
  }

  return -1;
}

function OnboardingSurvey_findSheetByNames_(ss, names) {
  for (let i = 0; i < names.length; i++) {
    const sh = ss.getSheetByName(names[i]);

    if (sh) return sh;
  }

  return null;
}

function OnboardingSurvey_parseDateOnly_(value) {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return null;

    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
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
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(text);

  if (isNaN(fallback.getTime())) return null;

  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function OnboardingSurvey_formatDate_(date) {
  if (!date) return '';

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function OnboardingSurvey_daysBetween_(fromDate, toDate) {
  const from = OnboardingSurvey_parseDateOnly_(fromDate);
  const to = OnboardingSurvey_parseDateOnly_(toDate);

  if (!from || !to) return 0;

  const ms = to.getTime() - from.getTime();

  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function OnboardingSurvey_isBusinessDay_(date) {
  const d = OnboardingSurvey_parseDateOnly_(date);
  if (!d) return false;

  const day = d.getDay();

  return day !== 0 && day !== 6;
}

function OnboardingSurvey_isBeforeSurveyLaunch_(dueDate) {
  const due = OnboardingSurvey_parseDateOnly_(dueDate);
  const launch = OnboardingSurvey_parseDateOnly_(ONBOARDING_SURVEY_CFG.SURVEY_LAUNCH_DATE);

  if (!due || !launch) return true;

  return due.getTime() < launch.getTime();
}

function OnboardingSurvey_canInitialSendByDueDate_(dueDate, today) {
  const due = OnboardingSurvey_parseDateOnly_(dueDate);
  const run = OnboardingSurvey_parseDateOnly_(today);
  const launch = OnboardingSurvey_parseDateOnly_(ONBOARDING_SURVEY_CFG.SURVEY_LAUNCH_DATE);

  if (!due || !run || !launch) return false;

  if (due.getTime() < launch.getTime()) return false;
  if (due.getTime() > run.getTime()) return false;

  const overdueDays = OnboardingSurvey_daysBetween_(due, run);

  if (overdueDays === 0) return true;

  return overdueDays > 0 && overdueDays <= ONBOARDING_SURVEY_CFG.INITIAL_SEND_MAX_OVERDUE_DAYS;
}

function OnboardingSurvey_normalizeEmpId_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return '';

  return String(value).trim().replace(/\.0$/, '');
}

function OnboardingSurvey_normalizeEmail_(value) {
  if (value === null || value === undefined) return '';

  return String(value).trim().toLowerCase();
}
