/* 離線快取：第一次打開就把整個網站存起來，之後沒網路也能看。
   網頁、CSS、JS 先抓網路的新版（3 秒沒回應就用快取）；字型、圖示直接用快取，背景再更新。
   新增檔案時記得加進 FILES。 */
var CACHE = "jp8day-v1";
var FILES = [
  "./", "index.html", "prep.html", "css/style.css",
  "js/icons.js", "js/data.js", "js/main.js",
  "fonts/huninn-subset.woff2", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromNetwork(req) {
  return fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  var cacheFirst = /\.(woff2|png)$/.test(new URL(req.url).pathname);
  if (cacheFirst) {
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fromNetwork(req).catch(function () { return hit; });
      return hit || net;
    }));
    return;
  }
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
    }, 3000);
    fromNetwork(req).then(function (res) {
      clearTimeout(timer); if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (!done) { done = true; resolve(hit || caches.match("index.html")); }
      });
    });
  }));
});
