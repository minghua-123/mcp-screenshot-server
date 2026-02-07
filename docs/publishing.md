# Publishing Guide

This document describes how to publish `universal-screenshot-mcp` to npm and the MCP Registry using **trusted publishing** (OIDC) — no long-lived secrets required.

## Overview

Publishing happens in two places:

| Registry | What it hosts | Identifier |
|----------|--------------|------------|
| **npm** | Package artifacts (JS code) | `universal-screenshot-mcp` |
| **MCP Registry** | Server metadata (discovery info) | `io.github.sethbang/screenshot-server` |

Both use **OIDC trusted publishing** from GitHub Actions — no `NPM_TOKEN` or other long-lived secrets.

---

## First-Time Setup (v1.0.0)

Since this is the first publish, the package doesn't exist on npm yet. You need to do the initial publish manually, then configure trusted publishing for all future releases.

### Step 1: Log in to npm

```bash
npm login
```

Verify:

```bash
npm whoami
```

### Step 2: Publish v1.0.0 to npm

```bash
npm publish --access public
```

Verify it's live:

```bash
npm view universal-screenshot-mcp
# or visit https://www.npmjs.com/package/universal-screenshot-mcp
```

### Step 3: Configure npm Trusted Publishing

Now that the package exists on npm, set up OIDC trusted publishing so future releases don't need tokens:

1. Go to **https://www.npmjs.com/package/universal-screenshot-mcp/access**
2. Find the **"Trusted Publisher"** section
3. Click **GitHub Actions**
4. Fill in the fields:
   - **Organization or user**: `sethbang`
   - **Repository**: `mcp-screenshot-server`
   - **Workflow filename**: `publish-mcp.yml`
   - **Environment name**: *(leave blank)*
5. Save

### Step 4: (Recommended) Restrict token access

After verifying trusted publishing works on a future release, lock down traditional tokens:

1. Go to package **Settings** → **Publishing access**
2. Select **"Require two-factor authentication and disallow tokens"**
3. Save

This ensures only your GitHub Actions workflow can publish — not leaked tokens.

### Step 5: Install mcp-publisher CLI

```bash
brew install mcp-publisher
```

Or download the binary:

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

### Step 6: Publish to MCP Registry

```bash
# Authenticate via GitHub OAuth
mcp-publisher login github

# Publish server.json metadata
mcp-publisher publish
```

Verify:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.sethbang/screenshot-server"
```

### Step 7: Commit, tag, and push

```bash
git add -A
git commit -m "v1.0.0: Initial release"
git tag v1.0.0
git push origin main --tags
```

---

## Future Releases (Automated)

After initial setup, all future releases are fully automated via the [`.github/workflows/publish-mcp.yml`](../.github/workflows/publish-mcp.yml) workflow. Push a version tag and it handles the rest.

### How the workflow works

The workflow triggers on `v*` tags and:

1. Checks out code
2. Sets up Node.js 24 (npm 11.5.1+ required for trusted publishing)
3. Runs `npm ci` → `npm test` → `npm run build`
4. **Publishes to npm via OIDC** — npm CLI auto-detects the GitHub Actions OIDC environment, no `NPM_TOKEN` needed
5. Installs `mcp-publisher` CLI
6. **Authenticates to MCP Registry via OIDC** — `mcp-publisher login github-oidc`
7. Updates `server.json` version from the git tag
8. Publishes to MCP Registry

### Release process

```bash
# 1. Update version in package.json and server.json
npm version patch  # or minor/major — updates package.json and creates git tag

# 2. Update CHANGELOG.md with the new version's changes

# 3. Commit & push
git add -A
git commit --amend --no-edit  # amend onto the npm version commit
git push origin main --tags
```

The `npm version` command automatically:
- Updates `version` in `package.json`
- Creates a `vX.Y.Z` git tag
- The GitHub Actions workflow triggers on the tag push

### No secrets required

| Authentication | Method | Secret needed? |
|---------------|--------|---------------|
| npm publish | OIDC trusted publishing | ❌ No |
| MCP Registry publish | GitHub OIDC | ❌ No |

Both use the `id-token: write` permission in the workflow to generate short-lived, cryptographically-signed tokens.

### Provenance

npm trusted publishing automatically generates [provenance attestations](https://docs.npmjs.com/generating-provenance-statements) — cryptographic proof of where and how the package was built. This is included by default with no extra flags needed.

---

## Verification Checklist

After publishing, verify:

- [ ] `npm view universal-screenshot-mcp` shows the correct version
- [ ] `npx universal-screenshot-mcp` starts the MCP server (prints to stderr, waits for stdin)
- [ ] MCP Registry API returns the server: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.sethbang/screenshot-server"`
- [ ] GitHub tag exists on the remote
- [ ] npm package page shows provenance badge (after first trusted publish)
