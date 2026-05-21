import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  // Locale is derived from x-country header, set by middleware based on subdomain.
  // de.servemytable.ca → DE → de  |  servemytable.ca → CA → en
  const headersList = await headers();
  const country = headersList.get("x-country") ?? "CA";
  const locale = country === "DE" ? "de" : "en";

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
