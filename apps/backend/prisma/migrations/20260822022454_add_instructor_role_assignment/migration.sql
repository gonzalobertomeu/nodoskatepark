-- CreateEnum
CREATE TYPE "InstructorInvitationStatus" AS ENUM ('pending', 'cancelled', 'resolved');

-- CreateEnum
CREATE TYPE "RoleAssignmentMethod" AS ENUM ('existing_user', 'email_invite');

-- CreateTable
CREATE TABLE "instructor_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "status" "InstructorInvitationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAccountId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "instructor_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignment_audit_log" (
    "id" TEXT NOT NULL,
    "adminAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT,
    "targetEmail" TEXT NOT NULL,
    "method" "RoleAssignmentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_assignment_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instructor_invitations_email_idx" ON "instructor_invitations"("email");

-- CreateIndex
CREATE INDEX "role_assignment_audit_log_targetAccountId_idx" ON "role_assignment_audit_log"("targetAccountId");

-- AddForeignKey
ALTER TABLE "instructor_invitations" ADD CONSTRAINT "instructor_invitations_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_invitations" ADD CONSTRAINT "instructor_invitations_resolvedAccountId_fkey" FOREIGN KEY ("resolvedAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignment_audit_log" ADD CONSTRAINT "role_assignment_audit_log_adminAccountId_fkey" FOREIGN KEY ("adminAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignment_audit_log" ADD CONSTRAINT "role_assignment_audit_log_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
