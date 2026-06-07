"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createApplicationDocument } from "@/lib/applications";
import type { ApplicationFormConfig } from "@/lib/applicationForms";
import { triggerEmailNotification } from "@/lib/notifications";

type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;

type ApplicationFormPageProps = {
  config: ApplicationFormConfig;
};

export default function ApplicationFormPage({ config }: ApplicationFormPageProps) {
  const router = useRouter();
  const initialValues = useMemo(() => {
    return config.fields.reduce<FormValues>((values, field) => {
      values[field.name] = "";
      return values;
    }, {});
  }, [config.fields]);

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState("");

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    for (const field of config.fields) {
      const value = values[field.name]?.trim() ?? "";

      if (field.required && !value) {
        nextErrors[field.name] = "Maklumat ini diperlukan.";
        continue;
      }

      if (field.name === "idNumber" && value && !isValidIdNumber(value)) {
        nextErrors[field.name] = "Masukkan No. Kad Pengenalan atau Passport yang sah.";
      }

      if (field.type === "number" && value && Number(value) < 0) {
        nextErrors[field.name] = "Nilai tidak boleh negatif.";
      }
    }

    if (values.residentialStatus === "lain-lain" && !values.otherResidentialStatus?.trim()) {
      nextErrors.otherResidentialStatus = "Sila nyatakan status tempat tinggal.";
    }

    if (!declarationAccepted) {
      nextErrors.declaration = "Sila sahkan perakuan sebelum menghantar permohonan.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrors({
        form: "Sila log masuk semula sebelum menghantar permohonan.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const submittedApplication = await createApplicationDocument({
        uid: currentUser.uid,
        config,
        values,
      });

      if (currentUser.email) {
        triggerEmailNotification({
          uid: currentUser.uid,
          recipientEmail: currentUser.email,
          recipientName: values.name,
          applicationId: submittedApplication.applicationId,
          referenceNumber: submittedApplication.referenceNumber,
          applicationTitle: config.title,
          eventType: "application_submitted",
          status: "In Review",
          actionUrl: `/review-status?focus=${encodeURIComponent(
            submittedApplication.referenceNumber,
          )}`,
        }).catch((error) => {
          console.error("Failed to send submission notification", error);
        });
      }

      window.localStorage.setItem(
        "latestApplication",
        JSON.stringify({
          id: submittedApplication.applicationId,
          referenceNumber: submittedApplication.referenceNumber,
          type: config.slug,
          status: "In Review",
          values,
          submittedAt: new Date().toISOString(),
        })
      );
      setSubmittedReferenceNumber(submittedApplication.referenceNumber);
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to submit application", error);
      setErrors({
        form: "Permohonan gagal dihantar. Sila cuba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="border-b border-outline-variant pb-5">
        <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link href="/new-application" className="hover:text-primary">
            Permohonan
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary">{config.shortTitle}</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">
              Permohonan Dalam Talian
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
              {config.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
              {config.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-80">
            <div className="border border-outline-variant bg-white p-3">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">
                Status Awal
              </p>
              <p className="mt-1 font-bold text-primary">In Review</p>
            </div>
            <div className="border border-outline-variant bg-white p-3">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">
                Anggaran Masa
              </p>
              <p className="mt-1 font-bold text-primary">{config.estimatedTime}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 border border-outline-variant bg-white md:grid-cols-3">
        <ProcessStep title="Langkah 1" description="Isi maklumat permohonan dengan lengkap." />
        <ProcessStep title="Langkah 2" description="Pejabat Penghulu membuat semakan." />
        <ProcessStep title="Langkah 3" description="Pemohon menerima arahan seterusnya." />
      </section>

      {Object.keys(errors).length > 0 && (
        <div className="border-l-4 border-error bg-error-container px-4 py-3 text-on-error-container">
          <p className="text-sm font-bold">Sila semak maklumat permohonan.</p>
          <p className="mt-1 text-xs">
            {errors.form || "Lengkapkan medan yang bertanda sebelum menghantar permohonan."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={handleSubmit} className="border border-outline-variant bg-white">
          <section className="border-b border-outline-variant p-5 md:p-6">
            <SectionTitle icon="person" title="Maklumat Pemohon" />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {config.fields.map((field) => (
                <div className={field.fullWidth ? "md:col-span-2" : ""} key={field.name}>
                  <label
                    className="mb-1.5 block text-sm font-bold text-on-surface"
                    htmlFor={field.name}
                  >
                    {field.label}
                    {field.required && <span className="text-error"> *</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={values[field.name]}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      className={fieldClassName(errors[field.name])}
                    >
                      <option value="">Pilih satu</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={4}
                      value={values[field.name]}
                      placeholder={field.placeholder}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      className={`${fieldClassName(errors[field.name])} min-h-28 resize-y`}
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      min={field.type === "number" ? "0" : undefined}
                      step={field.name.toLowerCase().includes("amount") || field.name === "income" ? "0.01" : undefined}
                      value={values[field.name]}
                      placeholder={field.placeholder}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      className={fieldClassName(errors[field.name])}
                    />
                  )}
                  {field.helperText && (
                    <p className="mt-1 text-xs text-on-surface-variant">{field.helperText}</p>
                  )}
                  {errors[field.name] && (
                    <p className="mt-1 text-xs font-semibold text-error">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="p-5 md:p-6">
            <SectionTitle icon="gavel" title="Perakuan Pemohon" />
            <label className="mt-4 flex gap-3 border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(event) => {
                  setDeclarationAccepted(event.target.checked);
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.declaration;
                    return next;
                  });
                }}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                Saya mengaku bahawa maklumat yang diberikan adalah benar dan saya
                bertanggungjawab sepenuhnya terhadap maklumat permohonan ini.
              </span>
            </label>
            {errors.declaration && (
              <p className="mt-2 text-xs font-semibold text-error">{errors.declaration}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setValues(initialValues);
                  setDeclarationAccepted(false);
                  setErrors({});
                }}
                className="border border-outline px-5 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container-low"
              >
                Kosongkan Borang
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-container"
              >
                {isSubmitting ? "Menghantar..." : "Hantar Permohonan"}
              </button>
            </div>
          </section>
        </form>

        <aside className="space-y-4">
          <div className="border-t-4 border-primary bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-primary">Maklumat Proses</h2>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-on-surface-variant">
              <li>
                <strong className="block text-on-surface">Dokumen sokongan</strong>
                Dokumen akan diminta selepas semakan pihak pejabat, bersama makluman tarikh
                atau arahan seterusnya.
              </li>
              <li>
                <strong className="block text-on-surface">Bahagian pejabat</strong>
                Ulasan, tandatangan, tarikh, nama, dan cap rasmi Penghulu tidak diisi oleh
                pemohon.
              </li>
              <li>
                <strong className="block text-on-surface">Status permohonan</strong>
                Permohonan yang dihantar akan direkodkan untuk semakan awal.
              </li>
            </ul>
          </div>
          <div className="border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface-variant">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              <p>
                Pastikan maklumat adalah tepat. Maklumat tidak lengkap boleh melambatkan
                semakan pihak Pejabat Penghulu.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <span className="material-symbols-outlined">check</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-primary">Permohonan Berjaya Dihantar</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Maklumat permohonan telah direkodkan. Sila semak status permohonan untuk
              makluman seterusnya.
            </p>
            {submittedReferenceNumber && (
              <p className="mt-3 text-xs font-bold text-primary">
                No. Rujukan: {submittedReferenceNumber}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="flex-1 border border-outline px-4 py-2.5 text-sm font-bold text-secondary"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => router.push("/review-status")}
                className="flex-1 bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Semak Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-outline-variant p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{title}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-outline-variant pb-3">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <h2 className="text-lg font-bold text-primary">{title}</h2>
    </div>
  );
}

function fieldClassName(hasError?: string) {
  return `w-full border bg-white px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    hasError ? "border-error" : "border-outline"
  }`;
}

function isValidIdNumber(value: string) {
  const normalized = value.trim();
  const myKadPattern = /^\d{6}-?\d{2}-?\d{4}$/;
  const passportPattern = /^[A-Z0-9]{6,12}$/i;
  return myKadPattern.test(normalized) || passportPattern.test(normalized);
}
