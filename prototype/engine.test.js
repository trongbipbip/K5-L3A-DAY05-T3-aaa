'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TravelEngine } = require('./engine');
test('không giữ chuyến chỉ còn 1 chỗ cho đoàn có trẻ nhỏ', () => {
  const e = new TravelEngine();
  assert.throws(() => e.reserve('BM 217'), /không đủ 2 chỗ/);
  assert.equal(e.hold, null);
  assert.equal(e.log.length, 0);
});
test('giữ chỗ không đổi vé; bấm lại không kéo dài thời hạn', () => {
  let now = 0; const e = new TravelEngine(() => now);
  e.reserve('BM 201'); now = 30_000; e.reserve('BM 201');
  assert.equal(e.hold.until, 1_200_000);
  assert.equal(e.changedFlight, null);
  assert.equal(e.freeChanges, 1);
  e.release(); assert.equal(e.hold, null); assert.equal(e.freeChanges, 1);
});
test('đồng ý mơ hồ/không duyệt không được thực hiện tool đổi', () => {
  const e = new TravelEngine(); e.reserve('BM 201');
  assert.throws(() => e.confirm(true)); // Chưa có bản tóm tắt để duyệt.
  e.prepare('change'); assert.throws(() => e.confirm(false));
  assert.equal(e.changedFlight, null);
  assert.equal(e.log.filter(x => x.tool === 'doi_chuyen_bay').length, 0);
});
test('đổi sau duyệt chỉ thực hiện một lần, dùng đúng chuyến đang giữ', () => {
  const e = new TravelEngine(); e.reserve('BM 205'); e.prepare('change'); e.confirm(true);
  assert.equal(e.changedFlight, 'BM 205'); assert.equal(e.freeChanges, 0);
  assert.equal(e.hold, null); assert.throws(() => e.confirm(true));
  assert.equal(e.log.filter(x => x.tool === 'doi_chuyen_bay').length, 1);
});
test('hết 20 phút ngay tại ranh giới thì chặn bản xác nhận cũ', () => {
  let now = 0; const e = new TravelEngine(() => now);
  e.reserve('BM 201'); e.prepare('change'); now = 1_200_000;
  assert.throws(() => e.confirm(true)); assert.equal(e.changedFlight, null);
  assert.equal(e.hold, null); assert.equal(e.freeChanges, 1);
});
test('đổi chuyến lựa chọn làm mất hiệu lực xác nhận trước', () => {
  const e = new TravelEngine(); e.reserve('BM 201'); e.prepare('change'); e.reserve('BM 205');
  assert.throws(() => e.confirm(true)); assert.equal(e.changedFlight, null);
});
test('yêu cầu mới hoặc chuyển nhân viên phải huỷ xác nhận đang chờ', () => {
  const e = new TravelEngine(); e.prepare('refund'); e.invalidate();
  assert.throws(() => e.confirm(true)); e.prepare('refund'); e.transfer('khách cần hỗ trợ');
  assert.throws(() => e.confirm(true)); assert.equal(e.refundId, null);
});
test('mở bảng hoàn rồi quay lại không gửi hoàn và vẫn giữ lựa chọn đổi', () => {
  const e = new TravelEngine(); e.reserve('BM 201'); e.prepare('refund'); e.invalidate();
  assert.equal(e.refundId, null); assert.equal(e.hold.id, 'BM 201');
  assert.equal(e.freeChanges, 1);
});
test('hoàn cần duyệt riêng; đã gửi thì chặn đổi và gửi lặp', () => {
  const e = new TravelEngine(); e.prepare('refund'); assert.throws(() => e.confirm(false));
  e.confirm(true); assert.equal(e.refundId, 'REF-DEMO-001');
  assert.throws(() => e.reserve('BM 201')); assert.throws(() => e.prepare('change'));
  assert.throws(() => e.prepare('refund')); assert.equal(e.hold, null);
  assert.equal(e.log.filter(x => x.tool === 'gui_yeu_cau_hoan_ve').length, 1);
});
