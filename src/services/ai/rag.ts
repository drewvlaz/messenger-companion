import { ChromaVectorStore } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { OpenAI } from '@langchain/openai';
import { formatDocumentsAsString } from 'langchain/util/document';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { squish } from '../../utils/strings';

interface RAGConfig {
    chromaUrl?: string;
    collectionName: string;
    chunkSize?: number;
    chunkOverlap?: number;
    embeddingModel?: string;
    llmModel?: string;
}

class RAGSystem {
    private vectorStore?: ChromaVectorStore;
    private embeddings: OpenAIEmbeddings;
    private textSplitter: RecursiveCharacterTextSplitter;
    private llm: OpenAI;
    private config: RAGConfig;

    constructor(config: RAGConfig) {
        this.config = {
            chromaUrl: 'http://localhost:8000',
            chunkSize: 1000,
            chunkOverlap: 200,
            embeddingModel: 'text-embedding-3-small',
            llmModel: 'gpt-3.5-turbo-instruct',
            ...config,
        };

        this.embeddings = new OpenAIEmbeddings({
            model: this.config.embeddingModel!,
        });

        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.chunkSize!,
            chunkOverlap: this.config.chunkOverlap!,
            separators: ['\n\n', '\n', '. ', ' ', ''],
        });

        this.llm = new OpenAI({
            model: this.config.llmModel!,
            temperature: 0,
        });
    }

    async initialize(): Promise<void> {
        try {
            // Initialize empty vector store
            this.vectorStore = new ChromaVectorStore(this.embeddings, {
                collectionName: this.config.collectionName,
                url: this.config.chromaUrl,
            });
            console.log(`✅ Connected to Chroma at ${this.config.chromaUrl}`);
        } catch (error) {
            console.error('❌ Failed to connect to Chroma:', error);
            throw error;
        }
    }

    async addDocuments(documents: string[], metadatas?: Record<string, any>[]): Promise<void> {
        if (!this.vectorStore) {
            throw new Error('RAG system not initialized. Call initialize() first.');
        }

        // Create Document objects
        const docs = documents.map(
            (text, i) =>
                new Document({
                    pageContent: text,
                    metadata: metadatas?.[i] || { id: i, timestamp: new Date().toISOString() },
                }),
        );

        // Split documents into chunks
        const splits = await this.textSplitter.splitDocuments(docs);

        console.log(`📄 Processing ${splits.length} chunks from ${documents.length} documents`);

        // Add to vector store
        await this.vectorStore.addDocuments(splits);

        console.log(
            `✅ Added ${splits.length} chunks to collection: ${this.config.collectionName}`,
        );
    }

    async query(question: string, k: number = 4): Promise<string> {
        if (!this.vectorStore) {
            throw new Error('RAG system not initialized. Call initialize() first.');
        }

        const retriever = this.vectorStore.asRetriever({
            k,
            searchType: 'similarity',
        });

        // Create RAG chain
        const prompt = PromptTemplate.fromTemplate(squish`
            Answer the question based on the following context. If you cannot answer based on the context, say so clearly.
            
            Context: {context}
            
            Question: {question}
            
            Answer:`);

        const ragChain = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocumentsAsString),
                question: new RunnablePassthrough(),
            },
            prompt,
            this.llm,
        ]);

        const result = await ragChain.invoke(question);
        return result;
    }

    async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error('RAG system not initialized');
        }

        return await this.vectorStore.similaritySearch(query, k);
    }

    async getCollectionStats(): Promise<{ count: number; collection: string }> {
        if (!this.vectorStore) {
            throw new Error('RAG system not initialized');
        }

        // This is a simplified version - Chroma client methods may vary
        return {
            count: 0, // You'd need to implement actual count retrieval
            collection: this.config.collectionName,
        };
    }
}

// MCP Server Implementation
class RAGMCPServer {
    private server: Server;
    private ragSystem: RAGSystem;

    constructor(ragSystem: RAGSystem) {
        this.ragSystem = ragSystem;
        this.server = new Server(
            {
                name: 'rag-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.setupTools();
    }

    private setupTools(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'add_documents',
                        description: 'Add documents to the RAG knowledge base',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                documents: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Array of document texts to add',
                                },
                                metadatas: {
                                    type: 'array',
                                    items: { type: 'object' },
                                    description: 'Optional metadata for each document',
                                    optional: true,
                                },
                            },
                            required: ['documents'],
                        },
                    },
                    {
                        name: 'query_rag',
                        description: 'Query the RAG system with a question',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                question: {
                                    type: 'string',
                                    description: 'The question to ask',
                                },
                                k: {
                                    type: 'number',
                                    description: 'Number of similar documents to retrieve',
                                    default: 4,
                                },
                            },
                            required: ['question'],
                        },
                    },
                    {
                        name: 'similarity_search',
                        description: 'Find similar documents without generating an answer',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query',
                                },
                                k: {
                                    type: 'number',
                                    description: 'Number of results to return',
                                    default: 4,
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'get_stats',
                        description: 'Get statistics about the knowledge base',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                ] as Tool[],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'add_documents':
                        await this.ragSystem.addDocuments(args.documents, args.metadatas);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Successfully added ${args.documents.length} documents to the knowledge base.`,
                                },
                            ],
                        };

                    case 'query_rag':
                        const answer = await this.ragSystem.query(args.question, args.k || 4);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: answer,
                                },
                            ],
                        };

                    case 'similarity_search':
                        const docs = await this.ragSystem.similaritySearch(args.query, args.k || 4);
                        const results = docs
                            .map(
                                (doc, i) =>
                                    `Document ${i + 1}:\n${doc.pageContent}\nMetadata: ${JSON.stringify(doc.metadata)}`,
                            )
                            .join('\n\n---\n\n');

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Found ${docs.length} similar documents:\n\n${results}`,
                                },
                            ],
                        };

                    case 'get_stats':
                        const stats = await this.ragSystem.getCollectionStats();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Collection: ${stats.collection}\nDocument count: ${stats.count}`,
                                },
                            ],
                        };

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('🚀 RAG MCP Server started');
    }
}

// Usage Example
async function main() {
    // Initialize RAG system
    const ragSystem = new RAGSystem({
        collectionName: 'my-knowledge-base',
        chromaUrl: 'http://localhost:8000',
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    try {
        await ragSystem.initialize();

        // Example: Add some documents
        const sampleDocs = [
            'Artificial Intelligence is a field of computer science that aims to create intelligent machines.',
            'Machine Learning is a subset of AI that focuses on algorithms that can learn from data.',
            'Deep Learning uses neural networks with multiple layers to model complex patterns.',
        ];

        await ragSystem.addDocuments(sampleDocs, [
            { topic: 'AI', category: 'definition' },
            { topic: 'ML', category: 'definition' },
            { topic: 'DL', category: 'definition' },
        ]);

        // Start MCP server
        const mcpServer = new RAGMCPServer(ragSystem);
        await mcpServer.start();
    } catch (error) {
        console.error('Failed to start RAG system:', error);
        process.exit(1);
    }
}

// Run if this is the main module
if (require.main === module) {
    main().catch(console.error);
}

export { RAGSystem, RAGMCPServer };
