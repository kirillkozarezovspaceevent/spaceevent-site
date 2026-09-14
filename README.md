SPACE Event V113

Добавлены 12 страниц портфолио, обновлён существующий кейс BMW 7 Series / Seven Luxury. В новой подборке 135 локальных фотографий в WebP с уменьшенными версиями для телефонов. Всего в основной коллекции 27 кейсов, в архиве — 3 проекта.

Новые страницы: Toyota Prado, Lexus Client Day, Lexus UX, BMW X4, Audi City Cinema, BMW X5, АВТОДОМ BMW / Аукцион, Звезда Столицы / «Вернувшиеся», Rolls-Royce Cullinan, Audi × НАВОЛНЕ, Subafest, БинБанк × Porsche 911.

У исходников Audi City и АВТОДОМ BMW обнаружены описания других мероприятий; они не перенесены. У Toyota Prado, Lexus Client Day, Lexus UX, BMW 7, BMW X4, Audi City и АВТОДОМ даты в новой версии не указаны. Их можно дополнить после сверки с архивом агентства.

Для публикации используйте содержимое ZIP целиком. Папки assets и api должны сохранять структуру. Настройки доставки формы описаны ниже; сам ZIP не содержит секретов. Текст политики конфиденциальности остаётся отдельным пунктом для подготовки.


## V90 — contact form delivery
The contact form now posts to `/api/contact`. Configure these Vercel Environment Variables before production use:
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_EMAIL_TO` (defaults to kozarezov@spaceevent.ru)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Do not expose these secrets in browser JavaScript.

### V90 anti-spam fix
The honeypot field was renamed to `contact_extra_field`, marked to discourage password-manager/browser autofill, and now returns an explicit `spam_check_failed` response instead of a false HTTP 200 success.

V110: выровнена шапка портфолио, уменьшены логотип и заголовок, сокращена высота первого экрана, повышен контраст текста.

V111: BMW X5 — новая обложка «Всё в силе». Добавлен КЛАЗКО / «Золотой ланцет» в МХАТе, 8 фотографий и 30-секундный фоновый фрагмент трейлера (65–95 с), без звука, 720p H.264, 4,35 МБ. Оригинальный трейлер не изменён и не включён в ZIP. В основной коллекции теперь 28 кейсов.

V112: первые восемь кейсов расположены в согласованном порядке, остальные — по значимости. Обновлено название карточки сессии региональных операторов. В кейсе ФГП удалён год из текста и заголовка страницы; технические адреса сохранены.

V113: добавлен кейс «Всадники одиночества» Александра Цапенко. Полная организация SPACE, 14 фотографий, полный вертикальный ролик в hero: без звука, повтор, кнопка паузы, механизм media.js. Новый кейс стоит 11-м, первые восемь сохранены.
