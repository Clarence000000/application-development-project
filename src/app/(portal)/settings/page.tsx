"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <div className="rounded-lg border border-outline-variant bg-white p-6 text-sm font-medium text-on-surface-variant">
      Opening profile settings...
    </div>
  );
}
