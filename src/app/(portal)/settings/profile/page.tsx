"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserProfile = {
  name: string;
  icNumber: string;
  addressIC: string;
  gender: string;
  religion: string;
  citizenship: string;
  phoneNumber: string;
};

const defaultProfile: UserProfile = {
  name: "",
  icNumber: "",
  addressIC: "",
  gender: "",
  religion: "",
  citizenship: "",
  phoneNumber: "",
};

export default function ProfileSettingsPage() {
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [editForm, setEditForm] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || "");
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          const email = user.email || "";

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const loadedProfile = {
              ...defaultProfile,
              ...data,
              name: getDisplayName(data.name, email),
            };
            setProfile(loadedProfile);
            setEditForm(loadedProfile);
          } else {
            const fallbackProfile = {
              ...defaultProfile,
              name: getDisplayName(undefined, email),
            };
            setProfile(fallbackProfile);
            setEditForm(fallbackProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          showToast("Failed to load profile data.", "error");
        }
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 3000);
  };

  const handleEditChange = (field: keyof UserProfile, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), editForm);
      setProfile(editForm);
      setIsEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-outline-variant bg-white p-6 text-sm font-medium text-on-surface-variant">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined">person</span>
            <h2>Profile Settings</h2>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          <div className="border-b border-outline-variant pb-5 md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
              Email Address
            </label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface opacity-70"
            />
            <p className="mt-1 text-[10px] text-on-surface-variant">
              Email cannot be changed directly.
            </p>
          </div>

          <ProfileField label="Full Name" value={isEditing ? editForm.name : profile.name} isEditing={isEditing} onChange={(v) => handleEditChange("name", v)} />
          <ProfileField label="IC Number" value={isEditing ? editForm.icNumber : profile.icNumber} isEditing={isEditing} onChange={(v) => handleEditChange("icNumber", v)} />
          <ProfileField label="Phone Number" value={isEditing ? editForm.phoneNumber : profile.phoneNumber} isEditing={isEditing} onChange={(v) => handleEditChange("phoneNumber", v)} />

          <SelectField
            label="Gender"
            value={isEditing ? editForm.gender : profile.gender}
            isEditing={isEditing}
            options={[
              ["", "Select Gender"],
              ["Lelaki", "Male"],
              ["Perempuan", "Female"],
            ]}
            onChange={(value) => handleEditChange("gender", value)}
          />
          <SelectField
            label="Religion"
            value={isEditing ? editForm.religion : profile.religion}
            isEditing={isEditing}
            options={[
              ["", "Select Religion"],
              ["Islam", "Islam"],
              ["Buddha", "Buddha"],
              ["Hindu", "Hindu"],
              ["Kristian", "Christian"],
              ["Lain-lain", "Others"],
            ]}
            onChange={(value) => handleEditChange("religion", value)}
          />
          <SelectField
            label="Citizenship"
            value={isEditing ? editForm.citizenship : profile.citizenship}
            isEditing={isEditing}
            options={[
              ["", "Select Citizenship"],
              ["Warganegara", "Citizen"],
              ["Bukan Warganegara", "Non-citizen"],
            ]}
            onChange={(value) => handleEditChange("citizenship", value)}
          />

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
              Address (IC)
            </label>
            {isEditing ? (
              <textarea
                value={editForm.addressIC}
                onChange={(e) => handleEditChange("addressIC", e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-outline px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="min-h-[3rem] rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-sm font-semibold text-on-surface">
                {profile.addressIC || "-"}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 border-t border-outline-variant bg-gray-50 px-6 py-4">
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-lg border border-outline px-4 py-2 text-sm font-bold text-secondary transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </section>

      {toastMessage.text && (
        <Toast message={toastMessage.text} type={toastMessage.type} />
      )}
    </div>
  );
}

function getDisplayName(name: string | undefined, email: string) {
  const trimmedName = name?.trim() || "";

  if (trimmedName && trimmedName.toLowerCase() !== "not scanned") {
    return trimmedName;
  }

  return email.split("@")[0] || trimmedName;
}

function formatProfileValue(value: string) {
  const labels: Record<string, string> = {
    Lelaki: "Male",
    Perempuan: "Female",
    Kristian: "Christian",
    "Lain-lain": "Others",
    Warganegara: "Citizen",
    "Bukan Warganegara": "Non-citizen",
  };

  return labels[value] || value;
}

function ProfileField({
  label,
  value,
  isEditing,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-bold uppercase text-on-surface-variant">
        {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-outline px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <p className="border-b border-transparent py-2 text-sm font-semibold text-on-surface">
          {value || "-"}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  isEditing,
  options,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  if (!isEditing) {
    return (
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-bold uppercase text-on-surface-variant">
          {label}
        </label>
        <p className="py-2 text-sm font-semibold text-on-surface">
          {formatProfileValue(value) || "-"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-bold uppercase text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-outline bg-white py-2 pl-3 pr-10 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {options.map(([optionValue, labelText]) => (
            <option key={optionValue || labelText} value={optionValue}>
              {labelText}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          expand_more
        </span>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: string }) {
  return (
    <div
      className={`fixed bottom-10 right-10 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-xl ${
        type === "success"
          ? "border border-green-200 bg-green-100 text-green-800"
          : "border border-error/20 bg-error-container text-error"
      }`}
    >
      <span className="material-symbols-outlined text-lg">
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}
