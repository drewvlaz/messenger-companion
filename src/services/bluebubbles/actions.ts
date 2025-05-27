import { prisma } from '../../db/config';

export const handleAnalyzeMessage = async ({
    message,
    address,
}: {
    message: string;
    address: string;
}) => {
    console.log('Analyzing:', message);
    const previousMessages = await prisma.bbMessage.findMany({
        where: {
            senderId: address,
        },
    });
};
