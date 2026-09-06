"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function LanguageSettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Settings");

  const languages = [
    { code: "en", label: t("english") },
    { code: "ms", label: t("malay") },
  ] as const;

  const selectLanguage = (nextLocale: "en" | "ms") => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    setIsOpen(false);
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined">language</span>
          <h2>{t("language")}</h2>
        </div>
      </div>

      {/* Dropdown Container */}
      <div className="p-6 max-w-sm">
        <p className="mb-4 text-sm text-on-surface-variant">{t("languageDescription")}</p>
        <div className="relative">
          {/* Dropdown Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-white px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-gray-50 focus:outline-none focus:border-primary"
          >
            <span>{languages.find((language) => language.code === locale)?.label}</span>
            <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Dropdown Options Box */}
          {isOpen && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-lg">
              <div className="flex flex-col">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => selectLanguage(language.code)}
                    className={`px-4 py-3 text-left text-sm font-bold transition-colors
                      ${locale === language.code
                        ? 'bg-primary/10 text-primary' 
                        : 'text-on-surface hover:bg-gray-50'
                      }`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
