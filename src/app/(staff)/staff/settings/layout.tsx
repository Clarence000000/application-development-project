"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const settingsItems = [
  {
    href: "/staff/settings/language",
    icon: "language",
    title: "language",
  },
  {
    href: "/staff/settings/theme",
    icon: "palette",
    title: "theme",
  },
  {
    href: "/staff/settings/notifications",
    icon: "notifications",
    title: "notifications",
  },
  {
    href: "/staff/settings/support",
    icon: "help",
    title: "support",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("Settings");

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {t("title")}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:self-start">
          <nav className="rounded-lg border border-outline-variant bg-white p-2 shadow-sm">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">
                      {t(item.title)}
                    </span>
                    <span
                      className={`block truncate text-xs ${
                        isActive ? "text-white/80" : "text-on-surface-variant"
                      }`}
                    >
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
