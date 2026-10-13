/**
 * @OnlyCurrentDoc
 *
 * Skibby Watch – modtager formularer fra skibbywatch.dk og skriver dem i dette Google Sheet.
 * Hver formular får sin egen fane: "venteliste" og "erhvervsbestilling".
 * Scriptet kan kun skrive i dette ene ark og sender ingen mails.
 *
 * Felter tilføjes automatisk: kommer der et felt, som arket ikke har en kolonne til,
 * oprettes kolonnen sidst. Ændringer i formularen kræver derfor ingen ændring her.
 */

// Formularer, der må skrive i arket (= fanernes navne). Kun en ny formular kræver en ændring her.
const FORMS = ['venteliste', 'erhvervsbestilling', 'foredrag'];

// Felter, der aldrig gemmes.
const SKIP = ['form-name', 'bot-field'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  const form = p['form-name'];
  if (FORMS.indexOf(form) === -1) return ContentService.createTextOutput('ukendt formular');

  const fields = Object.keys(p).filter((k) => SKIP.indexOf(k) === -1).slice(0, 60);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(form) || ss.insertSheet(form);

    // Overskrifter: læs dem, der findes, og tilføj nye felter som kolonner til sidst.
    let header = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
      : [];
    if (header.length === 0) header = ['tidspunkt'];
    const added = fields.filter((f) => header.indexOf(f) === -1);
    if (added.length) {
      header = header.concat(added);
      sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Et apostrof foran bevarer foranstillede nuller (postnr, CVR) og forhindrer,
    // at tekst der starter med =, +, - eller @ tolkes som formel.
    const safe = (v) => (v === undefined || v === '' ? '' : "'" + String(v).slice(0, 500));
    const row = header.map((h) => (h === 'tidspunkt' ? new Date() : safe(p[h])));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

// Åbn webappens /exec-adresse i et privat browservindue: står der "Skibby formularer kører",
// er adgangen sat rigtigt. Beder Google om login, står "Hvem har adgang" ikke til "Alle".
function doGet() {
  return ContentService.createTextOutput('Skibby formularer kører');
}

// Kør i editoren (vælg testVenteliste → Kør) for at tjekke, at scriptet kan skrive i arket.
function testVenteliste() {
  doPost({ parameter: { 'form-name': 'venteliste', navn: 'Test', email: 'test@example.com', samtykke: 'on' } });
}
