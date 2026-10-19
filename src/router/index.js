import { titles, pagePaths, pathPages } from './routes.js';
import { validGuest, receipt } from '../state/registration.js';
import { positionAgendaMap } from '../components/ocean-map.js';
const pages = [...document.querySelectorAll('[data-page]')];
export function navigate(page) {
  history.pushState(null, '', pagePaths[page]);
  route(true);
}

function route(shouldFocus = false) {
  const legacy = location.hash.slice(1);
  const path = decodeURI(location.pathname).replace(/\/$/, '');
  const legacyPath = path.slice(1);
  let target = titles[legacy]
    ? legacy
    : pathPages[path] || (titles[legacyPath] ? legacyPath : 'trang-chu');
  if (!titles[target]) target = 'trang-chu';
  if (/^dang-ky-tiec\/[23]$/.test(target) && !validGuest()) target = 'dang-ky-tiec/1';
  if (target === 'thanh-cong' && (!receipt.id || receipt.event !== 'party')) target = 'trang-chu';
  if (target === 'thanh-cong-golf' && (!receipt.id || receipt.event !== 'golf'))
    target = 'trang-chu';
  if (location.pathname !== pagePaths[target] || location.hash)
    history.replaceState(null, '', `${pagePaths[target]}${location.search}`);
  for (const page of pages) page.hidden = page.dataset.page !== target;
  if (target === 'lich-trinh' || target === 'thu-ngo') requestAnimationFrame(positionAgendaMap);
  document.title = `${titles[target]} | Gemadept`;
  window.scrollTo(0, 0);
  if (shouldFocus) document.getElementById('main').focus({ preventScroll: true });
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    if (location.hash !== '#main') route(true);
  });
  window.addEventListener('popstate', () => route(true));
  for (const link of document.querySelectorAll('a[href^="/"]')) {
    const page = pathPages[link.pathname];
    if (!page) continue;
    link.addEventListener('click', (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      navigate(page);
    });
  }
  route();
}
