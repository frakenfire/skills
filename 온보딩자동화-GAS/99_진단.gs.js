/**
 * 시트 구조 전체 진단 함수
 * clasp run diagnoseFull 로 실행
 */
function diagnoseFull() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets().map(sh => sh.getName());

  const targetSheets = [
    '온보딩 대상자',
    '직원 마스터 시트 (연동)',
    '직원 마스터 시트',
    '메일 템플릿',
    '부서 메타 데이터',
    '온보딩만족도_발송로그',
    '온보딩미션_발송로그',
  ];

  const result = {
    allSheetNames: allSheets,
    sheetDetails: {}
  };

  targetSheets.forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) {
      result.sheetDetails[name] = { exists: false };
      return;
    }

    const lastCol = sh.getLastColumn();
    const lastRow = sh.getLastRow();
    let headers = [];

    if (lastCol > 0 && lastRow > 0) {
      // 직원 마스터는 6행이 헤더
      const headerRow = (name === '직원 마스터 시트 (연동)' || name === '직원 마스터 시트') ? 6 : 1;
      if (lastRow >= headerRow) {
        headers = sh.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
      }
    }

    result.sheetDetails[name] = {
      exists: true,
      lastRow: lastRow,
      lastCol: lastCol,
      headers: headers
    };
  });

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * 메일 템플릿 시트의 A열(구분) 값 전체 확인
 */
function diagnoseTemplateKeys() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 가능한 템플릿 시트 이름들을 다 시도
  const candidates = ['메일 템플릿', '메일템플릿', 'Mail Template', '템플릿'];
  let sh = null;
  let foundName = '';

  for (let i = 0; i < candidates.length; i++) {
    sh = ss.getSheetByName(candidates[i]);
    if (sh) { foundName = candidates[i]; break; }
  }

  if (!sh) {
    Logger.log('메일 템플릿 시트 없음. 전체 시트: ' + ss.getSheets().map(s => s.getName()).join(', '));
    return null;
  }

  const values = sh.getDataRange().getDisplayValues();
  const result = {
    sheetName: foundName,
    headers: values[0],
    templateKeys: []
  };

  for (let i = 1; i < values.length; i++) {
    if (values[i][0]) result.templateKeys.push(values[i][0]);
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * 현재 걸려있는 트리거 전체 확인
 */
function diagnoseTriggers() {
  const triggers = ScriptApp.getProjectTriggers().map(function(t) {
    return {
      handler: t.getHandlerFunction(),
      type: t.getEventType().toString(),
      source: t.getTriggerSource().toString()
    };
  });

  Logger.log(JSON.stringify(triggers, null, 2));
  return triggers;
}
