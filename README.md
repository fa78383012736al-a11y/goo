# نظام GOO — دليل النشر والتحديث التلقائي

## بنية الملفات

```
your-repo/
├── accounting_system.html   ← الواجهة الرئيسية (تُعدَّل وتُرفع هنا)
├── sw.js                    ← Service Worker (لا تحتاج تعديله)
├── manifest.json            ← إعدادات PWA (لا تحتاج تعديله)
├── version.json             ← رقم الإصدار (حدِّثه مع كل تعديل)
├── icon-192.png             ← أيقونة التطبيق 192×192 (اختياري)
└── icon-512.png             ← أيقونة التطبيق 512×512 (اختياري)
```

---

## خطوات الإعداد لأول مرة

### 1. أنشئ Repository على GitHub
- اسمه مثلاً: `goo-app`
- اجعله **Public**

### 2. ارفع الملفات الأربعة
```
accounting_system.html
sw.js
manifest.json
version.json
```

### 3. فعّل GitHub Pages
- اذهب لـ Settings → Pages
- اختر Branch: `main` → Folder: `/ (root)`
- احفظ

### 4. عدِّل رابط GitHub في الملف الرئيسي
افتح `accounting_system.html` وابحث عن:
```javascript
const GITHUB_RAW = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main';
```
غيّره إلى:
```javascript
const GITHUB_RAW = 'https://raw.githubusercontent.com/اسمك/goo-app/main';
```

### 5. ثبِّت التطبيق على الجهاز
- افتح رابط GitHub Pages في المتصفح
- اضغط "إضافة إلى الشاشة الرئيسية"

---

## كيف تنشر تحديثاً

1. **عدِّل** `accounting_system.html` كما تريد
2. **حدِّث** `version.json` برقم إصدار جديد:
```json
{
  "version": "1.0.1",
  "changelog": "وصف التعديل باختصار"
}
```
3. **ارفع** الملفين على GitHub

✅ سيظهر للمستخدمين بانر تلقائي "يتوفر تحديث جديد" بعد 3 دقائق

---

## كيف يعمل النظام

```
المستخدم يفتح التطبيق
        ↓
Service Worker يعرض النسخة المخزنة (فوري)
        ↓
بعد 3 ثوان: يتحقق من version.json على GitHub
        ↓
إذا رقم الإصدار مختلف → يظهر بانر "تحديث متاح"
        ↓
المستخدم يضغط "تحديث الآن"
        ↓
يجلب accounting_system.html الجديد من GitHub
        ↓
يحدِّث الكاش ويعيد تحميل الصفحة
```

---

## ملاحظات

- **بدون إنترنت**: التطبيق يعمل من الكاش تلقائياً
- **البيانات**: محفوظة في Firebase، لا تتأثر بالتحديث
- **التحديث دوري**: كل 30 دقيقة أثناء الاستخدام
- **الـ Cache**: يتجدد تلقائياً عند كل تحديث

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| لا يظهر بانر التحديث | تأكد أن `version` في version.json تغيّر |
| التطبيق لا يتحدث | افتح DevTools → Application → Clear Storage |
| 404 على version.json | تأكد أن GitHub Pages مفعّل والملف مرفوع |
