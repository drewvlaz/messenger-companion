import { prisma } from '../../db/config';
import { analyzeMessages } from '../ai/anthropic';
import { sendMessage } from './api';

export const handleAnalyzeMessage = async ({
    message,
    address,
}: {
    message: string;
    address: string;
}) => {
    console.log('Analyzing:', message);
    
    try {
        // Fetch previous messages from this sender
        const previousMessages = await prisma.bbMessage.findMany({
            where: {
                senderId: address,
            },
            orderBy: {
                timestamp: 'asc',
            },
            select: {
                text: true,
                timestamp: true,
            },
        });

        if (previousMessages.length === 0) {
            await sendMessage({
                address,
                message: "I don't have any previous messages to analyze.",
            });
            return;
        }

        // Send a processing message
        await sendMessage({
            address,
            message: "Analyzing your message history... This may take a moment.",
        });

        // Get analysis from Claude
        const analysis = await analyzeMessages(previousMessages);

        // Send the analysis back as an iMessage
        await sendMessage({
            address,
            message: `📊 Message Analysis:\n\n${analysis}`,
        });
    } catch (error) {
        console.error('Error in handleAnalyzeMessage:', error);
        await sendMessage({
            address,
            message: "Sorry, I encountered an error while analyzing your messages.",
        });
    }
};
