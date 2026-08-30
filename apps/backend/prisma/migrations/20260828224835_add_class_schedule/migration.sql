-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "ClassAgeGroup" AS ENUM ('menores', 'adultos');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('iniciantes', 'intermedios', 'avanzados');

-- CreateTable
CREATE TABLE "scheduled_classes" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startsAtMinute" INTEGER NOT NULL,
    "endsAtMinute" INTEGER NOT NULL,
    "ageGroup" "ClassAgeGroup" NOT NULL,
    "level" "ClassLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skatepark_hours" (
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "opensAtMinute" INTEGER,
    "closesAtMinute" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skatepark_hours_pkey" PRIMARY KEY ("dayOfWeek")
);

-- CreateIndex
CREATE INDEX "scheduled_classes_dayOfWeek_startsAtMinute_idx" ON "scheduled_classes"("dayOfWeek", "startsAtMinute");
