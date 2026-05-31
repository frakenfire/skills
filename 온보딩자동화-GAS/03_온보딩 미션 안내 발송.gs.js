/******************************************************
 * 파일명: 03_온보딩미션안내발송.gs
 *
 * 역할:
 * - 온보딩 미션/수습평가 안내 메일 발송
 * - 시작안내 / 1차(D+30) / 2차(D+60) / 3차(D+90)
 * - 메일 템플릿 시트 기준 발송
 * - 직원 마스터 기준 재직/수습인 사람만 발송
 * - 평가 완료 전까지 리마인드 발송
 *
 * 현재 온보딩 대상자 시트 구조 기준:
 * - 시작 안내: L 시작 안내
 * - D+30: Q 예정일 / R 발송여부 / T 평가 완료
 * - D+60: V 예정일 / W 발송여부 / Y 평가 완료
 * - D+90: AA 예정일 / AB 발송여부 / AD 평가 완료
 *
 * 발송여부 값:
 * - 완료
 * - 발송 전
 * - 발송 실패
 *
 * 평가 완료 값:
 * - D+30 / D+60: 완료 / 미평가
 * - D+90: 합격 / 연장 / 불합격 / 완료 / 미평가
 *
 * 실행 함수:
 * - previewOnboardingMissionGuideAutomation()
 * - previewOnboardingMissionGuideAutomationForDate(dateText)
 * - runOnboardingMissionGuideAutomation()
 * - installOnboardingMissionGuideTrigger()
 * - removeOnboardingMissionGuideTrigger()
 * - checkOnboardingMissionGuideTriggerStatus()
 ******************************************************/

const MISSION_GUIDE_CFG = {
  MAIN_SHEET: '온보딩 대상자',
  TEMPLATE_SHEET: '메일 템플릿',
  LOG_SHEET: '온보딩미션_발송로그',

  EMP_MASTER_SHEET_CANDIDATES: [
    '직원 마스터 시트 (연동)',
    '직원 마스터 시트',
    '재직자명부',
    '직원명부',
    '직원 마스터',
  ],

  TRIGGER_HANDLER: 'runOnboardingMissionGuideAutomation',
  TRIGGER_HOUR: 9,

  MISSION_LAUNCH_DATE: '2026-05-19',

  INITIAL_SEND_MAX_OVERDUE_DAYS: 2,

  ACTIVE_EMPLOYEE_STATUSES: ['재직', '수습'],
  CLOSED_EMPLOYEE_STATUS_REGEX: /퇴사|퇴직|휴직/,

  SEND_DONE: '완료',
  SEND_READY: '발송 전',
  SEND_FAILED: '발송 실패',

  NOT_EVALUATED: '미평가',

  STAGES: [
    {
      key: 'START',
      label: '시작안내',
      templateKey: '시작안내',
      dueHeader: '입사일',
      sentHeader: '시작 안내',
      sentHeaderCandidates: ['시작 안내', '시작안내', '시작 안내 발송여부', '시작안내 발송여부'],
      completeHeader: '시작 안내',
      completeHeaderCandidates: ['시작 안내', '시작안내', '시작 안내 발송여부', '시작안내 발송여부'],
      mode: 'ONCE',
    },
    {
      key: 'D30',
      label: '1차',
      templateKey: '1차',
      dueHeader: 'D+30 예정일',
      dueHeaderCandidates: ['D+30 예정일', 'D+30 설문 예정일', 'D30 예정일'],
      sentHeader: 'D+30 발송여부',
      sentHeaderCandidates: ['D+30 발송여부', 'D+30 미션 발송여부', 'D+30 발송일'],
      completeHeader: 'D+30 평가 완료',
      completeHeaderCandidates: ['D+30 평가 완료', 'D+30 응답완료', 'D+30 완료', 'D+30 평가완료'],
      mode: 'DAILY_UNTIL_DONE',
    },
    {
      key: 'D60',
      label: '2차',
      templateKey: '2차',
      dueHeader: 'D+60 예정일',
      dueHeaderCandidates: ['D+60 예정일', 'D+60 설문 예정일', 'D60 예정일'],
      sentHeader: 'D+60 발송여부',
      sentHeaderCandidates: ['D+60 발송여부', 'D+60 미션 발송여부', 'D+60 발송일'],
      completeHeader: 'D+60 평가 완료',
      completeHeaderCandidates: ['D+60 평가 완료', 'D+60 응답완료', 'D+60 완료', 'D+60 평가완료'],
      mode: 'DAILY_UNTIL_DONE',
    },
    {
      key: 'D90',
      label: '3차',
      templateKey: '3차',
      dueHeader: 'D+90 예정일',
      dueHeaderCandidates: ['D+90 예정일', 'D+90 설문 예정일', 'D90 예정일'],
      sentHeader: 'D+90 발송여부',
      sentHeaderCandidates: ['D+90 발송여부', 'D+90 미션 발송여부', 'D+90 발송일'],
      completeHeader: 'D+90 평가 완료',
      completeHeaderCandidates: ['D+90 평가 완료', 'D+90 응답완료', 'D+90 완료', 'D+90 평가완료'],
      mode: 'DAILY_UNTIL_DONE',
    },
  ],
};

