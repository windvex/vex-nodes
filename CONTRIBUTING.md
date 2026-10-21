# Add your Vexanium node

Submitting an endpoint is simple:

1. **[Fork this repository](https://github.com/windvex/vex-nodes/fork)**.
2. Add a new JSON file to [registry/nodes](registry/nodes) on your fork, e.g. `mynode-evm.json`.
3. Open a **[Pull Request](https://github.com/windvex/vex-nodes/compare)** to `main`. GitHub runs all checks automatically.

That's it. **No DNS TXT record, separate account verification, or manual review for eligible additions.**

## Example

File: `registry/nodes/mynode-evm.json`

```json
{
  "id": "mynode-evm",
  "name": "My Node EVM RPC",
  "operator": "My Node",
  "kind": "evm",
  "url": "https://rpc.yourdomain.com",
  "description": "Public Vexanium EVM JSON-RPC",
  "docs": "https://yourdomain.com"
}
```

Node type (`kind`) can be `native`, `evm` or `history` (Hyperion). The URL must be a publicly accessible HTTPS endpoint serving the correct network.

## What the bot checks

- Valid JSON, unique ID and URL, and only new files in `registry/nodes/`.
- Public HTTPS, without private or internal IP addresses.
- Working Vexanium RPC with the correct chain identity (EVM chain ID **6736**).
- Two successful health checks and passing GitHub CI.

When all checks pass, GitHub can auto-merge the PR. Invalid submissions get an explanatory comment. Changes to existing entries, scripts, workflows, or unrelated files are **not** eligible for automatic merging.

Only submit public, unauthenticated endpoints. Do not include passwords, API keys, private admin endpoints, P2P or SHIP addresses.

The listed operator name is community-supplied; automated checks confirm network compatibility and endpoint reachability, **not domain ownership or official endorsement**.

## Block Producer profiles

BP records are read directly from Vexanium. To publish a logo or organization details, host a public `bp.json` at the BP website recorded on-chain.

Questions? Open an [issue](https://github.com/windvex/vex-nodes/issues).
