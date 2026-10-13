# Gem formularer i et privat Google Sheet

Ventelisten og erhvervsbestillingerne sendes til et Google Sheet via en lille Apps Script-webapp.
Det er gratis, virker med Vercel (og alle andre hosts), og arket forbliver privat:
kun scriptet kan skrive i det, og kun de personer, du deler arket med, kan læse det.

## Opsætning (ca. 5 minutter)

1. **Opret arket.** Gå til sheets.new med jeres firmakonto, og kald det fx "Skibby Watch – formularer".
2. **Indsæt scriptet.** Vælg *Udvidelser → Apps Script*. Slet det, der står, og indsæt hele indholdet af `Code.gs`. Gem.
   Scriptet beder kun om adgang til netop dette ark (`@OnlyCurrentDoc`) og sender ingen mails.
3. **Udrul som webapp.** Klik *Udrul → Ny udrulning*, vælg typen *Webapp*, og sæt:
   - *Udfør som:* **Mig**
   - *Hvem har adgang:* **Alle**

   Klik *Udrul*, og godkend adgangen (Google advarer, fordi scriptet er dit eget og ikke er gennemgået. Vælg *Avanceret → Gå til projektet*).
4. **Kopiér webappens URL** (den ender på `/exec`), og indsæt den i `assets/js/main.js`:
   ```js
   sheetsUrl: 'https://script.google.com/macros/s/…/exec',
   ```
5. **Test.** Udfyld ventelisten på siden. Der kommer en fane "venteliste" med en ny række.
   Første erhvervsbestilling opretter fanen "erhvervsbestilling".

Ændrer du senere i scriptet, skal du vælge *Udrul → Administrer udrulninger → Rediger → Ny version*, så URL'en forbliver den samme.

## Godt at vide

- **"Alle" betyder kun, at alle kan *sende* til scriptet**, ikke at de kan se arket.
- **Spam:** formularerne har et skjult felt, som robotter udfylder; de rækker gemmes ikke.
- **Bekræftelse:** Google tillader ikke, at siden læser svaret, så siden viser "tak", når forespørgslen er sendt.
  Fejler netværket, får brugeren en fejlbesked og kan prøve igen.
- **GDPR:** brug firmaets Google Workspace-konto (databehandleraftale), nævn ventelisten i privatlivspolitikken,
  og slet listen, når den ikke længere bruges. Samtykket gemmes som "on" i kolonnen *samtykke*.
- **Besked om nye bestillinger:** i arket kan du vælge *Værktøjer → Notifikationsregler → Når der foretages ændringer*,
  så sender Google dig selv en mail, uden at scriptet skal have mailadgang.
- **Eksport:** *Filer → Download → CSV* til fx Mailchimp, når der åbnes for privatpersoner.
