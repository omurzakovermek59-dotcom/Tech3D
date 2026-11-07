# Мой телефон

React жана Vite менен жасалган «Мой телефон» смартфон дүкөнү. Учурдагы UI компоненттери
сакталды; Firebase Authentication жана Cloud Firestore аркылуу
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
2. Authentication → Sign-in method бөлүмүндө **Email/Password**, **Google** жана **Anonymous**
   провайдерлерин иштетиңиз. Google провайдерин күйгүзүп, OAuth колдоо барагындагы
   маалыматтарды толтуруңуз. Anonymous Auth катталбаган кардарга да checkout'ту
   бүтүрүүгө мүмкүндүк берет; мындай заказ анын ошол браузердеги Firebase UID'ине
   байланып сакталат.
3. Firestore Database түзүп, `firestore.rules` мазмунун Firestore Rules бөлүмүнө
   жарыялаңыз.
4. Товар сүрөттөрү кысылган Base64 форматында же URL катары Firestore'го түз сакталат.
   Бир товар документиндеги сүрөттөрдүн жалпы көлөмү 900 KiB менен чектелет.
5. Колдонуучулар email/password, email'ге келген код же Google менен кире алышат.
   Firebase конфигурациясы жок болсо auth/заказ/пикир иштебейт жана UI муну билдирет;
   каталогдун демо товарлары гана көрүнөт.
6. `/admin` жолу админ панелине алып барат. Firebase'де ар бир админ үчүн
   Authentication аккаунтун түзүңүз. Админдердин email даректерин
   `.env.local` файлындагы `VITE_ADMIN_EMAILS` маанисине үтүр менен бөлүп жазыңыз
   (мисалы: `admin@256.kg,manager@example.com`) жана `firestore.rules` ичиндеги
   `isAdmin()` allowlist тизмесине ошол эле даректерди кошуп, эрежелерди жарыялаңыз.
   Админ Google, email/сырсөз же email-код аркылуу кире алат; уруксат берилбеген
   email админ панелине киргизилбейт.
   Алгачкы админ киргенде каталог бош болсо, учурдагы демо товарлар Firestore'го
   бир жолу көчүрүлөт.
