import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

export const analyzeMessages = async (messages: { text: string; timestamp: Date }[]): Promise<string> => {
    try {
        // Read system prompt
        const systemPromptPath = path.join(__dirname, 'systemPrompt.txt');
        const systemPrompt = fs.existsSync(systemPromptPath) 
            ? fs.readFileSync(systemPromptPath, 'utf-8')
            : 'You are an assistant that analyzes message patterns and provides insights.';

        // Format messages for Claude
        const formattedMessages = messages.map(msg => 
            `[${msg.timestamp.toISOString()}] ${msg.text}`
        ).join('\n');

        const response = await client.messages.create({
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { 
                    role: 'user', 
                    content: `Please analyze these messages and provide insights about communication patterns, topics, sentiment, and any notable observations:\n\n${formattedMessages}`
                }
            ],
            model: 'claude-3-7-sonnet-20240307',
        });

        return response.content[0].text;
    } catch (error) {
        console.error('Error analyzing messages with Claude:', error);
        return 'Sorry, I encountered an error while analyzing the messages.';
    }
};
