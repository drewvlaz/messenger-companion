-- CreateTable
CREATE TABLE "BbMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "subject" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "dateDelivered" TIMESTAMP(3),
    "dateEdited" TIMESTAMP(3),
    "dateRetracted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BbMessage_pkey" PRIMARY KEY ("id")
);
