# FIELDNOTE K49 – Công cụ tạo ảnh thực địa (V3)

## Công dụng

Website chỉ làm một việc: tải ảnh từ thiết bị → nhập thông tin (tên ảnh, địa điểm, ngày/giờ, người chụp, mô tả, tọa độ nếu có) → xem trước → tải ảnh PNG có dải thông tin ở phía dưới.

**Không có** mục Phụ lục 3, kho minh chứng, danh sách ảnh/video, lưu dữ liệu tập trung hay xuất ZIP hàng loạt. Mỗi lần xuất sẽ tải một ảnh PNG riêng. ZIP này chỉ để đóng gói mã nguồn website đưa lên GitHub.

## Sử dụng nhanh

1. Mở `index.html` trong trình duyệt hoặc truy cập website sau khi đăng GitHub Pages.
2. Nhấn **Chọn ảnh từ thiết bị** hoặc kéo ảnh vào ô.
3. Nhập **Tên ảnh**, **Địa điểm chụp** và các thông tin khác nếu có.
4. Nếu muốn có tọa độ trên ảnh, mở mục **Thêm tọa độ khảo sát**, nhập cặp vĩ độ, kinh độ, dán Google Maps dạng đầy đủ, hoặc chọn điểm trực tiếp trên bản đồ.
5. Kiểm tra ảnh ở cột bên phải, nhấn **Tải ảnh PNG**.
6. Nhấn **Làm mới** để chuẩn bị một ảnh khác.

## Cấu trúc mã nguồn

- `index.html`: cấu trúc giao diện.
- `assets/styles.css`: màu sắc, bố cục và giao diện điện thoại.
- `js/app.js`: tải ảnh, nhập liệu, xem trước, nút tải ảnh, mở bản đồ tùy chọn.
- `js/export.js`: tạo ảnh bằng Canvas, thêm phần chú thích và xuất PNG.
- `js/geo.js`: xử lý tọa độ, liên kết Google Maps, ngày tháng và tên tệp.
- `js/map.js`: bản đồ có thể nhấp, kéo, thu phóng; dùng bản đồ nền OpenStreetMap khi có Internet.

Không cần cài Node.js hay máy chủ. Phần xử lý ảnh chạy tại trình duyệt; không tự động tải ảnh người dùng lên GitHub. Khi mở bản đồ, các tệp nền bản đồ sẽ được yêu cầu từ OpenStreetMap và cần kết nối Internet.

## Đưa lên GitHub Pages

Giải nén ZIP, đưa `index.html`, `assets/` và `js/` lên thư mục gốc của repository. Vào **Settings → Pages → Build and deployment → Deploy from a branch**, chọn `main` và `/(root)`. Không đưa riêng file ZIP lên rồi mong website tự giải nén.

## Ghi chú kỹ thuật

- Hỗ trợ JPG, PNG, WebP tối đa 35 MB.
- Ảnh xuất PNG giữ tỉ lệ và nội dung khung ảnh; phần thông tin được **thêm bên dưới** chứ không che ảnh gốc. Với ảnh rất lớn, chiều dài cạnh được giới hạn 5200 px để giảm lỗi bộ nhớ Canvas; ảnh gốc trên máy không bị sửa.
- Phần chữ sử dụng font hệ thống hỗ trợ tiếng Việt, tránh font chữ nghiêng serif đã gây lỗi hiển thị dấu ở bản trước. Văn bản đầu vào được chuẩn hóa Unicode NFC.
- Dữ liệu ngày, giờ và tọa độ do người dùng nhập, không phải chứng cứ xác thực vị trí hay thời gian GPS của ảnh.
- Trường tên ảnh và địa điểm là bắt buộc; các trường còn lại có thể bỏ trống.
