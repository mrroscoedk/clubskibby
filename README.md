# skibbyclub.dk — Skibby Watch Limited First Edition

Statisk landingsside (HTML/CSS/JS, ingen build). Åbn `index.html` direkte i browseren.

## Billeder
Ligger i `assets/img/` (se `assets/img/README.md`). Mangler et billede, vises en stribet pladsholder med filnavnet.

## Bestilling (erhverv) og venteliste
- Priser i `CONFIG` i `assets/js/main.js` er inkl. moms: 1.495 kr. til og med 14. nov. 2026, derefter 1.795 kr. Prisen ekskl. moms beregnes og vises nedenunder.
- Erhvervsformularen (`erhvervsbestilling`): antal, virksomhed (firmanavn, CVR, EAN valgfrit, adresse), kontaktperson, levering (firmaadresse eller anden adresse), betaling med faktura, accept af handelsbetingelser.
- CVR-opslag via cvrapi.dk (`CONFIG.cvr`): 8 cifre i CVR-feltet udfylder firmanavn og adresse; søgning på firmanavn (min. 3 tegn) foreslår ét firma, som udfylder CVR og adresse. Gratis med begrænset antal opslag pr. dag; et token fra cvrapi.dk kan sættes i `CONFIG.cvr.token`. Svarer opslaget ikke, udfylder man bare selv.
- Ventelisten (`venteliste`): navn, e-mail og samtykke.
- Formularerne gemmes i et privat Google Sheet via Apps Script: sæt `CONFIG.sheetsUrl` i `assets/js/main.js`. Opsætning i `google-sheets/README.md`. Er `sheetsUrl` tom, sendes intet, og siden siger det.

## Palette
| Token | Hex | |
| --- | --- | --- |
| `--paper` | `#F2EEE6` | baggrund |
| `--paper-2` | `#E7E1D5` | flader |
| `--ink` | `#1B1C1E` | tekst / knapper |
| `--fjord` | `#5E6E73` | sekundær |
| `--clay` | `#B4532F` | accent |