/******************************************************
 * 실제 발송
 ******************************************************/
function runOnboardingMissionGuideAutomation() {
  return Mission_run_(new Date(), false);
}

/******************************************************
 * 미리보기
 * - 실제 메일 발송 없음
 ******************************************************/
function previewOnboardingMissionGuideAutomation() {
  return Mission_run_(new Date(), true);
}

/******************************************************
 * 특정 날짜 기준 미리보기
 * 예: previewOnboardingMissionGuideAutomationForDate('2026-05-20')
 ******************************************************/
function previewOnboardingMissionGuideAutomationForDate(dateText) {
  return Mission_run_(dateText || new Date(), true);
}

/******************************************************
 * 메인 실행 로직
 ******************************************************/
function Mission_run_(runDate, isPreview) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(20000)) {
    Logger.log('[MISSION][SKIP] 다른 실행이 진행 중이라 종료');
    return;
  }

  const stats = {
    preview: !!isPreview,
    runDate: '',
    scanned: 0,
    activeTargets: 0,
    candidates: 0,
    initialCandidates: 0,
    reminderCandidates: 0,
    sent: 0,
    reminded: 0,
    failed: 0,
    skipped: 0,
    launchSkipped: 0,
    initialOverdueSkipped: 0,
    weekendSkipped: 0,
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
    const today = Mission_parseDateOnly_(runDate || new Date());

    if (!today) {
      Logger.log('[MISSION][FAIL] 실행일 파싱 실패');
      return stats;
    }

    stats.runDate = Mission_formatDate_(today);

    if (!Mission_isBusinessDay_(today)) {
      stats.weekendSkipped++;
      Logger.log('[MISSION][SKIP] 주말 실행 제외 / ' + JSON.stringify(stats));
      return stats;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mainSh = ss.getSheetByName(MISSION_GUIDE_CFG.MAIN_SHEET);
    const templateSh = ss.getSheetByName(MISSION_GUIDE_CFG.TEMPLATE_SHEET);

    if (!mainSh) throw new Error('시트 없음: ' + MISSION_GUIDE_CFG.MAIN_SHEET);
    if (!templateSh) throw new Error('시트 없음: ' + MISSION_GUIDE_CFG.TEMPLATE_SHEET);

    const mainValues = mainSh.getDataRange().getValues();

    if (mainValues.length < 2) {
      Logger.log('[MISSION] 온보딩 대상자 데이터 없음');
      return stats;
    }

    const mainHeaderMap = Mission_getHeaderMap_(mainSh);
    Mission_validateCurrentStructure_(mainHeaderMap);

    const templates = Mission_getTemplates_(templateSh);
    const activeIndex = Mission_buildActiveEmployeeIndex_();

    if (!activeIndex.loaded) {
      throw new Error(activeIndex.error || '직원 마스터 확인 실패');
    }

    const logRows = [];

    for (let r = 1; r < mainValues.length; r++) {
      const row = mainValues[r];

      const empId = Mission_getByHeader_(row, mainHeaderMap, '사번');
      const name = Mission_getByHeader_(row, mainHeaderMap, '성명');
      const email = Mission_getByHeader_(row, mainHeaderMap, '이메일');
      const leaderName = Mission_getByAnyHeader_(row, mainHeaderMap, ['온보딩 리더', '부서장', '리더']);
      const leaderEmail = Mission_getByAnyHeader_(row, mainHeaderMap, ['리더 이메일', '부서장 이메일', '온보딩 리더 이메일']);

      if (!empId && !name && !email) continue;

      stats.scanned++;

      if (Mission_isClosedRow_(row, mainHeaderMap)) {
        stats.closedSkipped++;
        continue;
      }

      const activeCheck = Mission_isActiveEmployee_(activeIndex, empId, email, name);
      if (!activeCheck.ok) {
        stats.skipped++;
        continue;
      }

      stats.activeTargets++;

      if (!leaderEmail) {
        const reason = '리더 이메일 없음';

        stats.failed++;
        notifySummary.failed.push((name || email || empId || '대상자') + ' 리더 / ' + reason);

        logRows.push(Mission_buildLogRow_({
          result: '실패',
          rowNo: r + 1,
          empId: empId,
          name: name,
          email: '',
          leaderEmail: '',
          stage: '',
          dueDate: '',
          reason: reason,
        }));

        continue;
      }

      for (let i = 0; i < MISSION_GUIDE_CFG.STAGES.length; i++) {
        const stage = MISSION_GUIDE_CFG.STAGES[i];

        const dueDate = Mission_getDueDate_(row, mainHeaderMap, stage);

        if (!dueDate) continue;

        if (dueDate.getTime() > today.getTime()) continue;

        if (Mission_isBeforeMissionLaunch_(dueDate)) {
          stats.launchSkipped++;
          continue;
        }

        const sentCol = Mission_firstHeader_(mainHeaderMap, stage.sentHeaderCandidates.concat([stage.sentHeader]));
        const completeCol = Mission_firstHeader_(mainHeaderMap, stage.completeHeaderCandidates.concat([stage.completeHeader]));

        if (sentCol < 0 || completeCol < 0) {
          const reason = '필수 컬럼 없음: ' + stage.sentHeader + ' / ' + stage.completeHeader;

          stats.failed++;
          notifySummary.failed.push((name || leaderEmail || empId || '대상자') + ' ' + stage.label + ' / ' + reason);

          logRows.push(Mission_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: leaderEmail,
            leaderEmail: leaderEmail,
            stage: stage.label,
            dueDate: Mission_formatDate_(dueDate),
            reason: reason,
          }));

          continue;
        }

        const sentVal = String(row[sentCol] || '').trim();
        const completeVal = String(row[completeCol] || '').trim();

        if (stage.mode === 'ONCE') {
          if (Mission_isSendDone_(sentVal)) continue;
        }

        if (stage.mode === 'DAILY_UNTIL_DONE') {
          if (Mission_isDone_(completeVal)) continue;
        }

        let isInitialSend = false;
        let isReminderSend = false;

        if (!Mission_isSendDone_(sentVal)) {
          isInitialSend = Mission_canInitialSendByDueDate_(dueDate, today) || sentVal === MISSION_GUIDE_CFG.SEND_FAILED;

          if (!isInitialSend) {
            stats.initialOverdueSkipped++;
            continue;
          }
        } else {
          isReminderSend = stage.mode === 'DAILY_UNTIL_DONE';

          // 리마인드는 중복 방지를 위해 설정된 시간(기본 오전 9시)에만 발송
          if (isReminderSend && runDate.getHours() !== MISSION_GUIDE_CFG.TRIGGER_HOUR) {
            continue;
          }
        }

        if (!isInitialSend && !isReminderSend) continue;

        const template = templates[stage.templateKey];

        if (!template) {
          const reason = '메일 템플릿 없음: ' + stage.templateKey;

          stats.failed++;
          notifySummary.failed.push((name || leaderEmail || empId || '대상자') + ' ' + stage.label + ' / ' + reason);

          logRows.push(Mission_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: leaderEmail,
            leaderEmail: leaderEmail,
            stage: stage.label,
            dueDate: Mission_formatDate_(dueDate),
            reason: reason,
          }));

          if (!isPreview) {
            mainSh.getRange(r + 1, sentCol + 1).setValue(MISSION_GUIDE_CFG.SEND_FAILED);
          }

          continue;
        }

        const fields = Mission_buildFields_(row, mainHeaderMap, stage, dueDate);

        const subject = isReminderSend
          ? '[리마인드] ' + Mission_fill_(template.subject, fields)
          : Mission_fill_(template.subject, fields);

        const htmlBody = Mission_fill_(template.body, fields);

        const item = {
          rowNo: r + 1,
          empId: empId,
          name: name,
          leaderName: leaderName,
          leaderEmail: leaderEmail,
          stage: stage.label,
          dueDate: Mission_formatDate_(dueDate),
          sentValue: sentVal,
          completeValue: completeVal,
          type: isReminderSend ? 'REMINDER' : 'INITIAL',
          subject: subject,
        };

        stats.candidates++;
        stats.details.push(item);

        if (isInitialSend) {
          stats.initialCandidates++;
        } else {
          stats.reminderCandidates++;
        }

        if (isPreview) {
          Logger.log('[MISSION][PREVIEW] ' + JSON.stringify(item));
          continue;
        }

        try {
          GmailApp.sendEmail(leaderEmail, subject, '', {
            htmlBody: htmlBody,
            name: 'LWC HR팀',
          });

          mainSh.getRange(r + 1, sentCol + 1).setValue(MISSION_GUIDE_CFG.SEND_DONE);

          if (isReminderSend) {
            stats.reminded++;
            notifySummary.reminded.push((name || leaderEmail || empId || '대상자') + ' ' + stage.label);
          } else {
            stats.sent++;
            notifySummary.sent.push((name || leaderEmail || empId || '대상자') + ' ' + stage.label);
          }

          logRows.push(Mission_buildLogRow_({
            result: isReminderSend ? '리마인드성공' : '발송성공',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: leaderEmail,
            leaderEmail: leaderEmail,
            stage: stage.label,
            dueDate: Mission_formatDate_(dueDate),
            reason: isReminderSend
              ? '평가 완료 전까지 리마인드 발송'
              : stage.mode === 'ONCE'
              ? '시작안내 발송'
              : '평가 완료 전까지 최초 발송',
          }));

          Logger.log('[MISSION][SENT] ' + JSON.stringify(item));

        } catch (e) {
          stats.failed++;
          notifySummary.failed.push((name || leaderEmail || empId || '대상자') + ' ' + stage.label + ' / ' + e.message);

          mainSh.getRange(r + 1, sentCol + 1).setValue(MISSION_GUIDE_CFG.SEND_FAILED);

          logRows.push(Mission_buildLogRow_({
            result: '실패',
            rowNo: r + 1,
            empId: empId,
            name: name,
            email: leaderEmail,
            leaderEmail: leaderEmail,
            stage: stage.label,
            dueDate: Mission_formatDate_(dueDate),
            reason: e.message,
          }));

          Logger.log('[MISSION][FAIL] ' + JSON.stringify(item) + ' / ' + e.message);
        }
      }
    }

    if (logRows.length > 0 && !isPreview) {
      Mission_appendLogs_(logRows);
    }

    if (!isPreview && typeof OpsNotify_missionResult === 'function') {
      OpsNotify_missionResult(notifySummary);
    }

    Logger.log('[MISSION][RESULT] ' + JSON.stringify(stats));
    return stats;

  } catch (e) {
    Logger.log('[MISSION][ERROR] ' + (e && e.stack ? e.stack : e));

    if (!isPreview && typeof OpsNotify_missionResult === 'function') {
      notifySummary.errors.push('시스템 미션 / ' + (e && e.message ? e.message : e));
      OpsNotify_missionResult(notifySummary);
    }

    throw e;

  } finally {
    lock.releaseLock();
  }
}

