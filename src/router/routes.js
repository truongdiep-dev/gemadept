export const titles = {
  'trang-chu': 'Tiệc tri ân khách hàng 2026',
  'thu-ngo': 'Thư ngỏ',
  'lich-trinh': 'Lịch trình sự kiện',
  'su-kien': 'Xác nhận tham gia',
  'tiec-tri-an': 'Partner Appreciation Party 2026',
  golf: 'Golf Tournament 2026',
  'chuong-trinh-golf': 'Chương trình Golf Tournament',
  'dang-ky-tiec/1': 'Thông tin khách mời',
  'dang-ky-tiec/2': 'Thông tin vé máy bay',
  'dang-ky-tiec/3': 'Thông tin khách sạn',
  'dang-ky-golf': 'Đăng ký đánh golf',
  'thanh-cong': 'Đăng ký thành công',
  'thanh-cong-golf': 'Đăng ký đánh golf thành công',
};
const homePath = '/trang-chu';
const attendancePath = `${homePath}/xac-nhan-tham-gia`;
const partyPath = `${attendancePath}/partner-appreciation-party-2026`;
const golfPath = `${attendancePath}/golf-tournament-2026`;
export const pagePaths = {
  'trang-chu': homePath,
  'thu-ngo': `${homePath}/thu-ngo`,
  'lich-trinh': `${homePath}/lich-trinh-su-kien`,
  'su-kien': attendancePath,
  'tiec-tri-an': partyPath,
  'dang-ky-tiec/1': `${partyPath}/xac-nhan-tham-gia/1`,
  'dang-ky-tiec/2': `${partyPath}/xac-nhan-tham-gia/2`,
  'dang-ky-tiec/3': `${partyPath}/xac-nhan-tham-gia/3`,
  golf: golfPath,
  'chuong-trinh-golf': `${golfPath}/chuong-trinh-golf`,
  'dang-ky-golf': `${partyPath}/xac-nhan-tham-gia`,
  'thanh-cong': `${partyPath}/xac-nhan-tham-gia/1/thanh-cong`,
  'thanh-cong-golf': `${partyPath}/xac-nhan-tham-gia/thanh-cong`,
};
export const pathPages = Object.fromEntries(
  Object.entries(pagePaths).map(([page, url]) => [url, page]),
);
