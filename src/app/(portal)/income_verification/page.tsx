"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function IncomeVerificationPage() {
  const router = useRouter();

  // Form states
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [dependents, setDependents] = useState("");
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

    if (!monthlyIncome) {
      setErrorMsg("Sila nyatakan pendapatan bulanan anda.");
      return;
    }
    if (parseFloat(monthlyIncome) <= 0) {
      setErrorMsg("Sila nyatakan pendapatan bulanan yang sah.");
      return;
    }
    if (!incomeSource) {
      setErrorMsg("Sila nyatakan sumber pendapatan anda.");
      return;
    }
    if (!dependents) {
      setErrorMsg("Sila nyatakan bilangan tanggungan anda.");
      return;
    }
    if (!file) {
      setErrorMsg("Sila muat naik dokumen sokongan (Penyata Bank / Slip Gaji).");
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-on-surface-variant mb-2">
          <Link href="/new-application" className="hover:text-primary transition-colors">
            Applications
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-primary font-bold">Borang Pengesahan Pendapatan</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Borang Pengesahan Pendapatan
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Sila lengkapkan butiran pendapatan anda untuk proses pengesahan rasmi.
        </p>
      </div>

      {/* Form Submission Error Banner */}
      {errorMsg && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex items-start gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-error shrink-0">error</span>
          <div>
            <p className="text-sm font-bold">Maklumat Tidak Lengkap</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Form Layout */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Personal Information (Read-only) */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            <h2 className="text-base font-bold text-primary">Maklumat Pemohon</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs text-secondary font-bold uppercase tracking-wide">
                Nama Penuh (Seperti IC)
              </label>
              <div className="bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold">
                Ahmad bin Zaki
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-secondary font-bold uppercase tracking-wide">
                Nombor Kad Pengenalan
              </label>
              <div className="bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold">
                850101-14-5567
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs text-secondary font-bold uppercase tracking-wide">
                Alamat Kediaman
              </label>
              <div className="bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold">
                No. 12, Jalan Utama, 56000 Kuala Lumpur
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-secondary font-bold uppercase tracking-wide">
                Pekerjaan
              </label>
              <div className="bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold">
                Freelance Designer
              </div>
            </div>
          </div>
        </div>

        {/* Two-column grid for Income and Upload on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Section: Financial Details (Input) */}
          <div className="md:col-span-7 bg-white border border-outline-variant rounded-xl p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
              <h2 className="text-base font-bold text-primary">Butiran Pendapatan Bulanan</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm text-on-surface font-bold animate-pulse-slow" htmlFor="monthly_income">
                  Pendapatan Bulanan (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                    RM
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    id="monthly_income"
                    name="monthly_income"
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(e) => {
                      setMonthlyIncome(e.target.value);
                      if (e.target.value) setErrorMsg("");
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm text-on-surface font-bold" htmlFor="income_source">
                  Sumber Pendapatan
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                  id="income_source"
                  name="income_source"
                  placeholder="Contoh: Projek Reka Bentuk"
                  type="text"
                  value={incomeSource}
                  onChange={(e) => {
                    setIncomeSource(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm text-on-surface font-bold" htmlFor="dependents">
                  Bilangan Tanggungan
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                  id="dependents"
                  name="dependents"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={dependents}
                  onChange={(e) => {
                    setDependents(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section: Document Upload */}
          <div className="md:col-span-5 bg-white border border-outline-variant rounded-xl p-5 md:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
              <h2 className="text-base font-bold text-primary">Dokumen Sokongan</h2>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer text-center group min-h-[200px] relative ${
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
                <div className="flex flex-col items-center animate-fade-in w-full">
                  <span className="material-symbols-outlined text-[32px] text-primary mb-2">
                    description
                  </span>
                  <p className="text-xs font-bold text-on-surface truncate max-w-[180px]">
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
                    Padam fail
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[32px] text-outline mb-2 group-hover:scale-110 transition-transform">
                    cloud_upload
                  </span>
                  <p className="text-sm font-bold text-on-surface mb-1">Klik untuk muat naik</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    Penyata Bank / Slip Gaji
                    <br />
                    (PDF, JPG maks 5MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-3 mt-4 pt-6 border-t border-outline-variant">
          <button
            className="w-full md:w-auto px-6 py-2.5 border border-outline text-secondary font-bold text-sm rounded-lg hover:bg-surface-container-high transition-all active:scale-[0.98] flex items-center justify-center text-center cursor-pointer bg-transparent"
            onClick={handleSaveDraft}
            type="button"
          >
            Save as Draft
          </button>
          <button
            className="w-full md:w-auto px-10 py-2.5 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center cursor-pointer"
            type="submit"
          >
            Submit Application
          </button>
        </div>
      </form>

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
              <h3 className="text-lg font-bold text-primary">Menghantar Permohonan</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                Mengenkripsi dokumen dan membina rekod selamat...
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
              <h3 className="text-lg font-bold text-primary">Penghantaran Berjaya!</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                Borang Pengesahan Pendapatan telah difailkan. Mengalih ke status permohonan...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
