-- Add defaultLanguage to Restaurant
-- Allows per-restaurant UI language configuration ("en" | "de" | "fr" | "es")
ALTER TABLE "Restaurant" ADD COLUMN "defaultLanguage" TEXT NOT NULL DEFAULT 'en';
