# Web frantisekzeman.cz

Statický web – žádný server, žádné PHP, žádná databáze.

## Struktura

- `index.html` – celý web (jedna stránka)
- `css/style.css` – vzhled
- `js/main.js` – logika (koncerty, galerie, animace)
- `data/koncerty.js` – **SEM SE PŘIDÁVAJÍ KONCERTY** (jediný soubor, který je potřeba běžně upravovat)
- `assets/img/` – místní fotky (zatím se používají fotky ze starého webu)

## Jak přidat koncert

Otevři `data/koncerty.js` a přidej nový blok podle vzoru. Web sám rozdělí
koncerty na nadcházející a proběhlé podle data.

## Náhled

Stačí otevřít `index.html` v prohlížeči (dvojklik).

## Nasazení (plán)

GitHub → Cloudflare Pages → doména frantisekzeman.cz
