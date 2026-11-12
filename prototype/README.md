# Prototype · Bay tiếp

Mở `index.html` bằng Chrome/Edge. Không cần server, đăng nhập hoặc API key. Dữ liệu giả; nạp lại trang đặt lại mô phỏng.

## Bấm demo

1. Gửi “Cho hai mẹ con đi chuyến sớm nhất”.
2. Chỉ BM 217 chỉ có 1 chỗ; BM 201 được giữ 2 chỗ trong 20 phút, chưa đổi vé.
3. Gửi “Ừ, đổi đi”. Bảng duyệt xuất hiện, nút thực hiện bị khoá cho đến khi tích ô đồng ý.
4. Đọc thông tin cả hai người và hậu quả; bấm quay lại hoặc xác nhận đổi.
5. Mở “Bàn demo” cuối trang để xem log mô phỏng, reset, thử hoàn hoặc giả lập hết hạn.

Các nút tình huống chỉ là tiện ích cho người trình bày. Không có AI thật; câu ngoài bộ từ khoá có thể chỉ được hỏi lại/chuyển người. Không tuyên bố hiểu ngôn ngữ tự do đầy đủ.

## Ảnh minh chứng

Giao diện đã có các số ①–⑥ bằng huy hiệu vàng. Chụp thực tế để minh chứng:

- `01-giu-cho.png`: màn hình hội thoại sau bước 1, thấy đặt chỗ, các chuyến và đếm ngược.
- `02-xac-nhan.png`: bảng xác nhận đổi sau bước 3, chưa tích ô, thấy cả hai tên và hậu quả.

Nếu ảnh đã được tạo bằng kiểm tra tự động, mở xem lại và có thể chụp lại sau khi chỉnh thiết kế. Nếu chưa có PNG, phóng trình duyệt vừa đủ nhìn toàn bộ nội dung cần thiết rồi dùng `Win+Shift+S`, lưu đúng tên ở thư mục này. Không gọi ảnh “đã chụp” khi chưa có file.

Thêm vào §5 của `spec.md` sau khi file tồn tại:

```markdown
![Ảnh 1 — Căn cứ, chuyến đủ chỗ và thao tác giữ chỗ](prototype/01-giu-cho.png)
![Ảnh 2 — Xác nhận riêng trước khi đổi vé](prototype/02-xac-nhan.png)
```

## Kiểm tra điều kiện

Tại thư mục gốc bài nhóm:

```powershell
node --check prototype/app.js
node --check prototype/engine.js
node --test prototype/engine.test.js
```

Các kiểm tra trên không thay thế việc xem và bấm giao diện. Không dùng dữ liệu này như hướng dẫn chính sách của hãng bay thật.
