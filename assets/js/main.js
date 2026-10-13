/* Skibby Watch — skibbyclub.dk */
(() => {
  // Priser i DKK inkl. moms. Introprisen gælder til og med introUntil.
  const CONFIG = {
    introPrice: 1495,
    regularPrice: 1795,
    introUntil: new Date('2026-11-15T00:00:00+01:00'),
    edition: 500,   // ingen grænse pr. ordre; kun oplaget sætter loftet
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
    $('#price-note').textContent = 'Pris inkl. moms. Forventet afsendelse 25. januar 2027.';
    document.querySelector('.hero-facts dt').textContent = 'Pris';
  }

  const clamp = (v) => Math.max(1, Math.min(max, Number.isFinite(v) ? Math.round(v) : 1));

  const render = () => {
    const q = clamp(parseInt(input.value, 10));
    input.value = q;
    minus.disabled = q <= 1;
    plus.disabled = q >= max;
    $('#total-price').textContent = fmt(q * unitPrice);
  };

  form.querySelectorAll('.qty-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      input.value = clamp(parseInt(input.value, 10) + Number(btn.dataset.step));
      render();
    })
  );
  input.addEventListener('change', render);
  input.addEventListener('blur', render);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const qty = clamp(parseInt(input.value, 10));
    // TODO: kobl på checkout (Revolut) med `qty`.
    document.dispatchEvent(new CustomEvent('skibby:add-to-cart', { detail: { qty } }));
    const label = form.querySelector('.btn-label');
    form.classList.add('is-added');
    label.textContent = `${qty} ${qty === 1 ? 'ur' : 'ure'} valgt`;
    setTimeout(() => {
      form.classList.remove('is-added');
      label.textContent = 'Forudbestil';
    }, 2200);
  });

  render();

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
