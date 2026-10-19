import { customSelects } from './select.js';
export function initDatePickers() {
  const datePickers = [];
  const dateToISO = (date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  const dateFromISO = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  for (const input of document.querySelectorAll('.registration-form input[type="date"]')) {
    const originalLabel = input.closest('label');
    if (!originalLabel) continue;
    const caption = [...originalLabel.childNodes]
      .filter((node) => node !== input)
      .map((node) => node.textContent)
      .join('')
      .trim();
    const index = datePickers.length + 1;
    const field = document.createElement('div');
    field.className = 'date-field';
    const fieldLabel = document.createElement('span');
    fieldLabel.className = 'date-label';
    fieldLabel.id = 'date-label-' + index;
    fieldLabel.append(
      ...[...originalLabel.childNodes]
        .filter((node) => node !== input)
        .map((node) => node.cloneNode(true)),
    );
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
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((name) => {
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
    const choose = (value) => {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      refresh();
      close();
      trigger.focus();
    };
    const render = () => {
      const year = viewMonth.getFullYear();
      const month = viewMonth.getMonth();
      monthTitle.textContent = new Intl.DateTimeFormat('vi-VN', {
        month: 'long',
        year: 'numeric',
      }).format(viewMonth);
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
        cell.setAttribute(
          'aria-label',
          new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(
            new Date(year, month, day),
          ),
        );
        cell.setAttribute('aria-pressed', String(value === input.value));
        if (value === dateToISO(new Date())) cell.classList.add('is-today');
        cell.addEventListener('click', () => choose(value));
        grid.append(cell);
      }
    };
    const open = () => {
      customSelects.forEach((control) => control.close());
      datePickers.forEach((control) => control.close());
      const selected = dateFromISO(input.value);
      if (selected) viewMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      render();
      panel.hidden = false;
      field.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      field.classList.toggle(
        'open-up',
        trigger.getBoundingClientRect().bottom + panel.scrollHeight > innerHeight - 16 &&
          trigger.getBoundingClientRect().top > panel.scrollHeight,
      );
      (
        grid.querySelector('.date-day[aria-pressed="true"]') ||
        grid.querySelector('.date-day:not(:disabled)')
      )?.focus();
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
    trigger.addEventListener('click', () => (panel.hidden ? open() : close()));
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        trigger.focus();
        return;
      }
      if (event.key === 'Tab') {
        close();
        return;
      }
      if (event.key === 'PageUp' || event.key === 'PageDown') {
        event.preventDefault();
        (event.key === 'PageUp' ? previous : next).click();
        return;
      }
      const days = [...grid.querySelectorAll('.date-day:not(:disabled)')];
      const current = days.indexOf(document.activeElement);
      if (current < 0) return;
      const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
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
    datePickers.push({ field, close });
  }
  document.addEventListener('pointerdown', (event) => {
    datePickers.forEach((control) => {
      if (!control.field.contains(event.target)) control.close();
    });
  });
}