/******************************************************
 * 현재 구조 검증
 ******************************************************/
function Mission_validateCurrentStructure_(headerMap) {
  const requiredHeaderGroups = [
    { label: '사번', candidates: ['사번'] },
    { label: '성명', candidates: ['성명'] },
    { label: '이메일', candidates: ['이메일', '메일', 'Email', 'email'] },
    { label: '입사일', candidates: ['입사일'] },
    { label: '리더명', candidates: ['온보딩 리더', '부서장', '리더'] },
    { label: '리더 이메일', candidates: ['리더 이메일', '부서장 이메일', '온보딩 리더 이메일'] },
    { label: '퇴사·휴직 체크', candidates: ['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크'] },
    { label: '시작 안내 발송여부', candidates: ['시작 안내', '시작안내', '시작 안내 발송여부', '시작안내 발송여부'] },
    { label: 'D+30 예정일', candidates: ['D+30 예정일', 'D+30 설문 예정일', 'D30 예정일'] },
    { label: 'D+30 발송여부', candidates: ['D+30 발송여부', 'D+30 미션 발송여부', 'D+30 발송일'] },
    { label: 'D+30 평가 완료', candidates: ['D+30 평가 완료', 'D+30 응답완료', 'D+30 완료', 'D+30 평가완료'] },
    { label: 'D+60 예정일', candidates: ['D+60 예정일', 'D+60 설문 예정일', 'D60 예정일'] },
    { label: 'D+60 발송여부', candidates: ['D+60 발송여부', 'D+60 미션 발송여부', 'D+60 발송일'] },
    { label: 'D+60 평가 완료', candidates: ['D+60 평가 완료', 'D+60 응답완료', 'D+60 완료', 'D+60 평가완료'] },
    { label: 'D+90 예정일', candidates: ['D+90 예정일', 'D+90 설문 예정일', 'D90 예정일'] },
    { label: 'D+90 발송여부', candidates: ['D+90 발송여부', 'D+90 미션 발송여부', 'D+90 발송일'] },
    { label: 'D+90 평가 완료', candidates: ['D+90 평가 완료', 'D+90 응답완료', 'D+90 완료', 'D+90 평가완료'] },
  ];

  requiredHeaderGroups.forEach(function(group) {
    if (Mission_firstHeader_(headerMap, group.candidates) < 0) {
      throw new Error('온보딩 대상자 필수 헤더 없음: ' + group.label + ' / 후보: ' + group.candidates.join(', '));
    }
  });
}

