# skibbyclub.dk — Skibby Watch Limited First Edition

Statisk landingsside (HTML/CSS/JS, ingen build). Åbn `index.html` direkte i browseren.

## Billeder (placeholders)
Læg billederne fra skibbyur.dk i `assets/img/` med disse navne. Mangler et billede, vises en stribet pladsholder med filnavnet.

| Fil | Bruges til |
| --- | --- |
| `hero.jpg` | Hovedbillede i toppen (4:5 / 1:1 på mobil) |
| `jesper.jpg` | Jesper Skibby i historie-sektionen (vises i sort/hvid) |
| `detail-1.jpg` | Urskive tæt på (stort galleribillede) |
| `detail-2.jpg` | Bagside / gravering |
| `detail-3.jpg` | På håndleddet |
| `product.jpg` | Produktbillede ved køb (1:1) |

## Mangler / skal bekræftes
- Pris og lager: `CONFIG` i `assets/js/main.js` (`unitPrice`, `left`, `maxPerOrder`).
- Checkout: formularen sender eventet `skibby:add-to-cart` med `{ qty }` — kobles på Shopify/Stripe.
- Specs, leveringstid, Jesper-citat og USP'er markeret med rød `[...]` i `index.html`.

## Palette
| Token | Hex | |
| --- | --- | --- |
| `--paper` | `#F2EEE6` | baggrund |
| `--paper-2` | `#E7E1D5` | flader |
| `--ink` | `#1B1C1E` | tekst / knapper |
| `--fjord` | `#5E6E73` | sekundær |
| `--clay` | `#B4532F` | accent |
