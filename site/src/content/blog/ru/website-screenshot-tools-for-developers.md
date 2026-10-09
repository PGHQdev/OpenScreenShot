---
title: Инструменты для скриншотов сайтов для разработчиков, CI и ИИ-агентов
description: 'openscreenshot CLI и MCP, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer, Playwright MCP: среда, вся страница, CLI, MCP, видео, лицензия.'
audience: developers
order: 9
---

Для PNG публичной страницы из shell-скрипта или задачи CI достаточно инструмента командной строки: openscreenshot, shot-scraper, capture-website-cli или pageres-cli. Если для съёмки нужны вход в аккаунт, клики, проверки или видео, напишите её на Playwright или Puppeteer. Для ИИ-агента локальный MCP-сервер возвращает скриншоты модели: `openscreenshot serve` делает один скриншот за вызов, а Playwright MCP управляет целым сеансом браузера.

Пакет `openscreenshot` — наш продукт, и на этой странице сказано, где он слабее других. Она сравнивает возможности и не составляет рейтинг инструментов. Все факты приведены по состоянию на 9 октября 2026 г. и взяты из репозитория, реестра пакетов или официальной документации каждого проекта; ссылки ниже.

## Инструменты в кратком обзоре

| Инструмент          | Язык / среда выполнения                                 | Вся страница        | CLI           | MCP                  | Видео            | Лицензия   |
| ------------------- | ------------------------------------------------------- | ------------------- | ------------- | -------------------- | ---------------- | ---------- |
| openscreenshot      | Node.js 22.12+, установленный Chrome, Chromium или Edge | `--full`            | Да            | Да, stdio            | Нет              | MIT        |
| shot-scraper        | Python 3.10+, браузеры Playwright                       | По умолчанию        | Да            | Не указано           | Да, WebM или MP4 | Apache-2.0 |
| capture-website-cli | Node.js 20+, Chrome из Puppeteer                        | `--full-page`       | Да            | Не указано           | Нет              | MIT        |
| pageres-cli         | Node.js 20+, Chrome из Puppeteer                        | По умолчанию        | Да            | Не указано           | Нет              | MIT        |
| Playwright          | Node.js, Python, Java, .NET                             | `fullPage: true`    | Запуск тестов | Через Playwright MCP | Да               | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                          | `fullPage: true`    | Не указано    | Не указано           | Да, MP4 в Chrome | Apache-2.0 |
| Playwright MCP      | Node.js через `npx` или Docker                          | Параметр `fullPage` | Только сервер | Да, stdio или HTTP   | Да, по включению | Apache-2.0 |

«Не указано» означает, что проверенная нами документация самого проекта не описывает эту возможность.

## openscreenshot (CLI и MCP-сервер)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) управляет уже установленным на вашем компьютере Chrome, Chromium или Edge через `puppeteer-core`, поэтому не скачивает браузер. Одна команда сохраняет PNG всей страницы:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

Флаги: `--out` (файл или `-` для stdout), `--full`, `--width` (от 200 до 3840, по умолчанию 1280) и `--height` (от 200 до 2160, по умолчанию 800). Код выхода 0 означает, что PNG записан, 1 — что съёмка не удалась, 2 — неверное использование. `openscreenshot serve` запускает MCP-сервер через stdio с одним инструментом, `capture_screenshot`, который принимает `url`, `fullPage`, `width` и `height` и возвращает изображение PNG. Настройка описана в [руководстве по CLI](/ru/blog/screenshot-cli/), [руководстве по MCP](/ru/blog/screenshot-mcp-server/) и [руководстве по CI](/ru/blog/screenshots-for-ci/), а справочником служит [исходный код](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src).

Где он слабее:

- Каждая съёмка запускает новый браузер с пустым профилем. У него нет cookie, входа, кликов или ожидания селекторов, поэтому страница, требующая входа, показывает экран входа.
- Переход по адресу ждёт `networkidle2` до 30 секунд, без дополнительного параметра ожидания. Страницы, которые отрисовываются после затишья сети, могут получиться загруженными наполовину.
- Вывод только в PNG, без PDF и видео.
- MCP-сервер работает только локально через stdio, без размещённого URL и транспорта HTTP. Инструмент возвращает изображение и не записывает файл.
- Браузер запускается с `--no-sandbox`, чтобы работать в контейнерах. Снимайте только URL, которым доверяете.
- В Windows Edge и Chrome, установленный для одного пользователя, не определяются; задайте `CHROME_PATH`.

