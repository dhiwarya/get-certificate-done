CREATE TYPE "ResourceStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "NotificationType" AS ENUM ('RESOURCE_DUE', 'CERTIFICATION_DUE', 'SKILL_INACTIVE');

CREATE TABLE "skills" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "name_key" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL DEFAULT 0,
  "last_progress_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skills_name_key_key" ON "skills"("name_key");

CREATE TABLE "resources" (
  "id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "estimated_duration_minutes" INTEGER NOT NULL CHECK ("estimated_duration_minutes" > 0),
  "target_date" DATE,
  "position" INTEGER NOT NULL DEFAULT 0,
  "status" "ResourceStatus" NOT NULL DEFAULT 'PLANNED',
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "resources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "resources_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
);
CREATE INDEX "resources_skill_id_position_idx" ON "resources"("skill_id", "position");
CREATE INDEX "resources_status_completed_at_idx" ON "resources"("status", "completed_at");

CREATE TABLE "certifications" (
  "id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "target_date" DATE,
  "proof_url" TEXT,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "certifications_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "certifications_skill_id_key" ON "certifications"("skill_id");

CREATE TABLE "notification_settings" (
  "id" INTEGER NOT NULL DEFAULT 1 CHECK ("id" = 1),
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  "due_enabled" BOOLEAN NOT NULL DEFAULT true,
  "due_lead_days" INTEGER NOT NULL DEFAULT 3 CHECK ("due_lead_days" BETWEEN 0 AND 365),
  "inactivity_enabled" BOOLEAN NOT NULL DEFAULT true,
  "inactivity_days" INTEGER NOT NULL DEFAULT 14 CHECK ("inactivity_days" BETWEEN 1 AND 365),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "notification_settings" ("id") VALUES (1);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "skill_id" UUID NOT NULL,
  "resource_id" UUID,
  "certification_id" UUID,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "dedupe_key" TEXT NOT NULL,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE,
  CONSTRAINT "notifications_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL,
  CONSTRAINT "notifications_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_read_at_created_at_idx" ON "notifications"("read_at", "created_at");
