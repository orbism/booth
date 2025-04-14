-- CreateTable
CREATE TABLE "BoothAnalytics" (
    "id" VARCHAR(191) NOT NULL,
    "sessionId" VARCHAR(191) NOT NULL,
    "boothSessionId" VARCHAR(191),
    "eventType" VARCHAR(191) NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "userAgent" VARCHAR(191),
    "emailDomain" VARCHAR(191),
    "durationMs" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothEventLog" (
    "id" VARCHAR(191) NOT NULL,
    "analyticsId" VARCHAR(191) NOT NULL,
    "eventType" VARCHAR(191) NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoothAnalytics.sessionId_unique" ON "BoothAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "BoothEventLog.analyticsId_index" ON "BoothEventLog"("analyticsId");

-- AddForeignKey
ALTER TABLE "BoothEventLog" ADD FOREIGN KEY ("analyticsId") REFERENCES "BoothAnalytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;