// Short batches reduce simultaneous Apps Script executions during arrival bursts.
export function createBatchWriter(send, { delay = 90, maxBatch = 100, maxPending = 500 } = {}) {
  let queue = [],
    running = false,
    timer;
  async function drain() {
    if (running || !queue.length) return;
    running = true;
    const batch = queue.splice(0, maxBatch);
    try {
      const results = await send(batch.map((item) => item.record));
      for (const item of batch) {
        const result = results.find(
          (r) => r.requestId === item.record.requestId && r.event === item.record.event,
        );
        if (!result?.ok || !result.id)
          item.reject(new Error(result?.message || 'Chưa lưu được đăng ký. Vui lòng thử lại.'));
        else item.resolve({ ok: true, id: result.id });
      }
    } catch (err) {
      for (const item of batch) item.reject(err);
    } finally {
      running = false;
      if (queue.length) timer = setTimeout(drain, delay);
    }
  }
  return (record) =>
    new Promise((resolve, reject) => {
      if (queue.length >= maxPending) {
        reject(new Error('Có nhiều lượt đăng ký. Vui lòng thử lại sau ít phút.'));
        return;
      }
      queue.push({ record, resolve, reject });
      if (!running) {
        clearTimeout(timer);
        timer = setTimeout(drain, delay);
      }
    });
}