7. Email аркылуу 6 орундуу кирүү кодун иштетүү үчүн Firebase долбоорунда billing
   күйгүзүлгөн Blaze планы болушу керек. Resend'де жөнөтүүчү доменди ырастап,
   Firebase CLI менен кирип (`firebase login`), Firebase долбоорун тандаңыз
   (`firebase use <project-id>`). Андан кийин
   репозиторийдин түбүнөн төмөнкү командаларды аткарыңыз:

   ```sh
   firebase functions:secrets:set RESEND_API_KEY
   firebase functions:secrets:set OTP_HMAC_SECRET
   firebase functions:secrets:set EMAIL_FROM
   firebase deploy --only functions,firestore:rules
   ```

   `EMAIL_FROM` мааниси Resend'де ырасталган дарек болсун, мисалы
   `Tech3D <no-reply@your-domain.com>`. `OTP_HMAC_SECRET` үчүн узун кокустук
   ачкычты `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
   менен түзүп, Firebase Secret командасы сураганда киргизиңиз;
   аны Vite `.env` файлына же браузердин кодуна жазбаңыз. Код 10 мүнөт иштейт;
   email'ге 1 мүнөттө бир, күнүнө 5 жолу, IP дарегине күнүнө 30 код чеги бар.
   Текшерүү 5 жаңылыш аракеттен кийин жабылат.

`firestore.rules` кардардын өз заказдарын гана окуусун, өзүнүн favorites жана
review документтерин гана өзгөртүүсүн, ал эми товар/заказ/модерация операцияларын
`isAdmin()` функциясында уруксат берилген email'дерге чектейт.
Заказ Telegram'га
жөнөтүлбөйт — Firestore'го сакталат. Telegram кошулса, Bot Token'ди Vercel
Serverless Function же Cloud Function environment variables'ында сактап,
браузерден түз жөнөтпөңүз.

## Функциялар жана негизги файлдар

- `src/shop/ShopApp.jsx` — маршруттар, auth абалы, Firebase каталогу, favorites.
- `src/components/shop/AuthPage.jsx` — катталуу/кирүү; Firebase Auth.
- `functions/index.js` — email кодун жөнөтүү жана бир жолку код менен Firebase Auth сессиясын түзүү.
- `src/services/emailCode.js` — callable Cloud Functions аркылуу код жөнөтүү/текшерүү.
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
- `firestore.rules` — сервер тараптагы уруксаттар.
- `style.css` — учурдагы анимациялар/карточкалар сакталган, эки тема режиминин
  учурдагы эки теманы жана responsive стилдерди сактайт.

## Vercel'ге жайгаштыруу

1. Репозиторийди Vercel'ге туташтырыңыз. Build command: `npm run build`,
   output directory: `dist`.
2. Project Settings → Environment Variables бөлүмүнө `.env.example`'дагы бардык
   `VITE_FIREBASE_*` өзгөрмөлөрдү, уруксат берилген админ email'деринин тизмесин
   (`VITE_ADMIN_EMAILS`) жана интерактивдүү 2GIS карта үчүн `VITE_2GIS_API_KEY`
   маанисин киргизиңиз.
3. Firebase Authentication'да Google провайдерин иштетип, production доменди
   Authorized domains катары кошуңуз.
4. `vercel.json` `/admin` жолун React колдонмосуна багыттайт. Email-код функцияларын
   Vercel'ден өзүнчө Firebase CLI аркылуу deploy кылыңыз (`firebase.json`'ду караңыз).
5. Өзгөрмөлөрдү орноткондон кийин кайра deploy кылыңыз.

## Telegram'га заказ жөнөтүү

Боттун токенин браузердеги өзгөрмөлөргө же репозиторийге кошпоңуз. Эгер токен
мурда ачык бөлүшүлгөн же клиенттик кодго кошулган болсо, BotFather'ден жаңысын
чыгарып, төмөндө ошол жаңы токенди колдонуңуз.

Firebase CLI менен секреттерди коопсуз киргизип, callable функцияларды deploy кылыңыз:

```powershell
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
firebase deploy --only functions
```

CLI сураганда боттун токенин жана чат ID'син терминалга киргизиңиз. Товар бетиндеги
тез буйрутма формасы буйрутманы серверде каталог менен текшерип, Telegram'га жөнөтөт.
Checkout'тон берилген корзина заказы Firestore'го сакталат жана Telegram'га билдирүү
жөнөтүлбөсө да ийгиликтүү аяктайт.

## Кол менен текшерүү тизмеси

- [ ] `.env.local` жокто сайт демо каталогду көрсөтүп, Firebase auth/заказ иштебей турганын түшүндүрөт.
- [ ] Email/password жана Google менен кирүү, аккаунт менюсунан чыгуу жана
  барак жаңыртылгандан кийинки auth сессиясы.
- [ ] Каталогдо издөө, категория, арзан/кымбат сорт бир учурда иштейт.
- [ ] Кирбегенде favorite/review колдонууга аракет кылуу login'ге багыттайт.
- [ ] Favorites бетин refresh кылганда тандоолор калыбына келет; башка аккаунт аларды окуй албайт.
- [ ] Checkout аты/телефону/дареги текшерет; ийгиликтүү Firestore жазуусунан кийин гана себет тазаланып, ийгилик экраны ачылат.
- [ ] Товардагы тез буйрутма формасы Telegram'га заказ жөнөтөт; секреттер frontend bundle'де жок.
- [ ] Бир submit'ти кайталоо ошол эле order id'ни колдонот.
- [ ] 3D шилтемеси бар товар чычкан/touch менен айланып жана zoom кылынат; модель жок/ката болсо сүрөт колдонулат.
- [ ] Пикирдин рейтинги жана орточо баасы көрүнөт; ошол эле аккаунт экинчи документ түзбөй, барын өзгөртөт.
- [ ] Allowlist'теги админ Google/email менен `/admin`'ге кирип, Firestore операцияларын аткарат; тизмеде жок аккаунт кире албайт.
- [ ] Админ товар, сүрөт, заказ статусу жана пикир модерациясын текшерет.
- [ ] Товарда ID туура ачылып, сүрөт галереясы, түс, корзина жана заказдагы түс текшерилет.
- [ ] Админ товарга кошумча сүрөт, мүнөздөмө, жеткиликтүү түстөрдү кошуп/алып салат.
- [ ] Жайгашкан жер Firebase'де сакталат; бош координатта ойдон чыгарылган карта ачылбайт.
- [ ] Тар экранда header, карточкалар, checkout жана admin таблицалар колдонууга ыңгайлуу.
