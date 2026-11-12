(function (root) {
  'use strict';
  // Tất cả dữ liệu dưới đây là dữ liệu dựng cho LAB5.
  const fixture = {
    booking: 'TRV-7Q2K', original: 'BM 213', route: 'Hà Nội → TP.HCM',
    passengers: ['Nguyễn Minh An · 34 tuổi', 'Nguyễn Gia Bình · 5 tuổi'],
    flights: [
      { id: 'BM 217', date: '12/11/2026', time: '21:00', seats: 1 },
      { id: 'BM 201', date: '13/11/2026', time: '07:00', seats: 9 },
      { id: 'BM 205', date: '13/11/2026', time: '09:30', seats: 4 }
    ],
    // Giả định nhóm bổ sung, không phải chính sách của Traveloka/hãng thật.
    refund: { amount: '2.400.000 ₫', method: 'Ví Mẫu •••• 0000', eta: 'Tối đa 90 ngày' }
  };
  class TravelEngine {
    constructor(now = () => Date.now()) {
      this.now = now;
      this.hold = null;
      this.pending = null;
      this.changedFlight = null;
      this.refundId = null;
      this.freeChanges = 1;
      this.log = [];
    }
    record(tool, detail) { this.log.push({ tool, detail }); }
    lookup() { this.record('tra_cuu_dat_cho', fixture.booking); return fixture; }
    expire() {
      if (this.hold && this.now() >= this.hold.until) {
        this.hold = null; this.pending = null;
        this.record('het_han_giu_cho', 'Tự nhả chỗ; không đổi vé.');
        return true;
      }
      return false;
    }
    invalidate() { this.pending = null; }
    guardOpen() {
      if (this.refundId) throw new Error('Yêu cầu hoàn đã gửi, không thể tự huỷ hoặc đổi vé. Hãy chuyển nhân viên.');
      if (this.changedFlight) throw new Error('Vé đã đổi và đã dùng lần miễn phí. Hãy chuyển nhân viên nếu cần sửa.');
    }
    reserve(id) {
      this.guardOpen();
      const flight = fixture.flights.find(f => f.id === id);
      if (!flight || flight.seats < fixture.passengers.length) throw new Error('Chuyến này không đủ 2 chỗ; không tách trẻ nhỏ khỏi người lớn.');
      this.expire();
      // Cùng một chỗ giữ không được gia hạn chỉ bằng cách bấm lại.
      if (!this.hold || this.hold.id !== id) {
        this.hold = { id, until: this.now() + 20 * 60 * 1000 };
        this.record('giu_cho_chuyen_moi', id + ' · 2 hành khách · 20 phút');
      }
      this.pending = null;
      return flight;
    }
    release() {
      if (this.hold) this.record('bo_giu_cho', this.hold.id + ' · vé chưa đổi');
      this.hold = null; this.pending = null;
    }
    prepare(kind) {
      this.guardOpen(); this.expire();
      if (!['change', 'refund'].includes(kind)) throw new Error('Yêu cầu không được hỗ trợ.');
      if (kind === 'change' && !this.hold) throw new Error('Chưa có chỗ đang giữ. Hãy chọn chuyến và giữ đủ 2 chỗ trước.');
      this.pending = { kind, flight: kind === 'change' ? this.hold.id : null };
      return this.pending;
    }
    confirm(accepted) {
      this.guardOpen(); this.expire();
      if (!accepted || !this.pending) throw new Error('Cần kiểm tra và xác nhận rõ hành khách, chuyến hoặc yêu cầu hoàn trước khi thực hiện.');
      const request = this.pending;
      if (request.kind === 'change') {
        const flight = fixture.flights.find(f => f.id === request.flight);
        if (!this.hold || this.hold.id !== request.flight || !flight || flight.seats < 2 || this.freeChanges < 1) throw new Error('Chỗ giữ không còn hợp lệ. Chưa đổi vé.');
        this.changedFlight = request.flight; this.freeChanges = 0;
        this.record('doi_chuyen_bay', request.flight + ' · cả 2 hành khách · khách xác nhận');
      } else {
        this.refundId = 'REF-DEMO-001';
        this.record('gui_yeu_cau_hoan_ve', this.refundId + ' · cả 2 hành khách · khách xác nhận riêng');
      }
      this.hold = null; this.pending = null;
      return request.kind;
    }
    transfer(reason) {
      this.pending = null;
      this.record('chuyen_nhan_vien', reason);
      return 'HT-DEMO-' + String(this.log.filter(x => x.tool === 'chuyen_nhan_vien').length).padStart(3, '0');
    }
  }
  const api = { TravelEngine, fixture };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TravelLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
