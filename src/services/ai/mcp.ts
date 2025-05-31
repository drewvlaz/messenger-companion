import { Anthropic } from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import readline from 'readline/promises';
import { config } from '../../config';
import { MCPToolSchema } from './mcp.types';
import z from 'zod';

class MCP {
    private client: Client;
    private server: McpServer;
    private anthropic: Anthropic;
    private model: string;

    constructor(model?: string) {
        this.client = new Client({ name: 'mcp-client-cli', version: '1.0.0' });
        this.server = new McpServer({
            name: 'weather',
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
    }

    initializeConnections() {
        try {
            const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

            // Connect server first
            this.server.connect(serverTransport);

            // Then connect client
            this.client.connect(clientTransport);

            // Verify connections
            if (!this.server.isConnected()) {
                console.log('Server:', this.server.isConnected());
                throw new Error('Failed to establish connections');
            }
        } catch (error) {
            console.error('Connection initialization error:', error);
            throw error;
        }
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
            tools: (await this.client.listTools()).tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            })),
        });

        const finalText = [];
        const toolResults = [];

        for (const content of response.content) {
            if (content.type === 'text') {
                finalText.push(content.text);
            } else if (content.type === 'tool_use') {
                const toolName = content.name;
                const toolArgs = content.input as { [x: string]: unknown } | undefined;

                const result = await this.client.callTool({
                    name: toolName,
                    arguments: toolArgs,
                });
                toolResults.push(result);
                finalText.push(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);

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

                finalText.push(response.content[0].type === 'text' ? response.content[0].text : '');
            }
        }

        return finalText.join('\n');
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log('\nMCP Client Started!');
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question('\nQuery: ');
                if (message.toLowerCase() === 'quit') {
                    break;
                }
                const response = await this.processQuery(message);
                console.log('\n' + response);
            }
        } finally {
            rl.close();
        }
    }

    async cleanup() {
        await this.client.close();
        await this.server.close();
    }
}

async function main() {
    let mcp = null;
    try {
        console.log('Initializing MCP...');
        mcp = new MCP();
        console.log('MCP initialized successfully');

        console.log('Registering tool...');
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

        mcp.initializeConnections();
        console.log('Sending query to Claude...');
        const response = await mcp.processQuery('tell the console hellow');
        console.log('Response:', response);
    } catch (error) {
        console.error('Error in main:', error);
    } finally {
        if (mcp) {
            console.log('Cleaning up MCP resources...');
            await mcp.cleanup();
        }
    }
}

if (require.main === module) {
    main();
}
