# Arkade Unilateral Exit

A static, **keyless** web executor for [Arkade](https://arkadeos.com) unilateral exit
packages. Import a pre-signed exit package produced by
[`@arkade-os/sdk`](https://github.com/arkade-os/ts-sdk) and drive every transaction onchain with
nothing but an Esplora-compatible endpoint — no wallet keys, no operator, no Arkade
infrastructure.

Everything runs in your browser. It is a single-page app safe to host anywhere static.

**Live:** <https://arkade-os.github.io/arkade-unilateral-exit/>

## What it does

1. **Import** an exit package — drop a `.json` file, paste it, or open a share link
   (`#pkg=<base64url(gzip(json))>`). The `#`-fragment form keeps the package out of server logs.
2. **Review** the plan — how many VTXOs are exiting and their total value, the amount you recover,
   network fees, funding required, a rough end-to-end time estimate, a per-VTXO breakdown with its
   exit path and CSV timelock, and warnings (expired validity window, embedded condition secrets).
   The Esplora endpoint is under **Advanced settings**.
3. **Execute** — watch each transaction go onchain on a live timeline with confirmation progress
   and CSV maturity countdowns. Safe to close and reopen: the executor is idempotent, the
   blockchain is the only state.

### Two funding modes

| Mode       | How fees are funded                                                        | Executor                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Funded** | A splitter tx broadcast at prepare time pre-funds pre-signed fee children. | Fully keyless — nothing to fund here.                                                                                                                    |
| **Graph**  | Only the tx graph + sweeps are transported.                                | The app generates a **throwaway fee key** in your browser and asks you to _send funds to an address_; it builds and signs the CPFP fee bumps as it goes. |

The graph-mode fee key lives in `localStorage`, only ever holds fee sats (never your exited
funds), and can be regenerated at any time. Losing it forfeits at most the small unspent fee
remainder — the exit is idempotent and re-fundable.

From the funding screen you can also **Export package**: a self-executable bundle
(`{"arkadeExitBundle":1, …}`) carrying the fee key, so another machine can run the same exit
against the already-funded address with no key of its own. It is the graph-mode equivalent of a
fully-signed funded package — and it is sensitive, since anyone holding it can spend the fee
remainder.

## Security notes

- **Treat package files as confidential.** A sweep of a contract path (e.g. a VHTLC claim) embeds
  its condition witness — such as a preimage — in the pre-signed transaction. Anyone with the
  package can read it before broadcast.
- The app performs **no protocol logic of its own** — package parsing, transaction construction,
  and execution all come from `@arkade-os/sdk`. This UI is a thin, auditable shell.
- **The default Esplora endpoint is Arkade-operated.** Defaults come from the SDK's `ESPLORA_URL`
  (e.g. `https://mempool.arkade.sh/api` on mainnet). Nothing forces you to use it: change it under
  Review → Advanced settings, or bake in your own with `VITE_ESPLORA_URL` at build time. Whichever
  you pick sees your transactions (as it must, to broadcast them) and your IP.

## Build

**Prerequisites:** Node 24 and [corepack](https://nodejs.org/api/corepack.html). pnpm is pinned by
the `packageManager` field, so `corepack enable` gets you the right version automatically — don't
install pnpm globally.

```bash
corepack enable
pnpm install
```

| Script           | What it does                                                                   |
| ---------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`       | Dev server with HMR.                                                           |
| `pnpm typecheck` | `tsc -b --noEmit`. Strict, with `noUnusedLocals`/`noUnusedParameters`.         |
| `pnpm test`      | Vitest unit tests — package decoding, bundle round-trip, executor step phases. |
| `pnpm lint`      | `prettier --check .`                                                           |
| `pnpm format`    | `prettier --write .`                                                           |
| `pnpm build`     | Typecheck, then a production build into `dist/`.                               |
| `pnpm preview`   | Serve the built `dist/` locally at the same base path Pages uses.              |

CI runs lint, typecheck, test and build on every pull request
(`.github/workflows/ci.yml`).

### Base path

Vite's `base` defaults to `/arkade-unilateral-exit/`, matching the GitHub Pages project site.
`pnpm preview` therefore serves at <http://localhost:4173/arkade-unilateral-exit/>, which is what
you want — it exercises the same asset URLs the deployed site uses.

To build for a different root (a custom domain, or a plain static host), set `BASE_PATH` **on the
build**, not on the preview — it is read at build time and baked into `index.html`:

```bash
BASE_PATH=/ pnpm build && pnpm preview
```

Setting it only on `preview` will serve at `/` while the bundle still points at
`/arkade-unilateral-exit/assets/…`, and every asset 404s.

## Deployment

### GitHub Pages (default)

Every push to `master` triggers `.github/workflows/deploy.yml`, which builds and publishes via
`actions/deploy-pages` to <https://arkade-os.github.io/arkade-unilateral-exit/>.

The repository's Pages source must be set to **GitHub Actions** (Settings → Pages → Build and
deployment → Source), not "Deploy from a branch" — the workflow uploads an artifact rather than
committing to `gh-pages`. The workflow can also be run by hand via `workflow_dispatch`.

### Anywhere else

The build output is plain static files. There is no server runtime and no runtime configuration —
`VITE_ESPLORA_URL` is baked in at build time, and everything else is chosen in the UI.

```bash
BASE_PATH=/ pnpm build   # then serve dist/ with any static file server
```

Because it is a single-page app with no routing, no SPA rewrite rules are needed: `dist/index.html`
is the only entry point.

For a custom domain, build with `BASE_PATH=/` and add a `CNAME` file containing the domain to
`dist/` (or to the repository, if you keep using the Pages workflow).

## License

MIT
