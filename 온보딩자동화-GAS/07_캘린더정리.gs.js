/******************************************************
 * 파일명: 07_캘린더정리.gs
 *
 * 역할:
 * - 직원 마스터 기준 재직/수습이 아닌 대상자의 향후 수습평가 캘린더 일정을 정리
 * - 이벤트 ID가 저장되어 있지 않으므로 예정일 + 성명 + 차수 제목 패턴으로 탐색
 * - preview 함수는 Calendar 삭제/시트 쓰기 없음
 *
 * 수동 확인:
 * - previewCalendarCleanupForInactiveEmployees()
 *
 * 실제 정리:
 * - runCalendarCleanupForInactiveEmployees()
 * - runProbationConsistencyCheck() 마지막에 자동 호출됨
 ******************************************************/

const CALENDAR_CLEANUP_CFG = {
  MAIN_SHEET: '온보딩 대상자',
  LOG_SHEET: '캘린더_로그',
  MASTER_SHEET_CANDIDATES: [
    '직원 마스터 시트 (연동)',
    '직원 마스터 시트',
    '재직자명부',
    '직원명부',
    '직원 마스터',
  ],
  RETIREE_SHEET_CANDIDATES: [
    '퇴사자 명부',
    '퇴사자명부',
    '퇴직자 명부',
    '퇴직자명부',
  ],
  ACTIVE_STATUSES: ['재직', '수습'],
  CLOSE_STATUS_REGEX: /퇴사|퇴직|휴직|퇴사예정/,
  CALENDAR_ID_PROPERTY_KEYS: ['ONBOARDING_CALENDAR_ID', 'PROBATION_CALENDAR_ID', 'CALENDAR_ID'],
  TITLE_PREFIX: '[수습평가]',
  STAGES: [
    { label: '1차', dueHeaders: ['D+30 예정일'] },
    { label: '2차', dueHeaders: ['D+60 예정일'] },
    { label: '3차', dueHeaders: ['D+90 예정일'] },
  ],
};

function previewCalendarCleanupForInactiveEmployees() {
  return CalendarCleanup_run_(true);
}

function runCalendarCleanupForInactiveEmployees() {
  return CalendarCleanup_run_(false);
}

function CalendarCleanup_run_(isPreview, options) {
  const stats = {
    preview: !!isPreview,
    checkedAt: new Date().toISOString(),
    scannedRows: 0,
    inactiveRows: 0,
    futureStageChecks: 0,
    matchedEvents: 0,
    deletedEvents: 0,
    skippedPastDue: 0,
    skippedNoDueDate: 0,
    skippedActive: 0,
    errors: [],
    details: [],
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSh = ss.getSheetByName(CALENDAR_CLEANUP_CFG.MAIN_SHEET);
  if (!mainSh) throw new Error('시트 없음: ' + CALENDAR_CLEANUP_CFG.MAIN_SHEET);

  const calendar = CalendarCleanup_getCalendar_();
  if (!calendar) throw new Error('캘린더를 찾을 수 없음: script property ONBOARDING_CALENDAR_ID 또는 기본 캘린더 확인 필요');

  const activeIndex = CalendarCleanup_buildActiveIndex_(ss);
  if (!activeIndex.loaded) throw new Error(activeIndex.error || '직원 마스터 로드 실패');

  const retireeIndex = CalendarCleanup_buildRetireeIndex_(ss);
  const values = mainSh.getDataRange().getValues();
  const headerMap = CalendarCleanup_getHeaderMap_(mainSh);
  const today = CalendarCleanup_parseDateOnly_((options && options.today) || new Date());

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const empId = CalendarCleanup_getByHeader_(row, headerMap, '사번');
    const name = CalendarCleanup_getByHeader_(row, headerMap, '성명');
    const email = CalendarCleanup_getByHeader_(row, headerMap, '이메일');

    if (!empId && !name && !email) continue;

    stats.scannedRows++;

    const inactiveReason = CalendarCleanup_getInactiveReason_(activeIndex, retireeIndex, empId, email, name);
    if (!inactiveReason) {
      stats.skippedActive++;
      continue;
    }

    stats.inactiveRows++;

    CALENDAR_CLEANUP_CFG.STAGES.forEach(function(stage) {
      const dueDate = CalendarCleanup_getDueDate_(row, headerMap, stage);
      if (!dueDate) {
        stats.skippedNoDueDate++;
        return;
      }

      if (dueDate.getTime() < today.getTime()) {
        stats.skippedPastDue++;
        return;
      }

      stats.futureStageChecks++;

      try {
        const events = CalendarCleanup_findReviewEvents_(calendar, dueDate, name, stage.label);
        stats.matchedEvents += events.length;

        if (events.length === 0) {
          stats.details.push({
            rowNo: r + 1,
            empId: empId,
            name: name,
            stage: stage.label,
            dueDate: CalendarCleanup_formatDate_(dueDate),
            action: 'NO_EVENT',
            reason: inactiveReason,
          });
          return;
        }

        events.forEach(function(event) {
          const title = event.getTitle();
          const item = {
            rowNo: r + 1,
            empId: empId,
            name: name,
            stage: stage.label,
            dueDate: CalendarCleanup_formatDate_(dueDate),
            title: title,
            action: isPreview ? 'DRY_DELETE' : 'DELETE',
            reason: inactiveReason,
          };

          if (!isPreview) {
            event.deleteEvent();
            stats.deletedEvents++;
          }

          stats.details.push(item);
        });
      } catch (e) {
        const message = `${name || empId || email} ${stage.label} 캘린더 정리 실패: ${e.message}`;
        stats.errors.push(message);
        stats.details.push({
          rowNo: r + 1,
          empId: empId,
          name: name,
          stage: stage.label,
          dueDate: CalendarCleanup_formatDate_(dueDate),
          action: 'ERROR',
          reason: message,
        });
      }
    });
  }

  if (!isPreview) {
    CalendarCleanup_appendLogs_(stats.details);
  }

  Logger.log('[CALENDAR_CLEANUP][RESULT] ' + JSON.stringify(stats, null, 2));
  return stats;
}

