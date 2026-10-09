'use strict';
const pages = [...document.querySelectorAll('[data-page]')];
const forms = [...document.querySelectorAll('.registration-form')];
const storageKey = 'gemadept-rsvp-draft-v1';
const readSession = key => { try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; } };
let draft = readSession(storageKey);
let receipt = readSession('gemadept-receipt');
let submitting = false;
const saveDraft = () => { try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch {} };
const formData = form => Object.fromEntries([...new FormData(form)].map(([key, val]) => [key, String(val).trim()]));
const titles = {'trang-chu':'Tiệc tri ân khách hàng 2026','thu-ngo':'Thư ngỏ','lich-trinh':'Lịch trình sự kiện','su-kien':'Xác nhận tham gia','tiec-tri-an':'Partner Appreciation Party 2026','golf':'Golf Tournament 2026','chuong-trinh-golf':'Chương trình Golf Tournament','dang-ky-tiec/1':'Thông tin khách mời','dang-ky-tiec/2':'Thông tin vé máy bay','dang-ky-tiec/3':'Thông tin khách sạn','dang-ky-golf':'Đăng ký đánh golf','thanh-cong':'Đăng ký thành công'};
for (const select of document.querySelectorAll('[data-time-slots]')) {
  for (let hour = 0; hour < 24; hour++) {
    const start = `${String(hour).padStart(2,'0')}:00`;
    const end = `${String((hour + 2) % 24).padStart(2,'0')}:00`;
    select.add(new Option(`${start} – ${end}${hour >= 22 ? ' (+1 ngày)' : ''}`, `${start}-${end}`));
  }
}
for (const form of forms) {
  const saved = draft[form.dataset.step];
  if (saved && typeof saved === 'object') for (const [key,value] of Object.entries(saved)) {
    const field = form.elements.namedItem(key); if (field && typeof value === 'string') field.value = value;
  }
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    draft[form.dataset.step] = formData(form); saveDraft();
  });
  form.addEventListener('change', () => { draft[form.dataset.step] = formData(form); saveDraft(); });
}
function validGuest() { return ['company','name','position'].every(key => draft.guest?.[key]?.trim()); }
function showReceipt() {
  document.getElementById('receipt').textContent = receipt.id ? `Mã đăng ký: ${receipt.id}` : '';
}
function route(shouldFocus = false) {
  let target = location.hash.slice(1) || location.pathname.replace(/^\/+|\/+$/g, '') || 'trang-chu';
  if (!titles[target]) target = 'trang-chu';
  if (/^dang-ky-tiec\/[23]$/.test(target) && !validGuest()) target = 'dang-ky-tiec/1';
  if (target === 'thanh-cong' && !receipt.id) target = 'trang-chu';
  if (location.pathname !== '/' || location.hash !== `#${target}`) history.replaceState(null, '', `/${location.search}#${target}`);
  for (const page of pages) page.hidden = page.dataset.page !== target;
  document.title = `${titles[target]} | Gemadept`;
  if (target === 'thanh-cong') showReceipt();
  window.scrollTo(0,0);
  if (shouldFocus) document.getElementById('main').focus({preventScroll:true});
}
function validateDates(form, first, second, message, paired = false) {
  const a = form.elements.namedItem(first), b = form.elements.namedItem(second);
  let error = form.querySelector('.date-error');
  if (!error) {
    error = document.createElement('p');
    error.className = 'form-error date-error';
    error.setAttribute('role', 'alert');
    (form.querySelector('.form-actions, .confirm-button') || form.lastElementChild).before(error);
  }
  let text = '';
  if (paired && Boolean(a.value) !== Boolean(b.value))
    text = 'Vui lòng chọn đủ ngày nhận và trả phòng.';
  else if (a.value && b.value && b.value < a.value)
    text = message;
  error.textContent = text;
  error.hidden = !text;
  if (text) error.scrollIntoView({block:'center', behavior:'smooth'});
  return !text;
}
async function submitRegistration(form, event) {
  if (submitting) return;
  if (event === 'party' && !validGuest()) { location.hash = 'dang-ky-tiec/1'; return; }
  const error = form.querySelector('.form-error');
  const button = form.querySelector('[type=submit]');
  const label = button.textContent;
  error.hidden = true;
  submitting = true; button.disabled = true; button.textContent = 'ĐANG GỬI / SUBMITTING…';
  form.setAttribute('aria-busy','true');
  const idKey = `${event}RequestId`;
  draft[idKey] ||= crypto.randomUUID(); saveDraft();
  const fields = event === 'party' ? {...draft.guest,...draft.flight,...draft.hotel} : {...draft.golf};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify({event,requestId:draft[idKey],...fields}),signal:controller.signal});
    let result;
    try { result = await response.json(); } catch { throw new Error('Chưa thể kết nối nơi nhận đăng ký. Vui lòng thử lại sau.'); }
    if (!response.ok || !result.ok || !result.id) throw new Error(result.message || 'Chưa lưu được đăng ký. Vui lòng thử lại.');
    receipt = {id:result.id,event};
    try { sessionStorage.setItem('gemadept-receipt', JSON.stringify(receipt)); } catch {}
    if (event === 'party') { for (const step of ['guest','flight','hotel']) { delete draft[step]; document.querySelector(`[data-step="${step}"]`).reset(); } }
    else { delete draft.golf; form.reset(); }
    delete draft[idKey]; saveDraft();
    location.hash = 'thanh-cong';
  } catch (err) {
    error.textContent = err.name === 'AbortError' ? 'Kết nối mất nhiều thời gian. Vui lòng thử gửi lại; hệ thống sẽ tránh ghi trùng đăng ký.' : (err.message || 'Mất kết nối. Vui lòng kiểm tra mạng và thử lại.');
    error.hidden = false; error.scrollIntoView({block:'center',behavior:'smooth'});
  } finally { clearTimeout(timeout); submitting = false; button.disabled = false; button.textContent = label; form.removeAttribute('aria-busy'); }
}
for (const form of forms) form.addEventListener('submit', event => {
  event.preventDefault();
  for (const field of form.querySelectorAll('input[required]')) {
    field.setCustomValidity(field.value.trim() ? '' : 'Vui lòng nhập thông tin này.');
  }
  if (!form.reportValidity()) return;
  draft[form.dataset.step] = formData(form); saveDraft();
  switch (form.dataset.step) {
    case 'guest': location.hash = 'dang-ky-tiec/2'; break;
    case 'flight': if (validateDates(form,'departureDate','returnDate','Ngày về phải bằng hoặc sau ngày đi.')) location.hash = 'dang-ky-tiec/3'; break;
    case 'hotel': if (validateDates(form,'checkIn','checkOut','Ngày trả phòng phải bằng hoặc sau ngày nhận phòng.',true)) submitRegistration(form,'party'); break;
    case 'golf': submitRegistration(form,'golf'); break;
  }
});

