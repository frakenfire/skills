/******************************************************
 * 파일명: 05_온보딩운영관제.gs
 *
 * 역할:
 * - 02/03 발송 결과를 Google Chat으로 즉시 보고
 * - 시간 트리거 없음
 * - 정상 점검용 별도 실행 없음
 *
 * 호출 방식:
 * - 02번 발송 완료 후 OpsNotify_surveyResult(summary)
 * - 03번 발송 완료 후 OpsNotify_missionResult(summary)
 ******************************************************/

function OpsNotify_surveyResult(summary) {
  OpsNotify_sendResult_('온보딩 만족도 설문 발송 결과', summary);
}

function OpsNotify_missionResult(summary) {
  OpsNotify_sendResult_('온보딩 미션 안내 발송 결과', summary);
}

function OpsNotify_sendResult_(title, summary) {
  summary = summary || {};

  const sent     = summary.sent     || [];
  const reminded = summary.reminded || [];
  const failed   = summary.failed   || [];
  const errors   = summary.errors   || [];

  // 발송/리마인드/실패/오류 모두 없으면 정상 스킵으로 기록만 남긴다.
  if (sent.length === 0 && reminded.length === 0 && failed.length === 0 && errors.length === 0) {
    Logger.log('[OPS_NOTIFY] 오늘 발송 대상자 없음: ' + title);
    return;
  }

  const lines = [];

  lines.push('*[' + title + ']* ' + OpsNotify_now_());

  if (sent.length > 0) {
    lines.push('');
    lines.push('📨 발송되었습니다');
    sent.forEach(function(item) {
      lines.push('• ' + item);
    });
  }

  if (reminded.length > 0) {
    lines.push('');
    lines.push('🔁 리마인드 발송되었습니다');
    reminded.forEach(function(item) {
      lines.push('• ' + item);
    });
  }

  if (failed.length > 0) {
    lines.push('');
    lines.push('❌ 발송 실패 — 아래 대상자에게 발송되지 않았습니다');
    failed.forEach(function(item) {
      lines.push('• ' + item);
    });
  }

  if (errors.length > 0) {
    lines.push('');
    lines.push('🔧 시스템 오류 (발송 미실행) — 담당자 확인 필요');
    errors.forEach(function(item) {
      lines.push('• ' + item);
    });
  }

  OpsNotify_chat_(lines.join('\n'));
}

function OpsNotify_chat_(message) {
  if (typeof notifyChat === 'function') {
    notifyChat(message);
    return;
  }

  const webhook = PropertiesService
    .getScriptProperties()
    .getProperty('CHAT_WEBHOOK');

  if (!webhook) {
    Logger.log('[OPS_NOTIFY][SKIP] CHAT_WEBHOOK 없음');
    Logger.log(message);
    return;
  }

  UrlFetchApp.fetch(webhook, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: message }),
    muteHttpExceptions: true
  });
}

function OpsNotify_now_() {
  if (typeof toKST === 'function') {
    return toKST(new Date());
  }

  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );
}

/******************************************************
 * 설문 제출 (Form Submit) 핸들러
 * - 폼 제출 시 e.namedValues를 기반으로 발송자 파악 후 카드 전송
 ******************************************************/
function onSurveySubmit(e) {
  if (!e || !e.range) return;
  
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  
  // '설문' 및 '응답' 키워드가 들어간 시트만 필터링
  if (!sheetName.includes('설문') || !sheetName.includes('응답')) return;
  
  // D+30, D+3 등 식별 (예: 설문지 응답_D+30)
  let surveyType = sheetName.split('_')[1] || sheetName;
  
  let submitterName = '알 수 없음';
  let timestamp = OpsNotify_now_();
  
  if (e.values && e.values[0]) {
    timestamp = e.values[0];
  }
  
  if (e.namedValues) {
    // '이름', '성명', '성함' 키워드가 들어간 답변 찾기
    for (let key in e.namedValues) {
      if (key.includes('이름') || key.includes('성명') || key.includes('성함')) {
        let val = String(e.namedValues[key][0] || '').trim();
        if (val) {
          submitterName = val;
          break;
        }
      }
    }
    
    // 이름이 없는 경우 이메일이라도 추출 시도
    if (submitterName === '알 수 없음') {
      for (let key in e.namedValues) {
        if (key.includes('메일') || key.toLowerCase().includes('email')) {
          let val = String(e.namedValues[key][0] || '').trim();
          if (val) {
            submitterName = val.split('@')[0];
            break;
          }
        }
      }
    }
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formUrl = ss.getUrl() + '#gid=' + sheet.getSheetId();
  
  const title = "🎉 신규 온보딩 설문 도착";
  const subtitle = submitterName + "님의 " + surveyType + " 설문이 방금 제출되었습니다!";
  
  const fields = [
    { label: "설문 종류", text: surveyType },
    { label: "제출자", text: submitterName },
    { label: "제출 일시", text: timestamp }
  ];
  
  OpsNotify_sendCardMessage_(title, subtitle, formUrl, fields);
}

function OpsNotify_sendCardMessage_(title, subtitle, btnUrl, fields) {
  const webhook = PropertiesService.getScriptProperties().getProperty('CHAT_WEBHOOK');
  if (!webhook) {
    Logger.log('[OPS_NOTIFY][SKIP] CHAT_WEBHOOK 없음 (Card)');
    return;
  }
  
  const widgets = fields.map(function(f) {
    return {
      "decoratedText": {
        "topLabel": f.label,
        "text": f.text
      }
    };
  });
  
  widgets.push({
    "buttonList": {
      "buttons": [
        {
          "text": "📄 응답 보러가기",
          "onClick": {
            "openLink": {
              "url": btnUrl
            }
          }
        }
      ]
    }
  });

  const payload = {
    "cardsV2": [
      {
        "cardId": "surveyResultCard",
        "card": {
          "header": {
            "title": title,
            "subtitle": subtitle,
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Google_Forms_2020_Logo.svg/512px-Google_Forms_2020_Logo.svg.png",
            "imageType": "CIRCLE"
          },
          "sections": [
            {
              "widgets": widgets
            }
          ]
        }
      }
    ]
  };

  UrlFetchApp.fetch(webhook, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

