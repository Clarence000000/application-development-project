"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ICPenaltyAppealPage() {
  const router = useRouter();

  // Form states
  const [incidentDate, setIncidentDate] = useState("");
  const [policeReport, setPoliceReport] = useState("");
  const [reason, setReason] = useState("");
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

    if (!incidentDate) {
      setErrorMsg("Please select the incident date.");
      return;
    }
    if (!reason) {
      setErrorMsg("Please explain the reason for your appeal.");
      return;
    }
    if (!file) {
      setErrorMsg("Please upload financial hardship evidence.");
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <nav className="flex items-center gap-1 text-[11px] text-on-surface-variant mb-2">
          <Link href="/new-application" className="hover:text-primary transition-colors">
            Applications
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">ID Penalty Appeal</span>
        </nav>
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-1">
          Rayuan Bayaran Denda Kerosakan/ Kehilangan Kad Pengenalan
        </h1>
        <p className="text-xs md:text-sm text-on-surface-variant">
          Please provide accurate details for your penalty appeal. All submissions are subject to
          verification.
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

      {/* Form Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-8">
          {/* Section 1: Personal Information (Auto-filled) */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-1.5">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              <h3 className="text-base font-semibold text-on-surface">Maklumat Peribadi</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">Name</label>
                <input
                  className="w-full bg-surface-container border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-0 focus:border-outline-variant cursor-not-allowed font-semibold"
                  readOnly
                  type="text"
                  value="Ahmad bin Zaki"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">IC Number</label>
                <input
                  className="w-full bg-surface-container border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-0 focus:border-outline-variant cursor-not-allowed font-semibold"
                  readOnly
                  type="text"
                  value="850101-14-5567"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">Permanent Address</label>
                <textarea
                  className="w-full bg-surface-container border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-0 focus:border-outline-variant cursor-not-allowed font-semibold resize-none"
                  readOnly
                  rows={2}
                  value="No. 12, Jalan Utama, 56000 Kuala Lumpur"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Appeal Details */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-1.5">
              <span className="material-symbols-outlined text-primary text-xl">description</span>
              <h3 className="text-base font-semibold text-on-surface">Butiran Rayuan</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant">Incident Date</label>
                  <input
                    className="w-full border border-outline text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => {
                      setIncidentDate(e.target.value);
                      if (e.target.value) setErrorMsg("");
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant">
                    Police Report Number (If applicable)
                  </label>
                  <input
                    className="w-full border border-outline text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. TRAFIK/001234/23"
                    type="text"
                    value={policeReport}
                    onChange={(e) => setPoliceReport(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">
                  Reason for Appeal (Loss/Damage details)
                </label>
                <textarea
                  className="w-full border border-outline text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Describe the incident and reasons for requesting a penalty waiver..."
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Supporting Documents */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-1.5">
              <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
              <h3 className="text-base font-semibold text-on-surface">Financial Hardship Evidence</h3>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant bg-surface-container-low hover:bg-surface-container"
              }`}
            >
              <input
                id="file-input"
                className="hidden"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center animate-fade-in w-full px-4">
                  <span className="material-symbols-outlined text-2xl text-primary mb-1">
                    description
                  </span>
                  <p className="text-xs font-bold text-on-surface truncate max-w-[280px]">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    onClick={handleRemoveFile}
                    className="mt-2 text-[11px] font-bold text-error hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">
                    cloud_upload
                  </span>
                  <p className="mb-1 text-xs text-on-surface">
                    <span className="font-bold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-on-surface-variant">PDF, PNG, JPG (Max. 10MB)</p>
                </div>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              className="flex-1 px-4 py-2.5 border border-outline text-on-surface text-sm font-bold rounded-lg hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent"
              onClick={handleSaveDraft}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Save Draft
            </button>
            <button
              className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              type="submit"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-surface-container rounded-lg border border-outline-variant flex gap-3">
        <span className="material-symbols-outlined text-primary shrink-0 text-xl">info</span>
        <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium">
          <strong>Important:</strong> Section 5 of the National Registration Act states that providing
          false information is a punishable offense. Ensure all uploaded documents are genuine and
          relevant to your financial situation.
        </p>
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
              <h3 className="text-lg font-bold text-primary">Submitting Appeal</h3>
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
                Rayuan Bayaran Denda IC has been submitted. Redirecting to status logs...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
