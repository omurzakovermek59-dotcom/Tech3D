# Мой телефон

React жана Vite менен жасалган «Мой телефон» смартфон дүкөнү. Учурдагы UI компоненттери
сакталды; Firebase Authentication, Cloud Firestore жана Firebase Storage аркылуу
каталог, аккаунттар, заказдар, тандалгандар жана пикирлер иштейт.

## Локалдуу иштетүү

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` файлына Firebase консолундагы Web App конфигурациясын толтуруңуз.
`VITE_FIREBASE_API_KEY` — браузерге арналган public client config; Firebase Admin
SDK/service-account ачкычын бул файлга же frontend'ге эч качан кошпоңуз.
Бул workspace'та мурунку Firebase Web client config ignored `.env.local` файлына
көчүрүлдү; ал Git'ке кирбейт. Жаңы clone'до `.env.example`'ды көчүрүп, маанилерди
Firebase Console'дон кайра алыңыз. Азыркы Firebase долбоорунда default Firestore
базасы түзүлө элек (браузерден текшерилди); заказ/favorites/reviews/admin иштеши
үчүн базаны түзүп, төмөнкү эрежелерди жарыялоо керек.

Көз карандылыктар `package.json` ичинде бар. Кадимки орнотуу үчүн `npm install`
жана текшерүү үчүн `npm run build` колдонуңуз.

## 2GIS картасын конфигурациялоо

Интерактивдүү карта расмий 2GIS MapGL API'ин колдонот. [2GIS developer порталынан](https://dev.2gis.com/)
MapGL API ачкычын алып, `.env.local` файлына `VITE_2GIS_API_KEY=...` катары
киргизиңиз. Бул браузерде иштеген public ачкыч болгондуктан, аны сыр катары
кароого болбойт: мүмкүн болсо 2GIS консолунда домендерге чектөө коюңуз. Картанын
ачкычы жок же карта жүктөлбөй калса да, байланыш маалыматтары жана картага
шилтемелер көрсөтүлөт.

Администратор `/admin` → **Жөндөөлөр** → **Дүкөндүн жайгашкан жери** бөлүмүнөн
дүкөндүн атын, дарегин, координаттарын, 2GIS шилтемесин жана телефонун киргизет.
Дарек/координаттар башында бош; демек ойдон чыгарылган жайгашкан жер көрсөтүлбөйт.
Бул маалымат Firestore'дун `system/storeSettings` документинде сакталат.

## Firebase даярдоо

1. Firebase Console'до Web App түзүп, анын client config маанилерин `.env.local`'га
   көчүрүңүз. `.env.example` файлында чыныгы ачкычтар жок.
2. Authentication → Sign-in method бөлүмүндө **Email/Password** жана **Anonymous**
   провайдерлерин иштетиңиз. Anonymous Auth катталбаган кардарга да checkout'ту
   бүтүрүүгө мүмкүндүк берет; мындай заказ анын ошол браузердеги Firebase UID'ине
   байланып сакталат.
3. Firestore Database түзүп, `firestore.rules` мазмунун Firestore Rules бөлүмүнө
   жарыялаңыз.
4. Firebase Storage түзүп, `storage.rules` мазмунун Storage Rules бөлүмүнө
   жарыялаңыз. Сүрөт жүктөө үчүн Storage күйгүзүлгөн болушу керек.
5. Колдонуучулар email/password менен катталып, кирет. Firebase конфигурациясы
   жок болсо auth/заказ/пикир иштебейт жана UI муну билдирет; каталогдун демо
   товарлары гана көрүнөт.
6. `/admin` жолу өзүнчө `admin.html` панелине алып барат. Админ панелине жана
   админ Firestore/Storage аракеттерине тастыкталган
   `admin@256.kg` аккаунту гана кире алат. Firebase Authentication'да
   бул email үчүн аккаунт түзүп, Firestore жана Storage эрежелерин жарыялаңыз.
   Алгачкы админ киргенде каталог бош болсо, учурдагы демо товарлар Firestore'го
   бир жолу көчүрүлөт.

`firestore.rules` кардардын өз заказдарын гана окуусун, өзүнүн favorites жана
review документтерин гана өзгөртүүсүн, ал эми товар/заказ/модерация операцияларын
`admin@256.kg` аккаунтуна чектейт. Админ email'ин ырастоо талап кылынбайт.
Заказ Telegram'га
жөнөтүлбөйт — Firestore'го сакталат. Telegram кошулса, Bot Token'ди Vercel
Serverless Function же Cloud Function environment variables'ында сактап,
браузерден түз жөнөтпөңүз.

## Функциялар жана негизги файлдар

- `src/shop/ShopApp.jsx` — маршруттар, auth абалы, Firebase каталогу, favorites.
- `src/components/shop/AuthPage.jsx` — катталуу/кирүү; Firebase Auth.
- `src/components/shop/Catalog.jsx` — издөө, категория жана баа боюнча сорттоо.
- `src/components/shop/Favorites.jsx` жана `ProductCard.jsx` — аккаунттагы избранное.
- `src/components/shop/Checkout.jsx` жана `src/services/store.js` — форма, уникалдуу
  idempotent заказ id, Firestore транзакциясы; сакталгандан кийин гана корзина тазаланат.
- `src/components/shop/ProductDetails.jsx` жана `ProductGallery.jsx` — товар ID
  боюнча толук барак, сүрөт галереясы, түс/эс тандоо, мүнөздөмөлөр, GLB/GLTF көргүч,
  бир аккаунтка бир пикир жана орточо рейтинг.
- `src/components/shop/StoreLocation.jsx` — Firestore'дон алынган байланыш маалыматы,
  расмий 2GIS MapGL картасы жана карта/маршрут шилтемелери.
- `src/components/admin/ProductDialog.jsx` — товар сүрөттөрүн, галереяны,
  техникалык мүнөздөмөлөрдү, түстөрдү жана түс сүрөттөрүн башкаруу.
- `src/components/admin/Settings.jsx` — дүкөндүн дарегин жана байланыш маалыматын
  Firestore'го сактоо.
- `src/admin/AdminApp.jsx`, `src/components/admin/` — админ email текшерүүсү,
  Firestore каталог/заказ башкаруусу жана пикирлерди модерациялоо.
- `firestore.rules`, `storage.rules` — сервер тараптагы уруксаттар.
- `style.css` — учурдагы анимациялар/карточкалар сакталган, эки тема режиминин
  учурдагы эки теманы жана responsive стилдерди сактайт.

## Vercel'ге жайгаштыруу

1. Репозиторийди Vercel'ге туташтырыңыз. Build command: `npm run build`,
   output directory: `dist`.
2. Project Settings → Environment Variables бөлүмүнө `.env.example`'дагы бардык
   `VITE_FIREBASE_*` өзгөрмөлөрдү жана интерактивдүү 2GIS карта үчүн
   `VITE_2GIS_API_KEY` маанисин киргизиңиз.
3. Firebase Authentication'га production доменди Authorized domains катары кошуңуз.
4. `vercel.json` `/admin` жолун `/admin.html` барагына багыттайт.
5. Өзгөрмөлөрдү орноткондон кийин кайра deploy кылыңыз. Firebase Rules'ту
   Vercel эмес, Firebase Console аркылуу жарыялаңыз.

## Кол менен текшерүү тизмеси

- [ ] `.env.local` жокто сайт демо каталогду көрсөтүп, Firebase auth/заказ иштебей турганын түшүндүрөт.
- [ ] Email/password каттоо, чыгуу жана барак жаңыртылгандан кийинки auth сессиясы.
- [ ] Каталогдо издөө, категория, арзан/кымбат сорт бир учурда иштейт.
- [ ] Кирбегенде favorite/review колдонууга аракет кылуу login'ге багыттайт.
- [ ] Favorites бетин refresh кылганда тандоолор калыбына келет; башка аккаунт аларды окуй албайт.
- [ ] Checkout аты/телефону/дареги текшерет; ийгиликтүү Firestore жазуусунан кийин гана себет тазаланат.
- [ ] Бир submit'ти кайталоо ошол эле order id'ни колдонот.
- [ ] 3D шилтемеси бар товар чычкан/touch менен айланып жана zoom кылынат; модель жок/ката болсо сүрөт колдонулат.
- [ ] Пикирдин рейтинги жана орточо баасы көрүнөт; ошол эле аккаунт экинчи документ түзбөй, барын өзгөртөт.
- [ ] Башка аккаунт `/admin`'ге кире албайт; тастыкталган admin email Firestore жана Storage операцияларын аткара алат.
- [ ] Админ товар, сүрөт, заказ статусу жана пикир модерациясын текшерет.
- [ ] Товарда ID туура ачылып, сүрөт галереясы, түс, корзина жана заказдагы түс текшерилет.
- [ ] Админ товарга кошумча сүрөт, мүнөздөмө, жеткиликтүү түстөрдү кошуп/алып салат.
- [ ] Жайгашкан жер Firebase'де сакталат; бош координатта ойдон чыгарылган карта ачылбайт.
- [ ] Тар экранда header, карточкалар, checkout жана admin таблицалар колдонууга ыңгайлуу.