function CalendarCleanup_getCalendar_() {
  const props = PropertiesService.getScriptProperties();
  let calendarId = '';

  CALENDAR_CLEANUP_CFG.CALENDAR_ID_PROPERTY_KEYS.some(function(key) {
    calendarId = String(props.getProperty(key) || '').trim();
    return !!calendarId;
  });

  if (calendarId) {
    return CalendarApp.getCalendarById(calendarId);
  }

  return CalendarApp.getDefaultCalendar();
}

function CalendarCleanup_buildActiveIndex_(ss) {
  const result = {
    loaded: false,
    error: '',
    byEmpId: {},
    byEmail: {},
    byName: {},
    statusByEmpId: {},
    statusByEmail: {},
    statusByName: {},
  };

  const sh = CalendarCleanup_findSheetByNames_(ss, CALENDAR_CLEANUP_CFG.MASTER_SHEET_CANDIDATES);
  if (!sh) {
    result.error = '직원 마스터/재직자명부 탭 없음';
    return result;
  }

  const values = sh.getDataRange().getValues();
  if (values.length < 2) {
    result.error = '직원 마스터 데이터 없음';
    return result;
  }

  const headerMap = CalendarCleanup_getHeaderMap_(sh);
  const empIdCol = CalendarCleanup_firstHeader_(headerMap, ['사번', 'employee_id', 'EMP_ID']);
  const emailCol = CalendarCleanup_firstHeader_(headerMap, ['이메일', '메일', 'Email', 'email']);
  const nameCol = CalendarCleanup_firstHeader_(headerMap, ['성명', '이름', 'name']);
  const statusCol = CalendarCleanup_firstHeader_(headerMap, ['재직구분', '재직 구분', '상태', '근무상태']);

  if (empIdCol < 0 && emailCol < 0 && nameCol < 0) {
    result.error = '직원 마스터 사번/이메일/성명 컬럼 없음';
    return result;
  }

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const empId = empIdCol >= 0 ? CalendarCleanup_normalizeEmpId_(row[empIdCol]) : '';
    const email = emailCol >= 0 ? CalendarCleanup_normalizeEmail_(row[emailCol]) : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';
    const status = statusCol >= 0 ? String(row[statusCol] || '').trim() : '재직';
    const isActive = CALENDAR_CLEANUP_CFG.ACTIVE_STATUSES.indexOf(status) >= 0;

    if (empId) result.statusByEmpId[empId] = status;
    if (email) result.statusByEmail[email] = status;
    if (name) result.statusByName[name] = status;

    if (!isActive) continue;

    if (empId) result.byEmpId[empId] = true;
    if (email) result.byEmail[email] = true;
    if (name) result.byName[name] = true;
  }

  result.loaded = true;
  return result;
}

function CalendarCleanup_buildRetireeIndex_(ss) {
  const result = { loaded: false, byEmpId: {}, byEmail: {}, byName: {} };
  const sh = CalendarCleanup_findSheetByNames_(ss, CALENDAR_CLEANUP_CFG.RETIREE_SHEET_CANDIDATES);
  if (!sh) return result;

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return result;

  const headerMap = CalendarCleanup_getHeaderMap_(sh);
  const empIdCol = CalendarCleanup_firstHeader_(headerMap, ['사번', 'employee_id', 'EMP_ID']);
  const emailCol = CalendarCleanup_firstHeader_(headerMap, ['이메일', '메일', 'Email', 'email']);
  const nameCol = CalendarCleanup_firstHeader_(headerMap, ['성명', '이름', 'name']);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const empId = empIdCol >= 0 ? CalendarCleanup_normalizeEmpId_(row[empIdCol]) : '';
    const email = emailCol >= 0 ? CalendarCleanup_normalizeEmail_(row[emailCol]) : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';

    if (empId) result.byEmpId[empId] = true;
    if (email) result.byEmail[email] = true;
    if (name) result.byName[name] = true;
  }

  result.loaded = true;
  return result;
}

