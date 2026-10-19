const agendaPage = document.querySelector('.agenda-page');
const agendaMapStart = agendaPage?.querySelector('.schedule-row:nth-child(2)');
for (const oceanPage of document.querySelectorAll('.agenda-page,.letter-page')) {
  const mapArtwork = document.createElement('div');
  mapArtwork.className = 'ocean-map-art';
  mapArtwork.setAttribute('aria-hidden', 'true');
  const filterId = `map-color-${oceanPage.dataset.page}`;
  mapArtwork.innerHTML = `<svg viewBox="0 1430 1440 450" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><filter id="${filterId}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .35 0 0 0 0 .8 0 0 0 0 1 0 5 0 0 -3.14"/></filter></defs><image href="/assets/images/home-sea-2026.webp" width="1440" height="2700" filter="url(#${filterId})"/></svg>`;
  oceanPage.prepend(mapArtwork);
}
export function positionAgendaMap() {
  if (agendaMapStart && !agendaPage.hidden) {
    const top = agendaMapStart.getBoundingClientRect().top - agendaPage.getBoundingClientRect().top;
    agendaPage.style.setProperty('--agenda-map-top', `${top}px`);
    const programTitle = agendaPage.querySelector('.program-title');
    const programTop =
      programTitle.getBoundingClientRect().top - agendaPage.getBoundingClientRect().top;
    agendaPage.style.setProperty('--agenda-gradient-end', `${programTop}px`);
  }
  const letterPage = document.querySelector('.letter-page');
  const letterStart = letterPage?.querySelector('.english-horizon');
  if (letterStart && !letterPage.hidden) {
    const top = letterStart.getBoundingClientRect().bottom - letterPage.getBoundingClientRect().top;
    letterPage.style.setProperty('--letter-map-top', `${top}px`);
    const welcomeTitle = letterPage.querySelector('.welcome-title');
    if (welcomeTitle) {
      const gradientEnd =
        welcomeTitle.getBoundingClientRect().top - letterPage.getBoundingClientRect().top;
      letterPage.style.setProperty('--letter-gradient-end', `${gradientEnd}px`);
    }
    const closingParagraph = letterPage.querySelector('.english-horizon + p + p');
    if (closingParagraph) {
      const mobileTop =
        closingParagraph.getBoundingClientRect().top - letterPage.getBoundingClientRect().top;
      letterPage.style.setProperty('--letter-mobile-map-top', `${mobileTop}px`);
    }
  }
}
if (agendaMapStart) {
  const agendaObserver = new ResizeObserver(positionAgendaMap);
  agendaObserver.observe(agendaPage);
  agendaObserver.observe(agendaPage.querySelector('.agenda-content'));
  agendaObserver.observe(document.querySelector('.letter-page'));
  agendaObserver.observe(document.querySelector('.letter-content'));
  document.fonts.ready.then(positionAgendaMap);
}
