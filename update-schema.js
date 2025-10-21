const fs = require('fs');

// Read the current schema
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add new enums at the end
const newEnums = `
// New enums for assignment submissions
enum SubmissionType {
  TEXT
  GITHUB_URL
  LIVE_URL
  SCREENSHOTS
  SCREENRECORDINGS
  FILE_UPLOAD
  MULTIPLE_TYPES
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  LATE
  GRADED
  RETURNED
  RESUBMITTED
}`;

// Update the AssignmentSubmission model
const updatedModel = `model AssignmentSubmission {
  id           String           @id @default(cuid())
  content      String?
  submissionType SubmissionType @default(TEXT)
  attachments  Json?
  status       SubmissionStatus @default(SUBMITTED)
  score        Float?
  feedback     String?
  isGraded     Boolean          @default(false)
  assignmentId String
  studentId    String
  enrollmentId String?
  submittedAt  DateTime         @default(now())
  gradedAt     DateTime?

  assignment   Assignment  @relation(fields: [assignmentId], references: [id])
  enrollment   Enrollment? @relation(fields: [enrollmentId], references: [id])
  student      User        @relation("StudentSubmissions", fields: [studentId], references: [id])

  @@unique([assignmentId, studentId])
  @@map("assignment_submissions")
}`;

// Replace the old model with the new one
schema = schema.replace(/model AssignmentSubmission \{[\s\S]*?\}/, updatedModel);

// Add the new enums at the end
schema += newEnums;

// Write the updated schema
fs.writeFileSync('prisma/schema.prisma', schema);

console.log('Schema updated successfully!');
