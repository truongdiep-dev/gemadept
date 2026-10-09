# GEMADEPT 2026 — Website thư mời

Dự án HTML, CSS, JavaScript thuần. Máy chủ Node.js dùng thư viện có sẵn, không cần npm install. Font Myriad Pro được nhúng từ file người dùng cung cấp. Các ảnh WebP được tách từ JPG thiết kế, không lấy ảnh bên ngoài.

## Chạy dự án

Cài Node.js 20 trở lên, mở `start.cmd`, hoặc chạy:

```sh
npm start
```

Mở http://localhost:3000. Có thể mở trực tiếp `index.html` để xem giao diện, nhưng việc gửi đăng ký cần máy chủ chạy.

## Các trang và luồng

- Trang chủ → Thư ngỏ, Lịch trình sự kiện, Xác nhận tham gia.
- Tiệc tri ân → Thông tin khách mời → Vé máy bay → Khách sạn và liên hệ → Thành công.
- Golf → Chương trình hoặc đăng ký → Thành công.

Các trường thông tin là HTML thật. Chọn ngày bằng lịch, giờ đi/về bằng khoảng 2 giờ bắt đầu mỗi giờ. Có trạng thái đang gửi, kiểm tra trường bắt buộc, kiểm tra ngày về/ngày trả phòng, thông báo lỗi và giữ dữ liệu khi quay lại. Bản nháp nằm trong sessionStorage của tab và được xóa sau khi gửi thành công.

## Nơi quản lý đăng ký

Google Sheet đã tạo:
https://docs.google.com/spreadsheets/d/1fcJOvdaQrt0WUpdPjhYnlgw28LaAcHVykh6jnIWFBvI/edit

Hai tab `Tiệc tri ân` và `Golf`. Khách không cần tài khoản Google. Người quản lý mở Sheet bằng tài khoản được chia sẻ, lọc trạng thái tham dự và tải Excel qua **Tệp → Tải xuống → Microsoft Excel (.xlsx)**.

Apps Script đã được triển khai. Máy chủ cục bộ lấy URL `/exec` và khóa kết nối từ `.env`. Khi đưa lên Vercel cần đặt cùng hai biến trong Environment Variables của Vercel; `.env` không được commit. Xem `docs/VERCEL.md`.

## Cấu trúc

- `index.html`: nội dung các trang.
- `styles.css`: giao diện responsive, màu sắc và font.
- `app.js`: điều hướng và biểu mẫu.
- `server.mjs`: phục vụ web cục bộ, kiểm tra dữ liệu và gửi đến Google Sheets.
- `api/register.mjs`: Vercel Function nhận đăng ký khi website chạy trên Vercel.
- `scripts/build-vercel.mjs` và `vercel.json`: xuất bản file giao diện, ảnh và font trên Vercel.
- `assets/images`: hình tách từ thiết kế; `manifest.json` ghi nguồn và tọa độ cắt.
- `assets/fonts`: font Myriad Pro Regular.
- `google-apps-script/Code.gs`: bộ nhận dữ liệu cho Google Sheets.
- `google-apps-script/INSTALL.gs`: bản cài đặt riêng ở máy hiện tại, đã điền cấu hình; không commit hoặc chia sẻ công khai.
- `.env.example`: cấu hình mẫu; `.env` chứa cấu hình riêng của máy chủ.
- `scripts/extract-assets.py`: tái tạo ảnh từ bộ JPG trong `source/JPG` (Python, Pillow, NumPy).

## Cách dữ liệu được ghi

Website → `POST /api/register` trên cùng máy chủ → Google Apps Script → Google Sheet.

Máy chủ gom các yêu cầu đến gần nhau thành lô tối đa 100. Apps Script dùng khóa chung trước khi ghi, mỗi yêu cầu có mã UUID riêng để tránh lặp khi khách gửi lại. Chỉ trả thành công sau `SpreadsheetApp.flush()`. Số điện thoại giữ dạng văn bản; ngày và thời gian đăng ký là dữ liệu ngày giờ theo múi giờ Việt Nam. Không đưa secret vào mã frontend; máy chủ chỉ phục vụ các file giao diện và ảnh/font được cho phép.

Đây là cơ chế trong mã nguồn; chưa chạy kiểm thử tải hoặc kiểm thử gửi dữ liệu theo yêu cầu của người dùng.

## Đưa lên hosting

Với Vercel, xem `docs/VERCEL.md`. Dự án đã có Vercel Function tại `/api/register`; đặt `GOOGLE_SCRIPT_URL` và `GOOGLE_SCRIPT_SECRET` trong Environment Variables. Với hosting Node thông thường, dùng `npm start`, `HOST=0.0.0.0`, `PORT` của hosting và `PUBLIC_ORIGIN` là tên miền HTTPS của website.

Giữ Google Sheet ở chế độ Restricted và chia sẻ cho email người quản lý. Endpoint Apps Script có quyền Anyone nhưng yêu cầu secret do máy chủ giữ. Tài khoản Workspace có thể hạn chế triển khai Apps Script công khai; nếu bị chặn cần quản trị viên của tổ chức cho phép.

## Nguồn thiết kế và ghi chú

Nguồn: `GMD-thumoionl.ai`, bộ JPG do người dùng gửi và các ảnh mô tả luồng. Nền, logo, hình 36 năm, hình tiệc, golf và chữ nghệ thuật được cắt từ JPG. Chữ nội dung, nút và trường nhập liệu được dựng lại bằng HTML/CSS. Trên điện thoại, chữ nội dung và ô nhập được giữ đủ lớn nên chiều dài một số trang tăng so với poster gốc.

Địa điểm golf dùng thông tin trong JPG gốc: C, D Course (ảnh chụp mô tả luồng ghi A, B Course). Cần Ban tổ chức chốt lại trước khi phát hành.