/******************************************************
 * 메일 템플릿 읽기
 * - 시트 헤더: 구분 / 제목 템플릿 / 본문 템플릿
 ******************************************************/
function Mission_getTemplates_(templateSh) {
  const values = templateSh.getDataRange().getValues();
  const headerMap = Mission_getHeaderMap_(templateSh);

  const keyCol = headerMap['구분'];
  const subjectCol = headerMap['제목 템플릿'];
  const bodyCol = headerMap['본문 템플릿'];

  if (keyCol === undefined || subjectCol === undefined || bodyCol === undefined) {
    throw new Error('메일 템플릿 헤더 없음: 구분 / 제목 템플릿 / 본문 템플릿');
  }

  const templates = {};

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const key = String(row[keyCol] || '').trim();

    if (!key) continue;

    templates[key] = {
      subject: String(row[subjectCol] || ''),
      body: String(row[bodyCol] || ''),
    };
  }

  return templates;
}

/******************************************************
 * 템플릿 치환 필드
 ******************************************************/
function Mission_buildFields_(row, headerMap, stage, dueDate) {
  const name = Mission_getByHeader_(row, headerMap, '성명');
  const leader = Mission_getByAnyHeader_(row, headerMap, ['온보딩 리더', '부서장', '리더']);
  const hq = Mission_getByHeader_(row, headerMap, '본부');
  const team = Mission_getByHeader_(row, headerMap, '팀');
  const joinDate = Mission_parseDateOnly_(Mission_getByHeader_(row, headerMap, '입사일'));

  const d30 = Mission_parseDateOnly_(Mission_getByHeader_(row, headerMap, 'D+30 예정일'));
  const d60 = Mission_parseDateOnly_(Mission_getByHeader_(row, headerMap, 'D+60 예정일'));
  const d90 = Mission_parseDateOnly_(Mission_getByHeader_(row, headerMap, 'D+90 예정일'));

  return {
    '성명': name,
    '이름': name,
    '부서장': leader,
    '리더': leader,
    '본부': hq,
    '팀': team,
    '입사일': joinDate ? Mission_formatDate_(joinDate) : '',
    '1차종료일': d30 ? Mission_formatDate_(d30) : '',
    '2차종료일': d60 ? Mission_formatDate_(d60) : '',
    '3차종료일': d90 ? Mission_formatDate_(d90) : '',
    '리뷰일': dueDate ? Mission_formatDate_(dueDate) : '',
    '예정일': dueDate ? Mission_formatDate_(dueDate) : '',
    '차수': stage.label,
  };
}

