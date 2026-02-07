# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-07

### Added

- MCP Screenshot Server implementing Model Context Protocol for screenshot capture
- Published to npm as `universal-screenshot-mcp` and to the MCP Registry as `io.github.sethbang/screenshot-server`
- `take_screenshot` tool for web page capture via headless Puppeteer browser
  - Full-page capture mode
  - CSS selector-based element capture
  - Configurable viewport dimensions (up to 3840x2160)
  - Wait for selector/timeout options for dynamic content
  - Customizable output path with default to `~/Desktop/Screenshots`
- `take_system_screenshot` tool for cross-platform system screenshots via native OS tools
  - Fullscreen capture mode
  - Window capture by app name or window ID
  - Region capture with coordinate specification
  - Multi-display support
  - PNG and JPG output formats
  - Optional cursor inclusion and capture delay
- `ScreenshotProvider` interface and factory in `src/utils/screenshot-provider.ts`
- **macOS**: `screencapture` CLI wrapper (`MacOSProvider`)
- **Linux**: Auto-detects available tool (maim → scrot → gnome-screenshot → spectacle → grim → import) (`LinuxProvider`). Window-by-name uses `xdotool` on X11.
- **Windows**: PowerShell + .NET `System.Drawing` — zero external dependencies (`WindowsProvider`)
- Provider-specific unit tests: `macos-provider.test.ts`, `linux-provider.test.ts`, `windows-provider.test.ts`, `screenshot-provider.test.ts`
- GitHub Actions workflow for automated npm + MCP Registry publishing on tag push

### Security

- **SEC-001**: DNS rebinding protection - URL validation resolves DNS before allowing requests to prevent attackers from using DNS rebinding to access internal resources
- **SEC-003**: Command injection prevention - uses `execFileAsync` instead of shell execution for all subprocess calls, eliminating shell interpretation vulnerabilities
- **SEC-004**: Path traversal prevention - validates output paths with symlink resolution using `fs.realpath()` to prevent TOCTOU attacks; restricts output to allowed directories (`~/Desktop/Screenshots`, `~/Downloads`, `~/Documents`, `/tmp`)
- **SEC-005**: DoS protection - limits concurrent Puppeteer instances to 3 via semaphore to prevent resource exhaustion attacks
- SSRF prevention with comprehensive IP blocking:
  - IPv4: loopback (127.x.x.x), private networks (10.x.x.x, 172.16-31.x.x, 192.168.x.x), link-local/metadata (169.254.x.x)
  - IPv6: loopback (::1), link-local (fe80::/10), unique local (fc00::/7), IPv4-mapped addresses
- App name validation pattern for window capture to prevent injection via Swift code execution

[Unreleased]: https://github.com/sethbang/mcp-screenshot-server/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sethbang/mcp-screenshot-server/releases/tag/v1.0.0
