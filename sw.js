/* Scratch坐标角度探险 · 离线缓存（Service Worker）
   更新题目后，把 VERSION 加 1（scratch-v1 → scratch-v2），孩子下次联网打开就会换成新版本。
   放在独立仓库的根目录，和 index.html 在同一层。 */
const VERSION = 'scratch-v1';
const FILES = ['./', './index.html', './manifest.webmanifest',
               './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // 只清理本游戏自己的旧缓存（以 scratch- 开头），不动同一网站上其他游戏的缓存
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('scratch-') && k !== VERSION).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 网页本身：优先联网取最新版；github.io 在国内有时很慢，所以超过 3 秒或离线就直接用缓存
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = await caches.match('./index.html', {cacheName: VERSION});
      const net = fetch(req).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); }
        return r;
      });
      if (!cached) return net;
      const timeout = new Promise(res => setTimeout(() => res(cached), 3000));
      return Promise.race([net.catch(() => cached), timeout]);
    })());
    return;
  }
  // 图标等静态文件：先用缓存，没有再联网
  e.respondWith(caches.match(req, {cacheName: VERSION}).then(hit => hit || fetch(req)));
});
