# Kết quả kiểm chứng · 12/11/2026

## Đã kiểm tra thực tế

- JavaScript qua `node --check` cho `engine.js` và `app.js`: không lỗi cú pháp.
- `node --test prototype/engine.test.js`: **9/9 Pass**, kiểm tra điều kiện thực thi và trạng thái.
- Chrome cục bộ, viewport desktop 1440px và di động 390px: **18/18 kiểm tra giao diện Pass**, không ghi nhận lỗi JavaScript trong các luồng đã chạy.
- Đã chạy cùng 18 kiểm tra ở cả hai cách mở: qua HTTP cục bộ và trực tiếp file `index.html` (`--file`); cả hai đều Pass.
- Hai ảnh `01-giu-cho.png`, `02-xac-nhan.png` là ảnh chụp trình duyệt thực tế; đã mở xem lại.

## Các hành vi giao diện đã quan sát

1. Ban đầu có hai người, chưa đổi/hoàn.
2. Chuyến 1 chỗ không có nút giữ cho cả hai; BM 201 giữ được 2 chỗ.
3. Mới giữ chưa dùng lần đổi miễn phí.
4. “Ừ, đổi đi” chỉ mở bảng duyệt; nút xác nhận đang khoá.
5. Bảng có cả hai tên, đúng chuyến và hậu quả.
6. Quay lại chưa đổi.
7. Tích ô và duyệt mới đổi đúng một lần, lượt miễn phí còn 0.
8. Báo đổi nhầm chuyển hàng chờ mô phỏng; không hoàn tác giả.
9. Hoàn chưa tích ô thì không gửi; cảnh báo không huỷ được hiện trước duyệt.
10. Quay lại không gửi hoàn.
11. Đã gửi hoàn không đổi tiếp hoặc gửi lặp.
12. Hết 20 phút khi đang mở bảng duyệt thì đóng bảng và không đổi.
13. Yêu cầu chỉ đổi một người chuyển nhân viên, không tự đổi cả hai.
14. “Đừng đổi nữa” bỏ giữ chỗ, chưa đổi vé.
15. Tin nhắn chứa HTML hiển thị như văn bản, không tạo thẻ thực thi.
16. Ca không hiểu hỏi lại, không gọi tool ghi.
17. Màn hình chat 390px không tràn ngang.
18. Màn hình duyệt 390px không tràn ngang.

Trong lần kiểm tra đầu đã phát hiện bộ chuẩn hoá không xử lý chữ Đ viết hoa; đã sửa chuyển chữ thường trước khi bỏ dấu và chạy lại toàn bộ kiểm tra giao diện đạt.

## Cách chạy lại

Từ thư mục gốc bài nhóm, có Node và Chrome/Edge trên Windows:

```powershell
node --test prototype/engine.test.js
node prototype/verify-browser.cjs
node prototype/verify-browser.cjs --file
```

Script trình duyệt dùng profile riêng `.browser-profile/` trong thư mục bài và tự đóng browser/server do nó tạo. Profile bị loại khỏi Git và không thuộc bài nộp. Chế độ `--file` kiểm tra mở trực tiếp `index.html`, không phụ thuộc hosting.

## Giới hạn kết luận

Đây là kiểm chứng mô phỏng giao diện và state engine, chưa phải thử với hành khách thật, hệ thống đặt vé, LLM, mạng hay nhân viên thật. Không chứng minh hiểu mọi câu hoặc bảo vệ được giao dịch production. Các mục thành viên, quyết định cá nhân và ca lạ demo vẫn phải do nhóm điền đúng thực tế.
