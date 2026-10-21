# Add a Vexanium node

Registering your node works through a **fork and Pull Request**, as on Chainlist. Eligible submissions are reviewed and merged automatically.

## Submit your endpoint

1. **[Fork windvex/vex-nodes](https://github.com/windvex/vex-nodes/fork)**.
2. Add one JSON file in [registry/nodes](registry/nodes) on your fork. Name it after a unique ID, e.g. mynode-evm.json.
3. Use real public HTTPS URLs and choose `native`, `evm`, or `history`. See the example below.
4. **Prove ownership of the endpoint hostname**. Add this public DNS TXT record through your DNS provider:

       Name:  _vexnodes.rpc.yourdomain.com
       Type:  TXT
       Value: vex-nodes=github:your-github-username

   Replace `rpc.yourdomain.com` with your exact endpoint hostname and `your-github-username` with your GitHub account. The PR author must match the record. If you use Cloudflare, create the TXT under your zone with the correct relative name.
5. Open a **[Pull Request](https://github.com/windvex/vex-nodes/compare)** against `main`. GitHub Actions validates and reviews the submission.

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

## Automated review

The bot automatically checks JSON format, unique ID and URL, changed files, DNS ownership, public IP addresses, correct chain identity, and two endpoint health checks. For EVM, the chain ID must be **6736**. Auto-merge is enabled only when everything passes **and the required CI status is green**. The website then picks up the approved registry changes automatically.

Each PR can add 1–3 new JSON files. **Changes to existing entries, scripts, CI files, or anything outside `registry/nodes/*.json` never auto-merge.** If ownership verification fails or a health check is unavailable, the PR is blocked; make corrections and push a new commit.

- Node endpoints must be HTTPS and publicly accessible.
- Never submit authenticated, private LAN, admin, P2P or SHIP URLs, secrets or access tokens.
- Submitting an endpoint does not imply endorsement.
- DNS ownership proves control of the endpoint host; it does not certify reliability or security.
- Only merged node entries are sent to production monitoring. GitHub Actions does not run code supplied by PR authors in its privileged review job.

## Block Producer profiles

BP account information comes from Vexanium itself. Publish `bp.json` on the HTTPS website registered by your BP for logo, organization, location, and announced node services. BP metadata is distinct from submitted RPC endpoints.

Questions? Open an [issue](https://github.com/windvex/vex-nodes/issues). Additions should use PRs rather than issues.
