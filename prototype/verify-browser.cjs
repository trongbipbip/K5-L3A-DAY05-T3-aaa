// Kiểm tra giao diện bằng Chrome/Edge cục bộ qua DevTools; không có thư viện ngoài.
// Chạy: node prototype/verify-browser.cjs (Windows, cần Chrome hoặc Edge đã cài).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const executable = candidates.find(p => fs.existsSync(p));
if (!executable) throw new Error('Chưa tìm được Chrome/Edge. Mở và thử thủ công theo README.');
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(__dirname, relative);
  if (!file.startsWith(__dirname + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' }[path.extname(file)] || 'text/plain; charset=utf-8');
  res.end(fs.readFileSync(file));
});
let browser;
let ws;
const requests = new Map();
const errors = [];
let seq = 0;
let passed = 0;
let browserOutput = '';
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const profile = path.resolve(__dirname, '..', '.browser-profile');
  browser = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-breakpad', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Không mở được DevTools trong 20 giây.')), 20_000);
    browser.stderr.on('data', buffer => {
      output += buffer.toString(); browserOutput = output; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    browser.on('error', reject);
    browser.on('exit', code => { clearTimeout(timeout); reject(new Error('Trình duyệt thoát trước khi kết nối, mã ' + code)); });
  });
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
    if (requests.has(message.id)) {
      const { resolve, reject, timer } = requests.get(message.id); clearTimeout(timer); requests.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  });
  const target = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const page = (method, params = {}) => command(method, params, sessionId);
  const run = async expression => {
    const result = await page('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const check = async (name, expression) => { assert.equal(await run(expression), true, name); passed++; console.log('PASS ' + name); };
  const send = async text => run(`$('message-input').value=${JSON.stringify(text)}; $('chat-form').dispatchEvent(new Event('submit',{cancelable:true})); true`);
  const click = async id => run(`$(${JSON.stringify(id)}).click(); true`);
  const reset = async () => click('reset-demo');
  const screenshot = async filename => {
    const { cssContentSize } = await page('Page.getLayoutMetrics');
    const { data } = await page('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: Math.ceil(cssContentSize.height), scale: 1 } });
    fs.writeFileSync(path.join(__dirname, filename), Buffer.from(data, 'base64'));
  };
  await page('Page.enable'); await page('Runtime.enable');
  await page('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const pageUrl = process.argv.includes('--file') ? pathToFileURL(path.join(__dirname, 'index.html')).href : url + '/index.html';
  await page('Page.navigate', { url: pageUrl });
  await run(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(typeof engine!=='undefined'){clearInterval(timer);resolve(true)}else if(++n>100){clearInterval(timer);reject(new Error('Trang chưa sẵn sàng'))}},50)})`);
  await page('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  await check('khởi tạo không đổi/hoàn, có đủ 2 hành khách', `!engine.changedFlight && !engine.refundId && fixture.passengers.length===2`);
  await send('Cho hai mẹ con đi chuyến sớm nhất');
  await check('BM 201 giữ 2 chỗ; BM 217 không có nút giữ', `engine.hold.id==='BM 201' && !$('hold-box').hidden && $('flight-cards').firstChild.querySelector('button')===null`);
  await check('không báo đổi vé khi mới giữ', `engine.freeChanges===1 && !engine.changedFlight && $('ticket-status').textContent.includes('Chưa đổi')`);
  await screenshot('01-giu-cho.png');
  await send('Ừ, đổi đi');
  await check('đồng ý mơ hồ mở bảng duyệt nhưng không thực hiện', `!$('confirm-screen').hidden && $('commit').disabled && !engine.changedFlight`);
  await check('bảng duyệt có hai tên, chuyến và hậu quả', `$('confirm-summary').textContent.includes('Nguyễn Gia Bình') && $('confirm-summary').textContent.includes('BM 201') && $('confirm-warning').textContent.includes('miễn phí')`);
  await screenshot('02-xac-nhan.png');
  await click('back'); await check('quay lại chưa đổi', `engine.changedFlight===null && engine.pending===null`);
  await click('review-change');
  await run(`$('consent').checked=true; $('consent').dispatchEvent(new Event('change')); true`); await click('commit');
  await check('duyệt mới thực hiện đổi đúng một lần', `engine.changedFlight==='BM 201' && engine.freeChanges===0 && engine.log.filter(x=>x.tool==='doi_chuyen_bay').length===1`);
  await click('result-back'); await send('Bạn vừa đổi nhầm vé của mình');
  await check('đổi nhầm chuyển người, không hoàn tác giả', `engine.log.at(-1).tool==='chuyen_nhan_vien' && engine.changedFlight==='BM 201' && $('messages').textContent.includes('Chưa có nhân viên nhận')`);
  await reset(); await click('refund'); await check('hoàn chưa tích ô không được gửi', `$('commit').disabled && engine.refundId===null && $('confirm-warning').textContent.includes('không huỷ được')`);
  await click('back'); await check('quay lại không gửi hoàn', `engine.refundId===null && !engine.log.some(x=>x.tool==='gui_yeu_cau_hoan_ve')`);
  await click('refund'); await run(`$('consent').checked=true; $('consent').dispatchEvent(new Event('change')); true`); await click('commit');
  await click('result-back'); await send('Đổi sang chuyến khác');
  await check('đã gửi hoàn không đổi tiếp/gửi lặp', `engine.refundId==='REF-DEMO-001' && !engine.changedFlight && $('refund').disabled && engine.log.filter(x=>x.tool==='gui_yeu_cau_hoan_ve').length===1`);
  await reset(); await send('Cho hai mẹ con đi chuyến sớm nhất'); await click('review-change'); await click('expire-demo');
  await check('hết hạn ngay khi đang duyệt thì đóng bảng, không đổi', `engine.hold===null && engine.pending===null && !engine.changedFlight && $('confirm-screen').hidden`);
  await reset(); await send('chỉ đổi cho mình thôi');
  await check('thay đổi một phần chuyển người, không tự đổi cả hai', `engine.log.at(-1).tool==='chuyen_nhan_vien' && !engine.changedFlight && !engine.hold`);
  await reset(); await send('Cho hai mẹ con đi chuyến sớm nhất'); await send('Đừng đổi nữa');
  await check('yêu cầu dừng bỏ giữ chỗ và chưa đổi', `engine.hold===null && !engine.changedFlight`);
  await reset(); await send('<img src=x onerror=alert(1)>');
  await check('tin nhắn hiển thị dạng văn bản, không tạo HTML', `$('messages').querySelector('img')===null && $('messages').textContent.includes('<img')`);
  await check('ca ngoài bộ từ khoá chỉ hỏi lại, không gọi tool ghi', `engine.log.length===1 && $('messages').textContent.includes('Mình chưa hiểu đủ')`);
  await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await check('màn hình 390px không cuộn ngang', `document.documentElement.scrollWidth<=390`);
  await send('Cho hai mẹ con đi chuyến sớm nhất'); await send('Ừ, đổi đi');
  await check('bảng duyệt trên di động không cuộn ngang', `document.documentElement.scrollWidth<=390 && !$('confirm-screen').hidden`);
  assert.deepEqual(errors, []); console.log(`PASS ${passed} kiểm tra giao diện; không có lỗi JavaScript. Đã chụp 2 PNG.`);
}
function command(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { requests.delete(id); reject(new Error('DevTools timeout: ' + method)); }, 15_000);
    requests.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
main().catch(error => { console.error(error); console.error(browserOutput.slice(-2000)); process.exitCode = 1; }).finally(async () => {
  if (ws?.readyState === WebSocket.OPEN) {
    try { await command('Browser.close'); } catch {}
    ws.close();
  }
  if (browser && browser.exitCode === null) browser.kill();
  server.close();
});
