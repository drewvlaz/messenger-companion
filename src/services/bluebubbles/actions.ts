import { config } from '../../config';
import { prisma } from '../../db/config';
import {
    analyzeMessages,
    askQuestion,
    determineAnalysisType,
    storeAnalysisContext,
} from '../ai/anthropic';
import { sendMessage } from './api';

/**
 * Handles the /ask command by sending the user's question to Claude AI
 * and returning the response. Includes previous analysis context if available.
 *
 * @param question - The question text from the user
 * @param userAddress - The phone number/address of the user to send the response to
 */
export const handleAskQuestion = async ({
    question,
    userAddress,
}: {
    question: string;
    userAddress: string;
}) => {
    // TODO: unsend this messsage after the llm returns
    await sendMessage({
        address: userAddress,
        message: 'Thinking about your question... One moment please.',
    });
    const answer = await askQuestion(question, userAddress);
    await sendMessage({
        address: userAddress,
        message: answer,
    });
};

/**
 * Handles the /analyze command by:
 * 1. Determining the appropriate analysis type based on the user's message
 * 2. Fetching recent messages from the conversation
 * 3. Sending them to Claude AI for analysis
 * 4. Returning the analysis results to the user
 *
 * @param message - The message text from the user (may contain analysis instructions)
 * @param senderAddress - The phone number/address of the sender requesting analysis
 * @param recipientAddress - The phone number/address of the recipient (usually the bot)
 */
export const handleAnalyzeMessage = async ({
    message,
    userAddress,
}: {
    message: string;
    userAddress: string;
}) => {
    // First, determine the appropriate analysis type based on the user's message
    // TODO: unsend this messsage after the llm returns
    await sendMessage({
        address: userAddress,
        message: 'Determining the appropriate level of analysis...',
    });

    // TODO: Decide on good way to model this
    const otherAddress = config.env.SELF_ADDRESS!;

    const analysisType = await determineAnalysisType(message);
    console.log(`Analysis type determined: ${analysisType} for message: "${message}"`);

    // Fetch previous messages from the chat between sender and recipient
    const previousMessages = await prisma.bbMessage.findMany({
        where: {
            OR: [
                // Messages from sender to recipient
                {
                    senderId: userAddress,
                    recipientId: otherAddress,
                },
                // Messages from recipient to sender
                {
                    senderId: otherAddress,
                    recipientId: userAddress,
                },
            ],
        },
        orderBy: {
            dateCreated: 'desc',
        },
        select: {
            text: true,
            dateCreated: true,
            senderId: true,
        },
        take: 30,
    });

    if (previousMessages.length === 0) {
        await sendMessage({
            address: userAddress,
            message: "I don't have any previous messages to analyze.",
        });
        return;
    }

    await sendMessage({
        address: userAddress,
        message: 'Analyzing your message history... This may take a moment.',
    });

    const analysis = await analyzeMessages(
        previousMessages.map((msg) => ({
            text: msg.text,
            timestamp: msg.dateCreated,
            author: msg.senderId, // TODO: use sender name instead of ID
        })),
        analysisType,
        message, // Pass the user's message as context
    );

    // Store the analysis context for future questions
    const messagesWithAuthors = previousMessages.map((msg) => ({
        text: msg.text,
        timestamp: msg.dateCreated,
        author: msg.senderId, // TODO: use sender name instead of ID
    }));
    storeAnalysisContext(userAddress, analysis, messagesWithAuthors);

    // Send the analysis back as an iMessage with type indicator
    const analysisTypeLabel = analysisType.charAt(0).toUpperCase() + analysisType.slice(1);
    await sendMessage({
        address: userAddress,
        message: `${analysisTypeLabel} Message Analysis:\n\n${analysis}\n\nYou can now use /ask to ask follow-up questions about this analysis.`,
    });
};
