# Arkade Unilateral Exit

A static, **keyless** web executor for [Arkade](https://arkadeos.com) unilateral exit
packages. Import a pre-signed exit package produced by
[`@arkade-os/sdk`](https://github.com/arkade-os/ts-sdk) and drive every transaction onchain with
nothing but an Esplora-compatible endpoint — no wallet keys, no operator, no Arkade
infrastructure.

Everything runs in your browser. It is a single-page app safe to host anywhere static
(GitHub Pages by default).

## What it does

1. **Import** an exit package — drop a `.json` file, paste it, or open a share link
   (`#pkg=<base64url(gzip(json))>`). The `#`-fragment form keeps the package out of server logs.
2. **Review** the plan — transaction count, total fees, funding required, the amount you recover,
   a per-VTXO breakdown, the CSV timelocks, and warnings (expired validity window, embedded
   condition secrets). Pick your Esplora endpoint.
3. **Execute** — watch each transaction go onchain on a live timeline with confirmation progress
   and CSV maturity countdowns. Safe to close and reopen: the executor is idempotent, the
   blockchain is the only state.

### Two funding modes

| Mode       | How fees are funded                                                        | Executor                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Funded** | A splitter tx broadcast at prepare time pre-funds pre-signed fee children. | Fully keyless — nothing to fund here.                                                                                                                    |
| **Graph**  | Only the tx graph + sweeps are transported.                                | The app generates a **throwaway fee key** in your browser and asks you to _send funds to an address_; it builds and signs the CPFP fee bumps as it goes. |

The graph-mode fee key lives in `localStorage`, only ever holds fee sats (never your exited
funds), and can be exported or regenerated. Losing it forfeits at most the small unspent fee
remainder — the exit is idempotent and re-fundable.

## Security notes

- **Treat package files as confidential.** A sweep of a contract path (e.g. a VHTLC claim) embeds
  its condition witness — such as a preimage — in the pre-signed transaction. Anyone with the
  package can read it before broadcast.
- The app performs **no protocol logic of its own** — package parsing, transaction construction,
  and execution all come from `@arkade-os/sdk`. This UI is a thin, auditable shell.
- Choose an Esplora endpoint you trust. It sees your transactions (as it must, to broadcast them)
  and your IP.

## Development

```bash
pnpm install
pnpm dev          # local dev server
pnpm typecheck
pnpm test         # unit tests (package import/decoding)
pnpm build        # production build to dist/
BASE_PATH=/ pnpm preview   # preview the build at the site root
```

### SDK dependency

This app depends on the `UnilateralExit` API in `@arkade-os/sdk`, which is not yet published to
npm (it lands with [ts-sdk#606](https://github.com/arkade-os/ts-sdk/pull/606)). Until then the
dependency is a **vendored tarball** (`vendor/arkade-os-sdk-*.tgz`, packed from that branch) so the
build is self-contained and CI installs cleanly. Once the SDK publishes, replace it with a normal
semver range (`"@arkade-os/sdk": "^<version>"`) and delete `vendor/`. See
[`arkade-os/ts-sdk`](https://github.com/arkade-os/ts-sdk) for the SDK and the exit-package format.

## Deployment

`master` deploys to GitHub Pages via `.github/workflows/deploy.yml`. The Vite `base` defaults to
`/arkade-unilateral-exit/`; override with `BASE_PATH` for a custom domain.

## License

MIT
