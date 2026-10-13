/* Skibby Watch — cookieboks. Siden bruger ingen cookies; boksen informerer kun og huskes, når den er lukket. */
(() => {
  const KEY = 'skibby-cookie-ok';
  try { if (localStorage.getItem(KEY)) return; } catch {}
  const box = document.createElement('div');
  box.className = 'cookie-box';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Cookies');
  box.innerHTML =
    '<p>Vi bruger ingen cookies. Vi tæller kun besøg anonymt. <a href="privatlivspolitik.html#cookies">Læs mere</a></p>' +
    '<button type="button" class="btn btn-sm">Accepter</button>';
  box.querySelector('button').addEventListener('click', () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    box.remove();
  });
  document.body.append(box);
})();
