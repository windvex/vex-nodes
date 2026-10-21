# VEX Nodes

A community directory for public Vexanium Native, EVM and Hyperion endpoints.

**Website:** https://nodes.windcrypto.com

## Add your node

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Fork this repository and add your endpoint JSON under [registry/nodes](registry/nodes).
3. Open a Pull Request.

GitHub Actions validates the JSON and checks the public endpoint against the correct Vexanium network. **Eligible additions merge automatically after checks pass**, with no DNS TXT records or manual approval needed.

Changes to existing registrations, code or workflows are **never auto-merged**.

## Repository contents

- `registry/network.json` — Vexanium chain identifiers
- `registry/nodes/*.json` — community-submitted public endpoints
- `scripts/` and `.github/workflows/` — validation and automatic checks

Frontend and monitoring backend are maintained separately in a private repository.

## Local validation

Node.js 22+:

    npm run validate
    npm test

Block Producer profiles come independently from on-chain records and public `bp.json` files.
