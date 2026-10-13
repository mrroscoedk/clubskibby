/* Skibby Watch — skibbyclub.dk */
(() => {
  // Erhvervspriser i DKK ekskl. moms. Introprisen gælder til og med introUntil.
  const CONFIG = {
    introPrice: 1196,   // 1.495 kr. inkl. moms
    regularPrice: 1436, // 1.795 kr. inkl. moms
    vat: 0.25,
    introUntil: new Date('2026-11-15T00:00:00+01:00'),
    edition: 500,       // ingen grænse pr. ordre; kun oplaget sætter loftet
    // Hvor formularerne sendes hen:
    //   'netlify'  – Netlify Forms (siden skal hostes på Netlify)
    //   en URL     – fx et Formspree-endpoint, modtager JSON
    //   ''         – preview: intet sendes, og det står tydeligt i beskeden
    submitTo: '',
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
  if (!isIntro) {
    $('#regular-price').remove();
    $('#price-note').textContent = 'Pris ekskl. moms. Forventet afsendelse 25. januar 2027.';
  }

  const clamp = (v) => Math.max(1, Math.min(max, Number.isFinite(v) ? Math.round(v) : 1));

  const render = () => {
    const q = clamp(parseInt(input.value, 10));
    input.value = q;
    minus.disabled = q <= 1;
    plus.disabled = q >= max;
    $('#total-price').textContent = fmt(q * unitPrice);
    $('#total-incl').textContent = `${fmt(Math.round(q * unitPrice * (1 + CONFIG.vat)))} inkl. moms`;
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

  // Separat leveringsadresse
  const same = $('#same-address');
  const delivery = $('#delivery-fields');
  const deliveryRequired = ['#d-street', '#d-zip', '#d-city'].map((sel) => $(sel));
  same.addEventListener('change', () => {
    delivery.hidden = same.checked;
    deliveryRequired.forEach((el) => { el.required = !same.checked; });
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
    const data = new FormData(f);
    if (CONFIG.submitTo === 'netlify') {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      return true;
    }
    if (CONFIG.submitTo) {
      const res = await fetch(CONFIG.submitTo, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!res.ok) throw new Error(res.status);
      return true;
    }
    return false; // preview: intet modtager-endpoint sat op
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
