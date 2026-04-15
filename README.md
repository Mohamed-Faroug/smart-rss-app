# 🎙️ منصة توزيع البودكاست العربي

منصة ويب كاملة لنشر وإدارة البودكاست من خلال RSS Feed، مبنية بـ React + Supabase، مع دعم كامل للغة العربية.

## 🚀 المميزات

- **مزامنة RSS تلقائية** — أضف رابط RSS وسيتم جلب جميع الحلقات وتحديثها
- **مشغل صوتي متكامل** — تشغيل، إيقاف، طابور، تحكم في السرعة، تقديم/رجوع
- **دعم كامل للعربية** — RTL، خطوط عربية، واجهة مصممة للمستخدم العربي
- **لوحة إدارة** — إضافة/حذف Feeds، مزامنة يدوية، إدارة البودكاست
- **API جاهز** — كل شيء في Supabase، جاهز لتطبيق موبايل
- **أداء عالٍ** — تحميل كسول، Skeleton loading، pagination

## 📦 هيكل المشروع

```
podcast-platform/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # شريط التنقل العلوي
│   │   ├── Footer.jsx          # التذييل
│   │   ├── PlayerBar.jsx       # مشغل الصوت الثابت في الأسفل
│   │   ├── EpisodeCard.jsx     # بطاقة الحلقة
│   │   ├── PodcastCard.jsx     # بطاقة البودكاست
│   │   └── AddFeedModal.jsx    # نافذة إضافة RSS Feed
│   ├── pages/
│   │   ├── HomePage.jsx        # الصفحة الرئيسية
│   │   ├── PodcastsPage.jsx    # قائمة البودكاست
│   │   ├── PodcastDetailPage.jsx # صفحة بودكاست واحد
│   │   ├── EpisodesPage.jsx    # كل الحلقات مع بحث
│   │   └── AdminPage.jsx       # لوحة الإدارة
│   ├── hooks/
│   │   ├── usePlayer.jsx       # مشغل الصوت (Context + Reducer)
│   │   └── useRSSSync.js       # منطق مزامنة RSS
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   ├── api.js              # طبقة API (podcasts, episodes, rss)
│   │   └── rss.js              # محلل RSS Feed
│   └── styles/
│       └── globals.css         # CSS + Tailwind + animations
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # كامل قاعدة البيانات
├── .env.example
└── README.md
```

## ⚡ التثبيت والتشغيل

### 1. إعداد Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. في **SQL Editor**، انسخ والصق محتوى ملف:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. شغّل الكود لإنشاء الجداول

### 2. إعداد المتغيرات

```bash
cp .env.example .env
```

عدّل `.env` وضع مفاتيح Supabase:
- `VITE_SUPABASE_URL` — من: Project → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` — من: Project → Settings → API → anon public

### 3. تثبيت وتشغيل

```bash
npm install
npm run dev
```

افتح المتصفح على: http://localhost:5173

### 4. البناء للإنتاج

```bash
npm run build
```

## 🗄️ قاعدة البيانات

### الجداول

| الجدول | الوصف |
|--------|-------|
| `podcasts` | معلومات البودكاست (العنوان، الوصف، الصورة...) |
| `episodes` | الحلقات (العنوان، الصوت، المدة...) |
| `rss_feeds` | روابط RSS مع حالة المزامنة |

### مثال على استخدام API (للموبايل)

```javascript
// جلب كل البودكاست
const { data } = await supabase
  .from('podcasts')
  .select('*')
  .order('created_at', { ascending: false })

// جلب حلقات بودكاست معين
const { data } = await supabase
  .from('episodes')
  .select('*')
  .eq('podcast_id', podcastId)
  .order('published_at', { ascending: false })

// البحث في الحلقات
const { data } = await supabase
  .from('episodes')
  .select('*, podcasts(title)')
  .ilike('title', '%بحث%')
```

## 📱 تطبيق الموبايل

المشروع مبني مع Supabase مما يجعل بناء تطبيق موبايل سهلاً:

```bash
# React Native + Supabase
npm install @supabase/supabase-js

# استخدم نفس src/lib/api.js و src/lib/rss.js
```

## 🔧 إضافة RSS Feed

1. اذهب إلى **لوحة الإدارة** (`/admin`)
2. اضغط **إضافة RSS Feed**
3. الصق رابط RSS (مثال: `https://feeds.simplecast.com/...`)
4. اضغط **إضافة وجلب**

سيتم تلقائياً:
- إنشاء سجل البودكاست
- جلب جميع الحلقات
- حفظها في قاعدة البيانات

## 🎨 التخصيص

الألوان في `tailwind.config.js`:

```js
colors: {
  bg: '#F7F5EE',      // خلفية بيج دافئة (من ثمانية)
  primary: '#FA541C', // برتقالي أساسي
  secondary: '#111322', // أسود داكن
  accent: '#EA5B38',  // برتقالي ثانوي
}
```

## 📄 الترخيص

مشروع مفتوح المصدر للاستخدام الشخصي والتجاري.
