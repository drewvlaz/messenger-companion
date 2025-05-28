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

// Analysis types
export enum AnalysisType {
    BASIC = 'basic',
    STANDARD = 'standard',
    DETAILED = 'detailed',
}

/**
 * Determines the appropriate analysis type based on user input.
 * Uses Claude to analyze the request and decide which level of analysis is needed.
 *
 * @param userInput - The user's message requesting analysis
 * @returns The appropriate AnalysisType (BASIC, STANDARD, or DETAILED)
 */
export const determineAnalysisType = async (userInput: string): Promise<AnalysisType> => {
    try {
        // If input is very short or empty, default to STANDARD
        if (!userInput || userInput.trim().length < 5) {
            return AnalysisType.STANDARD;
        }

        const response = await client.messages.create({
            max_tokens: 50,
            system: squish`
                You are an assistant that determines the appropriate level of message analysis.
                Based on the user's request, determine if they need:
                - BASIC analysis (quick overview, simple patterns)
                - STANDARD analysis (moderate detail, main patterns and insights)
                - DETAILED analysis (in-depth, comprehensive analysis with examples)
                
                Respond with ONLY ONE WORD: BASIC, STANDARD, or DETAILED.
            `,
            messages: [
                {
                    role: 'user',
                    content: squish`
                        Based on this analysis request, what level of detail should I provide?
                        
                        Request: "${userInput}"
                        
                        Respond with ONLY ONE WORD: BASIC, STANDARD, or DETAILED.
                    `,
                },
            ],
            model: 'claude-3-5-sonnet-latest', // Use the faster model for this decision
        });

        const result =
            response.content[0].type === 'text'
                ? response.content[0].text.trim().toUpperCase()
                : '';

        if (result.includes('BASIC')) {
            return AnalysisType.BASIC;
        } else if (result.includes('DETAILED')) {
            return AnalysisType.DETAILED;
        } else {
            return AnalysisType.STANDARD; // Default to STANDARD for any other response
        }
    } catch (error) {
        console.error('Error determining analysis type:', error);
        return AnalysisType.STANDARD; // Default to STANDARD on error
    }
};

// Model selection based on analysis complexity
const getModelForAnalysisType = (type: AnalysisType): string => {
    switch (type) {
        case AnalysisType.BASIC:
            return 'claude-3-5-sonnet-latest'; // Use 3.5 for basic analysis (faster, cheaper)
        case AnalysisType.DETAILED:
            return 'claude-3-7-opus-latest'; // Use 3.7 Opus for detailed analysis (more powerful)
        case AnalysisType.STANDARD:
        default:
            return 'claude-3-7-sonnet-latest'; // Use 3.7 Sonnet for standard analysis
    }
};

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
 * Uses the appropriate prompt file for system instructions based on analysis type,
 * or falls back to a default prompt if the file doesn't exist.
 *
 * @param messages - Array of message objects containing text, timestamp, and author
 * @param type - Type of analysis to perform (basic, standard, detailed)
 * @param contextMessage - Optional message providing additional context for analysis
 * @returns A string containing Claude's analysis or an error message
 */
export const analyzeMessages = async (
    messages: { text: string; timestamp: Date; author?: string }[],
    type: AnalysisType = AnalysisType.STANDARD,
    contextMessage?: string,
): Promise<string> => {
    try {
        // Select prompt file based on analysis type
        let promptFileName: string;
        switch (type) {
            case AnalysisType.BASIC:
                promptFileName = 'basicAnalysisPrompt.txt';
                break;
            case AnalysisType.DETAILED:
                promptFileName = 'detailedAnalysisPrompt.txt';
                break;
            case AnalysisType.STANDARD:
            default:
                promptFileName = 'analyzeMessagesPrompt.txt';
                break;
        }

        // Read system prompt for the selected analysis type
        const systemPromptPath = path.join(__dirname, 'prompts', promptFileName);
        let systemPrompt: string;

        if (fs.existsSync(systemPromptPath)) {
            systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
        } else {
            // Fallback prompts if files don't exist
            switch (type) {
                case AnalysisType.BASIC:
                    systemPrompt = squish`
                        You are an assistant that performs quick, basic analysis of conversations.
                        Focus on main topics and overall tone only.
                        Keep your response very brief (2-3 paragraphs maximum).
                        DO NOT USE ANY MARKDOWN.
                    `;
                    break;
                case AnalysisType.DETAILED:
                    systemPrompt = squish`
                        You are an expert conversation analyst providing in-depth insights.
                        Analyze communication patterns, themes, emotional undertones, and language patterns.
                        Be thorough and provide specific examples from the conversation.
                        DO NOT USE ANY MARKDOWN.
                    `;
                    break;
                default:
                    systemPrompt = squish`
                        You are an assistant that analyzes message patterns and provides insights.
                        Identify communication patterns, topics, and sentiment.
                        DO NOT USE ANY MARKDOWN.
                    `;
            }
        }

        // Format messages for Claude, including author information
        const formattedMessages = messages
            .map((msg) => {
                const authorInfo = msg.author ? `[Author: ${msg.author}]` : '';
                return `[${msg.timestamp.toISOString()}] ${authorInfo} ${msg.text}`;
            })
            .join('\n');

        // Select appropriate model based on analysis type
        const model = getModelForAnalysisType(type);

        // Adjust token limit based on analysis type
        const maxTokens = type === AnalysisType.DETAILED ? 2048 : 1024;

        const response = await client.messages.create({
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: squish`
                        Please analyze these messages and provide insights about:
                        - Communication patterns between participants
                        - Topics discussed
                        - Overall sentiment
                        - Any notable observations about individual communication styles
                        - Interaction dynamics between participants

                        ${contextMessage ? `User's analysis request: "${contextMessage}"` : ''}
                        ${contextMessage ? '\n\n' : ''}Messages:
                        ${formattedMessages}

                        Do not use any markdown. Format your response in small paragraphs that are easy to read.
                        ${contextMessage ? "Pay special attention to the user's analysis request when providing insights." : ''}
                    `,
                },
            ],
            model: model,
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
        console.error('Error analyzing messages with Claude:', error);
        return 'Sorry, I encountered an error while analyzing the messages.';
    }
};
