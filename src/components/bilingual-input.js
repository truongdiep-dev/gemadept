export function setBilingualText(element, value) {
  const separator = value.indexOf(' / ');
  if (separator < 0) {
    element.textContent = value;
    return;
  }
  const copy = document.createElement('span');
  const english = document.createElement('span');
  english.lang = 'en';
  english.textContent = value.slice(separator + 3);
  copy.append(document.createTextNode(value.slice(0, separator + 3)), english);
  element.replaceChildren(copy);
}

export function initBilingualInputs() {
  for (const input of document.querySelectorAll('.registration-form input[placeholder]')) {
    if (!input.placeholder.includes(' / ')) continue;
    const wrapper = document.createElement('span');
    wrapper.className = 'bilingual-input';
    const placeholder = document.createElement('span');
    placeholder.className = 'bilingual-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    setBilingualText(placeholder, input.placeholder);
    input.replaceWith(wrapper);
    wrapper.append(input, placeholder);
  }
}
