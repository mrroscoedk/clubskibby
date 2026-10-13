/* Skibby Watch — kvitteringsside */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const api = document.body.dataset.api;
  const kr = (n) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(n);

  // Ordren gemmes af forsiden lige før den sender kunden hertil.
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem('skibby-order') || 'null'); } catch {}

  if (order) {
    const first = (order.contact || '').trim().split(/\s+/)[0];
    if (first) $('#thanks-name').textContent = `, ${first}`;
    if (order.number) $('#order-no').textContent = ` · ${order.number}`;
    $('#r-number').textContent = order.number || '–';
    $('#r-qty').textContent = `${order.qty} × Skibby Watch Limited First Edition`;
    $('#r-total').textContent = `${kr(order.total)} inkl. moms`;
    $('#r-total-ex').textContent = `(${kr(Math.round(order.total / 1.25))} ekskl. moms)`;
    $('#r-email').textContent = order.email;
    $('#receipt').hidden = false;
    if (order.preview) $('#receipt-note').textContent = 'Preview: bestillingen er ikke sendt, og der er ikke sendt nogen mail.';

    // Foredragsformularen er udfyldt på forhånd med oplysningerne fra bestillingen.
    $('#t-name').value = order.contact || '';
    $('#t-email').value = order.email || '';
    $('#t-phone').value = order.phone || '';
    $('#t-company').value = order.company || '';
    $('#t-order').value = order.number || '';
  } else {
    $('#receipt-note').textContent = 'Du modtager en ordrebekræftelse på mail.';
  }

  // Foredrag: send forespørgslen
  const form = $('#talk-form');
  const status = $('#talk-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    const fields = [...form.querySelectorAll('input[required]')];
    const bad = fields.filter((el) => !el.checkValidity());
    fields.forEach((el) => {
      const wrap = el.closest('.field');
      wrap.classList.toggle('is-invalid', bad.includes(el));
      let err = wrap.querySelector('.err');
      if (!err) { err = document.createElement('span'); err.className = 'err'; wrap.append(err); }
      err.textContent = bad.includes(el) ? el.dataset.error : '';
    });
    if (bad.length) { bad[0].focus(); return; }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    status.textContent = 'Sender …';
    try {
      if (api) {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || res.status);
        status.textContent = 'Tak. Vi kontakter dig om et foredrag med Jesper.';
        form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
      } else {
        status.textContent = 'Preview: forespørgslen er ikke sendt.';
        btn.disabled = false;
      }
      status.classList.add('is-ok');
    } catch {
      status.textContent = 'Det gik ikke igennem. Prøv igen, eller skriv til info@skibbywatch.dk.';
      status.classList.add('is-error');
      btn.disabled = false;
    }
  });
})();
