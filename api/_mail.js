// Mail-skabeloner til skibbywatch.dk.
// Bygget med tabeller og inline-styles, så de ser rigtige ud i Gmail, Outlook og Apple Mail.
// Billeder hentes fra sitet (absolutte URL'er), og JPEG bruges, da Outlook ikke viser WebP.

const C = {
  paper: '#F4F3EE',
  paper2: '#ECEAE3',
  white: '#FFFFFF',
  ink: '#1D1D1B',
  inkSoft: '#4B4B47',
  steel: '#676C70',
  line: '#E4E2DA',
  gold: '#C0974A',
  goldInk: '#8A6419',
  stone: '#494743',
};
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Helvetica,Arial,sans-serif";

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kr = (n) => `${Math.round(n).toLocaleString('da-DK')} kr.`;

const label = (t, color = C.steel) =>
  `<span style="font-family:${SANS};font-size:10px;line-height:14px;letter-spacing:2.4px;text-transform:uppercase;color:${color};font-weight:bold">${esc(t)}</span>`;

// Fælles ramme: lys baggrund, hvidt kort med guldlinje, mørk footer
function frame({ preheader, site, body }) {
  return `<!doctype html>
<html lang="da"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>Skibby Watch</title>
<style>
  @media (max-width:620px){ .px{padding-left:22px!important;padding-right:22px!important} .h1{font-size:30px!important;line-height:34px!important} .stack{display:block!important;width:100%!important} }
  a{color:${C.ink}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper2};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2}">
<tr><td align="center" style="padding:28px 12px 40px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
    <tr><td align="center" style="padding:0 0 20px;font-family:${SANS};font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${C.ink}">
      <a href="${esc(site)}" style="color:${C.ink};text-decoration:none">Skibby&nbsp;<b>Watch</b></a>
    </td></tr>
    <tr><td style="background:${C.white};border-top:2px solid ${C.gold}">
      ${body}
    </td></tr>
    <tr><td style="background:${C.stone};padding:28px 36px" class="px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:${SANS};font-size:13px;line-height:20px;color:#E4E2DA">
          <b style="color:#FFFFFF">Skibby Watch</b> · Limited First Edition<br>
          <span style="color:#C4C7C7">En del af Klub Skibby</span><br>
          <span style="color:#9A9E9E;font-size:11px">Skibby v/ Jesper Skibby · CVR 30022076 · Møllegade 6B, 3250 Gilleleje</span>
        </td>
        <td align="right" style="font-family:${SANS};font-size:12px;line-height:20px;color:#C4C7C7">
          <a href="${esc(site)}" style="color:#D9B977;text-decoration:none">skibbywatch.dk</a><br>
          <a href="mailto:info@skibbywatch.dk" style="color:#C4C7C7;text-decoration:none">info@skibbywatch.dk</a><br>
          <a href="${esc(site)}/handelsbetingelser.html" style="color:#C4C7C7;text-decoration:underline">Handelsbetingelser</a>
        </td>
      </tr></table>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

// Ordrebekræftelse til kunden
function customerOrder({ data, order, site, shipDate }) {
  const first = String(data.kontaktperson || '').trim().split(/\s+/)[0] || '';
  const vat = order.total - order.totalEx;
  const delivery = data.anden_leveringsadresse
    ? [data.levering_att, data.levering_adresse, `${data.levering_postnr} ${data.levering_by}`].filter(Boolean).join(', ')
    : `${data.firmanavn}, ${data.adresse}, ${data.postnr} ${data.by}`;

  const step = (n, title, text) => `
    <tr>
      <td width="40" valign="top" style="padding:0 0 18px">
        <div style="width:28px;height:28px;border-radius:14px;border:1px solid ${C.gold};text-align:center;font-family:${SERIF};font-size:15px;line-height:28px;color:${C.goldInk}">${n}</div>
      </td>
      <td valign="top" style="padding:3px 0 18px;font-family:${SANS};font-size:14px;line-height:21px;color:${C.inkSoft}">
        <b style="color:${C.ink}">${esc(title)}</b><br>${text}
      </td>
    </tr>`;

  const detail = (k, v) => `
    <tr>
      <td width="38%" valign="top" style="padding:11px 0;border-bottom:1px solid ${C.line}">${label(k)}</td>
      <td valign="top" style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:20px;color:${C.ink}">${v}</td>
    </tr>`;

  const body = `
    <img src="${esc(site)}/assets/img/mail-uret.jpg" width="600" alt="Skibby Watch Limited First Edition (AI-genereret billede)" style="display:block;width:100%;max-width:600px;height:auto;border:0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="px" style="padding:36px 44px 8px">
        ${label(`Ordrebekræftelse · ${order.number}`, C.goldInk)}
        <h1 class="h1" style="margin:14px 0 18px;font-family:${SERIF};font-weight:normal;font-size:38px;line-height:42px;color:${C.ink}">Tak for bestillingen${first ? `, ${esc(first)}` : ''}.</h1>
        <p style="margin:0 0 26px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.inkSoft}">
          I har sikret jer ${order.qty} ${order.qty === 1 ? 'eksemplar' : 'eksemplarer'} af første udgave af Skibby Watch. Her er jeres ordre.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:2px solid ${C.gold}">
          <tr><td style="padding:4px 0 4px 18px">
            <p style="margin:0 0 8px;font-family:${SERIF};font-style:italic;font-size:19px;line-height:27px;color:${C.ink}">„Tusind tak, fordi I vil være en del af første udgave. Det glæder mig, at uret nu skal sidde på håndleddet hos jer."</p>
            <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:15px;color:${C.steel}">— Jesper Skibby</p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td class="px" style="padding:30px 44px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ink}">
          <tr>
            <td style="padding:16px 0 4px;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink}">
              <b>${order.qty} × Skibby Watch</b><br><span style="font-size:13px;color:${C.steel}">Limited First Edition · ${kr(order.unit)} pr. stk.</span>
            </td>
            <td align="right" valign="top" style="padding:16px 0 4px;font-family:${SANS};font-size:15px;color:${C.ink};white-space:nowrap">${kr(order.total)}</td>
          </tr>
          <tr><td colspan="2" style="padding:12px 0 0;border-bottom:1px solid ${C.line}"></td></tr>
          <tr>
            <td style="padding:12px 0 2px;font-family:${SANS};font-size:13px;color:${C.steel}">Ekskl. moms</td>
            <td align="right" style="padding:12px 0 2px;font-family:${SANS};font-size:13px;color:${C.steel}">${kr(order.totalEx)}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-family:${SANS};font-size:13px;color:${C.steel}">Moms (25 %)</td>
            <td align="right" style="padding:2px 0;font-family:${SANS};font-size:13px;color:${C.steel}">${kr(vat)}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-family:${SANS};font-size:13px;color:${C.steel}">Levering</td>
            <td align="right" style="padding:2px 0;font-family:${SANS};font-size:13px;color:${C.steel}">Gratis</td>
          </tr>
          <tr>
            <td style="padding:14px 0 0;font-family:${SANS};font-size:15px;color:${C.ink}"><b>I alt inkl. moms</b></td>
            <td align="right" style="padding:10px 0 0;font-family:${SERIF};font-size:28px;line-height:32px;color:${C.ink};white-space:nowrap">${kr(order.total)}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td class="px" style="padding:30px 44px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">
          ${detail('Ordrenummer', esc(order.number))}
          ${detail('Virksomhed', `${esc(data.firmanavn)}<br><span style="color:${C.steel}">CVR ${esc(data.cvr)}${data.ean ? ` · EAN ${esc(data.ean)}` : ''}</span>`)}
          ${detail('Levering', esc(delivery))}
          ${detail('Betaling', `Faktura til ${esc(data.email)}`)}
        </table>
      </td></tr>

      <tr><td class="px" style="padding:32px 44px 8px">
        <p style="margin:0 0 18px">${label('Hvad sker der nu', C.goldInk)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${step(1, 'Faktura', `Vi sender fakturaen til ${esc(data.email)}, når bestillingen er bekræftet.`)}
          ${step(2, 'Afsendelse', `Urene afsendes ${esc(shipDate)} (planlagt). Vi giver lyd, når de er på vej.`)}
          ${step(3, 'Levering', 'Gratis, direkte til adressen.')}
        </table>
      </td></tr>

      <tr><td class="px" style="padding:6px 44px 40px">
        <p style="margin:0;padding-top:22px;border-top:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:22px;color:${C.inkSoft}">
          Spørgsmål til ordren? Svar bare på denne mail.
        </p>
      </td></tr>
    </table>`;

  const text = [
    `Tak for bestillingen${first ? `, ${first}` : ''}.`,
    '',
    `Ordrebekræftelse ${order.number}`,
    `${order.qty} × Skibby Watch Limited First Edition à ${kr(order.unit)}`,
    `I alt: ${kr(order.total)} inkl. moms (${kr(order.totalEx)} ekskl. moms). Levering: gratis.`,
    '',
    `Virksomhed: ${data.firmanavn}, CVR ${data.cvr}${data.ean ? `, EAN ${data.ean}` : ''}`,
    `Levering: ${delivery}`,
    `Betaling: faktura til ${data.email}`,
    '',
    'Hvad sker der nu',
    `1. Faktura: vi sender fakturaen, når bestillingen er bekræftet.`,
    `2. Afsendelse: ${shipDate} (planlagt).`,
    '3. Levering: gratis, direkte til adressen.',
    '',
    '„Tusind tak, fordi I vil være en del af første udgave." — Jesper Skibby',
    '',
    'Spørgsmål? Svar bare på denne mail.',
    'Skibby Watch · skibbywatch.dk',
  ].join('\n');

  return {
    subject: `Ordrebekræftelse ${order.number} – Skibby Watch`,
    html: frame({ preheader: `Tak for bestillingen på ${order.qty} ${order.qty === 1 ? 'ur' : 'ure'}. Afsendes ${shipDate}.`, site, body }),
    text,
  };
}

// Kompakt intern mail: nøgletal øverst, alle felter nedenunder, knap til at svare kunden
function internal({ title, eyebrow, stats, rows, replyTo, replyLabel, site, preheader }) {
  const stat = ([k, v]) => `
    <td class="stack" valign="top" style="padding:0 18px 16px 0">
      ${label(k)}<br>
      <span style="font-family:${SERIF};font-size:26px;line-height:34px;color:${C.ink}">${esc(v)}</span>
    </td>`;
  const row = ([k, v]) => `
    <tr>
      <td width="36%" valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line}">${label(k)}</td>
      <td valign="top" style="padding:8px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:20px;color:${C.ink}">${esc(v || '–')}</td>
    </tr>`;
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="px" style="padding:32px 40px 10px">
        ${label(eyebrow, C.goldInk)}
        <h1 class="h1" style="margin:12px 0 22px;font-family:${SERIF};font-weight:normal;font-size:32px;line-height:36px;color:${C.ink}">${esc(title)}</h1>
        ${stats.length ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${stats.map(stat).join('')}</tr></table>` : ''}
      </td></tr>
      <tr><td class="px" style="padding:0 40px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ink}">${rows.map(row).join('')}</table>
      </td></tr>
      <tr><td class="px" style="padding:26px 40px 36px">
        <a href="mailto:${esc(replyTo)}" style="display:inline-block;background:${C.ink};color:#FFFFFF;font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;text-decoration:none;padding:14px 22px;border:1px solid ${C.gold}">${esc(replyLabel)}</a>
      </td></tr>
    </table>`;
  return frame({ preheader, site, body });
}

function internalOrder({ data, order, site, shipDate }) {
  const rows = [
    ['Ordrenummer', order.number],
    ['Virksomhed', data.firmanavn],
    ['CVR', data.cvr],
    ['EAN', data.ean],
    ['Firmaadresse', `${data.adresse}, ${data.postnr} ${data.by}`],
    ['Levering', data.anden_leveringsadresse
      ? [data.levering_att, data.levering_adresse, `${data.levering_postnr} ${data.levering_by}`].filter(Boolean).join(', ')
      : 'Firmaadressen'],
    ['Kontaktperson', data.kontaktperson],
    ['E-mail', data.email],
    ['Telefon', data.telefon],
    ['Betaling', 'Faktura'],
    ['Afsendes', `${shipDate} (planlagt)`],
  ];
  return {
    subject: `Ny ordre ${order.number}: ${order.qty} stk. – ${data.firmanavn}`,
    html: internal({
      title: data.firmanavn,
      eyebrow: `Ny ordre · ${order.number}`,
      stats: [['Antal', `${order.qty} stk.`], ['I alt inkl. moms', kr(order.total)], ['Ekskl. moms', kr(order.totalEx)]],
      rows,
      replyTo: data.email,
      replyLabel: `Svar ${String(data.kontaktperson || 'kunden').split(/\s+/)[0]}`,
      site,
      preheader: `${order.qty} stk. · ${kr(order.total)} inkl. moms · ${data.kontaktperson}`,
    }),
    text: `Ny ordre ${order.number}\n\nAntal: ${order.qty}\nI alt: ${kr(order.total)} inkl. moms (${kr(order.totalEx)} ekskl. moms)\n\n${rows.map(([k, v]) => `${k}: ${v || '–'}`).join('\n')}`,
  };
}

function internalTalk({ data, site }) {
  const rows = [
    ['Virksomhed', data.firmanavn],
    ['Kontaktperson', data.kontaktperson],
    ['E-mail', data.email],
    ['Telefon', data.telefon],
    ['Dato / anledning', data.besked],
    ['Ordrenummer', data.ordrenummer],
  ];
  return {
    subject: `Foredragsforespørgsel – ${data.firmanavn || data.kontaktperson}`,
    html: internal({
      title: data.firmanavn || data.kontaktperson,
      eyebrow: 'Forespørgsel · Foredrag med Jesper',
      stats: [],
      rows,
      replyTo: data.email,
      replyLabel: `Svar ${String(data.kontaktperson || '').split(/\s+/)[0] || 'kunden'}`,
      site,
      preheader: `${data.kontaktperson} vil høre mere om et foredrag${data.besked ? `: ${data.besked}` : ''}`,
    }),
    text: `Ny forespørgsel på foredrag med Jesper\n\n${rows.map(([k, v]) => `${k}: ${v || '–'}`).join('\n')}`,
  };
}

module.exports = { customerOrder, internalOrder, internalTalk };