function CalendarCleanup_getInactiveReason_(activeIndex, retireeIndex, empId, email, name) {
  const cleanEmpId = CalendarCleanup_normalizeEmpId_(empId);
  const cleanEmail = CalendarCleanup_normalizeEmail_(email);
  const cleanName = String(name || '').trim();

  if (
    (cleanEmpId && retireeIndex.byEmpId[cleanEmpId]) ||
    (cleanEmail && retireeIndex.byEmail[cleanEmail]) ||
    (cleanName && retireeIndex.byName[cleanName])
  ) {
    return '퇴사자 명부에 존재';
  }

  const status =
    (cleanEmpId && activeIndex.statusByEmpId[cleanEmpId]) ||
    (cleanEmail && activeIndex.statusByEmail[cleanEmail]) ||
    (cleanName && activeIndex.statusByName[cleanName]) ||
    '';

  if (status && CALENDAR_CLEANUP_CFG.CLOSE_STATUS_REGEX.test(status)) {
    return '직원 마스터 재직구분=' + status;
  }

  const isActive =
    (cleanEmpId && activeIndex.byEmpId[cleanEmpId]) ||
    (cleanEmail && activeIndex.byEmail[cleanEmail]) ||
    (cleanName && activeIndex.byName[cleanName]);

  if (isActive) return '';

  return status
    ? '직원 마스터 재직/수습 아님: ' + status
    : '재직자명부/직원 마스터에서 재직자로 찾을 수 없음';
}

function CalendarCleanup_findReviewEvents_(calendar, date, name, stageLabel) {
  if (!name) return [];

  const searchOptions = { search: name };
  const events = calendar.getEventsForDay(date, searchOptions);
  const stageText = '(' + stageLabel + ' 리뷰)';

  return events.filter(function(event) {
    const title = event.getTitle();
    return title.indexOf(CALENDAR_CLEANUP_CFG.TITLE_PREFIX) >= 0 &&
      title.indexOf(name) >= 0 &&
      title.indexOf(stageText) >= 0;
  });
}

function CalendarCleanup_getDueDate_(row, headerMap, stage) {
  const idx = CalendarCleanup_firstHeader_(headerMap, stage.dueHeaders);
  if (idx < 0) return null;
  return CalendarCleanup_parseDateOnly_(row[idx]);
}

function CalendarCleanup_appendLogs_(details) {
  if (!details || details.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CALENDAR_CLEANUP_CFG.LOG_SHEET);
  if (!sh) {
    Logger.log('[CALENDAR_CLEANUP][LOG][SKIP] 로그 탭 없음: ' + CALENDAR_CLEANUP_CFG.LOG_SHEET);
    return;
  }

  const rows = details
    .filter(function(item) {
      return item.action === 'DELETE' || item.action === 'ERROR';
    })
    .map(function(item) {
      return [
        new Date(),
        item.rowNo || '',
        item.name || '',
        item.stage || '',
        item.action === 'DELETE' ? 'DELETED' : 'ERROR',
        (item.reason || '') + (item.title ? ' / ' + item.title : ''),
      ];
    });

  if (rows.length === 0) return;

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function CalendarCleanup_getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const map = {};

  headers.forEach(function(header, idx) {
    const key = String(header || '').trim();
    if (key) map[key] = idx;
  });

  return map;
}

function CalendarCleanup_getByHeader_(row, headerMap, headerName) {
  const idx = headerMap[headerName];
  if (idx === undefined || idx < 0) return '';
  return String(row[idx] || '').trim();
}

function CalendarCleanup_firstHeader_(headerMap, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const name = candidates[i];
    if (Object.prototype.hasOwnProperty.call(headerMap, name)) return headerMap[name];
  }
  return -1;
}

function CalendarCleanup_findSheetByNames_(ss, names) {
  for (let i = 0; i < names.length; i++) {
    const sh = ss.getSheetByName(names[i]);
    if (sh) return sh;
  }
  return null;
}

function CalendarCleanup_parseDateOnly_(value) {
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

function CalendarCleanup_formatDate_(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function CalendarCleanup_normalizeEmpId_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return '';
  return String(value).trim().replace(/\.0$/, '');
}

function CalendarCleanup_normalizeEmail_(value) {
  if (value === null || value === undefined) return '';
  return String(value || '').trim().toLowerCase();
}
