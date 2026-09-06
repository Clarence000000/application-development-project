import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const storedLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = storedLocale === "ms" ? "ms" : "en";

  return {
    locale,
    messages: (await import(`../../locales/${locale}.json`)).default,
  };
});
