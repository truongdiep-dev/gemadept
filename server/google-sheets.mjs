export async function googleTransport(records) {
  const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, records }),
    redirect: 'follow',
    signal: AbortSignal.timeout(35000),
  });
  if (!response.ok) throw new Error('Google endpoint unavailable');
  const data = await response.json();
  if (!data.ok || !Array.isArray(data.results)) throw new Error('Google storage rejected request');
  return data.results;
}
