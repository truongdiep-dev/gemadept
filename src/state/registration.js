const storageKey = 'gemadept-rsvp-draft-v1';
const readSession = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};
export const draft = readSession(storageKey);
export let receipt = readSession('gemadept-receipt');
export const saveDraft = () => {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {}
};
export const formData = (form) =>
  Object.fromEntries([...new FormData(form)].map(([key, val]) => [key, String(val).trim()]));

export function setReceipt(value) {
  receipt = value;
  try {
    sessionStorage.setItem('gemadept-receipt', JSON.stringify(value));
  } catch {}
}
export function validGuest() {
  return ['company', 'name', 'position'].every((key) => draft.guest?.[key]?.trim());
}
