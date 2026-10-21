# VEX Nodes — Public Registry

Community directory for Vexanium Native, EVM and Hyperion endpoints.

**Website:** https://nodes.windcrypto.com

## Add a node

Read [CONTRIBUTING.md](CONTRIBUTING.md), fork the repository, add one JSON file to [registry/nodes](registry/nodes), and open a Pull Request. CI validates entries before maintainer approval.

This repository deliberately contains **only public network metadata, contribution guidelines and CI checks**. No application frontend, monitoring backend, deployment scripts or private infrastructure.

Block Producers are read directly from Vexanium on-chain records and published bp.json profiles; they are not automatically public RPC nodes.

## Registry layout

- registry/network.json — chain identifiers
- registry/nodes/*.json — one reviewed public endpoint per file

## Validation

Requires Node.js 22+. Run:

    npm run validate
    npm test

No dependencies, credentials or live endpoint probes are needed for CI.
