export async function sendRegistration(payload, signal) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Chưa thể kết nối nơi nhận đăng ký. Vui lòng thử lại sau.');
  }
  if (!response.ok || !result.ok || !result.id) {
    throw new Error(result.message || 'Chưa lưu được đăng ký. Vui lòng thử lại.');
  }
  return result;
}
