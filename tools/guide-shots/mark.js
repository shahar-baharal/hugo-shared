// usage: eval js="window.__mark('text', n)" — rings the nth visible element whose
// aria-label / placeholder / own text equals `text` ('~text': an option containing it);
// window.__unmark() clears.
window.__mark = (t, n = 0) => {
  const has = t.startsWith('~'), s = has ? t.slice(1) : t;
  const all = [...document.querySelectorAll('button,a,input,[role=option],[role=radio],[role=combobox],[role=button],label,span,div')]
    .filter(e => e.offsetParent && (has
      ? e.getAttribute('role') === 'option' && e.innerText?.includes(s)
      : (e.getAttribute('aria-label') || '') === s || (e.placeholder || '') === s || e.innerText?.trim() === s));
  const e = all[n]; if (!e) return 'none';
  e.dataset.mk = e.getAttribute('style') || '';
  e.style.outline = '4px solid #e11d48'; // full-width rows: draw inside, or the screen edge clips the sides
  e.style.outlineOffset = e.getBoundingClientRect().width > innerWidth - 16 ? '-4px' : '4px'; e.style.borderRadius = '8px';
  e.scrollIntoView({ block: 'center' }); return all.length;
};
window.__unmark = () => document.querySelectorAll('[data-mk]').forEach(e => { e.setAttribute('style', e.dataset.mk); delete e.dataset.mk; });
