/** Result from URL validation */
export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  resolvedIp?: string;
  hostname?: string;
}

/** Result from path validation */
export interface PathValidationResult {
  valid: boolean;
  path?: string;
  error?: string;
}

/** Standard MCP tool response */
export interface McpToolResponse {
  /** Required by MCP SDK: CallToolResult extends Result which has an index signature. */
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}