/******************************************************
 * 템플릿 치환
 ******************************************************/
function Mission_fill_(template, fields) {
  let text = String(template || '');

  Object.keys(fields).forEach(function(key) {
    const value = fields[key] === null || fields[key] === undefined ? '' : String(fields[key]);
    text = text.split('{' + key + '}').join(value);
  });

  return text;
}

/******************************************************
 * 예정일 가져오기
 ******************************************************/
function Mission_getDueDate_(row, headerMap, stage) {
  const candidates = stage.dueHeaderCandidates
    ? stage.dueHeaderCandidates.concat([stage.dueHeader])
    : [stage.dueHeader];

  const dueCol = Mission_firstHeader_(headerMap, candidates);

  if (dueCol < 0) return null;

  return Mission_parseDateOnly_(row[dueCol]);
}

/******************************************************
 * 완료 판정
 * - 미평가는 완료 아님
 ******************************************************/
function Mission_isDone_(value) {
  const status = String(value || '').trim();

  if (!status) return false;

  const doneValues = [
    '완료',
    '응답완료',
    '응답 완료',
    '제출완료',
    '제출 완료',
    '합격',
    '연장',
    '불합격',
    '부적합',
    '전환완료',
    '전환 완료',
    'Y',
    'y',
  ];

  return doneValues.indexOf(status) >= 0;
}

