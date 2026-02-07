#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.error('Screenshot MCP server running'))
  .catch((error) => {
    console.error('Failed to connect server:', error);
    process.exit(1);
  });
