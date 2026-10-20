-- CreateTable
CREATE TABLE "IdeaSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "history" JSONB NOT NULL DEFAULT '[]',
    "thinking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "activity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaCandidate" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "whyNow" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdeaSession_userId_createdAt_idx" ON "IdeaSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "IdeaMessage_sessionId_createdAt_idx" ON "IdeaMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "IdeaSession" ADD CONSTRAINT "IdeaSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaMessage" ADD CONSTRAINT "IdeaMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IdeaSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaCandidate" ADD CONSTRAINT "IdeaCandidate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IdeaSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
