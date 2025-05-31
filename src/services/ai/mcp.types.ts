import { ZodRawShape } from 'zod';

export interface MCPToolOutput {
    [x: string]: unknown;
    content: Array<
        | {
              [x: string]: unknown;
              type: 'text';
              text: string;
          }
        | {
              [x: string]: unknown;
              type: 'image';
              data: string;
              mimeType: string;
          }
        | {
              [x: string]: unknown;
              type: 'audio';
              data: string;
              mimeType: string;
          }
    >;
    _meta?: { [x: string]: unknown } | undefined;
    structuredContent?: { [x: string]: unknown } | undefined;
    isError?: boolean | undefined;
}

export interface MCPToolSchema {
    name: string;
    description: string;
    inputSchema: ZodRawShape;
    func: (args: { [x: string]: any }, extra: any) => Promise<MCPToolOutput>;
}
