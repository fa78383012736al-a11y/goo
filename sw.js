// ==================== GOO Service Worker ====================
// الإصدار: 1.1.0 - يدعم التحديث التلقائي الفوري

const CACHE_NAME = 'goo-app-v1.1.0';
const CACHE_URLS = [
    './index.html',
    './manifest.json',
    './version.json',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// ==================== Install ====================
self.addEventListener('install', event => {
    self.skipWaiting(); // إجبار الـ SW الجديد على التفعيل فوراً
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CACHE_URLS);
        })
    );
});

// ==================== Activate ====================
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // التحكم في جميع الصفحات فوراً
            caches.keys().then(keys => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
                );
            })
        ])
    );
});

// ==================== Fetch Strategy ====================
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // استثناء طلبات GitHub API و Raw لضمان الحصول على أحدث البيانات
    if (url.hostname.includes('githubusercontent.com') || url.hostname.includes('api.github.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // استراتيجية Network First للملفات الأساسية لضمان التحديث
    if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('version.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // استراتيجية Cache First للباقي
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse => {
                if (networkResponse.ok) {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
                }
                return networkResponse;
            });
        })
    );
});

// ==================== Message Handler ====================
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
