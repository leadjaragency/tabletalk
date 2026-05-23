import { cache } from "react";
import { getRequiredSession, getPrismaForSession } from "@/lib/auth";

export type SupportedLocale = "en" | "de" | "fr" | "es";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "de", "fr", "es"];

export function isValidLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as string[]).includes(value);
}

/**
 * Returns the authenticated restaurant's configured UI language.
 * React cache() deduplicates the DB call within a single render pass,
 * so admin/layout.tsx and admin/page.tsx don't both hit the DB.
 */
export const getAdminLocale = cache(async (): Promise<SupportedLocale> => {
  try {
    const session = await getRequiredSession();
    if (!session.user.restaurantId) return "en";
    const db = getPrismaForSession(session);
    const row = await db.restaurant.findUnique({
      where:  { id: session.user.restaurantId },
      select: { defaultLanguage: true },
    });
    const lang = row?.defaultLanguage ?? "en";
    return isValidLocale(lang) ? lang : "en";
  } catch {
    return "en";
  }
});
