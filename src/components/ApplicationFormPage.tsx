"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  createApplicationDocument,
  deleteDraftApplicationDocument,
  getLatestDraftApplication,
  saveDraftApplicationDocument,
} from "@/lib/applications";
import type { ApplicationFormConfig } from "@/lib/applicationForms";
import {
  createInAppNotification,
  triggerEmailNotification,
} from "@/lib/notifications";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { districtOptions } from "@/lib/districts";

type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;
type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

type ApplicationFormPageProps = {
  config: ApplicationFormConfig;
};

export default function ApplicationFormPage({
  config,
}: ApplicationFormPageProps) {
  const router = useRouter();

  const initialValues = useMemo(() => {
    return config.fields.reduce<FormValues>(
      (values, field) => {
        values[field.name] = "";
        return values;
      },
      { district: "" },
    );
  }, [config.fields]);

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] =
    useState<DraftSaveStatus>("idle");
  const [draftApplicationId, setDraftApplicationId] = useState<
    string | undefined
  >();
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const hasLoadedInitialData = useRef(false);
  const hasUserEdited = useRef(false);

  useEffect(() => {
    hasLoadedInitialData.current = false;
    hasUserEdited.current = false;
    setValues(initialValues);
    setDeclarationAccepted(false);
    setDraftApplicationId(undefined);
    setDraftSaveStatus("idle");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        hasLoadedInitialData.current = true;
        setCurrentUserId("");
        return;
      }

      setCurrentUserId(currentUser.uid);
      try {
        let profileValues: FormValues = {};
        // Fetch the user document from the 'users' collection using the authenticated UID
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const updatedValues = { ...initialValues };

          // 1. Map 'name'
          if (userData.name && "name" in updatedValues) {
            updatedValues.name = userData.name;
          }

          // 2. Map 'icNumber' -> 'idNumber'
          if (userData.icNumber && "idNumber" in updatedValues) {
            updatedValues.idNumber = userData.icNumber;
          }

          // 3. Map 'addressIC' -> 'icAddress'
          if (userData.addressIC && "icAddress" in updatedValues) {
            updatedValues.icAddress = userData.addressIC;
          }

          if (
            (userData.addressCurrent || userData.addressIC) &&
            "residentialAddress" in updatedValues
          ) {
            updatedValues.residentialAddress =
              userData.addressCurrent || userData.addressIC;
          }

          // 4. Map 'citizenship' -> Normalizes "Warganegara" string to form value slug "warganegara"
          if (userData.citizenship && "citizenship" in updatedValues) {
            const normalizedCitizenship = userData.citizenship
              .toLowerCase()
              .trim();
            if (
              normalizedCitizenship === "warganegara" ||
              normalizedCitizenship === "citizen"
            ) {
              updatedValues.citizenship = "warganegara";
            }

            if (
              normalizedCitizenship === "bukan warganegara" ||
              normalizedCitizenship === "bukan-warganegara" ||
              normalizedCitizenship === "non-citizen"
            ) {
              updatedValues.citizenship = "bukan-warganegara";
            }
          }

          // 5. Map 'phoneNumber' -> Safely auto-fills phone number if the current form configuration uses it
          if (userData.phoneNumber && "phoneNumber" in updatedValues) {
            updatedValues.phoneNumber = userData.phoneNumber;
          }

          if (userData.occupation && "occupation" in updatedValues) {
            updatedValues.occupation = userData.occupation;
          }

          if (
            userData.monthlyIncome !== undefined &&
            "income" in updatedValues
          ) {
            updatedValues.income = String(userData.monthlyIncome);
          }

          profileValues = updatedValues;
        }

        const latestDraft = await getLatestDraftApplication({
          uid: currentUser.uid,
          config,
        });

        const loadedValues = {
          ...initialValues,
          ...profileValues,
          ...(latestDraft?.values || {}),
        };
        const loadedDeclarationAccepted =
          latestDraft?.declarationAccepted || false;

        setValues(loadedValues);
        setDeclarationAccepted(loadedDeclarationAccepted);

        if (latestDraft) {
          setDraftApplicationId(latestDraft.applicationId);
          setDraftSaveStatus("saved");
        } else {
          const draft = await saveDraftApplicationDocument({
            uid: currentUser.uid,
            config,
            values: loadedValues,
            declarationAccepted: loadedDeclarationAccepted,
          });
          setDraftApplicationId(draft.applicationId);
          setDraftSaveStatus("saved");
        }
      } catch (error) {
        console.error("Failed to prefill user profile details:", error);
      } finally {
        hasLoadedInitialData.current = true;
      }
    });

    return () => unsubscribe();
  }, [config, initialValues]);

  function updateValue(name: string, value: string) {
    hasUserEdited.current = true;

    setValues((current) => {
      const nextValues = { ...current, [name]: value };

      if (name === "residentialStatus" && value !== "lain-lain") {
        nextValues.otherResidentialStatus = "";
      }

      return nextValues;
    });

    setErrors((current) => {
      const next = { ...current };
      delete next[name];

      if (name === "residentialStatus" && value !== "lain-lain") {
        delete next.otherResidentialStatus;
      }

      return next;
    });
  }

  const saveDraft = useCallback(
    async ({ manual = false }: { manual?: boolean } = {}) => {
      if (!currentUserId) {
        if (manual) {
          setErrors({
            form: "Please sign in again before saving a draft.",
          });
        }
        return;
      }

      try {
        if (manual) {
          setIsManualSaving(true);
        }
        setDraftSaveStatus("saving");
        const draft = await saveDraftApplicationDocument({
          uid: currentUserId,
          config,
          values,
          declarationAccepted,
          applicationId: draftApplicationId,
        });
        setDraftApplicationId(draft.applicationId);
        setDraftSaveStatus("saved");
        if (manual) {
          setErrors((current) => {
            const next = { ...current };
            delete next.form;
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to save draft", error);
        setDraftSaveStatus("error");
        if (manual) {
          setErrors({
            form: "Draft could not be saved. Please try again.",
          });
        }
      } finally {
        if (manual) {
          setIsManualSaving(false);
        }
      }
    },
    [config, currentUserId, declarationAccepted, draftApplicationId, values],
  );

  async function handleDeleteDraft() {
    if (!draftApplicationId) return;

    try {
      setIsDeletingDraft(true);
      await deleteDraftApplicationDocument(draftApplicationId);
      hasUserEdited.current = false;
      setDraftApplicationId(undefined);
      setValues(initialValues);
      setDeclarationAccepted(false);
      setDraftSaveStatus("idle");
      setErrors({});
      router.push("/new-application");
    } catch (error) {
      console.error("Failed to delete draft", error);
      setErrors({
        form: "Draft could not be deleted. Please try again.",
      });
    } finally {
      setIsDeletingDraft(false);
    }
  }

  useEffect(() => {
    if (
      !hasLoadedInitialData.current ||
      !hasUserEdited.current ||
      showSuccess
    ) {
      return;
    }

    const autosaveTimer = window.setTimeout(() => {
      saveDraft();
    }, 1200);

    return () => window.clearTimeout(autosaveTimer);
  }, [declarationAccepted, saveDraft, showSuccess, values]);

  function validateForm() {
    const nextErrors: FormErrors = {};

    for (const field of config.fields) {
      const value = values[field.name]?.trim() ?? "";

      if (field.required && !value) {
        nextErrors[field.name] = "This information is required.";
        continue;
      }

      if (field.name === "idNumber" && value && !isValidIdNumber(value)) {
        nextErrors[field.name] =
          "Enter a valid identity card or passport number.";
      }

      if (field.type === "number" && value && Number(value) < 0) {
        nextErrors[field.name] = "Value cannot be negative.";
      }
    }

    if (!values.district?.trim()) {
      nextErrors.district = "Please select an application district.";
    }

    if (
      values.residentialStatus === "lain-lain" &&
      !values.otherResidentialStatus?.trim()
    ) {
      nextErrors.otherResidentialStatus =
        "Please specify your residence status.";
    }

    if (!declarationAccepted) {
      nextErrors.declaration =
        "Please confirm the declaration before submitting your application.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrors({
        form: "Please sign in again before submitting your application.",
      });
      scrollToFirstError({ form: "Please sign in again before submitting your application." });
      return;
    }

    try {
      setIsSubmitting(true);
      const submittedApplication = await createApplicationDocument({
        uid: currentUser.uid,
        config,
        values,
        applicationId: draftApplicationId,
      });

      const notificationId = await createInAppNotification({
        uid: currentUser.uid,
        title: "Application Submitted",
        message: `We have received your ${config.title} application (${submittedApplication.referenceNumber}) and it is now in review.`,
        applicationId: submittedApplication.applicationId,
        referenceNumber: submittedApplication.referenceNumber,
        applicationTitle: config.title,
        eventType: "application_submitted",
      });

      if (currentUser.email) {
        triggerEmailNotification({
          uid: currentUser.uid,
          recipientEmail: currentUser.email,
          recipientName: values.name,
          notificationId,
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
        }),
      );
      setSubmittedReferenceNumber(submittedApplication.referenceNumber);
      setShowSuccess(true);
      setDraftSaveStatus("idle");
    } catch (error) {
      console.error("Failed to submit application", error);
      setErrors({
        form: "Application could not be submitted. Please try again.",
      });
      scrollToFirstError({ form: "Application could not be submitted. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function scrollToFirstError(nextErrors: FormErrors) {
    const errorOrder = [
      "district",
      ...config.fields.map((field) => field.name),
      "declaration",
      "form",
    ];
    const firstErrorKey = errorOrder.find((key) => nextErrors[key]);

    if (!firstErrorKey) {
      return;
    }

    window.requestAnimationFrame(() => {
      const target =
        document.getElementById(firstErrorKey) ||
        document.querySelector<HTMLElement>(
          `[data-error-key="${firstErrorKey}"]`,
        );

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      if ("focus" in target) {
        target.focus({ preventScroll: true });
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="border-b border-outline-variant pb-5">
        <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link href="/new-application" className="hover:text-primary">
            Applications
          </Link>
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
          <span className="text-primary">{config.shortTitle}</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">
              Online Application
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
                Initial Status
              </p>
              <p className="mt-1 font-bold text-primary">In Review</p>
            </div>
            <div className="border border-outline-variant bg-white p-3">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">
                Estimated Time
              </p>
              <p className="mt-1 font-bold text-primary">
                {config.estimatedTime}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 border border-outline-variant bg-white md:grid-cols-3">
        <ProcessStep
          title="Step 1"
          description="Complete the application details."
        />
        <ProcessStep
          title="Step 2"
          description="The office reviews your application."
        />
        <ProcessStep
          title="Step 3"
          description="You receive the next instructions."
        />
      </section>

      {Object.keys(errors).length > 0 && (
        <div
          className="border-l-4 border-error bg-error-container px-4 py-3 text-on-error-container"
          data-error-key="form"
          tabIndex={-1}
        >
          <p className="text-sm font-bold">
            Please review your application details.
          </p>
          <p className="mt-1 text-xs">
            {errors.form ||
              "Complete all marked fields before submitting your application."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="border border-outline-variant bg-white"
        >
          <section className="border-b border-outline-variant p-5 md:p-6">
            <SectionTitle icon="person" title="Applicant Details" />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-bold text-on-surface"
                  htmlFor="district"
                >
                  District / Office Area <span className="text-error">*</span>
                </label>
                <select
                  id="district"
                  name="district"
                  value={values.district}
                  onChange={(event) =>
                    updateValue("district", event.target.value)
                  }
                  className={fieldClassName(errors.district)}
                >
                  <option value="">Select application district</option>
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Your application will be routed to the staff assigned to this
                  area.
                </p>
                {errors.district && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    {errors.district}
                  </p>
                )}
              </div>
              {config.fields.map((field) => {
                const isOtherResidentialStatusField =
                  field.name === "otherResidentialStatus";

                const isFieldDisabled =
                  isOtherResidentialStatusField &&
                  values.residentialStatus !== "lain-lain";

                return (
                  <div
                    className={field.fullWidth ? "md:col-span-2" : ""}
                    key={field.name}
                  >
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
                        disabled={isFieldDisabled}
                        onChange={(event) =>
                          updateValue(field.name, event.target.value)
                        }
                        className={fieldClassName(
                          errors[field.name],
                          isFieldDisabled,
                        )}
                      >
                        <option value="">Select one</option>
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
                        disabled={isFieldDisabled}
                        onChange={(event) =>
                          updateValue(field.name, event.target.value)
                        }
                        className={`${fieldClassName(errors[field.name], isFieldDisabled)} min-h-28 resize-y`}
                      />
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        disabled={isFieldDisabled}
                        min={field.type === "number" ? "0" : undefined}
                        step={
                          field.name.toLowerCase().includes("amount") ||
                          field.name === "income"
                            ? "0.01"
                            : undefined
                        }
                        value={values[field.name]}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          updateValue(field.name, event.target.value)
                        }
                        className={fieldClassName(
                          errors[field.name],
                          isFieldDisabled,
                        )}
                      />
                    )}
                    {field.helperText && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {field.helperText}
                      </p>
                    )}
                    {errors[field.name] && (
                      <p className="mt-1 text-xs font-semibold text-error">
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="p-5 md:p-6">
            <SectionTitle icon="gavel" title="Applicant Declaration" />
            <label className="mt-4 flex gap-3 border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface">
              <input
                id="declaration"
                type="checkbox"
                checked={declarationAccepted}
                onChange={(event) => {
                  hasUserEdited.current = true;
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
                I declare that the information provided is true and that I am
                fully responsible for the details in this application.
              </span>
            </label>
            {errors.declaration && (
              <p className="mt-2 text-xs font-semibold text-error">
                {errors.declaration}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
              <div className="flex flex-1 items-center gap-2 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">
                  {draftSaveStatus === "saving"
                    ? "sync"
                    : draftSaveStatus === "error"
                      ? "error"
                      : draftSaveStatus === "saved"
                        ? "cloud_done"
                        : "cloud_queue"}
                </span>
                <span>{getDraftStatusText(draftSaveStatus)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  hasUserEdited.current = true;
                  setValues(initialValues);
                  setDeclarationAccepted(false);
                  setErrors({});
                }}
                className="border border-outline px-5 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container-low"
              >
                Clear Form
              </button>
              <button
                type="button"
                disabled={isManualSaving || isSubmitting || isDeletingDraft}
                onClick={() => saveDraft({ manual: true })}
                className="border border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary-container hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isManualSaving ? "Saving..." : "Save Draft"}
              </button>
              {draftApplicationId && (
                <button
                  type="button"
                  disabled={isManualSaving || isSubmitting || isDeletingDraft}
                  onClick={handleDeleteDraft}
                  className="border border-error px-5 py-2.5 text-sm font-bold text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingDraft ? "Deleting..." : "Delete Draft"}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isManualSaving || isDeletingDraft}
                className="bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-container"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </section>
        </form>

        <aside className="space-y-4">
          <div className="border-t-4 border-primary bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-primary">
              Process Information
            </h2>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-on-surface-variant">
              <li>
                <strong className="block text-on-surface">
                  Supporting documents
                </strong>
                Supporting documents may be requested after office review,
                together with appointment details or next instructions.
              </li>
              <li>
                <strong className="block text-on-surface">
                  Office section
                </strong>
                Comments, signature, date, name, and official stamp are
                completed by the office, not by the applicant.
              </li>
              <li>
                <strong className="block text-on-surface">
                  Application status
                </strong>
                Submitted applications are recorded for initial review.
              </li>
            </ul>
          </div>
          <div className="border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface-variant">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-primary">
                info
              </span>
              <p>
                Make sure your information is accurate. Incomplete details may
                delay the office review.
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
            <h2 className="mt-4 text-xl font-bold text-primary">
              Application Submitted Successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Your application details have been recorded. Please check your
              application status for further updates.
            </p>
            {submittedReferenceNumber && (
              <p className="mt-3 text-xs font-bold text-primary">
                Reference No.: {submittedReferenceNumber}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="flex-1 border border-outline px-4 py-2.5 text-sm font-bold text-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => router.push("/review-status")}
                className="flex-1 bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-outline-variant p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">
        {title}
      </p>
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

function fieldClassName(error?: string, disabled = false) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
    error
      ? "border-error focus:border-error focus:ring-1 focus:ring-error"
      : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
  } ${
    disabled
      ? "bg-gray-100 text-on-surface-variant cursor-not-allowed opacity-70"
      : "bg-white"
  }`;
}

function getDraftStatusText(status: DraftSaveStatus) {
  if (status === "saving") {
    return "Saving draft...";
  }

  if (status === "saved") {
    return "Draft saved automatically.";
  }

  if (status === "error") {
    return "Autosave failed. Try saving the draft manually.";
  }

  return "Autosave starts when you begin filling the form.";
}

function isValidIdNumber(value: string) {
  const normalized = value.trim();
  const myKadPattern = /^\d{6}-?\d{2}-?\d{4}$/;
  const passportPattern = /^[A-Z0-9]{6,12}$/i;
  return myKadPattern.test(normalized) || passportPattern.test(normalized);
}
