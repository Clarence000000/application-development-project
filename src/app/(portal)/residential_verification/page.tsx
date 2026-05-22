"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResidentialVerificationPage() {
  const router = useRouter();

  // Form states
  const [duration, setDuration] = useState("");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Status / Feedback states
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg("");
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
  };

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Save Draft Handler
  const handleSaveDraft = () => {
    triggerToast("Draft saved successfully!");
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!duration) {
      setErrorMsg("Please enter the duration of residence.");
      return;
    }
    if (!purpose) {
      setErrorMsg("Please select the purpose of this application.");
      return;
    }
    if (!file) {
      setErrorMsg("Please upload your utility bill as a supporting document.");
      return;
    }

    // Process submission mockup
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/review-status");
      }, 1500);
    }, 1800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-on-surface-variant mb-2">
          <Link href="/new-application" className="hover:text-primary transition-colors">
            Applications
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-primary font-bold">Borang Pengesahan Bermastautin</span>
        </nav>
        <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Residential Verification Form
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Please complete the details below to verify your residency status within the jurisdiction.
        </p>
      </div>

      {/* Form Submission Error Banner */}
      {errorMsg && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex items-start gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-error shrink-0">error</span>
          <div>
            <p className="text-sm font-bold">Missing Information</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Bento Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Section 1: Auto-filled User Identity */}
        <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-9xl">badge</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px]">
              verified_user
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-secondary">
              Verified Profile Information
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Full Name
              </label>
              <div className="p-2.5 bg-surface-container-low rounded-lg border border-transparent text-sm text-on-surface font-semibold">
                Ahmad bin Zaki
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Identification Number (IC)
              </label>
              <div className="p-2.5 bg-surface-container-low rounded-lg border border-transparent text-sm text-on-surface font-semibold">
                850101-14-5567
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Gender
              </label>
              <div className="p-2.5 bg-surface-container-low rounded-lg border border-transparent text-sm text-on-surface font-semibold">
                Male
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Residential Address Info */}
        <div className="md:col-span-4 bg-primary-container text-white rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]">home_pin</span>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                Permanent Address
              </h3>
            </div>
            <p className="text-lg font-light leading-snug text-white">
              No. 12, Jalan Utama, 56000 Kuala Lumpur
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/50 italic">Verified via National Registry</p>
          </div>
        </div>

        {/* Section 3: Manual Input Fields */}
        <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
            <h3 className="text-lg font-bold text-on-surface">Application Specifics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm text-on-surface font-bold" htmlFor="duration">
                  Duration of Residence (Years)
                </label>
                <input
                  className="w-full h-11 px-4 rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white text-sm"
                  id="duration"
                  name="duration"
                  placeholder="e.g. 5"
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
                <p className="text-[11px] text-on-surface-variant font-medium">
                  How many years have you lived at this address?
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm text-on-surface font-bold" htmlFor="purpose">
                  Purpose of Application
                </label>
                <select
                  className="w-full h-11 px-4 rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white text-sm"
                  id="purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                >
                  <option value="" disabled>
                    Select a purpose
                  </option>
                  <option value="school_enrollment">School Enrollment</option>
                  <option value="bank_account">Bank Account Opening</option>
                  <option value="employment">Employment Verification</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm text-on-surface font-bold">
                  Supporting Document (Utility Bill)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group min-h-[148px] relative ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    className="hidden"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center animate-fade-in w-full">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                          description
                        </span>
                      </div>
                      <p className="text-xs font-bold text-on-surface truncate max-w-[250px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        onClick={handleRemoveFile}
                        className="mt-3 text-[11px] font-bold text-error hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">
                          upload_file
                        </span>
                      </div>
                      <p className="text-xs font-bold text-on-surface">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        PDF, JPG, or PNG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-container-low rounded-lg text-[11px] text-on-surface-variant mt-2 font-medium">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Bill must be from within the last 3 months.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Action Buttons */}
        <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-end gap-3 mt-2">
          <button
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline text-secondary text-sm font-bold hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
            onClick={handleSaveDraft}
            type="button"
          >
            Save as Draft
          </button>
          <button
            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            type="submit"
          >
            Submit Application
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </div>
      </form>

      {/* Decorative Image Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center opacity-90 border-t border-outline-variant pt-10">
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-primary">Secure Citizen Services</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your data is protected under the Personal Data Protection Act (PDPA). We ensure all
            document submissions are encrypted and processed only for the intended verification
            purposes.
          </p>
        </div>
        <div className="h-40 rounded-xl overflow-hidden shadow-lg border border-outline-variant bg-surface-container">
          <img
            className="w-full h-full object-cover"
            alt="A clean, modern professional setting with architectural lines representing authority and transparency."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHaVr4FQ0wTakQm72nPvcQhSFAaA5rFo8hIhuqLt6U38JLlaAbsBy56YRdcAkqlW6qoHw34AqiA-R07UDcvktqk94jbmRLnAin9u95zvUx_ZzuNUhe1wy0nIXlHy19ex7BmCj4WXbxjEvR7w6XD6K_Xm1f05JTDSOdM3zjM8_he9EAWZpGJfOMGfCsKJUQ7zQQnbyTQmljmD0TxyG-q3pUTM8A0kdKOVKDu0-ZNzvZFgm6eE2LqgVEKO0tcfB6cFAUo-Giv7oJgTE"
          />
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 right-6 md:right-10 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold z-50 animate-fade-in">
          <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Submission Overlay Modals */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-outline-variant flex flex-col items-center text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-bold text-primary">Submitting Application</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                Encrypting documents and creating secure records...
              </p>
            </div>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-outline-variant flex flex-col items-center text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-2xl font-bold">check</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Submission Successful!</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                Borang Pengesahan Bermastautin has been filed. Redirecting to status logs...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
