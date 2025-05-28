import { prisma } from '../../db/config';
import { analyzeMessages, askQuestion } from '../ai/anthropic';
import { sendMessage } from './api';

export const handleAskQuestion = async ({
    question,
    userAddress,
    recipientAddress,
}: {
    question: string;
    userAddress: string;
    recipientAddress: string;
}) => {
    console.log('Question asked:', question);

    try {
        // Send a processing message
        await sendMessage({
            address: userAddress,
            message: 'Thinking about your question... One moment please.',
        });

        // Get answer from Claude
        const answer = await askQuestion(question);

        // Send the answer back as an iMessage
        await sendMessage({
            address: userAddress,
            message: answer,
        });
    } catch (error) {
        console.error('Error in handleAskQuestion:', error);
        await sendMessage({
            address: userAddress,
            message: 'Sorry, I encountered an error while processing your question.',
        });
    }
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
    console.log('Analyzing:', message);

    try {
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

        // Send a processing message
        await sendMessage({
            address: senderAddress,
            message: 'Analyzing your message history... This may take a moment.',
        });

        // Get analysis from Claude
        const analysis = await analyzeMessages(
            previousMessages.map((msg) => ({
                text: msg.text,
                timestamp: msg.dateCreated,
            })),
        );

        // Send the analysis back as an iMessage
        await sendMessage({
            address: senderAddress,
            message: `Message Analysis:\n\n${analysis}`,
        });
    } catch (error) {
        console.error('Error in handleAnalyzeMessage:', error);
        await sendMessage({
            address: senderAddress,
            message: 'Sorry, I encountered an error while analyzing your messages.',
        });
    }
};
