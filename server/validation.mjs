const allowedStatus = new Set(['yes', 'no', 'undecided']);
const commonFields = ['company', 'name', 'position', 'attendance'];
const partyFields = [
  'departureDate',
  'departureTime',
  'departureAirport',
  'flightAttendance',
  'returnDate',
  'returnTime',
  'returnAirport',
  'checkIn',
  'checkOut',
  'phone',
  'email',
];
export class ValidationError extends Error {}
export function validateRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new ValidationError('Dữ liệu đăng ký không hợp lệ.');
  if (!['party', 'golf'].includes(input.event)) throw new ValidationError('Vui lòng chọn sự kiện.');
  if (
    typeof input.requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)
  )
    throw new ValidationError('Mã yêu cầu không hợp lệ. Vui lòng tải lại trang.');
  const result = { event: input.event, requestId: input.requestId };
  for (const key of [
    ...commonFields,
    ...(input.event === 'party' ? partyFields : ['shirtSize', 'handicap']),
  ]) {
    if (input[key] != null && typeof input[key] !== 'string')
      throw new ValidationError('Thông tin nhập không hợp lệ.');
    const value = (input[key] || '').trim();
    if (
      value.length > (key === 'handicap' ? 500 : 160) ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      throw new ValidationError('Thông tin quá dài hoặc chứa ký tự không hợp lệ.');
    result[key] = value;
  }
  for (const key of ['company', 'name', 'position'])
    if (!result[key]) throw new ValidationError('Vui lòng nhập đủ công ty, họ tên và chức vụ.');
  if (!allowedStatus.has(result.attendance))
    throw new ValidationError('Xác nhận tham dự không hợp lệ.');
  if (input.event === 'golf') {
    if (!['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(result.shirtSize))
      throw new ValidationError('Vui lòng chọn size áo.');
    return result;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
    throw new ValidationError('Vui lòng nhập email hợp lệ.');
  if (!/^[+0-9() .-]{8,25}$/.test(result.phone) || result.phone.replace(/\D/g, '').length < 8)
    throw new ValidationError('Vui lòng nhập số điện thoại hợp lệ.');
  if (result.flightAttendance && !allowedStatus.has(result.flightAttendance))
    throw new ValidationError('Xác nhận tham dự không hợp lệ.');
  for (const key of ['departureDate', 'returnDate', 'checkIn', 'checkOut']) {
    const val = result[key];
    if (
      val &&
      (!/^202[67]-\d{2}-\d{2}$/.test(val) ||
        Number.isNaN(Date.parse(val)) ||
        new Date(val).toISOString().slice(0, 10) !== val)
    )
      throw new ValidationError('Ngày được chọn không hợp lệ.');
  }
  for (const key of ['departureTime', 'returnTime']) {
    const val = result[key];
    if (
      val &&
      !Array.from(
        { length: 24 },
        (_, i) => `${String(i).padStart(2, '0')}:00-${String((i + 2) % 24).padStart(2, '0')}:00`,
      ).includes(val)
    )
      throw new ValidationError('Vui lòng chọn khoảng giờ hợp lệ.');
  }
  if (result.departureDate && result.returnDate && result.returnDate < result.departureDate)
    throw new ValidationError('Ngày về phải bằng hoặc sau ngày đi.');
  if (Boolean(result.checkIn) !== Boolean(result.checkOut))
    throw new ValidationError('Vui lòng chọn đủ ngày nhận và trả phòng.');
  if (result.checkIn && result.checkOut < result.checkIn)
    throw new ValidationError('Ngày trả phòng phải bằng hoặc sau ngày nhận phòng.');
  return result;
}
