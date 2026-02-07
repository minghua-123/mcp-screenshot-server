import { describe, it, expect } from 'vitest';
import { validateUrl, isBlockedIPv4, isBlockedIPv6 } from '../../src/validators/url.js';
import { createMockDns, mockDns } from '../mocks/dns.js';

describe('isBlockedIPv4', () => {
  it('blocks loopback 127.x.x.x', () => {
    expect(isBlockedIPv4('127.0.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('127.255.255.255').blocked).toBe(true);
  });

  it('blocks 10.x.x.x private range', () => {
    expect(isBlockedIPv4('10.0.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('10.255.255.255').blocked).toBe(true);
  });

  it('blocks 172.16-31.x.x private range', () => {
    expect(isBlockedIPv4('172.16.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('172.31.255.255').blocked).toBe(true);
    expect(isBlockedIPv4('172.15.0.1').blocked).toBe(false);
    expect(isBlockedIPv4('172.32.0.1').blocked).toBe(false);
  });

  it('blocks 192.168.x.x private range', () => {
    expect(isBlockedIPv4('192.168.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('192.168.255.255').blocked).toBe(true);
  });

  it('blocks 169.254.x.x link-local/metadata', () => {
    expect(isBlockedIPv4('169.254.169.254').blocked).toBe(true);
    expect(isBlockedIPv4('169.254.0.1').blocked).toBe(true);
  });

  it('blocks 0.x.x.x', () => {
    expect(isBlockedIPv4('0.0.0.0').blocked).toBe(true);
  });

  it('blocks 100.64.0.0/10 CGNAT range', () => {
    expect(isBlockedIPv4('100.64.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('100.100.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('100.127.255.255').blocked).toBe(true);
    expect(isBlockedIPv4('100.63.255.255').blocked).toBe(false);
    expect(isBlockedIPv4('100.128.0.1').blocked).toBe(false);
  });

  it('blocks 198.18.0.0/15 benchmark range', () => {
    expect(isBlockedIPv4('198.18.0.1').blocked).toBe(true);
    expect(isBlockedIPv4('198.19.255.255').blocked).toBe(true);
    expect(isBlockedIPv4('198.17.0.1').blocked).toBe(false);
    expect(isBlockedIPv4('198.20.0.1').blocked).toBe(false);
  });

  it('blocks broadcast 255.255.255.255', () => {
    expect(isBlockedIPv4('255.255.255.255').blocked).toBe(true);
    expect(isBlockedIPv4('255.255.255.254').blocked).toBe(false);
  });

  it('allows public IPs', () => {
    expect(isBlockedIPv4('93.184.216.34').blocked).toBe(false);
    expect(isBlockedIPv4('8.8.8.8').blocked).toBe(false);
  });

  it('returns not blocked for non-IPv4 strings', () => {
    expect(isBlockedIPv4('not-an-ip').blocked).toBe(false);
  });
});

describe('isBlockedIPv6', () => {
  it('blocks ::1 loopback', () => {
    expect(isBlockedIPv6('::1').blocked).toBe(true);
  });

  it('blocks fe80:: link-local', () => {
    expect(isBlockedIPv6('fe80::1').blocked).toBe(true);
  });

  it('blocks fc00::/fd00:: unique local', () => {
    expect(isBlockedIPv6('fc00::1').blocked).toBe(true);
    expect(isBlockedIPv6('fd12::1').blocked).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 with blocked IPv4 (dotted form)', () => {
    expect(isBlockedIPv6('::ffff:127.0.0.1').blocked).toBe(true);
    expect(isBlockedIPv6('::ffff:10.0.0.1').blocked).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 with blocked IPv4 (hex form)', () => {
    // ::ffff:7f00:1 = ::ffff:127.0.0.1 (loopback)
    expect(isBlockedIPv6('::ffff:7f00:1').blocked).toBe(true);
    // ::ffff:a00:1 = ::ffff:10.0.0.1 (private)
    expect(isBlockedIPv6('::ffff:a00:1').blocked).toBe(true);
    // ::ffff:c0a8:101 = ::ffff:192.168.1.1 (private)
    expect(isBlockedIPv6('::ffff:c0a8:101').blocked).toBe(true);
    // ::ffff:a9fe:a9fe = ::ffff:169.254.169.254 (metadata)
    expect(isBlockedIPv6('::ffff:a9fe:a9fe').blocked).toBe(true);
    // ::ffff:6440:1 = ::ffff:100.64.0.1 (CGNAT)
    expect(isBlockedIPv6('::ffff:6440:1').blocked).toBe(true);
  });

  it('allows IPv4-mapped IPv6 with public IPv4 (dotted form)', () => {
    expect(isBlockedIPv6('::ffff:93.184.216.34').blocked).toBe(false);
  });

  it('allows IPv4-mapped IPv6 with public IPv4 (hex form)', () => {
    // ::ffff:5db8:d822 = ::ffff:93.184.216.34
    expect(isBlockedIPv6('::ffff:5db8:d822').blocked).toBe(false);
  });

  it('allows public IPv6', () => {
    expect(isBlockedIPv6('2001:db8::1').blocked).toBe(false);
  });
});

describe('validateUrl', () => {
  it('accepts a valid public URL', async () => {
    const result = await validateUrl('https://example.com', mockDns.public);
    expect(result).toEqual({
      valid: true,
      resolvedIp: '93.184.216.34',
      hostname: 'example.com',
    });
  });

  it('rejects URL resolving to localhost', async () => {
    const result = await validateUrl('https://evil.com', mockDns.localhost);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('blocked IP');
  });

  it('rejects NXDOMAIN', async () => {
    const result = await validateUrl('https://nonexistent.example', mockDns.nxdomain);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DNS resolution failed');
  });

  it('rejects DNS timeout', async () => {
    const result = await validateUrl('https://example.com', mockDns.timeout);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DNS resolution failed');
  });

  it('rejects invalid URL format', async () => {
    const result = await validateUrl('not-a-url');
    expect(result).toEqual({ valid: false, error: 'Invalid URL format' });
  });

  it('rejects ftp:// protocol', async () => {
    const result = await validateUrl('ftp://example.com/file');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only http and https');
  });

  it('rejects file:// protocol', async () => {
    const result = await validateUrl('file:///etc/passwd');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only http and https');
  });

  it('rejects localhost by name', async () => {
    const result = await validateUrl('http://localhost:8080');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('localhost');
  });

  it('rejects localhost.localdomain', async () => {
    const result = await validateUrl('http://localhost.localdomain');
    expect(result.valid).toBe(false);
  });

  it('rejects direct private IPv4', async () => {
    const result = await validateUrl('http://192.168.1.1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('private network');
  });

  it('accepts direct public IPv4', async () => {
    const result = await validateUrl('http://93.184.216.34');
    expect(result.valid).toBe(true);
    expect(result.resolvedIp).toBe('93.184.216.34');
    expect(result.hostname).toBe('93.184.216.34');
  });

  it('rejects IPv6 loopback in brackets', async () => {
    const result = await validateUrl('http://[::1]:8080');
    expect(result.valid).toBe(false);
  });

  it('returns hostname for DNS-resolved URLs', async () => {
    const dns = createMockDns(new Map([
      ['mysite.org', [{ address: '1.2.3.4', family: 4 }]],
    ]));
    const result = await validateUrl('https://mysite.org/page', dns);
    expect(result.valid).toBe(true);
    expect(result.resolvedIp).toBe('1.2.3.4');
    expect(result.hostname).toBe('mysite.org');
  });

  it('rejects when all DNS results are blocked', async () => {
    const dns = createMockDns(new Map([
      ['internal.corp', [
        { address: '10.0.0.5', family: 4 },
        { address: '10.0.0.6', family: 4 },
      ]],
    ]));
    const result = await validateUrl('https://internal.corp', dns);
    expect(result.valid).toBe(false);
  });

  it('rejects when any DNS result is blocked', async () => {
    const dns = createMockDns(new Map([
      ['mixed.example', [
        { address: '93.184.216.34', family: 4 },
        { address: '127.0.0.1', family: 4 },
      ]],
    ]));
    const result = await validateUrl('https://mixed.example', dns);
    expect(result.valid).toBe(false);
  });
});
