'use strict';
const { TravelEngine, fixture } = window.TravelLab;
let clockOffset = 0;
let engine = new TravelEngine(() => Date.now() + clockOffset);
const $ = id => document.getElementById(id);
function bubble(text, user = false) {
  const box = document.createElement('div'); box.className = 'bubble' + (user ? ' user' : '');
  const who = document.createElement('span'); who.className = 'speaker'; who.textContent = user ? 'BẠN' : 'TRỢ LÝ AI · MÔ PHỎNG';
  box.append(who, document.createTextNode(text)); $('messages').append(box); $('messages').scrollTop = $('messages').scrollHeight;
}
function showChat() { $('chat-screen').hidden = false; $('confirm-screen').hidden = true; }
function sync() {
  const expired = engine.expire();
  if (expired) {
    showChat(); bubble('Chỗ giữ đã hết 20 phút và tự nhả. Mình chưa đổi vé. Bạn cần tra cứu và giữ chỗ lại trước khi xác nhận.');
  }
  const terminal = !!(engine.changedFlight || engine.refundId);
  $('hold-box').hidden = !engine.hold;
  $('next-actions').hidden = !engine.hold || terminal;
  if (engine.hold) {
    const seconds = Math.max(0, Math.ceil((engine.hold.until - engine.now()) / 1000));
    $('hold-label').textContent = `Giữ 2 chỗ · ${engine.hold.id} · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  $('refund').disabled = terminal;
  $('ticket-status').textContent = engine.refundId ? 'Đã gửi yêu cầu hoàn · không thể tự huỷ' : engine.changedFlight ? `Đã đổi sang ${engine.changedFlight} · còn 0 lần miễn phí` : 'Chưa đổi vé · còn 1 lần đổi miễn phí';
  for (const button of $('flight-cards').querySelectorAll('button')) button.disabled = terminal;
  $('tool-log').replaceChildren();
  for (const item of engine.log) { const li = document.createElement('li'); li.textContent = item.tool + ' → ' + item.detail; $('tool-log').append(li); }
}
function options() {
  $('flight-options').hidden = false; $('flight-cards').replaceChildren();
  for (const flight of fixture.flights) {
    const card = document.createElement('div'); card.className = 'flight-card' + (flight.seats < 2 ? ' unavailable' : '');
    const info = document.createElement('div'); const title = document.createElement('strong'); title.textContent = `${flight.id} · ${flight.time}`;
    const desc = document.createElement('p'); desc.textContent = `${flight.date} · Còn ${flight.seats} chỗ`;
    info.append(title, desc); card.append(info);
    if (flight.seats < 2) { const note = document.createElement('span'); note.className = 'source'; note.textContent = 'Không đủ cho 2 hành khách'; card.append(note); }
    else { const btn = document.createElement('button'); btn.textContent = 'Giữ 2 chỗ'; btn.onclick = () => reserve(flight.id); card.append(btn); }
    $('flight-cards').append(card);
  }
  sync();
}
function reserve(id) {
  try { const flight = engine.reserve(id); bubble(`Đang giữ 2 chỗ trên ${flight.id}, ${flight.time} ngày ${flight.date}. Chỗ giữ có hiệu lực tối đa 20 phút. Chưa đổi vé và chưa dùng lần đổi miễn phí. Bạn có thể bỏ giữ chỗ hoặc kiểm tra trước khi xác nhận.`); }
  catch (error) { bubble(error.message); }
  sync();
}
function row(label, value) {
  const div = document.createElement('div'); div.className = 'summary-row'; const key = document.createElement('span'); const val = document.createElement('strong'); key.textContent = label; val.textContent = value; div.append(key, val); $('confirm-summary').append(div);
}
function review(kind) {
  try { engine.prepare(kind); } catch (error) { bubble(error.message); sync(); return; }
  $('chat-screen').hidden = true; $('confirm-screen').hidden = false; $('confirm-summary').replaceChildren();
  $('consent').checked = false; $('commit').disabled = true; $('consent-wrap').hidden = false; $('confirm-actions').hidden = false; $('result-back').hidden = true; $('result').textContent = '';
  const refund = kind === 'refund';
  $('confirm-title').textContent = refund ? 'Kiểm tra yêu cầu hoàn vé' : 'Kiểm tra thay đổi chuyến';
  row('Mã đặt chỗ', fixture.booking); row('Áp dụng cho', 'Cả 2 hành khách');
  row('Người lớn', fixture.passengers[0]); row('Trẻ em', fixture.passengers[1]);
  row('Chuyến gốc đã huỷ', 'BM 213 · 19:00 · 12/11/2026');
  if (refund) {
    row('Tổng tiền hoàn (giả định demo)', fixture.refund.amount); row('Về phương thức gốc (giả định)', fixture.refund.method); row('Thời gian xử lý (giả định)', fixture.refund.eta);
    $('confirm-warning').textContent = '⑤ Gửi rồi không huỷ được yêu cầu hoàn. Sau khi gửi, luồng này không thể đổi vé. Số tiền, phương thức và thời gian ở trên là dữ liệu giả nhóm bổ sung, không phải chính sách của hãng thật.';
    $('consent-text').textContent = 'Tôi yêu cầu hoàn vé cho cả Nguyễn Minh An và Nguyễn Gia Bình; đã kiểm tra số tiền, nơi nhận, thời gian và hiểu rằng gửi rồi không huỷ được.';
    $('commit').textContent = 'Gửi yêu cầu hoàn cho cả 2';
  } else {
    const flight = fixture.flights.find(f => f.id === engine.pending.flight);
    row('Chuyến mới · HAN → SGN', `${flight.id} · ${flight.time} · ${flight.date}`); row('Phí đổi theo dữ liệu dựng', '0 ₫ · dùng 1 lần miễn phí');
    $('confirm-warning').textContent = '⑤ Đổi vé sẽ dùng lần đổi miễn phí duy nhất. Không có hoàn tác tự động sau khi đổi. Nếu cần sửa, bạn phải gặp nhân viên và chưa chắc còn chuyến phù hợp.';
    $('consent-text').textContent = `Tôi xác nhận đổi cả Nguyễn Minh An và Nguyễn Gia Bình sang ${flight.id}, ${flight.time} ngày ${flight.date}, và đồng ý dùng lần đổi miễn phí.`;
    $('commit').textContent = 'Xác nhận đổi cho cả 2';
  }
  $('confirm-title').tabIndex = -1; $('confirm-title').focus(); sync();
}
function transfer(reason) {
  const id = engine.transfer(reason);
  bubble(`Đã tạo phiếu ${id} trong hàng chờ mô phỏng, kèm đặt chỗ, hai hành khách, chỗ đang giữ và lịch sử thao tác. Chưa có nhân viên nhận; chưa có thời gian phản hồi được xác nhận. Nếu có chỗ giữ, thời hạn 20 phút vẫn tiếp tục và không tự đổi/hoàn khi hết hạn.`);
  sync();
}
function normalize(text) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }
function send(text) {
  if (!text.trim()) return;
  showChat(); engine.invalidate(); bubble(text.trim(), true);
  const t = normalize(text);
  if (engine.changedFlight || engine.refundId) {
    transfer('Khách liên hệ sau thao tác đã thực hiện: ' + text); return;
  }
  // Bộ quy tắc giới hạn cho demo; không dùng model để suy đoán ý định.
  if (/khong doi|dung doi|chua doi|dung lai/.test(t) && !/hoan/.test(t)) { engine.release(); bubble('Mình dừng yêu cầu đổi và bỏ chỗ đang giữ. Chưa đổi vé hoặc gửi hoàn. Bạn có thể chọn lại khi cần.'); sync(); return; }
  if (/minh thoi|chi.*(mot|1|minh|nguyen)/.test(t)) { transfer('Yêu cầu thay đổi một phần đặt chỗ; prototype chỉ xử lý cả hai hành khách: ' + text); return; }
  if (/nham|doi ten|mot minh|nhan vien|bo qua|tre.*rieng/.test(t)) { transfer(text); return; }
  if (/hoan|huy het/.test(t) && /doi/.test(t)) { bubble('Bạn đang nhắc cả đổi chuyến và hoàn vé. Bạn muốn xem chuyến thay thế hay kiểm tra yêu cầu hoàn? Mình chưa thực hiện việc nào.'); sync(); return; }
  if (/hoan|huy het/.test(t)) { bubble('Mình chưa gửi yêu cầu hoàn. Bạn cần kiểm tra cả hai hành khách và cảnh báo không huỷ được, rồi xác nhận riêng.'); review('refund'); return; }
  if (/boi thuong/.test(t)) { bubble('Theo chính sách dựng của hãng Bay Mẫu, chuyến bị huỷ do bão được đổi miễn phí một lần trong 48 giờ hoặc hoàn toàn bộ; không bồi thường tiền mặt.'); sync(); return; }
  if (/som nhat|hai me con|ca hai|2 nguoi/.test(t)) {
    engine.lookup(); options(); bubble('BM 217 lúc 21:00 chỉ còn 1 chỗ, không đủ cho cả hai. Trong dữ liệu dựng, chuyến sớm nhất đủ 2 chỗ là BM 201 lúc 07:00 ngày 13/11. Mình giữ chỗ trước; vé chỉ đổi khi bạn kiểm tra và xác nhận rõ.'); reserve('BM 201'); return;
  }
  if (/doi|dong y|^u[, .]|^ok|xac nhan/.test(t)) {
    bubble('“Đổi đi” chưa đủ để xác nhận chính xác chuyến và hành khách. Mình chưa đổi vé. Hãy kiểm tra thông tin cụ thể trước khi bấm xác nhận.');
    if (engine.hold) review('change'); else { engine.lookup(); options(); }
    return;
  }
  if (/may gio|tinh trang|chuyen bay|tra cuu/.test(t)) {
    engine.lookup(); bubble('BM 213 Hà Nội → TP.HCM, dự kiến 19:00 ngày 12/11/2026, đã huỷ do thời tiết. Bạn có thể xem chuyến thay thế đủ 2 chỗ hoặc kiểm tra yêu cầu hoàn.'); options(); return;
  }
  bubble('Mình chưa hiểu đủ yêu cầu để thực hiện. Bạn muốn xem chuyến thay thế, hoàn vé hay gặp nhân viên? Mình chưa đổi hoặc gửi yêu cầu hoàn.'); sync();
}
$('chat-form').onsubmit = event => { event.preventDefault(); const text = $('message-input').value; $('message-input').value = ''; send(text); };
$('review-change').onclick = () => review('change'); $('refund').onclick = () => review('refund');
$('release').onclick = () => { engine.release(); bubble('Đã bỏ giữ chỗ. Chưa đổi vé, lần đổi miễn phí vẫn còn.'); sync(); };
$('support').onclick = () => transfer('Khách yêu cầu gặp nhân viên');
$('consent').onchange = () => { $('commit').disabled = !$('consent').checked; };
$('back').onclick = () => { engine.invalidate(); showChat(); bubble('Bạn đã quay lại. Chưa thực hiện yêu cầu đang xem.'); sync(); };
$('result-back').onclick = () => { showChat(); sync(); };
$('commit').onclick = () => {
  try {
    const kind = engine.confirm($('consent').checked);
    $('result').textContent = kind === 'refund' ? 'Đã gửi yêu cầu hoàn mô phỏng REF-DEMO-001 cho cả hai hành khách. Không thể huỷ yêu cầu. Nhân viên chỉ có thể tiếp nhận hỗ trợ, không có cam kết rút lại được.' : `Đã đổi vé mô phỏng cho cả hai hành khách sang ${engine.changedFlight}. Lần đổi miễn phí đã dùng. Cần sửa? Về hội thoại và gặp nhân viên.`;
    $('consent-wrap').hidden = true; $('confirm-actions').hidden = true; $('result-back').hidden = false;
  } catch (error) { $('result').textContent = error.message; $('commit').disabled = true; }
  sync();
};
document.querySelectorAll('[data-example]').forEach(button => { button.onclick = () => send(button.dataset.example); });
$('expire-demo').onclick = () => {
  if (!engine.hold) { bubble('Chưa có chỗ đang giữ để giả lập hết hạn.'); return; }
  clockOffset += 20 * 60 * 1000; sync();
};
function reset() {
  clockOffset = 0; engine = new TravelEngine(() => Date.now() + clockOffset); $('messages').replaceChildren(); $('flight-options').hidden = true; $('flight-cards').replaceChildren(); showChat(); engine.lookup();
  bubble('Chào bạn, mình là trợ lý AI mô phỏng. Chuyến BM 213 đã bị huỷ do bão. Đặt chỗ có một người lớn và một trẻ 5 tuổi. Mình có thể tra cứu, giữ chỗ và chuẩn bị yêu cầu; đổi hoặc hoàn vé chỉ thực hiện sau khi bạn xác nhận rõ. Bạn cần đi sớm nhất hay muốn xem quyền lợi?'); sync();
}
$('reset-demo').onclick = reset;
setInterval(sync, 1000); reset();
