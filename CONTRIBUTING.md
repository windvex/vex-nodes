# Contribute a public node

Adding your Vexanium node works through **forks and Pull Requests**, just like Chainlist.

## Steps

1. [Fork windvex/vex-nodes](https://github.com/windvex/vex-nodes/fork).
2. In your fork, open the [registry/nodes](registry/nodes) directory.
3. Add one JSON file with a unique lowercase name such as mynode-evm.json. Do not edit other operators' files.
4. Fill it with real public HTTPS information using the example below.
5. Run npm run validate and npm test using Node.js 22+, or let GitHub Actions check the PR.
6. [Create a Pull Request](https://github.com/windvex/vex-nodes/compare) against the main branch. Include evidence you own or are authorized to publish the endpoint.
7. Wait for maintainer review. Approved, merged entries are automatically synchronized to the directory.

## JSON example

File name: registry/nodes/example-evm.json

    {
      "id": "example-evm",
      "name": "Example EVM RPC",
      "operator": "Example Operator",
      "kind": "evm",
      "url": "https://rpc.example.com",
      "description": "Public Vexanium EVM JSON-RPC",
      "docs": "https://example.com"
    }

Supported kinds: native (Antelope chain API), evm (chain 6736), history (Hyperion).

Use one file per service. Only public HTTPS addresses are accepted. Never add admin, LAN, authenticated, SSH, SHIP or private endpoints, keys or passwords.

## Review

CI validates JSON shape, file naming, duplicate endpoint IDs/URLs and public HTTPS format. CI **never probes unreviewed URLs**.

Maintainers verify endpoint ownership, chain ID, public availability and usage policy before merging. A PR is not a guarantee of acceptance.

## Block Producer profiles

Block Producer registration is different: producer data comes from the chain. Publish bp.json at the HTTPS website associated with your on-chain producer account to provide logo, location and public node metadata.

For help, use [Issues](https://github.com/windvex/vex-nodes/issues). Endpoint submission must use a Pull Request.
