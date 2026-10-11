# skibbyclub.dk — Skibby Watch Limited First Edition

Statisk landingsside (HTML/CSS/JS, ingen build). Åbn `index.html` direkte i browseren.

## Billeder
Ligger i `assets/img/` (se `assets/img/README.md`). Mangler et billede, vises en stribet pladsholder med filnavnet.

## Pris og forudbestilling
- `CONFIG` i `assets/js/main.js`: introduktionspris 1.495 kr. til og med 14. nov. 2026, derefter 1.795 kr. (skifter automatisk).
- Antalsvælger 1–5. Submit sender eventet `skibby:add-to-cart` med `{ qty }` — checkout (Revolut) er ikke koblet på endnu.
- Jesper-citat markeret med rød `[...]` i `index.html`.

## Palette
| Token | Hex | |
| --- | --- | --- |
| `--paper` | `#F2EEE6` | baggrund |
| `--paper-2` | `#E7E1D5` | flader |
| `--ink` | `#1B1C1E` | tekst / knapper |
| `--fjord` | `#5E6E73` | sekundær |
| `--clay` | `#B4532F` | accent |
