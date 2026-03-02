-- Ensure Roadmap.slug exists and is populated for older databases.
-- Safe to run on databases where the column already exists.

ALTER TABLE "Roadmap"
ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "Roadmap"
SET "slug" = COALESCE(
  NULLIF(
    regexp_replace(
      regexp_replace(lower(coalesce("title", '')), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  ),
  "id"
)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "Roadmap"
ALTER COLUMN "slug" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Roadmap_slug_idx" ON "Roadmap"("slug");