Для страниц с выполненным входом, аннотаций или ручного экспорта в PDF используйте [расширение для браузера](/ru/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) — инструмент на Python на основе Playwright. Установите его, скачайте его браузер и сделайте скриншот, согласно его [документации по скриншотам](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md):

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Если не указать `--height`, скриншот снимает всю страницу. `--selector` снимает один элемент, `shot-scraper pdf` сохраняет PDF, а `multi` выполняет список снимков из YAML. Команда `video`, добавленная в [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), записывает WebM по раскадровке YAML, а `--mp4` преобразует его с помощью ffmpeg. Браузер по умолчанию — Chromium, Firefox и WebKit можно установить. Выбирайте его, если ваша команда работает на Python или вам нужны скриншоты, PDF и демо-видео по сценарию из одного инструмента.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) — инструмент на Node.js от Sindre Sorhus, который снимает страницы с помощью Puppeteer. По умолчанию снимается окно; `--full-page` снимает всю прокручиваемую страницу:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Без `--output` он выводит изображение в stdout. Он выводит PNG, JPEG или WebP. Флаги вроде `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` и `--script` подготавливают страницу перед съёмкой, чего openscreenshot не умеет. Выбирайте его, когда перед съёмкой нужно скрыть баннеры cookie или подставить CSS.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) снимает несколько URL в нескольких разрешениях за один запуск:

```sh
pageres https://example.com 1366x768 1600x900
```

Он снимает каждую пару URL и разрешения, по умолчанию всю страницу; `--crop` ограничивает каждое изображение заданной высотой. Вывод — PNG или JPEG, размер по умолчанию — 1366x768. Ключевые слова устройств вроде `iphone5s` больше не поддерживаются. Активность низкая: последний релиз, v9.0.0 от 9 сентября 2025 г., поднял требование к Node.js до 20 и добавил три флага. Выбирайте его для быстрой проверки адаптивности на нескольких ширинах.

## Playwright

[Playwright](https://github.com/microsoft/playwright) — фреймворк Microsoft для автоматизации и тестирования в Chromium, Firefox и WebKit, с привязками для Node.js, Python, Java и .NET. Скриншот всей страницы — один параметр [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) работает только в Chromium без интерфейса. [Запись видео](https://playwright.dev/docs/videos) — параметр контекста, и средство запуска тестов может сохранять видео только для упавших тестов. Выбирайте Playwright, когда скриншот — один шаг теста, который входит в аккаунт, кликает и проверяет результат.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) — библиотека Google для Node.js для Chrome и Firefox. `npm i puppeteer` скачивает Chrome for Testing. [Параметры скриншота](https://pptr.dev/api/puppeteer.screenshotoptions) имеют ту же форму:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) создаёт PDF со стилями для печати. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), добавленный в puppeteer-core 25.10.0, записывает MP4 в Chrome. Firefox работает через WebDriver BiDi, где некоторые функции не поддерживаются. openscreenshot — тонкая обёртка над `puppeteer-core`, поэтому используйте Puppeteer напрямую, когда вам нужно больше его четырёх параметров съёмки.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) позволяет агенту управлять браузером через снимки дерева доступности, поэтому ему не нужна модель зрения. Его [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) приводит такую стандартную настройку:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Инструмент `browser_take_screenshot` принимает параметр `fullPage` и возвращает PNG, JPEG или WebP. Инструменты PDF и видео включаются через `--caps`. По умолчанию браузер запускается с интерфейсом и хранит постоянный профиль, поэтому вход в аккаунт может сохраняться; `--isolated`, `--storage-state` и `--extension` (для подключения к запущенному Chrome или Edge) это меняют. `--port` обслуживает HTTP вместо stdio. Это всё ещё релиз 0.0.x (v0.0.83). Выбирайте его вместо `openscreenshot serve`, когда агент должен входить в аккаунт, кликать или заполнять формы.

## Что выбрать

- **PNG публичной страницы в скрипте или артефакте CI:** openscreenshot, shot-scraper или capture-website-cli.
- **Одна страница на нескольких ширинах:** pageres-cli.
- **Сначала скрыть элементы или подставить CSS:** capture-website-cli или shot-scraper.
- **PDF или демо-видео по сценарию из командной строки:** shot-scraper.
- **Вход, клики и проверки в наборе тестов:** Playwright или Puppeteer.
- **Агент, которому нужно только посмотреть на страницу:** `openscreenshot serve`.
- **Агент, который должен взаимодействовать со страницей или входить в аккаунт:** Playwright MCP.
- **Человек, который снимает и размечает страницы с выполненным входом:** расширение; см. [сравнение расширений для скриншотов всей страницы](/ru/blog/full-page-screenshot-extensions/).