function Mission_isSendDone_(value) {
  return String(value || '').trim() === MISSION_GUIDE_CFG.SEND_DONE;
}

/******************************************************
 * 마감 행 판정
 * - 퇴직/퇴사/휴직/90일 평가 확정은 발송 제외
 ******************************************************/
function Mission_isClosedRow_(row, headerMap) {
  const note = Mission_getByAnyHeader_(row, headerMap, ['비고', '메모']);
  const closeCheck = Mission_getByAnyHeader_(row, headerMap, ['퇴사·휴직마감체크', '퇴사·휴직 체크', '퇴사·휴직마감 체크', '퇴사휴직 체크']);
  const d90Eval = Mission_getByHeader_(row, headerMap, 'D+90 평가 완료');

  if (MISSION_GUIDE_CFG.CLOSED_EMPLOYEE_STATUS_REGEX.test(note)) return true;
  if (MISSION_GUIDE_CFG.CLOSED_EMPLOYEE_STATUS_REGEX.test(closeCheck)) return true;

  const closedEvalValues = ['합격', '연장', '불합격', '완료'];
  if (closedEvalValues.indexOf(String(d90Eval || '').trim()) >= 0) return true;

  return false;
}

/******************************************************
 * 직원 마스터 기준 재직자 인덱스 생성
 ******************************************************/
