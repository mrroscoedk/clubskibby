/* Skibby Watch — skibbyclub.dk */
(() => {
  // Butiksopsætning. Pris og lager er pladsholdere, til checkout er koblet på.
  const CONFIG = {
    unitPrice: 0,      // TODO: pris i DKK inkl. moms
    maxPerOrder: 5,
    edition: 500,
    left: 500,         // TODO: hentes fra lager/checkout
  };

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
  const hint = $('#qty-hint');
  const max = Math.min(CONFIG.maxPerOrder, CONFIG.left);

  input.max = String(max);
  $('#qty-max').textContent = max;
  $('#stock-left').textContent = CONFIG.left;
  $('#unit-price').textContent = fmt(CONFIG.unitPrice);
  $('#sticky-price').textContent = fmt(CONFIG.unitPrice);

  const clamp = (v) => Math.max(1, Math.min(max, Number.isFinite(v) ? Math.round(v) : 1));

  const render = () => {
    const q = clamp(parseInt(input.value, 10));
    input.value = q;
    minus.disabled = q <= 1;
    plus.disabled = q >= max;
    hint.classList.toggle('is-max', q >= max);
    $('#total-price').textContent = fmt(q * CONFIG.unitPrice);
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
    // TODO: kobl på checkout (fx Shopify / Stripe) med `qty`.
    document.dispatchEvent(new CustomEvent('skibby:add-to-cart', { detail: { qty } }));
    const btn = form.querySelector('[type="submit"]');
    const label = btn.firstChild;
    form.classList.add('is-added');
    label.textContent = `${qty} lagt i kurven `;
    setTimeout(() => {
      form.classList.remove('is-added');
      label.textContent = 'Læg i kurv ';
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
