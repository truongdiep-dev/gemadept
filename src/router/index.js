import { titles, pagePaths, pathPages } from './routes.js';
import { validGuest, receipt } from '../state/registration.js';
import { positionAgendaMap } from '../components/ocean-map.js';
const pages = [...document.querySelectorAll('[data-page]')];
const breadcrumbTrails = {
  'thu-ngo': [['trang-chu', 'TRANG CHỦ'], ['thu-ngo', 'LỜI NGỎ']],
  'lich-trinh': [['trang-chu', 'TRANG CHỦ'], ['lich-trinh', 'LỊCH TRÌNH SỰ KIỆN']],
  'su-kien': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA']],
  'tiec-tri-an': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['tiec-tri-an', 'TIỆC TRI ÂN']],
  golf: [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['golf', 'GOLF TOURNAMENT']],
  'chuong-trinh-golf': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['golf', 'GOLF TOURNAMENT'], ['chuong-trinh-golf', 'CHƯƠNG TRÌNH GOLF']],
  'dang-ky-tiec/1': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['tiec-tri-an', 'TIỆC TRI ÂN'], ['dang-ky-tiec/1', 'THÔNG TIN KHÁCH MỜI']],
  'dang-ky-tiec/2': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['tiec-tri-an', 'TIỆC TRI ÂN'], ['dang-ky-tiec/1', 'THÔNG TIN KHÁCH MỜI'], ['dang-ky-tiec/2', 'THÔNG TIN VÉ MÁY BAY']],
  'dang-ky-tiec/3': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['tiec-tri-an', 'TIỆC TRI ÂN'], ['dang-ky-tiec/1', 'THÔNG TIN KHÁCH MỜI'], ['dang-ky-tiec/2', 'THÔNG TIN VÉ MÁY BAY'], ['dang-ky-tiec/3', 'THÔNG TIN KHÁCH SẠN']],
  'dang-ky-golf': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['golf', 'GOLF TOURNAMENT'], ['dang-ky-golf', 'ĐĂNG KÝ ĐÁNH GOLF']],
  'thanh-cong': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['tiec-tri-an', 'TIỆC TRI ÂN'], ['thanh-cong', 'ĐĂNG KÝ THÀNH CÔNG']],
  'thanh-cong-golf': [['trang-chu', 'TRANG CHỦ'], ['su-kien', 'XÁC NHẬN THAM GIA'], ['golf', 'GOLF TOURNAMENT'], ['thanh-cong-golf', 'ĐĂNG KÝ THÀNH CÔNG']],
};

function mountBreadcrumbs() {
  for (const page of pages) {
    const trail = breadcrumbTrails[page.dataset.page];
    if (!trail) continue;
    const nav = document.createElement('nav');
    nav.className = 'breadcrumbs';
    nav.setAttribute('aria-label', 'Đường dẫn trang');
    const list = document.createElement('ol');
    for (const [key, label] of trail) {
      const item = document.createElement('li');
      const current = key === page.dataset.page;
      const content = document.createElement(current ? 'span' : 'a');
      content.textContent = label;
      if (current) content.setAttribute('aria-current', 'page');
      else content.href = pagePaths[key];
      item.append(content);
      list.append(item);
    }
    nav.append(list);
    if (page.dataset.page === 'chuong-trinh-golf') {
      page.querySelector('.golf-program-hero')?.after(nav);
    } else {
      page.querySelector('.site-header')?.append(nav);
    }
  }
}

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
  const activeNav =
    target === 'thu-ngo' || target === 'lich-trinh'
      ? target
      : target === 'trang-chu'
        ? null
        : 'su-kien';
  for (const link of document.querySelectorAll('.site-nav [data-nav-target]')) {
    if (link.dataset.navTarget === activeNav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (target === 'lich-trinh' || target === 'thu-ngo') requestAnimationFrame(positionAgendaMap);
  document.title = `${titles[target]} | Gemadept`;
  window.scrollTo(0, 0);
  if (shouldFocus) document.getElementById('main').focus({ preventScroll: true });
}

export function initRouter() {
  mountBreadcrumbs();
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
