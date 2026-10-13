// Vercel-funktion: modtager formularerne fra skibbywatch.dk.
// 1) gemmer i Google Sheet (via Apps Script-webappen)
// 2) sender mails via Resend:
//    - erhvervsbestilling: ordrebekræftelse til kunden + besked om ny ordre internt
//    - foredrag: besked internt om en foredragsforespørgsel
//    - venteliste: ingen mails
//
// Miljøvariabler (Vercel → Settings → Environment Variables):
//   SHEETS_URL         Apps Script-webappens /exec-adresse
//   RESEND_API_KEY     API-nøgle fra resend.com
//   MAIL_FROM          afsender, fx "Skibby Watch <ordre@skibbywatch.dk>" (domænet skal være verificeret i Resend)
//   MAIL_REPLY_TO      (valgfri) svar-adresse på ordrebekræftelsen, fx jesper@skibbyur.dk
//   ORDER_NOTIFY_TO    modtager(e) af "ny ordre", kommasepareret
//   TALK_NOTIFY_TO     modtager(e) af foredragsforespørgsler, kommasepareret (falder tilbage til ORDER_NOTIFY_TO)

const PRICE = { intro: 1495, regular: 1795, introUntil: Date.parse('2026-11-15T00:00:00+01:00'), vat: 0.25 };
const SHIP_DATE = '25. januar 2027';

const FORMS = {
  venteliste: { required: ['navn', 'email'] },
  erhvervsbestilling: {
    required: ['antal', 'firmanavn', 'cvr', 'adresse', 'postnr', 'by', 'kontaktperson', 'email', 'telefon'],
  },
  foredrag: { required: ['kontaktperson', 'email'] },
};

const kr = (n) => `${Math.round(n).toLocaleString('da-DK')} kr.`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SKB-${ymd}-${rnd}`;
}

async function toSheet(data) {
  if (!process.env.SHEETS_URL) throw new Error('SHEETS_URL mangler');
  const res = await fetch(process.env.SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
    redirect: 'follow',
  });
  const text = await res.text();
  if (!res.ok || text.trim() !== 'ok') throw new Error(`Google Sheet svarede: ${res.status} ${text.slice(0, 120)}`);
}

async function sendMail({ to, subject, html, text, replyTo }) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !to.length) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html, text, reply_to: replyTo || undefined }),
  });
  if (!res.ok) throw new Error(`Resend: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return true;
}

// Fælles, enkel mail-skabelon i sidens farver
const layout = (body) => `<!doctype html><html lang="da"><body style="margin:0;background:#F4F3EE;font-family:Helvetica,Arial,sans-serif;color:#1D1D1B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-top:2px solid #C0974A" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 28px">
<p style="margin:0 0 24px;font-size:12px;letter-spacing:.3em;text-transform:uppercase">Skibby <b>Watch</b></p>
${body}
</td></tr></table>
<p style="font-size:12px;color:#676C70;margin:16px 0 0">Skibby Watch · Limited First Edition · skibbywatch.dk</p>
</td></tr></table></body></html>`;

