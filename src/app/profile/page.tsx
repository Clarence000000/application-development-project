"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
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

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [editForm, setEditForm] = useState<UserProfile>(defaultProfile);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

  // Password Reset State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || "");
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const loadedProfile = { ...defaultProfile, ...data };
            setProfile(loadedProfile);
            setEditForm(loadedProfile);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      return setPasswordError("New passwords do not match.");
    }
    if (newPassword.length < 6) {
      return setPasswordError("New password must be at least 6 characters.");
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setIsPasswordUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      showToast("Password updated successfully.", "success");
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        setPasswordError("Incorrect old password.");
      } else {
        setPasswordError(error.message || "Failed to update password.");
      }
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-on-surface-variant font-medium animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="pt-12 max-w-4xl mx-auto space-y-6 pb-12 w-full px-2 sm:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">User Profile</h1>
          <p className="mt-1 text-sm text-secondary">Manage your personal information and security settings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant text-primary text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content Area (Centered Column Layout) */}
      <div className="space-y-6">
        
        {/* 1. Personal Information Card */}
        <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4 bg-surface-container-low">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined">person</span>
              <h2>Personal Information</h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Profile
              </button>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email */}
            <div className="md:col-span-2 border-b border-outline-variant pb-5">
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email Address</label>
              <input
                type="text"
                value={userEmail}
                disabled
                className="w-full text-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 opacity-70 cursor-not-allowed"
              />
              <p className="text-[10px] mt-1 text-on-surface-variant">Email cannot be changed directly.</p>
            </div>

            <ProfileField label="Full Name" value={isEditing ? editForm.name : profile.name} isEditing={isEditing} onChange={(v) => handleEditChange("name", v)} />
            <ProfileField label="IC Number" value={isEditing ? editForm.icNumber : profile.icNumber} isEditing={isEditing} onChange={(v) => handleEditChange("icNumber", v)} />
            <ProfileField label="Phone Number" value={isEditing ? editForm.phoneNumber : profile.phoneNumber} isEditing={isEditing} onChange={(v) => handleEditChange("phoneNumber", v)} />
            
            {/* Gender Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-on-surface-variant mb-1">Gender</label>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={editForm.gender}
                    onChange={(e) => handleEditChange("gender", e.target.value)}
                    className="appearance-none w-full text-sm text-on-surface border border-outline rounded-lg pl-3 pr-10 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-on-surface py-2">{profile.gender || "-"}</p>
              )}
            </div>

            {/* Religion Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-on-surface-variant mb-1">Religion</label>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={editForm.religion}
                    onChange={(e) => handleEditChange("religion", e.target.value)}
                    className="appearance-none w-full text-sm text-on-surface border border-outline rounded-lg pl-3 pr-10 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="">Select Religion</option>
                    <option value="Islam">Islam</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Kristian">Kristian</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-on-surface py-2">{profile.religion || "-"}</p>
              )}
            </div>

            {/* Citizenship Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-on-surface-variant mb-1">Citizenship</label>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={editForm.citizenship}
                    onChange={(e) => handleEditChange("citizenship", e.target.value)}
                    className="appearance-none w-full text-sm text-on-surface border border-outline rounded-lg pl-3 pr-10 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="">Select Citizenship</option>
                    <option value="Warganegara">Warganegara</option>
                    <option value="Bukan Warganegara">Bukan Warganegara</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-on-surface py-2">{profile.citizenship || "-"}</p>
              )}
            </div>

            {/* Address Textarea */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-on-surface-variant mb-1 block">Address (IC)</label>
              {isEditing ? (
                <textarea
                  value={editForm.addressIC}
                  onChange={(e) => handleEditChange("addressIC", e.target.value)}
                  rows={3}
                  className="w-full text-sm text-on-surface border border-outline rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              ) : (
                <p className="text-sm font-semibold text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant min-h-[3rem]">
                  {profile.addressIC || "-"}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="border-t border-outline-variant px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-bold text-secondary border border-outline rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </section>

        {/* 2. Security Section */}
        <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4 bg-surface-container-low">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined">lock</span>
              <h2>Security & Password</h2>
            </div>
          </div>
          <div className="p-6">
            {!isChangingPassword ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">Account Password</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Ensure your account uses a long, secure password.</p>
                </div>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-primary border border-outline-variant rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                {passwordError && (
                  <div className="p-3 text-xs font-semibold text-error bg-error-container rounded-lg border border-error/20 flex gap-2 items-start">
                    <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Old Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full text-sm text-on-surface border border-outline rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-sm text-on-surface border border-outline rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-sm text-on-surface border border-outline rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError("");
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isPasswordUpdating}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-secondary border border-outline rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordUpdating}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isPasswordUpdating ? "Updating..." : "Confirm Update"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

      </div>

      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`fixed bottom-10 right-10 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-xl transition-all ${
          toastMessage.type === "success" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-error-container text-error border border-error/20"
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toastMessage.type === "success" ? "check_circle" : "error"}
          </span>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}

// Reusable input component for cleaner code
function ProfileField({ label, value, isEditing, onChange }: { label: string; value: string; isEditing: boolean; onChange: (val: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold uppercase text-on-surface-variant mb-1">{label}</label>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm text-on-surface border border-outline rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <p className="text-sm font-semibold text-on-surface py-2 border-b border-transparent">{value || "-"}</p>
      )}
    </div>
  );
}