import { setBilingualText } from './bilingual-input.js';
export const customSelects = [];
export function initSelects() {
  for (const select of document.querySelectorAll('.registration-form select')) {
    const originalLabel = select.closest('label');
    if (!originalLabel) continue;
    const index = customSelects.length + 1;
    const field = document.createElement('div');
    field.className = 'select-field';
    const fieldLabel = document.createElement('span');
    fieldLabel.className = 'select-label';
    fieldLabel.id = 'select-label-' + index;
    fieldLabel.append(
      ...[...originalLabel.childNodes]
        .filter((node) => node !== select)
        .map((node) => node.cloneNode(true)),
    );
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
      setBilingualText(item, option.textContent);
      menu.append(item);
      return item;
    });
    const refresh = () => {
      setBilingualText(
        trigger,
        select.selectedOptions[0]?.textContent || select.options[0]?.textContent || '',
      );
      items.forEach((item, itemIndex) =>
        item.setAttribute('aria-selected', String(itemIndex === select.selectedIndex)),
      );
    };
    const close = () => {
      menu.hidden = true;
      field.classList.remove('is-open', 'open-up');
      trigger.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      customSelects.forEach((control) => control.close());
      menu.hidden = false;
      field.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      field.classList.toggle(
        'open-up',
        trigger.getBoundingClientRect().bottom + Math.min(menu.scrollHeight, 320) >
          innerHeight - 16 &&
          trigger.getBoundingClientRect().top > Math.min(menu.scrollHeight, 320),
      );
      (items[select.selectedIndex] || items[0])?.focus();
    };
    items.forEach((item) =>
      item.addEventListener('click', () => {
        select.value = item.dataset.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        refresh();
        close();
        trigger.focus();
      }),
    );
    trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
        if (event.key === 'ArrowUp') items[items.length - 1]?.focus();
      }
    });
    menu.addEventListener('keydown', (event) => {
      const current = items.indexOf(document.activeElement);
      let next = current;
      if (event.key === 'ArrowDown') next = (current + 1) % items.length;
      else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else if (event.key === 'Escape') {
        event.preventDefault();
        close();
        trigger.focus();
        return;
      } else if (event.key === 'Tab') {
        close();
        return;
      } else if (event.key === 'Enter' || event.key === ' ') {
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
    customSelects.push({ field, close });
  }
  document.addEventListener('pointerdown', (event) => {
    customSelects.forEach((control) => {
      if (!control.field.contains(event.target)) control.close();
    });
  });
}