const rowsHtml = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #E9E8E1">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#676C70;border-bottom:1px solid #E9E8E1;width:40%">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #E9E8E1">${esc(v)}</td></tr>`).join('')}
</table>`;
const rowsText = (rows) => rows.map(([k, v]) => `${k}: ${v}`).join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Kun POST' });

  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
  const form = body['form-name'];
  const spec = FORMS[form];
  if (!spec) return res.status(400).json({ ok: false, error: 'Ukendt formular' });
  if (body['bot-field']) return res.status(200).json({ ok: true }); // spam-robot

  // Kun tekstfelter, korte værdier
  const data = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'bot-field' || typeof v !== 'string' || Object.keys(data).length > 60) continue;
    data[k] = v.trim().slice(0, 500);
  }
  const missing = spec.required.filter((k) => !data[k]);
  if (missing.length || !isEmail(data.email)) {
    return res.status(400).json({ ok: false, error: 'Udfyld de påkrævede felter', missing });
  }

  let order;
  if (form === 'erhvervsbestilling') {
    const qty = Math.max(1, Math.min(500, parseInt(data.antal, 10) || 1));
    const unit = Date.now() < PRICE.introUntil ? PRICE.intro : PRICE.regular;
    const total = qty * unit;
    order = { number: orderNumber(), qty, unit, total, totalEx: total / (1 + PRICE.vat) };
    Object.assign(data, {
      antal: String(qty),
      ordrenummer: order.number,
      stykpris_inkl_moms: String(unit),
      total_inkl_moms: String(total),
    });
  }

  try {
    await toSheet(data);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: 'Kunne ikke gemme' });
  }

  // Mails: en fejl her må ikke få kunden til at bestille igen, så den logges kun.
  const mails = [];
  try {
    if (form === 'erhvervsbestilling') {
      const delivery = data.anden_leveringsadresse
        ? [data.levering_att, data.levering_adresse, `${data.levering_postnr} ${data.levering_by}`].filter(Boolean).join(', ')
        : `${data.adresse}, ${data.postnr} ${data.by}`;
      const summary = [
        ['Ordrenummer', order.number],
        ['Antal', `${order.qty} × Skibby Watch Limited First Edition`],
        ['Pris pr. stk.', `${kr(order.unit)} inkl. moms`],
        ['I alt', `${kr(order.total)} inkl. moms (${kr(order.totalEx)} ekskl. moms)`],
        ['Virksomhed', `${data.firmanavn}, CVR ${data.cvr}${data.ean ? `, EAN ${data.ean}` : ''}`],
        ['Levering', delivery],
        ['Betaling', 'Faktura'],
        ['Forventet afsendelse', `${SHIP_DATE} (planlagt)`],
      ];

      mails.push(sendMail({
        to: [data.email],
        replyTo: process.env.MAIL_REPLY_TO,
        subject: `Ordrebekræftelse ${order.number} – Skibby Watch`,
        html: layout(`<h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 12px">Tak for bestillingen, ${esc(data.kontaktperson)}.</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">Vi har modtaget jeres bestilling på ${order.qty} ${order.qty === 1 ? 'ur' : 'ure'} fra første udgave. Fakturaen sendes til denne e-mail, når bestillingen er bekræftet.</p>
${rowsHtml(summary)}
<p style="font-size:15px;line-height:1.6;margin:24px 0 0">Har I spørgsmål, så svar bare på denne mail.</p>`),
        text: `Tak for bestillingen, ${data.kontaktperson}.\n\nVi har modtaget jeres bestilling. Fakturaen sendes til denne e-mail, når bestillingen er bekræftet.\n\n${rowsText(summary)}\n\nHar I spørgsmål, så svar bare på denne mail.`,
      }));

      const internal = summary.concat([
        ['Kontaktperson', data.kontaktperson],
        ['E-mail', data.email],
        ['Telefon', data.telefon],
        ['Firmaadresse', `${data.adresse}, ${data.postnr} ${data.by}`],
      ]);
      mails.push(sendMail({
        to: list(process.env.ORDER_NOTIFY_TO),
        replyTo: data.email,
        subject: `Ny ordre ${order.number}: ${order.qty} stk. – ${data.firmanavn}`,
        html: layout(`<h1 style="font-size:20px;margin:0 0 16px">Ny erhvervsbestilling</h1>${rowsHtml(internal)}`),
        text: `Ny erhvervsbestilling\n\n${rowsText(internal)}`,
      }));
    }

    if (form === 'foredrag') {
      const rows = [
        ['Virksomhed', data.firmanavn || '–'],
        ['Kontaktperson', data.kontaktperson],
        ['E-mail', data.email],
        ['Telefon', data.telefon || '–'],
        ['Ordrenummer', data.ordrenummer || '–'],
        ['Besked', data.besked || '–'],
      ];
      mails.push(sendMail({
        to: list(process.env.TALK_NOTIFY_TO || process.env.ORDER_NOTIFY_TO),
        replyTo: data.email,
        subject: `Foredragsforespørgsel – ${data.firmanavn || data.kontaktperson}`,
        html: layout(`<h1 style="font-size:20px;margin:0 0 16px">Ny forespørgsel på foredrag med Jesper</h1>${rowsHtml(rows)}`),
        text: `Ny forespørgsel på foredrag med Jesper\n\n${rowsText(rows)}`,
      }));
    }
    await Promise.all(mails);
  } catch (err) {
    console.error('Mail fejlede:', err);
  }

  return res.status(200).json({ ok: true, order: order && { number: order.number, qty: order.qty, total: order.total } });
};
