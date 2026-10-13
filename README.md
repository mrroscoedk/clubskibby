# skibbywatch.dk — Skibby Watch Limited First Edition

Statisk landingsside (HTML/CSS/JS, ingen build). Åbn `index.html` direkte i browseren.

## Billeder
Ligger i `assets/img/` (se `assets/img/README.md`). Mangler et billede, vises en stribet pladsholder med filnavnet.

## Bestilling (erhverv) og venteliste
- Priser i `CONFIG` i `assets/js/main.js` er inkl. moms: 1.495 kr. til og med 14. nov. 2026, derefter 1.795 kr. Prisen ekskl. moms beregnes og vises nedenunder.
- Erhvervsformularen (`erhvervsbestilling`): antal, virksomhed (firmanavn, CVR, EAN valgfrit, adresse), kontaktperson, levering (firmaadresse eller anden adresse), betaling med faktura, accept af handelsbetingelser.
- CVR-opslag via cvrapi.dk (`CONFIG.cvr`): 8 cifre i CVR-feltet udfylder firmanavn og adresse; søgning på firmanavn (min. 3 tegn) foreslår ét firma, som udfylder CVR og adresse. Gratis med begrænset antal opslag pr. dag; et token fra cvrapi.dk kan sættes i `CONFIG.cvr.token`. Svarer opslaget ikke, udfylder man bare selv.
- Ventelisten (`venteliste`): navn, e-mail og samtykke.
- Formularerne sendes til Vercel-funktionen `api/submit.js` (`CONFIG.apiUrl`), som gemmer i Google Sheet og sender mails via Resend. Opsætning nedenfor.

## Kvitteringsside og foredrag
- Efter en bestilling sendes kunden til `tak.html`: personlig tak fra Jesper, ordreoversigt og et tilbud om foredrag (formularen `foredrag`, udfyldt på forhånd med oplysningerne fra bestillingen).
- Ordren videregives via `sessionStorage`; åbnes siden direkte, vises en generel tak.

## Mails og opsætning på Vercel
`api/submit.js` gemmer hver indsendelse i Google Sheet og sender:
| Formular | Mail |
| --- | --- |
| `erhvervsbestilling` | Ordrebekræftelse til kunden + "Ny ordre" til `ORDER_NOTIFY_TO` |
| `foredrag` | Forespørgsel til `TALK_NOTIFY_TO` |
| `venteliste` | Ingen mail |

1. Opret en gratis konto på resend.com, og verificér domænet `skibbywatch.dk` (Resend viser de DNS-poster, der skal tilføjes).
2. Opret en API-nøgle i Resend.
3. Sæt miljøvariablerne i Vercel → Project → Settings → Environment Variables:
   - `SHEETS_URL` – Apps Script-webappens `/exec`-adresse
   - `RESEND_API_KEY` – nøglen fra trin 2
   - `MAIL_FROM` – fx `Skibby Watch <ordre@skibbywatch.dk>`
   - `MAIL_REPLY_TO` – hvor kundens svar skal hen, fx `info@skibbywatch.dk`
   - `ORDER_NOTIFY_TO` – hvem får "ny ordre" (flere adresser adskilles med komma)
   - `TALK_NOTIFY_TO` – hvem får foredragsforespørgsler
4. Redeploy. Uden Resend-variablerne gemmes indsendelser stadig i arket, men der sendes ingen mails.

Fejler en mail, gemmes ordren stadig, og kunden ser kvitteringssiden; fejlen kan ses i Vercel → Logs.

## Besøgsstatistik

Vercel Web Analytics er indsat som det statiske HTML-snippet (`/_vercel/insights/script.js`) i `<head>` på alle sider – ingen npm-pakke, da sitet ikke bruger Next.js. Slå det til under Vercel → projektet → Analytics → Enable og deploy igen. Det er cookiefrit og anonymt, og det står i privatlivspolitikken.

Custom events (kræver Pro-plan) sendes fra `assets/js/main.js` via `track()`:
- `Bestil klik` – klik på en Bestil-knap, `placering`: header / hero / mobilbar
- `Bestilling startet` – "Bestil som virksomhed" foldes ud, med `antal`
- `Bestilling sendt` – bestillingen er gemt, med `antal`

## Palette
| Token | Hex | |
| --- | --- | --- |
| `--paper` | `#F2EEE6` | baggrund |
| `--paper-2` | `#E7E1D5` | flader |
| `--ink` | `#1B1C1E` | tekst / knapper |
| `--fjord` | `#5E6E73` | sekundær |
| `--clay` | `#B4532F` | accent |
