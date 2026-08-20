/* offline cache — ciphertext only */
const V = "ft-202608201411";
const SHELL = ["./", "./index.html", "./boot.js", "./manifest.webmanifest",
  "./n-192.png", "./n-512.png", "./n-apple.png", "./n-favicon.png",
  "./d/k.e", "./d/s.e", "./d/p.e"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !/fonts\.(googleapis|gstatic)\.com/.test(url.host)) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      const c = r.clone(); caches.open(V).then(x => x.put("./index.html", c)); return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r && r.status === 200) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
