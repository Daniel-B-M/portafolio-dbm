# Portfolio — Daniel Bonilla

Static, single-page portfolio. No build step, no dependencies — plain HTML, CSS
and ES modules.

## Run locally

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8000>. There is no live reload, so hard-refresh
after editing. Opening `index.html` from the file system will **not** work — ES
modules need `http(s)://`.

## Structure

```
index.html        Markup + the English copy (source of truth for text)
styles.css        All styles (design tokens + light/dark themes)
js/
  main.js         Entry module: boots every UI widget (nav, scroll, gallery, …)
  i18n/
    index.js      i18n behaviour: applies a locale, remembers the choice
    en.js         English strings  (keep in sync with index.html)
    es.js         Spanish strings
assets/           Images, CV, favicon
.htaccess         Production caching / MIME / headers (Apache / LiteSpeed)
```

## Editing content

- **Text**: edit `js/i18n/en.js` and `js/i18n/es.js`. For `en`, also update the
  matching string in `index.html` so the page reads correctly before JS runs.
  Elements opt in with `data-i18n="key"` (or `data-i18n-href="key"` for links,
  and `data-i18n-attr="aria-label:key; alt:key2"` for attributes such as
  `aria-label`, `alt`, `title` or a meta tag's `content`). Every key must exist
  in both locale files.
- **Projects**: each is a `<section class="panel panel-project" id="project-N">`
  in `index.html`, plus its `pN_*` keys in both locale files. The nav links and
  scroll-spy pick up new panels automatically.

## Deploy

Upload the repo contents as-is to any static host. `.htaccess` assumes
Apache/LiteSpeed (Hostinger); on Nginx, replicate its rules in the server
config. Bump the `?v=` query on the `js/main.js` tag when shipping JS changes.