const customSelects = [];
for (const select of document.querySelectorAll('.registration-form select')) {
  const originalLabel = select.closest('label');
  if (!originalLabel) continue;
  const caption = [...originalLabel.childNodes]
    .filter(node => node !== select)
    .map(node => node.textContent).join('').trim();
  const index = customSelects.length + 1;
  const field = document.createElement('div');
  field.className = 'select-field';
  const fieldLabel = document.createElement('span');
  fieldLabel.className = 'select-label';
  fieldLabel.id = 'select-label-' + index;
  fieldLabel.textContent = caption;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.id = 'select-trigger-' + index;
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-labelledby', fieldLabel.id + ' ' + trigger.id);
  const menu = document.createElement('div');
  menu.className = 'select-options';
  menu.id = 'select-options-' + index;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', fieldLabel.id);
  menu.hidden = true;
  trigger.setAttribute('aria-controls', menu.id);
  const items = [...select.options].map((option, optionIndex) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'select-option';
    item.setAttribute('role', 'option');
    item.id = 'select-option-' + index + '-' + optionIndex;
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    menu.append(item);
    return item;
  });
  const refresh = () => {
    trigger.textContent = select.selectedOptions[0]?.textContent || select.options[0]?.textContent || '';
    items.forEach((item, itemIndex) =>
      item.setAttribute('aria-selected', String(itemIndex === select.selectedIndex)));
  };
  const close = () => {
    menu.hidden = true;
    field.classList.remove('is-open', 'open-up');
    trigger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    customSelects.forEach(control => control.close());
    menu.hidden = false;
    field.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    field.classList.toggle('open-up',
      trigger.getBoundingClientRect().bottom + Math.min(menu.scrollHeight, 320) > innerHeight - 16
      && trigger.getBoundingClientRect().top > Math.min(menu.scrollHeight, 320));
    (items[select.selectedIndex] || items[0])?.focus();
  };
  items.forEach(item => item.addEventListener('click', () => {
    select.value = item.dataset.value;
    select.dispatchEvent(new Event('change', {bubbles: true}));
    refresh();
    close();
    trigger.focus();
  }));
  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      open();
      if (event.key === 'ArrowUp') items[items.length - 1]?.focus();
    }
  });
  menu.addEventListener('keydown', event => {
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'Escape') { event.preventDefault(); close(); trigger.focus(); return; }
    else if (event.key === 'Tab') { close(); return; }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      items[current]?.click();
      return;
    } else return;
    event.preventDefault();
    items[next]?.focus();
  });
  originalLabel.replaceWith(field);
  select.classList.add('custom-native-select');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  field.append(fieldLabel, select, trigger, menu);
  select.addEventListener('change', refresh);
  select.form?.addEventListener('reset', () => setTimeout(refresh, 0));
  refresh();
  customSelects.push({field, close});
}
document.addEventListener('pointerdown', event => {
  customSelects.forEach(control => {
    if (!control.field.contains(event.target)) control.close();
  });
});


