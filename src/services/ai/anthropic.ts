import Anthropic from '@anthropic-ai/sdk';

import fs from 'fs';
import path from 'path';
import { squish } from '../../utils/strings';

/**
 * Anthropic Claude API client instance.
 * Uses the API key from environment variables.
 */
const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

/**
 * Sends a question to Claude AI and returns the response.
 *
 * Uses the askQuestionPrompt.txt file for system instructions if available,
 * or falls back to a default prompt if the file doesn't exist.
 *
 * @param question - The user's question to be answered by Claude
 * @returns A string containing Claude's response or an error message
 */
export const askQuestion = async (question: string): Promise<string> => {
    try {
        // Read system prompt for askQuestion
        const systemPromptPath = path.join(__dirname, 'prompts', 'askQuestionPrompt.txt');
        const systemPrompt = fs.existsSync(systemPromptPath)
            ? fs.readFileSync(systemPromptPath, 'utf-8')
            : squish`
                You are a helpful assistant.
                Answer questions clearly and concisely.
                DO NOT USE ANY MARKDOWN.
            `;

        const response = await client.messages.create({
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: question,
                },
            ],
            model: 'claude-3-7-sonnet-latest',
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
        console.error('Error asking question to Claude:', error);
        return 'Sorry, I encountered an error while processing your question.';
    }
};

/**
 * Analyzes a collection of messages using Claude AI and provides insights.
 *
 * Uses the analyzeMessagesPrompt.txt file for system instructions if available,
 * or falls back to a default prompt if the file doesn't exist.
 *
 * @param messages - Array of message objects containing text and timestamp
 * @returns A string containing Claude's analysis or an error message
 */
export const analyzeMessages = async (
    messages: { text: string; timestamp: Date }[],
): Promise<string> => {
    try {
        // Read system prompt for analyzeMessages
        const systemPromptPath = path.join(__dirname, 'prompts', 'analyzeMessagesPrompt.txt');
        const systemPrompt = fs.existsSync(systemPromptPath)
            ? fs.readFileSync(systemPromptPath, 'utf-8')
            : squish`
                You are an assistant that analyzes message patterns and provides insights.
                Identify communication patterns, topics, and sentiment.
                DO NOT USE ANY MARKDOWN.
            `;

        // Format messages for Claude
        const formattedMessages = messages
            .map((msg) => `[${msg.timestamp.toISOString()}] ${msg.text}`)
            .join('\n');

        const response = await client.messages.create({
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: squish`
                        Please analyze these messages and provide insights about:
                        - Communication patterns
                        - Topics discussed
                        - Overall sentiment
                        - Any notable observations

                        Messages:
                        ${formattedMessages}

                        Do not use any markdown. Format your response in small paragraphs that are easy to read.
                    `,
                },
            ],
            model: 'claude-3-7-sonnet-latest',
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
        console.error('Error analyzing messages with Claude:', error);
        return 'Sorry, I encountered an error while analyzing the messages.';
    }
};
