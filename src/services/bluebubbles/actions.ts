import { prisma } from '../../db/config';
import { analyzeMessages, askQuestion, determineAnalysisType } from '../ai/anthropic';
import { sendMessage } from './api';

export const handleAskQuestion = async ({
    question,
    userAddress,
}: {
    question: string;
    userAddress: string;
}) => {
    await sendMessage({
        address: userAddress,
        message: 'Thinking about your question... One moment please.',
    });
    const answer = await askQuestion(question);
    await sendMessage({
        address: userAddress,
        message: answer,
    });
};

export const handleAnalyzeMessage = async ({
    message,
    senderAddress,
    recipientAddress,
}: {
    message: string;
    senderAddress: string;
    recipientAddress: string;
}) => {
    // First, determine the appropriate analysis type based on the user's message
    await sendMessage({
        address: senderAddress,
        message: 'Determining the appropriate level of analysis...',
    });

    const analysisType = await determineAnalysisType(message);
    console.log(`Analysis type determined: ${analysisType} for message: "${message}"`);

    // Fetch previous messages from the chat between sender and recipient
    const previousMessages = await prisma.bbMessage.findMany({
        where: {
            OR: [
                // Messages from sender to recipient
                {
                    senderId: senderAddress,
                    recipientId: recipientAddress,
                },
                // Messages from recipient to sender
                {
                    senderId: recipientAddress,
                    recipientId: senderAddress,
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
        take: 10,
    });

    if (previousMessages.length === 0) {
        await sendMessage({
            address: senderAddress,
            message: "I don't have any previous messages to analyze.",
        });
        return;
    }

    await sendMessage({
        address: senderAddress,
        message: 'Analyzing your message history... This may take a moment.',
    });

    const analysis = await analyzeMessages(
        previousMessages.map((msg) => ({
            text: msg.text,
            timestamp: msg.dateCreated,
            author: msg.senderId === senderAddress ? 'User 1' : 'User 2',
        })),
        analysisType,
        message, // Pass the user's message as context
    );

    // Send the analysis back as an iMessage with type indicator
    const analysisTypeLabel = analysisType.charAt(0).toUpperCase() + analysisType.slice(1);
    await sendMessage({
        address: senderAddress,
        message: `${analysisTypeLabel} Message Analysis:\n\n${analysis}`,
    });
};
