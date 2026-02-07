# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Cross-platform `take_system_screenshot`** — No longer macOS-only. Now supports macOS, Linux, and Windows via a platform provider pattern:
  - **macOS**: `screencapture` CLI (unchanged behavior)
  - **Linux**: Auto-detects available tool (maim → scrot → gnome-screenshot → spectacle → grim → import). Window-by-name uses `xdotool` on X11.
  - **Windows**: PowerShell + .NET `System.Drawing` (zero external dependencies)
- Dropped `pdf` format option (was macOS-only via `screencapture -t pdf`). Format is now `png` or `jpg`.
- Tool description updated to reflect cross-platform support.

### Added

- `ScreenshotProvider` interface and factory in `src/utils/screenshot-provider.ts`
- `MacOSProvider` in `src/utils/macos-provider.ts`
- `LinuxProvider` in `src/utils/linux-provider.ts` with fallback tool detection chain
- `WindowsProvider` in `src/utils/windows-provider.ts` using PowerShell + .NET
- Provider-specific unit tests: `macos-provider.test.ts`, `linux-provider.test.ts`, `windows-provider.test.ts`, `screenshot-provider.test.ts`

## [1.0.0] - 2026-02-05

### Added

- MCP Screenshot Server implementing Model Context Protocol for screenshot capture
- `take_screenshot` tool for web page capture via headless Puppeteer browser
  - Full-page capture mode
  - CSS selector-based element capture
  - Configurable viewport dimensions (up to 3840x2160)
  - Wait for selector/timeout options for dynamic content
  - Customizable output path with default to `~/Desktop/Screenshots`
- `take_system_screenshot` tool for native macOS screenshots via `screencapture`
  - Fullscreen capture mode
  - Window capture by app name or window ID
  - Region capture with coordinate specification
  - Multi-display support
  - PNG, JPG, and PDF output formats
  - Optional cursor inclusion and capture delay

### Security

- **SEC-001**: DNS rebinding protection - URL validation resolves DNS before allowing requests to prevent attackers from using DNS rebinding to access internal resources
- **SEC-003**: Command injection prevention - uses `execFileAsync` instead of shell execution for all subprocess calls, eliminating shell interpretation vulnerabilities
- **SEC-004**: Path traversal prevention - validates output paths with symlink resolution using `fs.realpath()` to prevent TOCTOU attacks; restricts output to allowed directories (`~/Desktop/Screenshots`, `~/Downloads`, `~/Documents`, `/tmp`)
- **SEC-005**: DoS protection - limits concurrent Puppeteer instances to 3 via semaphore to prevent resource exhaustion attacks
- SSRF prevention with comprehensive IP blocking:
  - IPv4: loopback (127.x.x.x), private networks (10.x.x.x, 172.16-31.x.x, 192.168.x.x), link-local/metadata (169.254.x.x)
  - IPv6: loopback (::1), link-local (fe80::/10), unique local (fc00::/7), IPv4-mapped addresses
- App name validation pattern for window capture to prevent injection via Swift code execution

### Fixed

- License documentation in README now correctly references Apache-2.0 (matches LICENSE file)
- Documentation updated to reference correct npm scripts (`npm run build`, `npm start`)

[1.0.0]: https://github.com/sethbang/mcp-screenshot-server/releases/tag/v1.0.0
