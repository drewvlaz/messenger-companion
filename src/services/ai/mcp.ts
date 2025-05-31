import z from 'zod';
import { ok } from 'assert';
import { Anthropic } from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { config } from '../../config';
import { MCPActionType, MCPToolSchema } from './mcp.types';

class MCP {
    private client: Client;
    private server: McpServer; // We are the server
    private anthropic: Anthropic;
    private model: string;
    private tools: Tool[];

    constructor(name: string, { model }: { model?: string } = {}) {
        this.client = new Client({ name: `${name}-client`, version: '1.0.0' });
        this.server = new McpServer({
            name: `${name}-server`,
            version: '1.0.0',
            capabilities: {
                resources: {},
                tools: {},
            },
        });

        this.anthropic = new Anthropic({
            apiKey: config.env.ANTHROPIC_API_KEY,
        });
        this.model = model ?? 'claude-3-7-sonnet-latest';
        this.tools = [];
    }

    async initializeConnections() {
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        this.server.connect(serverTransport);
        this.client.connect(clientTransport);
        ok(this.server.isConnected());
        this.tools = (await this.client.listTools()).tools;
    }

    async registerTool(schema: MCPToolSchema) {
        this.server.tool(schema.name, schema.description, schema.inputSchema, schema.func);
    }

    async processQuery(query: string) {
        const messages: MessageParam[] = [
            {
                role: 'user',
                content: query,
            },
        ];

        const response = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: 1000,
            messages,
            tools: this.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            })),
        });

        const finalText = [];
        const toolResults = [];

        for (const content of response.content) {
            switch (content.type) {
                case MCPActionType.TEXT:
                    finalText.push(content.text);
                    break;
                case MCPActionType.TOOL_USE: {
                    const toolName = content.name;
                    const toolArgs = content.input as { [x: string]: unknown } | undefined;

                    const result = await this.client.callTool({
                        name: toolName,
                        arguments: toolArgs,
                    });
                    toolResults.push(result);
                    finalText.push(
                        `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`,
                    );

                    messages.push({
                        role: 'user',
                        content:
                            Array.isArray(result.content) &&
                            result.content.length > 0 &&
                            result.content[0].type === 'text'
                                ? result.content[0].text
                                : JSON.stringify(result.content),
                    });

                    const response = await this.anthropic.messages.create({
                        model: this.model,
                        max_tokens: 1000,
                        messages,
                    });

                    finalText.push(
                        response.content[0].type === 'text' ? response.content[0].text : '',
                    );
                    break;
                }
                default:
                    console.warn('Unexpected action type:', content.type);
            }
        }

        return finalText.join('\n');
    }

    async cleanup() {
        await this.client.close();
        await this.server.close();
    }
}

async function main() {
    const mcp = new MCP('test');
    await mcp.registerTool({
        name: 'print-message',
        description: 'Prints a message to the console',
        inputSchema: {
            message: z.string(),
        },
        func: async ({ message }) => {
            console.log('Tool executed with message:', message);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Message printed: ${message}`,
                    },
                ],
            };
        },
    });
    await mcp.initializeConnections();

    console.log('Sending query to Claude...');
    const response = await mcp.processQuery('tell the console a neat joke');
    console.log('Response:', response);

    await mcp.cleanup();
}

if (require.main === module) {
    main();
}
