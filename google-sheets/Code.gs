/**
 * @OnlyCurrentDoc
 *
 * Skibby Watch – modtager formularer fra skibbyclub.dk og skriver dem i dette Google Sheet.
 * Hver formular får sin egen fane: "venteliste" og "erhvervsbestilling".
 * Indsæt i Udvidelser → Apps Script, og udrul som webapp (se README.md).
 * Scriptet kan kun skrive i dette ene ark og sender ingen mails.
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
  return ContentService.createTextOutput('ok');
}

// Åbn webappens /exec-adresse i et privat browservindue: står der "Skibby formularer kører",
// er adgangen sat rigtigt. Beder Google om login, står "Hvem har adgang" ikke til "Alle".
function doGet() {
  return ContentService.createTextOutput('Skibby formularer kører');
}

// Kør denne i editoren (vælg testVenteliste → Kør) for at tjekke, at scriptet kan skrive i arket.
function testVenteliste() {
  doPost({ parameter: { 'form-name': 'venteliste', navn: 'Test', email: 'test@example.com', samtykke: 'on' } });
}