function Mission_buildActiveEmployeeIndex_() {
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

  let masterSh = null;

  for (let i = 0; i < MISSION_GUIDE_CFG.EMP_MASTER_SHEET_CANDIDATES.length; i++) {
    const candidate = MISSION_GUIDE_CFG.EMP_MASTER_SHEET_CANDIDATES[i];
    const sh = ss.getSheetByName(candidate);

    if (sh) {
      masterSh = sh;
      break;
    }
  }

  if (!masterSh) {
    index.error = '직원 마스터 탭 없음';
    return index;
  }

  const values = masterSh.getDataRange().getValues();

  if (values.length < 2) {
    index.error = '직원 마스터 데이터 없음';
    return index;
  }

  const headerMap = Mission_getHeaderMap_(masterSh);

  const empIdCol = Mission_firstHeader_(headerMap, ['사번', 'employee_id', 'EMP_ID']);
  const emailCol = Mission_firstHeader_(headerMap, ['이메일', '메일', 'Email', 'email']);
  const nameCol = Mission_firstHeader_(headerMap, ['성명', '이름', 'name']);
  const statusCol = Mission_firstHeader_(headerMap, ['재직구분', '재직 구분', '상태', '근무상태']);

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
    const empId = empIdCol >= 0 ? Mission_normalizeEmpId_(row[empIdCol]) : '';
    const email = emailCol >= 0 ? Mission_normalizeEmail_(row[emailCol]) : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';

    if (empId) index.statusByEmpId[empId] = status;
    if (email) index.statusByEmail[email] = status;
    if (name) index.statusByName[name] = status;

    if (MISSION_GUIDE_CFG.ACTIVE_EMPLOYEE_STATUSES.indexOf(status) < 0) continue;

    if (empId) index.byEmpId[empId] = true;
    if (email) index.byEmail[email] = true;
    if (name) index.byName[name] = true;
  }

  index.loaded = true;

  Logger.log(
    '[MISSION][MASTER] 직원 마스터 로드 완료 / 탭=' +
    masterSh.getName() +
    ' / 사번=' +
    Object.keys(index.byEmpId).length +
    ' / 이메일=' +
    Object.keys(index.byEmail).length
  );

  return index;
}

/******************************************************
 * 재직자 여부 판정
 ******************************************************/
function Mission_isActiveEmployee_(activeIndex, empId, email, name) {
  if (!activeIndex || !activeIndex.loaded) {
    return {
      ok: false,
      reason: '직원 마스터 확인 실패',
    };
  }

  const cleanEmpId = Mission_normalizeEmpId_(empId);
  const cleanEmail = Mission_normalizeEmail_(email);
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
 * 트리거 설치
 * - 매일 오전 9시 실행
 * - 기존 동일 핸들러 트리거는 삭제 후 1개만 생성
 ******************************************************/
function installOnboardingMissionGuideTrigger() {
  const removeHandlers = [
    MISSION_GUIDE_CFG.TRIGGER_HANDLER,
  ].concat(typeof AUTOMATION_LEGACY_TIME_HANDLERS_ !== 'undefined'
    ? AUTOMATION_LEGACY_TIME_HANDLERS_
    : ['sendSurveyBySchedule', 'Survey_run_']);

  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const fn = trigger.getHandlerFunction();

    if (removeHandlers.indexOf(fn) >= 0) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  ScriptApp.newTrigger(MISSION_GUIDE_CFG.TRIGGER_HANDLER)
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log(
    '[MISSION][TRIGGER] 설치 완료 / 삭제=' +
    deleted +
    ' / 1시간 주기 (리마인드는 ' + MISSION_GUIDE_CFG.TRIGGER_HOUR + '시)'
  );

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '온보딩 미션 안내 발송 트리거 설치 완료',
    '1시간 주기 (리마인드는 ' + MISSION_GUIDE_CFG.TRIGGER_HOUR + '시)',
    5
  );
}

/******************************************************
 * 트리거 제거
 ******************************************************/
