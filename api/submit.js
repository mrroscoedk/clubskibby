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
//   MAIL_REPLY_TO      (valgfri) svar-adresse på ordrebekræftelsen, fx info@skibbywatch.dk
//   ORDER_NOTIFY_TO    modtager(e) af "ny ordre", kommasepareret
//   TALK_NOTIFY_TO     modtager(e) af foredragsforespørgsler, kommasepareret (falder tilbage til ORDER_NOTIFY_TO)
//   SITE_URL           (valgfri) sitets adresse til billeder i mails, fx https://skibbywatch.dk

const mail = require('./_mail');

const PRICE = { intro: 1495, regular: 1795, introUntil: Date.parse('2026-11-15T00:00:00+01:00'), vat: 0.25 };
const SHIP_DATE = '25. januar 2027';

const FORMS = {
  venteliste: { required: ['navn', 'email'] },
  erhvervsbestilling: {
    required: ['antal', 'firmanavn', 'cvr', 'adresse', 'postnr', 'by', 'kontaktperson', 'email', 'telefon'],
  },
  foredrag: { required: ['kontaktperson', 'email'] },
};

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
  const site = (process.env.SITE_URL || `https://${req.headers.host || 'skibbywatch.dk'}`).replace(/\/$/, '');
  const mails = [];
  try {
    if (form === 'erhvervsbestilling') {
      const confirmation = mail.customerOrder({ data, order, site, shipDate: SHIP_DATE });
      mails.push(sendMail({ to: [data.email], replyTo: process.env.MAIL_REPLY_TO, ...confirmation }));
      const notify = mail.internalOrder({ data, order, site, shipDate: SHIP_DATE });
      mails.push(sendMail({ to: list(process.env.ORDER_NOTIFY_TO), replyTo: data.email, ...notify }));
    }
    if (form === 'foredrag') {
      const notify = mail.internalTalk({ data, site });
      mails.push(sendMail({ to: list(process.env.TALK_NOTIFY_TO || process.env.ORDER_NOTIFY_TO), replyTo: data.email, ...notify }));
    }
    const results = await Promise.allSettled(mails);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Mail fejlede:', r.reason));
  } catch (err) {
    console.error('Mail fejlede:', err);
  }

  return res.status(200).json({ ok: true, order: order && { number: order.number, qty: order.qty, total: order.total } });
};
