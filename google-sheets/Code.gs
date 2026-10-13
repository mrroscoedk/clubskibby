/**
 * Skibby Watch – modtager formularer fra skibbyclub.dk og skriver dem i dette Google Sheet.
 * Hver formular får sin egen fane: "venteliste" og "erhvervsbestilling".
 * Indsæt i Udvidelser → Apps Script, og udrul som webapp (se README.md).
 */

// Kolonner pr. formular, i den rækkefølge de skal stå i arket.
const COLUMNS = {
  venteliste: ['navn', 'email', 'samtykke'],
  erhvervsbestilling: [
    'antal', 'firmanavn', 'cvr', 'ean', 'adresse', 'postnr', 'by',
    'kontaktperson', 'email', 'telefon',
    'anden_leveringsadresse', 'levering_att', 'levering_adresse', 'levering_postnr', 'levering_by',
    'betaling', 'accept_betingelser',
  ],
};

// Valgfrit: få en mail ved hver ny erhvervsbestilling. Lad stå tom for at slå fra.
const NOTIFY_EMAIL = '';

function doPost(e) {
  const p = e.parameter || {};
  const form = p['form-name'];
  const cols = COLUMNS[form];
  if (!cols) return ContentService.createTextOutput('ukendt formular');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(form) || ss.insertSheet(form);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['tidspunkt'].concat(cols));
      sheet.setFrozenRows(1);
    }
    // Et apostrof foran tal bevarer foranstillede nuller (fx postnr og CVR) og
    // forhindrer, at tekst der starter med =, +, - eller @ tolkes som formel.
    const safe = (v) => (v === undefined || v === '' ? '' : "'" + String(v).slice(0, 500));
    sheet.appendRow([new Date()].concat(cols.map((c) => safe(p[c]))));
  } finally {
    lock.releaseLock();
  }

  if (form === 'erhvervsbestilling' && NOTIFY_EMAIL) {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      `Ny bestilling: ${p.antal} stk. – ${p.firmanavn}`,
      COLUMNS.erhvervsbestilling.map((c) => `${c}: ${p[c] || ''}`).join('\n')
    );
  }
  return ContentService.createTextOutput('ok');
}
