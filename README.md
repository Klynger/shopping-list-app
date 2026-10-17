# Shopping List app

The web client for [sl-api](https://github.com/Klynger/sl-api): a mobile-first React app for shared shopping lists. People create groups, invite others by username, and keep lists of products from a shared catalog that everyone in the group can check off while shopping.

Built with React 19, TypeScript, Vite, [Base UI](https://base-ui.com), TanStack Query and React Router. The UI is available in English and Brazilian Portuguese.

## Running locally

The app needs the API running. From the `sl-api` checkout:

```bash
docker compose up --build
```

That starts Postgres, runs migrations, serves the API on port 8080 and seeds test users (see `cmd/seed` in sl-api for their credentials).

Then, in this repo:

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. The dev server proxies `/v1` to the API, which keeps the session cookie same-origin (the API sends no CORS headers). Point it at another API with `API_URL=http://host:port pnpm dev`.

The pnpm version is pinned in `package.json` (`packageManager`). With [Volta](https://volta.sh), `volta install pnpm@<that version>` gets the right one.

## Scripts

- `pnpm dev`: start the dev server
- `pnpm build`: typecheck and build for production
- `pnpm lint`: run oxlint

## Translations

Text lives in `src/locales/<locale>.json` (`en.json`, `pt-br.json`): flat, dot-separated keys in [ICU message format](https://formatjs.github.io/docs/core-concepts/icu-syntax), rendered with [react-intl](https://formatjs.github.io/docs/react-intl). Components read text with `useIntl().formatMessage({ id: 'list.addItems' })`, and values go in the second argument (`{ name }`, `{ count }` for plurals). Note that ICU treats a plain `'` as an escape character, so use the typographic `’` in copy.

Message ids are type-checked against `en.json`, so a mistyped id fails the build, and `src/typings/intl.ts` fails it too when `pt-br.json` is missing a key or has an extra one. Each locale file loads lazily on top of English, so an untranslated key falls back to English text.

The language follows the browser on first visit and can be changed from the header; the choice is remembered on the device. API error text is English only, so errors are translated from their stable `code` (`error.code.<CODE>`), with a generic fallback for codes that have no message.
