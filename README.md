# FIELDNOTE K49 – Trình tạo ảnh minh chứng thực địa

Website tĩnh, chạy bằng HTML/CSS/JavaScript trên **GitHub Pages**. Tải ảnh lên từ thiết bị, điền tên ảnh, ngày giờ, nguồn ảnh, mô tả, chọn tọa độ trên bản đồ. Ảnh gốc được giữ nguyên bố cục; một dải thông tin được thêm bên dưới khi xuất ảnh PNG.

## Cài đặt trên GitHub Pages

1. Giải nén gói `FIELDNOTE-K49-WEBSITE.zip`.
2. Tạo repository GitHub (ví dụ `fieldnote-k49`) và đưa toàn bộ các file `index.html`, `styles.css`, `app.js` và `README.md` vào thư mục gốc.
3. Mở repository **Settings → Pages → Build and deployment → Deploy from a branch**, chọn nhánh `main`, thư mục `/(root)`, chọn Save.
4. Mở đường dẫn GitHub Pages (dạng `https://ten-tai-khoan.github.io/fieldnote-k49/`).

Kết nối mạng cần thiết để tải thư viện Leaflet, JSZip và bản đồ nền OpenStreetMap.

## Cách sử dụng

1. Chọn loại **Ảnh** hoặc **Video (liên kết)**.
2. Tải ảnh hoặc nhập URL video, điền mã/tên/địa điểm/ngày giờ/tác giả/mô tả.
3. Chọn tọa độ bằng cách nhấp bản đồ, nhập tay, hoặc dán URL Google Maps dạng đầy đủ chứa tọa độ. **URL rút gọn** thường không thể tự phân tích nếu không có server; hãy mở URL rồi sao chép tọa độ.
4. Nhấn **Lưu vào bộ minh chứng** cho từng ảnh/video. Có thể chỉnh sửa hoặc xóa trước khi xuất.
5. Chọn **Xuất ZIP**. Kết quả gồm:
   - `anh-minh-chung/`: ảnh PNG có dải chú thích.
   - `anh-goc/`: ảnh nguyên bản.
   - `danh-muc-minh-chung.csv`, `danh-muc-minh-chung.json`: bảng dữ liệu và liên kết bản đồ.
   - `thu-vien-minh-chung.html`: trang tra cứu ảnh/video.

## Lưu ý

- Công cụ này xử lý file **ngay trên trình duyệt**, không tự động đăng tải ảnh/video hoặc kết quả lên GitHub. Muốn công bố bộ ảnh bằng GitHub Pages, phải tải lên repository/hosting thủ công hoặc xây dựng hệ thống lưu trữ có đăng nhập riêng.
- Hình ảnh bị giới hạn kích thước xuất tối đa khoảng 3000 × 3200 pixel để duy trì hiệu năng; ảnh gốc luôn có trong bộ ZIP.
- Ngày, giờ, tọa độ được **người dùng cung cấp** và cần đối chiếu với thực tế. Tọa độ điểm khảo sát không tự động chứng minh chính xác vị trí máy ảnh lúc chụp.
- Các tệp ảnh giữ trong bộ nhớ phiên làm việc; **xuất ZIP trước khi đóng hoặc tải lại trang**. Không đưa ảnh chứa thông tin cá nhân nhạy cảm lên website công khai.
- Liên kết Google Maps được mở bằng Google Maps URLs (không cần API key). Bản đồ chọn điểm dùng Leaflet và OpenStreetMap.
- Video chỉ được ghi lại bằng URL trong danh mục, không tải file video hoặc đóng dấu chú thích lên video.

## Công nghệ

- HTML5, CSS3, JavaScript và Canvas API.
- Leaflet 1.9.4 + OpenStreetMap tiles.
- JSZip 3.10.1 (xuất bộ ZIP).
- Toàn bộ code nguồn có thể chỉnh sửa tùy ý phục vụ nghiên cứu và học tập.
