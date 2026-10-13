/* Skibby Watch — skibbyclub.dk */
(() => {
  // Priser i DKK inkl. moms. Introprisen gælder til og med introUntil.
  const CONFIG = {
    introPrice: 1495,
    regularPrice: 1795,
    vat: 0.25,
    introUntil: new Date('2026-11-15T00:00:00+01:00'),
    edition: 500,       // ingen grænse pr. ordre; kun oplaget sætter loftet
    // Webadressen på Google Apps Script-webappen, der skriver i Google Sheet.
    // Se google-sheets/README.md. Tom = preview: intet sendes, og det står i beskeden.
    sheetsUrl: 'https://script.google.com/a/macros/idealventures.dk/s/AKfycbztOCtY6sI0ulYm_g5zn0PIaaVR9pu7sb6N4BZl4Tuobq9PYJTd_I0F5Pnsgw3DmaeW3Q/exec',
    // Opslag i CVR-registeret via cvrapi.dk (gratis, begrænset antal opslag pr. dag).
    // Sæt token, hvis I køber et abonnement hos cvrapi.dk.
    cvr: { url: 'https://cvrapi.dk/api', token: '' },
  };
  const isIntro = Date.now() < CONFIG.introUntil.getTime();
  const unitPrice = isIntro ? CONFIG.introPrice : CONFIG.regularPrice;

  const fmt = (n) =>
    n > 0
      ? new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(n)
      : 'Pris følger';

  const $ = (sel) => document.querySelector(sel);

  // Billeder der ikke findes, skjules, så pladsholderen står tilbage.
  document.querySelectorAll('.ph img').forEach((img) => {
    const miss = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
  });

  // Antalsvælger
  const form = $('#buy-form');
  const input = $('#qty');
  const minus = form.querySelector('[data-step="-1"]');
  const plus = form.querySelector('[data-step="1"]');
  const max = CONFIG.edition;

  input.max = String(max);
  document.querySelectorAll('#unit-price, #sticky-price, [data-price="unit"]')
    .forEach((el) => { el.textContent = fmt(unitPrice); });
  const exVat = (n) => Math.round(n / (1 + CONFIG.vat));
  $('#unit-ex').textContent = fmt(exVat(unitPrice));
  if (!isIntro) {
    $('#price-note').textContent = 'Forventet afsendelse 25. januar 2027.';
    document.querySelector('.hero-facts dt').textContent = 'Pris';
  }

  const clamp = (v) => Math.max(1, Math.min(max, Number.isFinite(v) ? Math.round(v) : 1));

  const render = () => {
    const q = clamp(parseInt(input.value, 10));
    input.value = q;
    minus.disabled = q <= 1;
    plus.disabled = q >= max;
    $('#total-price').textContent = fmt(q * unitPrice);
    $('#total-ex').textContent = `${fmt(exVat(q * unitPrice))} ekskl. moms`;
  };

  form.querySelectorAll('.qty-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      input.value = clamp(parseInt(input.value, 10) + Number(btn.dataset.step));
      render();
    })
  );
  input.addEventListener('change', render);
  input.addEventListener('blur', render);
  render();

  // Fold firmaformularen ud
  const openBtn = $('#order-open');
  const details = $('#order-details');
  openBtn.addEventListener('click', () => {
    details.hidden = false;
    openBtn.hidden = true;
    openBtn.setAttribute('aria-expanded', 'true');
    $('#company').focus({ preventScroll: true });
    details.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // CVR-opslag: 8 cifre i CVR-feltet udfylder firma og adresse,
  // og søgning på firmanavn foreslår et firma, der udfylder CVR og adresse.
  const cvrInput = $('#cvr');
  const companyInput = $('#company');
  const suggest = $('#company-suggest');
  const cvrHint = $('#cvr-hint');
  const cvrCache = new Map();

  const cvrLookup = async (params) => {
    const key = new URLSearchParams(params).toString();
    if (cvrCache.has(key)) return cvrCache.get(key);
    const q = new URLSearchParams({ ...params, country: 'dk', format: 'json' });
    if (CONFIG.cvr.token) q.set('token', CONFIG.cvr.token);
    const res = await fetch(`${CONFIG.cvr.url}?${q}`);
    const data = await res.json().catch(() => null);
    // NOT_FOUND er et rigtigt svar; alt andet (fx QUOTA_EXCEEDED) betyder, at opslaget ikke kunne laves.
    if (data && data.error === 'NOT_FOUND') { cvrCache.set(key, null); return null; }
    if (!data || data.error || !data.vat) throw new Error(data?.error || res.status);
    cvrCache.set(key, data);
    return data;
  };

  const fillCompany = (c) => {
    companyInput.value = c.name || companyInput.value;
    cvrInput.value = String(c.vat);
    if (c.address) $('#street').value = c.address;
    if (c.zipcode) $('#zip').value = c.zipcode;
    if (c.city) $('#city').value = c.city;
    [companyInput, cvrInput, $('#street'), $('#zip'), $('#city')].forEach((el) => {
      if (el.closest('.is-invalid')) check(el);
    });
    cvrHint.textContent = `Hentet fra CVR: ${c.name}`;
  };

  let lastVat = '';
  cvrInput.addEventListener('input', async () => {
    const vat = cvrInput.value.replace(/\D/g, '');
    if (vat.length !== 8 || vat === lastVat) {
      if (vat.length !== 8) cvrHint.textContent = '';
      return;
    }
    lastVat = vat;
    cvrHint.textContent = 'Slår op i CVR …';
    try {
      const c = await cvrLookup({ vat });
      if (cvrInput.value.replace(/\D/g, '') !== vat) return;
      if (c) fillCompany(c);
      else cvrHint.textContent = 'Intet firma fundet. Udfyld selv felterne.';
    } catch {
      lastVat = '';
      cvrHint.textContent = 'CVR-opslag svarer ikke lige nu. Udfyld selv felterne.';
    }
  });

  const closeSuggest = () => {
    suggest.hidden = true;
    suggest.replaceChildren();
    companyInput.setAttribute('aria-expanded', 'false');
  };
  let searchTimer;
  companyInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const term = companyInput.value.trim();
    if (term.length < 3) return closeSuggest();
    searchTimer = setTimeout(async () => {
      try {
        const c = await cvrLookup({ search: term });
        if (companyInput.value.trim() !== term || !c) return closeSuggest();
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.tabIndex = -1;
        li.innerHTML = '<b></b><span></span>';
        li.querySelector('b').textContent = c.name;
        li.querySelector('span').textContent = `CVR ${c.vat}${c.city ? ` · ${c.city}` : ''}`;
        const pick = () => { fillCompany(c); closeSuggest(); companyInput.focus(); };
        li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(); });
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pick(); } });
        suggest.replaceChildren(li);
        suggest.hidden = false;
        companyInput.setAttribute('aria-expanded', 'true');
      } catch {
        closeSuggest();
      }
    }, 450);
  });
  companyInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !suggest.hidden) { e.preventDefault(); suggest.firstChild.focus(); }
    if (e.key === 'Escape') closeSuggest();
  });
  companyInput.addEventListener('blur', () => setTimeout(() => {
    if (!suggest.contains(document.activeElement)) closeSuggest();
  }, 120));

  // Separat leveringsadresse
  const other = $('#other-address');
  const delivery = $('#delivery-fields');
  const deliveryRequired = ['#d-street', '#d-zip', '#d-city'].map((sel) => $(sel));
  other.addEventListener('change', () => {
    delivery.hidden = !other.checked;
    deliveryRequired.forEach((el) => { el.required = other.checked; });
  });

  // Validering med fejlbesked under feltet
  const fieldError = (el) => {
    const wrap = el.closest('.field, .check');
    let msg = wrap.querySelector('.err');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'err';
      msg.id = `${el.id}-err`;
      wrap.append(msg);
      el.setAttribute('aria-describedby', msg.id);
    }
    return msg;
  };
  const check = (el) => {
    el.value = el.type === 'checkbox' ? el.value : el.value.trim();
    const ok = el.checkValidity();
    el.toggleAttribute('aria-invalid', !ok);
    el.closest('.field, .check')?.classList.toggle('is-invalid', !ok);
    if (el.closest('.field, .check')) fieldError(el).textContent = ok ? '' : el.dataset.error || 'Udfyld feltet.';
    return ok;
  };
  const validate = (f) => {
    const fields = [...f.querySelectorAll('input[required], input[pattern]')].filter((el) => !el.closest('[hidden]'));
    const bad = fields.filter((el) => !check(el));
    if (bad.length) bad[0].focus();
    return bad.length === 0;
  };
  document.querySelectorAll('.order input, .waitlist input').forEach((el) =>
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => {
      if (el.closest('.is-invalid')) check(el);
    })
  );

  // Afsendelse
  const send = async (f) => {
    if (!CONFIG.sheetsUrl) return false; // preview: intet modtager-endpoint sat op
    const data = new FormData(f);
    if (data.get('bot-field')) return true; // spam-robot: lad som om det lykkedes
    data.delete('bot-field');
    // Apps Script svarer ikke på CORS-preflight, så vi sender en "simpel" formular-POST.
    // Svaret kan derfor ikke læses; en netværksfejl kaster stadig, og så vises fejlbeskeden.
    await fetch(CONFIG.sheetsUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(data),
    });
    return true;
  };

  const wire = (f, statusEl, onDone) => {
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.className = 'form-status';
      if (!validate(f)) {
        statusEl.textContent = 'Tjek de markerede felter.';
        statusEl.classList.add('is-error');
        return;
      }
      const btn = f.querySelector('[type="submit"]');
      btn.disabled = true;
      statusEl.textContent = 'Sender …';
      try {
        const sent = await send(f);
        onDone(sent);
      } catch {
        statusEl.textContent = 'Det gik ikke igennem. Prøv igen, eller skriv til jesper@skibbyur.dk.';
        statusEl.classList.add('is-error');
      } finally {
        btn.disabled = false;
      }
    });
  };

  wire(form, $('#order-status'), (sent) => {
    const q = clamp(parseInt(input.value, 10));
    const company = $('#company').value;
    const email = $('#email').value;
    const status = $('#order-status');
    status.classList.add('is-ok');
    status.textContent = sent
      ? `Tak, ${company}. Vi har modtaget bestillingen på ${q} ${q === 1 ? 'ur' : 'ure'}. Fakturaen sendes til ${email}.`
      : `Preview: bestillingen på ${q} ${q === 1 ? 'ur' : 'ure'} er ikke sendt, fordi formularen endnu ikke er koblet til en modtager.`;
  });

  wire($('#waitlist-form'), $('#waitlist-status'), (sent) => {
    const status = $('#waitlist-status');
    status.classList.add('is-ok');
    status.textContent = sent
      ? 'Du er på listen. Vi skriver, så snart der åbnes for privatpersoner.'
      : 'Preview: tilmeldingen er ikke gemt, fordi formularen endnu ikke er koblet til en modtager.';
    if (sent) $('#waitlist-form').reset();
  });

  // Reveal + etapeprofil
  document.querySelectorAll('.section-head, .story-body, .story-media, .gallery, .specs, .buy-panel, .faq-list')
    .forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    }),
    { threshold: 0.15 }
  );
  document.querySelectorAll('.reveal, .stage').forEach((el) => io.observe(el));

  // Sticky køb-bar: vis efter hero, skjul når købssektionen er i view
  const sticky = $('#sticky-buy');
  const hero = $('.hero');
  const buy = $('#koeb');
  let heroGone = false;
  let buyInView = false;
  const updateSticky = () => sticky.classList.toggle('is-visible', heroGone && !buyInView);
  new IntersectionObserver(([en]) => { heroGone = !en.isIntersecting; updateSticky(); }).observe(hero);
  new IntersectionObserver(([en]) => { buyInView = en.isIntersecting; updateSticky(); }).observe(buy);
})();
