-- Remove default categories that were auto-created
-- This clears the categories table so admins can add their own categories

-- First, check if there are any courses using these categories
-- If yes, we need to either delete those courses or update their categoryId

-- Option 1: Delete courses that use these default categories (if they're just test data)
DELETE FROM "courses" WHERE "categoryId" IN (
  SELECT id FROM "categories" WHERE slug IN ('online-tuition', 'exam-preparation', 'arts-music')
);

-- Option 2: Then delete the default categories
DELETE FROM "categories" WHERE slug IN ('online-tuition', 'exam-preparation', 'arts-music');

-- Note: If you want to keep existing courses, you'll need to:
-- 1. Create new categories first
-- 2. Update courses to use the new category IDs
-- 3. Then delete the old default categories