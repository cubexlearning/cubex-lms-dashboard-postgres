-- Guarded cleanup of default categories; safe on empty DBs
DO $$
BEGIN
  IF to_regclass('public."categories"') IS NOT NULL
     AND to_regclass('public."courses"') IS NOT NULL THEN
    DELETE FROM "courses" WHERE "categoryId" IN (
      SELECT id FROM "categories" WHERE slug IN ('online-tuition', 'exam-preparation', 'arts-music')
    );
    DELETE FROM "categories" WHERE slug IN ('online-tuition', 'exam-preparation', 'arts-music');
  END IF;
END $$;


