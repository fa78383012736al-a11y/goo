// ==================== GOO Service Worker ====================
// يتحكم في التخزين المؤقت والعمل بدون إنترنت

const CACHE_NAME = 'goo-app-v1';
const CACHE_URLS = [
    './accounting_system.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
];

// ==================== Install ====================
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ==================== Activate ====================
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ==================== Fetch Strategy ====================
// الاستراتيجية: Network First للـ HTML الرئيسي → Cache Fallback
// Cache First لباقي الموارد الثابتة
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // GitHub Raw requests: دائماً من الشبكة (لا تخزين)
    if (url.hostname === 'raw.githubusercontent.com') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Firebase requests: دائماً من الشبكة
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('gstatic.com')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }

    // الملف الرئيسي: Network First ثم Cache
    if (url.pathname.endsWith('accounting_system.html') || url.pathname === '/' || url.pathname === '') {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' })
                .then(res => {
                    // تحديث الكاش بالنسخة الجديدة
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return res;
                })
                .catch(() => caches.match('./accounting_system.html'))
        );
        return;
    }

    // version.json: دائماً Network لاكتشاف التحديثات
    if (url.pathname.endsWith('version.json')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .catch(() => new Response('{"version":"offline"}', { headers: { 'Content-Type': 'application/json' } }))
        );
        return;
    }

    // باقي الموارد: Cache First ثم Network
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(res => {
                    if (res && res.status === 200) {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return res;
                });
            })
            .catch(() => new Response('Offline', { status: 503 }))
    );
});

// ==================== Message Handler ====================
// استقبال رسائل من الصفحة (مثل طلب تحديث فوري)
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0]?.postMessage('cleared');
        });
    }
});