const datePickers = [];
const dateToISO = date => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');
const dateFromISO = value => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
for (const input of document.querySelectorAll('.registration-form input[type="date"]')) {
  const originalLabel = input.closest('label');
  if (!originalLabel) continue;
  const caption = [...originalLabel.childNodes]
    .filter(node => node !== input)
    .map(node => node.textContent).join('').trim();
  const index = datePickers.length + 1;
  const field = document.createElement('div');
  field.className = 'date-field';
  const fieldLabel = document.createElement('span');
  fieldLabel.className = 'date-label';
  fieldLabel.id = 'date-label-' + index;
  fieldLabel.textContent = caption;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'date-trigger';
  trigger.id = 'date-trigger-' + index;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-labelledby', fieldLabel.id + ' ' + trigger.id);
  const panel = document.createElement('div');
  panel.className = 'date-panel';
  panel.id = 'date-panel-' + index;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', caption);
  panel.hidden = true;
  trigger.setAttribute('aria-controls', panel.id);
  const header = document.createElement('div');
  header.className = 'date-header';
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'date-nav';
  previous.textContent = '‹';
  previous.setAttribute('aria-label', 'Tháng trước');
  const monthTitle = document.createElement('strong');
  monthTitle.className = 'date-month';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'date-nav';
  next.textContent = '›';
  next.setAttribute('aria-label', 'Tháng sau');
  header.append(previous, monthTitle, next);
  const weekdays = document.createElement('div');
  weekdays.className = 'date-weekdays';
  ['T2','T3','T4','T5','T6','T7','CN'].forEach(name => {
    const day = document.createElement('span');
    day.textContent = name;
    weekdays.append(day);
  });
  const grid = document.createElement('div');
  grid.className = 'date-grid';
  const footer = document.createElement('div');
  footer.className = 'date-footer';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'Xóa ngày';
  footer.append(clear);
  panel.append(header, weekdays, grid, footer);
  const min = input.min || '0001-01-01';
  const max = input.max || '9999-12-31';
  const initial = dateFromISO(input.value) || new Date();
  let viewMonth = new Date(initial.getFullYear(), initial.getMonth(), 1);
  const refresh = () => {
    trigger.textContent = input.value
      ? new Intl.DateTimeFormat('vi-VN').format(dateFromISO(input.value))
      : 'dd/mm/yyyy';
    trigger.classList.toggle('is-placeholder', !input.value);
  };
  const close = () => {
    panel.hidden = true;
    field.classList.remove('is-open', 'open-up');
    trigger.setAttribute('aria-expanded', 'false');
  };
  const choose = value => {
    input.value = value;
    input.dispatchEvent(new Event('change', {bubbles:true}));
    refresh();
    close();
    trigger.focus();
  };
  const render = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    monthTitle.textContent = new Intl.DateTimeFormat('vi-VN', {month:'long', year:'numeric'}).format(viewMonth);
    previous.disabled = dateToISO(new Date(year, month, 0)) < min;
    next.disabled = dateToISO(new Date(year, month + 1, 1)) > max;
    grid.replaceChildren();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
    const days = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const value = dateToISO(new Date(year, month, day));
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'date-day';
      cell.textContent = day;
      cell.dataset.date = value;
      cell.disabled = value < min || value > max;
      cell.setAttribute('aria-label',
        new Intl.DateTimeFormat('vi-VN', {dateStyle:'full'}).format(new Date(year, month, day)));
      cell.setAttribute('aria-pressed', String(value === input.value));
      if (value === dateToISO(new Date())) cell.classList.add('is-today');
      cell.addEventListener('click', () => choose(value));
      grid.append(cell);
    }
  };
  const open = () => {
    customSelects.forEach(control => control.close());
    datePickers.forEach(control => control.close());
    const selected = dateFromISO(input.value);
    if (selected) viewMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    render();
    panel.hidden = false;
    field.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    field.classList.toggle('open-up',
      trigger.getBoundingClientRect().bottom + panel.scrollHeight > innerHeight - 16
      && trigger.getBoundingClientRect().top > panel.scrollHeight);
    (grid.querySelector('.date-day[aria-pressed="true"]') ||
      grid.querySelector('.date-day:not(:disabled)'))?.focus();
  };
  previous.addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    render();
    grid.querySelector('.date-day:not(:disabled)')?.focus();
  });
  next.addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    render();
    grid.querySelector('.date-day:not(:disabled)')?.focus();
  });
  clear.addEventListener('click', () => choose(''));
  trigger.addEventListener('click', () => panel.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown','Enter',' '].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      trigger.focus();
      return;
    }
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      (event.key === 'PageUp' ? previous : next).click();
      return;
    }
    const days = [...grid.querySelectorAll('.date-day:not(:disabled)')];
    const current = days.indexOf(document.activeElement);
    if (current < 0) return;
    const movement = {ArrowLeft:-1, ArrowRight:1, ArrowUp:-7, ArrowDown:7};
    let nextIndex;
    if (event.key in movement) nextIndex = current + movement[event.key];
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = days.length - 1;
    else return;
    event.preventDefault();
    days[Math.max(0, Math.min(days.length - 1, nextIndex))]?.focus();
  });
  originalLabel.replaceWith(field);
  input.classList.add('custom-native-date');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  field.append(fieldLabel, input, trigger, panel);
  input.addEventListener('change', refresh);
  input.form?.addEventListener('reset', () => setTimeout(refresh, 0));
  refresh();
  datePickers.push({field, close});
}
document.addEventListener('pointerdown', event => {
  datePickers.forEach(control => {
    if (!control.field.contains(event.target)) control.close();
  });
});

window.addEventListener('hashchange',() => route(true));
route();
