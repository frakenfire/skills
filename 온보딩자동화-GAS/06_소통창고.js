/******************************************************
 * 파일명: 06_소통창고.gs
 * 역할: 소통 창고 Form 응답 처리
 *       - SLA 처리기한 자동 계산
 *       - 긴급/막힘 → Google Chat 즉시 알림
 ******************************************************/

function onCommunicationSubmit(e) {
  const sh = getSheet(CFG.SHEET_COMM);
  if (!sh) return;
  const lastRow = sh.getLastRow();
  const row = sh.getRange(lastRow, 1, 1, 15).getValues()[0];

  const impact  = String(row[7]  || '');
  const content = String(row[9]  || '');
  const name    = String(row[3]  || '');
  const target  = String(row[8]  || '');
  const empId   = String(row[2]  || '');

  const SLA = {
    '긴급확인필요': 0,
    '업무막힘':     1,
    '업무지연':     2,
    '자료요청':     2,
    '약간':         7,
    '영향없음':     7,
  };
  const slaKey = Object.keys(SLA).find(k => impact.includes(k)) || '영향없음';
  const deadline = SLA[slaKey] === 0 ? new Date() : addBusinessDays(new Date(), SLA[slaKey]);

  sh.getRange(lastRow, 1).setValue(lastRow - 1);
  sh.getRange(lastRow, 2).setValue(toKST(new Date()));
  sh.getRange(lastRow, 11).setValue('접수');
  sh.getRange(lastRow, 13).setValue(toKST(deadline));

  if (impact.includes('긴급') || impact.includes('업무막힘')) {
    const preview = content.length > 100 ? content.substring(0, 100) + '…' : content;
    notifyChat([
      '*[소통창고 긴급]* ' + toKST(new Date()),
      '👤 ' + name + ' (' + empId + ') · 확인요청: ' + target,
      '🔴 영향도: ' + impact,
      '📝 ' + preview,
      '⏰ 처리기한: ' + toKST(deadline),
    ].join('\n'));
  }
}

/******************************************************
 * 폼 제출 트리거 설치
 * - 소통창고 설문 제출 시 자동 접수 처리
 ******************************************************/
function installCommunicationTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const handlers = ['onCommunicationSubmit'];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onCommunicationSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log('[COMMUNICATION][TRIGGER] 설치 완료 / onFormSubmit');
}