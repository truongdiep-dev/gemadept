# Đưa website GEMADEPT lên Vercel

Dự án đã có `vercel.json`, lệnh build giao diện và Vercel Function `/api/register`. Đưa mã nguồn lên Git rồi import repository vào Vercel với thư mục gốc là thư mục dự án này. Không cần đóng gói ZIP. Giữ Framework Preset là **Other**; cấu hình trong `vercel.json` sẽ chạy `npm run build` và lấy file tĩnh từ `dist`.

## Environment Variables

Trong **Vercel → Project → Settings → Environment Variables**, thêm:

- `GOOGLE_SCRIPT_URL`: `https://script.google.com/macros/s/AKfycbwsgjzkn6DO3omrOrmjmaioKX98JVuhx6_lRLacquFUOZ1M6gqMGbgJfaHtMTRHZbQV/exec`
- `GOOGLE_SCRIPT_SECRET`: sao chép **đúng giá trị** từ dòng cùng tên trong `.env` ở máy này. Không thêm dấu nháy, không gửi khóa qua chat và không commit `.env`.

Áp dụng cho **Production**. Nếu dùng bản Preview để nhận đăng ký, cũng áp dụng cho **Preview**. Sau khi thêm hoặc đổi biến, **Redeploy** để bản triển khai mới nhận cấu hình. Không cần đặt `HOST`, `PORT` hoặc `PUBLIC_ORIGIN` trên Vercel. Sheet vẫn giữ quyền **Restricted**.

Website gửi biểu mẫu tới `/api/register` cùng domain. Vercel Function kiểm tra dữ liệu, gửi sang Apps Script bằng khóa riêng, rồi trả về mã đăng ký. Người quản lý xem danh sách trong [Google Sheet](https://docs.google.com/spreadsheets/d/1fcJOvdaQrt0WUpdPjhYnlgw28LaAcHVykh6jnIWFBvI/edit).

Lưu ý: việc lưu một lượt đăng ký thật trên bản deploy chưa được kiểm thử theo yêu cầu người dùng.
## Mở trực tiếp từng trang

Vercel rewrite các URL trang sang `/index.html`; các file tĩnh và Vercel Function có ưu tiên theo filesystem. URL chính dùng cấu trúc phân cấp, ví dụ `/trang-chu/thu-ngo`, `/trang-chu/xac-nhan-tham-gia/golf-tournament-2026`. Các link cũ như `/#thu-ngo` vẫn được JavaScript chuyển sang URL mới.
