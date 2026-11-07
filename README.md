# FIELDNOTE K49 – Website tạo ảnh minh chứng thực địa

Website tĩnh chạy trên **GitHub Pages** hoặc mở trực tiếp file `index.html` trong trình duyệt Chrome / Edge. Không cần cài thư viện hoặc backend để tạo ảnh, đặt ghim tọa độ và xuất bộ ZIP.

## Bộ mã nguồn

```
fieldnote-k49-v2/
├── index.html
├── assets/
│   └── styles.css
└── js/
    ├── geo.js       (đọc tọa độ Google Maps; định dạng dữ liệu)
    ├── map.js       (bản đồ OSM, zoom/di chuyển/đặt ghim)
    ├── zip.js       (tạo ZIP ngay trong trình duyệt, không dùng CDN)
    ├── export.js    (vẽ ảnh có chú thích, CSV, thư viện HTML)
    └── app.js       (tương tác, lưu/sửa/xóa, xuất file)
```

## Đưa lên GitHub Pages

1. Giải nén `FIELDNOTE-K49-V2.zip`.
2. Tạo một repository GitHub. Tải `index.html`, hai thư mục `assets`, `js` và file `README.md` vào **thư mục gốc** của repository. Giữ nguyên đường dẫn thư mục.
3. Vào **Settings → Pages → Build and deployment → Deploy from a branch**. Chọn `main` và `/(root)`, lưu cài đặt.
4. Mở địa chỉ GitHub Pages của repository (ví dụ: `https://ten-github.github.io/fieldnote-k49/`).

## Hướng dẫn sử dụng

1. Chọn **Ảnh thực địa** → chọn ảnh JPG/PNG/WebP từ máy (≤35 MB). Hoặc chọn **Video (liên kết)**.
2. Điền mã, ngày khảo sát, tên tư liệu, địa điểm, ngày/giờ, người chụp và mô tả.
3. Chọn vị trí theo một trong ba cách:
   - Nhấp trực tiếp lên bản đồ, kéo để di chuyển hoặc nhấn `+`, `−` để đổi tỉ lệ.
   - Dán **cặp tọa độ**, ví dụ `15.123456, 108.123456`, vào ô liên kết rồi nhấn **Đọc tọa độ**.
   - Tìm địa điểm trên **Google Maps** bằng nút **Tìm trên Google Maps**, sao chép tọa độ thật của điểm, sau đó nhập vào đây. Có thể dán link Google Maps *đầy đủ* chứa tọa độ (dạng `@vĩ-độ,kinh-độ`, `!3d...!4d...`, `?query=vĩ-độ,kinh-độ`). Link `maps.app.goo.gl` rút gọn **không tự động giải mã** được trong website tĩnh.
4. Xem trước hình, nhấn **Lưu minh chứng**. Có thể chọn **Chỉnh sửa**, **Xóa** hoặc **Tải ảnh** ở danh sách.
5. Nhấn **Xuất toàn bộ ZIP**. ZIP bao gồm:
   - `anh-minh-chung/`: ảnh PNG thêm dải thông tin bên dưới (không phủ nội dung ảnh);
   - `anh-goc/`: file ảnh nguyên bản để đối chiếu;
   - `danh-muc-minh-chung.csv` và `.json`;
   - `thu-vien-minh-chung.html`: thư viện xem lại ảnh/video, có liên kết Google Maps;
   - `HUONG-DAN.txt`.
6. Muốn dùng **QR trong Word**, đưa thư mục ảnh và `thu-vien-minh-chung.html` từ ZIP lên website/hosting công khai rồi tạo mã QR dẫn đến trang thư viện đó. **Xuất ZIP không có nghĩa tự động đăng nội dung lên GitHub**.

## Cách hoạt động khi không có Internet

- Form, tải ảnh, vẽ chú thích, chọn tọa độ bằng cách nhấp bản đồ, nhập tọa độ thủ công, tạo PNG và ZIP **vẫn chạy**. Nếu bản đồ nền không tải được thì một nền lưới và thông báo thay thế sẽ xuất hiện; lúc này khó xác định vị trí bằng hình bản đồ, nên dùng tọa độ đã sao chép từ Google Maps khi có kết nối.
- **Nền bản đồ** cần Internet để lấy các tile hiện trong vùng người dùng đang xem từ `tile.openstreetmap.org`; không tải trước tile, không dùng bản đồ offline.
- Nút mở Google Maps và các đường dẫn video vẫn cần kết nối mạng.

## Lưu ý về tính xác thực và riêng tư

- Ngày, giờ, tên địa điểm và tọa độ đều do người dùng nhập. Tọa độ **điểm khảo sát** không mặc nhiên là vị trí máy ảnh khi chụp.
- Ảnh chỉ nằm trong bộ nhớ tab, không tự gửi lên máy chủ. **Xuất ZIP trước khi đóng tab hoặc làm mới trang**.
- Đối chiếu ảnh và thông tin với bản gốc; chỉ công bố hình ảnh có quyền chia sẻ.
- Bản đồ nền: © OpenStreetMap contributors, tuân thủ chính sách [OSM Tile Usage](https://operations.osmfoundation.org/policies/tiles/).
- Địa chỉ Google Maps được mở bằng cơ chế Maps URLs của Google, không cần API key.

## Phạm vi thử nghiệm

Đã kiểm tra cấu trúc mã nguồn, tương tác và việc tạo file ZIP trong môi trường thử nghiệm. Nên kiểm tra thêm trực tiếp trên GitHub Pages với kết nối Internet để xác nhận nền bản đồ tại mạng của từng người dùng.