function removeOnboardingMissionGuideTrigger() {
  const handler = MISSION_GUIDE_CFG.TRIGGER_HANDLER;
  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  Logger.log('[MISSION][TRIGGER] 제거 완료 / 삭제=' + deleted);
}

/******************************************************
 * 트리거 상태 확인
 ******************************************************/
function checkOnboardingMissionGuideTriggerStatus() {
  const handler = MISSION_GUIDE_CFG.TRIGGER_HANDLER;

  const matched = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === handler;
  });

  Logger.log('[MISSION][TRIGGER] ' + handler + ' / count=' + matched.length);

  return {
    ok: matched.length > 0,
    count: matched.length,
  };
}

/******************************************************
 * 로그 기록
 ******************************************************/
function Mission_appendLogs_(rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(MISSION_GUIDE_CFG.LOG_SHEET);

  if (!sh) {
    sh = ss.insertSheet(MISSION_GUIDE_CFG.LOG_SHEET);
    sh.appendRow([
      '실행시각',
      '결과',
      '행번호',
      '사번',
      '성명',
      '수신자',
      '차수',
      '기준일',
      '사유',
    ]);
  }

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function Mission_buildLogRow_(payload) {
  return [
    new Date(),
    payload.result || '',
    payload.rowNo || '',
    payload.empId || '',
    payload.name || '',
    payload.leaderEmail || payload.email || '',
    payload.stage || '',
    payload.dueDate || '',
    payload.reason || '',
  ];
}

/******************************************************
 * 공통 유틸
 ******************************************************/
function Mission_getHeaderMap_(sheet) {
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

function Mission_getByHeader_(row, headerMap, headerName) {
  const idx = headerMap[headerName];

  if (idx === undefined || idx < 0) return '';

  return String(row[idx] || '').trim();
}

function Mission_getByAnyHeader_(row, headerMap, candidates) {
  const idx = Mission_firstHeader_(headerMap, candidates);

  if (idx < 0) return '';

  return String(row[idx] || '').trim();
}

function Mission_firstHeader_(headerMap, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const name = candidates[i];

    if (Object.prototype.hasOwnProperty.call(headerMap, name)) {
      return headerMap[name];
    }
  }

  return -1;
}

function Mission_parseDateOnly_(value) {
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

function Mission_formatDate_(date) {
  if (!date) return '';

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function Mission_daysBetween_(fromDate, toDate) {
  const from = Mission_parseDateOnly_(fromDate);
  const to = Mission_parseDateOnly_(toDate);

  if (!from || !to) return 0;

  const ms = to.getTime() - from.getTime();

  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function Mission_isBusinessDay_(date) {
  const d = Mission_parseDateOnly_(date);
  if (!d) return false;

  const day = d.getDay();

  return day !== 0 && day !== 6;
}

function Mission_isBeforeMissionLaunch_(dueDate) {
  const due = Mission_parseDateOnly_(dueDate);
  const launch = Mission_parseDateOnly_(MISSION_GUIDE_CFG.MISSION_LAUNCH_DATE);

  if (!due || !launch) return true;

  return due.getTime() < launch.getTime();
}

function Mission_canInitialSendByDueDate_(dueDate, today) {
  const due = Mission_parseDateOnly_(dueDate);
  const run = Mission_parseDateOnly_(today);
  const launch = Mission_parseDateOnly_(MISSION_GUIDE_CFG.MISSION_LAUNCH_DATE);

  if (!due || !run || !launch) return false;

  if (due.getTime() < launch.getTime()) return false;
  if (due.getTime() > run.getTime()) return false;

  const overdueDays = Mission_daysBetween_(due, run);

  if (overdueDays === 0) return true;

  return overdueDays > 0 && overdueDays <= MISSION_GUIDE_CFG.INITIAL_SEND_MAX_OVERDUE_DAYS;
}

function Mission_normalizeEmpId_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return '';

  return String(value).trim().replace(/\.0$/, '');
}

function Mission_normalizeEmail_(value) {
  if (value === null || value === undefined) return '';

  return String(value).trim().toLowerCase();
}
