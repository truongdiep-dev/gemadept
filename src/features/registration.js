import { draft, saveDraft, formData, validGuest, setReceipt } from '../state/registration.js';
import { navigate } from '../router/index.js';
import { sendRegistration } from '../services/registration.js';
export function initRegistration() {
  const forms = [...document.querySelectorAll('.registration-form')];
  let submitting = false;
  for (const select of document.querySelectorAll('[data-time-slots]')) {
    for (let hour = 0; hour < 24; hour++) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String((hour + 2) % 24).padStart(2, '0')}:00`;
      select.add(
        new Option(`${start} – ${end}${hour >= 22 ? ' (+1 ngày)' : ''}`, `${start}-${end}`),
      );
    }
  }
  for (const form of forms) {
    const saved = draft[form.dataset.step];
    if (saved && typeof saved === 'object')
      for (const [key, value] of Object.entries(saved)) {
        const field = form.elements.namedItem(key);
        if (field && typeof value === 'string') field.value = value;
      }
    form.addEventListener('input', (event) => {
      event.target.setCustomValidity?.('');
      draft[form.dataset.step] = formData(form);
      saveDraft();
    });
    form.addEventListener('change', () => {
      draft[form.dataset.step] = formData(form);
      saveDraft();
    });
  }

  function validateDates(form, first, second, message, paired = false) {
    const a = form.elements.namedItem(first),
      b = form.elements.namedItem(second);
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
    else if (a.value && b.value && b.value < a.value) text = message;
    error.textContent = text;
    error.hidden = !text;
    if (text) error.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return !text;
  }
  async function submitRegistration(form, event) {
    if (submitting) return;
    if (event === 'party' && !validGuest()) {
      navigate('dang-ky-tiec/1');
      return;
    }
    const error = form.querySelector('.form-error');
    const button = form.querySelector('[type=submit]');
    const label = button.textContent;
    error.hidden = true;
    submitting = true;
    button.disabled = true;
    button.textContent = 'ĐANG GỬI / SUBMITTING…';
    form.setAttribute('aria-busy', 'true');
    const idKey = `${event}RequestId`;
    draft[idKey] ||= crypto.randomUUID();
    saveDraft();
    const fields =
      event === 'party' ? { ...draft.guest, ...draft.flight, ...draft.hotel } : { ...draft.golf };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const result = await sendRegistration(
        { event, requestId: draft[idKey], ...fields },
        controller.signal,
      );
      setReceipt({ id: result.id, event });
      if (event === 'party') {
        for (const step of ['guest', 'flight', 'hotel']) {
          delete draft[step];
          document.querySelector(`[data-step="${step}"]`).reset();
        }
      } else {
        delete draft.golf;
        form.reset();
      }
      delete draft[idKey];
      saveDraft();
      navigate(event === 'golf' ? 'thanh-cong-golf' : 'thanh-cong');
    } catch (err) {
      error.textContent =
        err.name === 'AbortError'
          ? 'Kết nối mất nhiều thời gian. Vui lòng thử gửi lại; hệ thống sẽ tránh ghi trùng đăng ký.'
          : err.message || 'Mất kết nối. Vui lòng kiểm tra mạng và thử lại.';
      error.hidden = false;
      error.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } finally {
      clearTimeout(timeout);
      submitting = false;
      button.disabled = false;
      button.textContent = label;
      form.removeAttribute('aria-busy');
    }
  }
  for (const form of forms)
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      for (const field of form.querySelectorAll('input[required]')) {
        field.setCustomValidity(field.value.trim() ? '' : 'Vui lòng nhập thông tin này.');
      }
      const phone = form.querySelector('input[name="phone"]');
      if (phone?.value.trim()) {
        const value = phone.value.trim();
        phone.setCustomValidity(
          /^[+0-9() .-]{8,25}$/.test(value) && value.replace(/\D/g, '').length >= 8
            ? ''
            : 'Vui lòng nhập số điện thoại hợp lệ.',
        );
      }
      if (!form.reportValidity()) return;
      draft[form.dataset.step] = formData(form);
      saveDraft();
      switch (form.dataset.step) {
        case 'guest':
          navigate('dang-ky-tiec/2');
          break;
        case 'flight':
          if (
            validateDates(
              form,
              'departureDate',
              'returnDate',
              'Ngày về phải bằng hoặc sau ngày đi.',
            )
          )
            navigate('dang-ky-tiec/3');
          break;
        case 'hotel':
          if (
            validateDates(
              form,
              'checkIn',
              'checkOut',
              'Ngày trả phòng phải bằng hoặc sau ngày nhận phòng.',
              true,
            )
          )
            submitRegistration(form, 'party');
          break;
        case 'golf':
          submitRegistration(form, 'golf');
          break;
      }
    });
}
