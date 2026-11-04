/* =====================================================================
   小小探险家 · 离线缓存脚本（Service Worker）
   作用：第一次联网打开时，把游戏所需的全部文件存进手机；
        之后断网也能从缓存直接打开。
   更新方法：修改了 index.html 等文件后，把下面的版本号 +1 再上传，
            孩子下次联网打开时会自动换成新版本。
   ===================================================================== */
const VERSION = 'xxtxj-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

// 安装：把所有文件存进缓存
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 激活：删除旧版本缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 请求：优先用缓存（离线可用），同时在有网时悄悄更新缓存
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(e.request, { ignoreSearch: true }).then(hit => {
        const net = fetch(e.request).then(res => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => null);
        if (hit) return hit;
        return net.then(res => res || cache.match('./index.html'));
      })
    )
  );
});
