-- Add new enums for assignment submissions
CREATE TYPE "SubmissionType" AS ENUM ('TEXT', 'GITHUB_URL', 'LIVE_URL', 'SCREENSHOTS', 'SCREENRECORDINGS', 'FILE_UPLOAD', 'MULTIPLE_TYPES');

CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED', 'RESUBMITTED');

-- Add new columns to assignment_submissions table
ALTER TABLE "assignment_submissions" 
ADD COLUMN "submission_type" "SubmissionType" DEFAULT 'TEXT',
ADD COLUMN "status" "SubmissionStatus" DEFAULT 'SUBMITTED',
ADD COLUMN "attachments_json" JSONB;

-- Update existing records
UPDATE "assignment_submissions" 
SET "submission_type" = 'TEXT',
    "status" = 'SUBMITTED'
WHERE "submission_type" IS NULL;

-- Make content optional since we now have flexible JSON
ALTER TABLE "assignment_submissions" 
ALTER COLUMN "content" DROP NOT NULL;
