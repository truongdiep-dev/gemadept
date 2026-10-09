# Kích hoạt Google Sheets

Sheet quản lý đã tạo:
https://docs.google.com/spreadsheets/d/1fcJOvdaQrt0WUpdPjhYnlgw28LaAcHVykh6jnIWFBvI/edit

## Cách cài nhanh trên máy hiện tại

1. Mở Sheet bằng tài khoản quản lý. Chọn **Tiện ích mở rộng → Apps Script**.
2. Mở file `google-apps-script/INSTALL.gs` trong dự án. Sao chép toàn bộ vào trình soạn thảo Apps Script, thay nội dung mặc định. Lưu dự án với tên **Gemadept RSVP 2026**. File này có khóa riêng để kết nối với `.env` ở máy hiện tại; không đăng công khai nội dung file.
3. Chọn hàm **installGemadept**, bấm **Run/Chạy**, rồi cấp quyền truy cập bảng tính cho script trong tài khoản của bạn. Hàm này thiết lập hai tab, bộ lọc, định dạng ngày và khóa kết nối.
4. Chọn **Deploy/Triển khai → New deployment/Triển khai mới → Web app/Ứng dụng web**. Chọn **Execute as: Me/Thực thi với tư cách: Tôi**, **Who has access: Anyone/Bất kỳ ai**. Bấm Deploy và hoàn tất cấp quyền nếu được yêu cầu.
5. Sao chép **Web app URL** kết thúc bằng `/exec`. Điền vào dòng `GOOGLE_SCRIPT_URL=` trong `.env` của website. Không dùng URL `/dev`.
6. Khởi động lại `npm start`. Khi đưa website lên hosting, chuyển các biến `.env` vào cấu hình Environment Variables của hosting. Không đưa `.env` vào thư mục công khai.

Có thể gửi lại URL `/exec` trong chat để Codex điền cấu hình. Không cần gửi khóa riêng: khóa đã được chuẩn bị ở máy này.

## Cài từ bộ mã nguồn được đóng gói

Bản đóng gói không chứa khóa riêng. Tạo `.env` từ `.env.example`. Sinh một secret bằng:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Lưu secret vào `GOOGLE_SCRIPT_SECRET` của máy chủ. Dán `google-apps-script/Code.gs` vào Apps Script. Trong **Project Settings → Script Properties**, thêm:

- `SPREADSHEET_ID`: `1fcJOvdaQrt0WUpdPjhYnlgw28LaAcHVykh6jnIWFBvI`
- `API_SECRET`: cùng giá trị với `GOOGLE_SCRIPT_SECRET`

Chạy hàm `setup`, sau đó triển khai theo bước 4–6 ở trên.

## Người quản lý sử dụng

Mỗi đăng ký đã nhận là một dòng, có mã đăng ký và thời điểm nhận. Dùng bộ lọc ở hàng tiêu đề để xem khách xác nhận, không tham dự hoặc chưa xác định. Tab tiệc có thông tin đi/về, khách sạn, số điện thoại và email. Tab golf có size áo và Handicap/VGA theo mẫu thiết kế.

Chia sẻ Sheet cho email người quản lý bằng nút **Share/Chia sẻ**. Giữ quyền truy cập chung là **Restricted/Hạn chế**. Khách chỉ truy cập website; không cần quyền xem Sheet. Để tải Excel: **File/Tệp → Download/Tải xuống → Microsoft Excel (.xlsx)**.

## Tài liệu Google

- Web Apps: https://developers.google.com/apps-script/guides/web
- Lock Service: https://developers.google.com/apps-script/reference/lock/
- Content Service: https://developers.google.com/apps-script/guides/content

Apps Script đã được triển khai từ tài khoản quản lý. URL `/exec` đã lưu trong `.env` cục bộ. Khi đưa lên Vercel, cấu hình các biến như `docs/VERCEL.md`; không đăng khóa kết nối công khai.
