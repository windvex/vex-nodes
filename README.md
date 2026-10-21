# VEX Nodes

Community-maintained directory of public Vexanium Native, EVM and Hyperion endpoints.

**Website:** https://nodes.windcrypto.com

## Add your node

Read **[CONTRIBUTING.md](CONTRIBUTING.md)**, fork the registry, add a JSON file in [registry/nodes](registry/nodes), configure DNS TXT ownership proof, and open a Pull Request.

A bot validates the change, verifies domain ownership and the live Vexanium network, then enables GitHub auto-merge when the required checks pass. PRs that change code or existing registrations require maintainer attention.

## Source of truth

- `registry/network.json` — canonical chain IDs
- `registry/nodes/*.json` — reviewed public endpoints
- `scripts/` and GitHub Actions — automated validation and safe review

Frontend and monitoring backend are maintained in a **separate private repository**. This repository does not include deployment files, secrets, or the application's source code.

## Local validation

Node.js 22 or newer:

    npm run validate
    npm test

Block Producer profiles are read independently from on-chain accounts and public `bp.json` records. BP registration does not automatically register an API endpoint.
