"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type NotificationPreferences = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  applicationSubmitted: boolean;
  statusUpdates: boolean;
  documentRequests: boolean;
};

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  applicationSubmitted: true,
  statusUpdates: true,
  documentRequests: true,
};

export default function NotificationSettingsPage() {
  const [uid, setUid] = useState("");
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUid(user.uid);

      try {
        const snap = await getDoc(doc(db, "notificationPreferences", user.uid));

        if (snap.exists()) {
          setPreferences({
            ...defaultPreferences,
            ...(snap.data() as Partial<NotificationPreferences>),
          });
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    if (!uid) return;

    const nextPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(nextPreferences);
    setIsSaving(true);
    setMessage("");

    try {
      await setDoc(doc(db, "notificationPreferences", uid), nextPreferences, {
        merge: true,
      });
      setMessage("Notification settings saved.");
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      setMessage("Failed to save notification settings.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border border-outline-variant bg-white p-6 text-sm font-medium text-on-surface-variant shadow-sm">
        Loading notification settings...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined">notifications</span>
          <h2>Notifications</h2>
        </div>
      </div>

      <div className="space-y-6 p-6">
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Delivery Methods
                </h3>
                <div className="space-y-2">
                  <SettingsToggle
                    checked={preferences.emailEnabled}
                    icon="mail"
                    label="Email"
                    onChange={(value) =>
                      updatePreference("emailEnabled", value)
                    }
                  />
                  <SettingsToggle
                    checked={preferences.smsEnabled}
                    icon="sms"
                    label="SMS"
                    onChange={(value) =>
                      updatePreference("smsEnabled", value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Alert Topics
                </h3>
                <div className="space-y-2">
                  <SettingsToggle
                    checked={preferences.applicationSubmitted}
                    disabled={
                      !preferences.emailEnabled && !preferences.smsEnabled
                    }
                    icon="outgoing_mail"
                    label="Application submitted"
                    onChange={(value) =>
                      updatePreference("applicationSubmitted", value)
                    }
                  />
                  <SettingsToggle
                    checked={preferences.statusUpdates}
                    disabled={
                      !preferences.emailEnabled && !preferences.smsEnabled
                    }
                    icon="published_with_changes"
                    label="Status updates"
                    onChange={(value) =>
                      updatePreference("statusUpdates", value)
                    }
                  />
                  <SettingsToggle
                    checked={preferences.documentRequests}
                    disabled={
                      !preferences.emailEnabled && !preferences.smsEnabled
                    }
                    icon="upload_file"
                    label="Document requests"
                    onChange={(value) =>
                      updatePreference("documentRequests", value)
                    }
                  />
                </div>
              </div>
            </div>

      <p className="-mt-6 text-xs font-medium text-on-surface-variant p-5">
        {isSaving ? "Saving..." : message}
      </p>
    </section>
  );
}

function SettingsToggle({
  checked,
  disabled = false,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  icon: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 transition ${
        disabled
          ? "cursor-not-allowed opacity-55"
          : "hover:border-primary/50 hover:bg-surface-container-low"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-primary">
          {icon}
        </span>
        <span className="block text-sm font-semibold text-on-surface">
          {label}
        </span>
      </div>
      <div className="relative inline-flex flex-shrink-0 items-center">
        <input
          checked={checked}
          className="peer sr-only"
          disabled={disabled}
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-outline-variant transition-colors peer-checked:bg-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 peer-disabled:cursor-not-allowed after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"></div>
      </div>
    </label>
  );
}