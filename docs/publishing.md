# Publishing Guide

This document describes how to publish `universal-screenshot-mcp` to npm and the MCP Registry.

## Overview

Publishing happens in two places:

1. **npm** — Hosts the actual package (`universal-screenshot-mcp`)
2. **MCP Registry** — Hosts metadata (`io.github.sethbang/screenshot-server`) that points to the npm package

## Automated Publishing (via GitHub Actions)

After initial setup, all future releases are automated. Push a version tag and the [`.github/workflows/publish-mcp.yml`](../.github/workflows/publish-mcp.yml) workflow handles the rest.

### One-Time Setup

1. **Add `NPM_TOKEN` secret** to the GitHub repo:
   - Go to https://github.com/sethbang/mcp-screenshot-server/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm automation token (generate at https://www.npmjs.com/settings/~/tokens → "Automation" type)

2. The workflow uses **GitHub OIDC** for MCP Registry authentication — no additional secret needed.

### Release Process

```bash
# 1. Update version in package.json and server.json
npm version patch  # or minor/major

# 2. Update CHANGELOG.md with the new version

# 3. Commit the version bump
git add -A
git commit -m "v$(node -p 'require(\"./package.json\").version')"

# 4. Create and push the tag
git tag "v$(node -p 'require("./package.json").version')"
git push origin main --tags
```

The GitHub Actions workflow will:
- Install dependencies and run tests
- Build the package
- Publish to npm (`npm publish --access public`)
- Install `mcp-publisher` CLI
- Authenticate to MCP Registry via GitHub OIDC
- Update `server.json` version from the git tag
- Publish to MCP Registry

## First-Time Manual Publishing (v1.0.0)

For the initial release, publish manually before the GitHub Actions workflow is in place:

### Step 1: Authenticate to npm

```bash
npm adduser
# or
npm login
```

Verify authentication:

```bash
npm whoami
```

### Step 2: Publish to npm

```bash
npm publish --access public
```

Verify on npm:

```bash
npm view universal-screenshot-mcp
# or visit https://www.npmjs.com/package/universal-screenshot-mcp
```

### Step 3: Install mcp-publisher CLI

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

Or via Homebrew:

```bash
brew install mcp-publisher
```

### Step 4: Authenticate to MCP Registry

```bash
mcp-publisher login github
```

Follow the OAuth flow:
1. Visit the GitHub device authorization URL shown in the terminal
2. Enter the code displayed
3. Authorize the application

### Step 5: Publish to MCP Registry

```bash
mcp-publisher publish
```

Verify your server is discoverable:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.sethbang/screenshot-server"
```

### Step 6: Tag the release in git

```bash
git add -A
git commit -m "v1.0.0: Initial release"
git tag v1.0.0
git push origin main --tags
```

## Verification Checklist

After publishing, verify:

- [ ] `npm view universal-screenshot-mcp` shows version 1.0.0
- [ ] `npx universal-screenshot-mcp` starts the MCP server (will print to stderr and wait for stdin)
- [ ] MCP Registry API returns the server metadata
- [ ] GitHub tag `v1.0.0` exists on the remote
