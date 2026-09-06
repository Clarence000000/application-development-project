"use client";

import { NextIntlClientProvider } from "next-intl";

export default function LocaleProvider({ children, locale, messages }: { children: React.ReactNode; locale: string; messages: Record<string, unknown> }) {
  return <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>;
}
