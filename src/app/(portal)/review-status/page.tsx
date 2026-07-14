"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { deleteDraftApplicationDocument } from "@/lib/applications";
import { createInAppNotification } from "@/lib/notifications";

interface Application {
  documentId: string;
  id: string;
  type: string;
  formSlug: string;
  category?: string;
  title: string;
  date: string;
  meta: string;
  status: "In Review" | "Approved" | "Action Required" | "Rejected" | "Draft";
  statusColor: string;
  statusBg: string;
  statusDot: string;
  link?: string;
  downloadUrl?: string;
  serialNumber?: string;
  officeRemark?: string;
  timeline: { title: string; date: string; desc: string; done: boolean }[];
}

const mapCategory = (type: string) => {
  switch (type) {
    case "residential":
      return "Residential";
    case "income":
      return "Finance";
    case "ic-appeal":
    case "ic_penalty":
      return "Appeal";
    default:
      return "General";
  }
};

export default function ReviewStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm font-medium text-secondary">
          Please wait, loading application details...
        </div>
      }
    >
      <ReviewStatusContent />
    </Suspense>
  );
}

function ReviewStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusedId = searchParams.get("focus");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitProgress, setResubmitProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusedId || isLoading || applications.length === 0) return;

    setActiveFocusId(focusedId);

    const scrollTimer = window.setTimeout(() => {
      cardRefs.current[focusedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    const highlightTimer = window.setTimeout(() => {
      setActiveFocusId(null);
    }, 3000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [focusedId, isLoading, applications]);

  useEffect(() => {
    let unsubscribeApplications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeApplications?.();
      unsubscribeApplications = null;

      if (!user) {
        router.push("/login");
        return;
      }

      setIsLoading(true);

      const applicationsQuery = query(
        collection(db, "applications"),
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc"),
      );

      unsubscribeApplications = onSnapshot(
        applicationsQuery,
        (querySnap) => {
          const appsList = querySnap.docs
            .map((documentSnapshot) =>
              mapFirestoreApplication(
                documentSnapshot.id,
                documentSnapshot.data(),
              ),
            )
            .sort((left, right) => right.sortTime - left.sortTime)
            .map(stripSortTime);

          setApplications(appsList);

          setSelectedApp((current) => {
            if (!current) return current;
            return (
              appsList.find(
                (application) => application.documentId === current.documentId,
              ) || null
            );
          });

          setIsLoading(false);
        },
        (err) => {
          console.error("Error listening to application statuses: ", err);
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeApplications?.();
      unsubscribeAuth();
    };
  }, [router]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleResubmit = async (app: Application) => {
    if (!resubmitFile) return;

    const user = auth.currentUser;
    if (!user) return;

    setResubmitLoading(true);
    setResubmitProgress(0);
    try {
      const storagePath = `applications/${user.uid}/${app.documentId}/resubmitted_${Date.now()}_${resubmitFile.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, resubmitFile);

      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          uploadTask.cancel();
          reject(new Error("The upload timed out after 45 seconds."));
        }, 45_000);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setResubmitProgress(progress);
          },
          (error) => {
            window.clearTimeout(timeoutId);
            reject(error);
          },
          () => {
            window.clearTimeout(timeoutId);
            setResubmitProgress(100);
            resolve();
          },
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      const docRef = doc(db, "applications", app.documentId);
      await updateDoc(docRef, {
        "values.resubmittedDocumentUrl": downloadURL,
        status: "In Review",
        resubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await createInAppNotification({
        uid: user.uid,
        title: "Document Resubmitted",
        message: `Your additional document for ${app.title} (${app.id}) has been submitted. Your application is now back under review.`,
        applicationId: app.documentId,
        referenceNumber: app.id,
        applicationTitle: app.title,
        eventType: "status_updated",
      });

      setResubmitFile(null);
      setSelectedApp(null);
      triggerToast("Document submitted successfully! Your application is back under review.");
    } catch (error) {
      console.error("Failed to resubmit document", error);
      triggerToast(getResubmissionErrorMessage(error));
    } finally {
      setResubmitLoading(false);
      setResubmitProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setResubmitFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResubmitFile(file);
  };

  const handleDeleteDraft = async (app: Application) => {
    try {
      setDeletingDraftId(app.documentId);
      await deleteDraftApplicationDocument(app.documentId);
      setApplications((current) =>
        current.filter(
          (application) => application.documentId !== app.documentId,
        ),
      );
      if (selectedApp?.documentId === app.documentId) {
        setSelectedApp(null);
      }
      triggerToast("Draft deleted.");
    } catch (error) {
      console.error("Failed to delete draft", error);
      triggerToast("Draft could not be deleted.");
    } finally {
      setDeletingDraftId(null);
    }
  };

  // Filter application list
  const filteredApps = applications.filter((app) => {
    const searchText = search.toLowerCase();
    const matchesSearch =
      readString(app.id).toLowerCase().includes(searchText) ||
      readString(app.title).toLowerCase().includes(searchText);
    const matchesStatus =
      statusFilter === "All Statuses" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics dynamically
  const approvedCount = applications.filter(
    (a) => a.status === "Approved",
  ).length;
  const inReviewCount = applications.filter(
    (a) => a.status === "In Review",
  ).length;
  const actionRequiredCount = applications.filter(
    (a) => a.status === "Action Required",
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.status === "Rejected",
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Review Status
        </h1>
        <p className="text-sm text-on-surface-variant max-w-xl">
          Track the progress of your submitted documents and verification
          requests. Real-time updates on your official government applications.
        </p>
      </section>

      {/* Filters & Search Bento Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">
              Search Application ID / Title
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-on-surface"
                placeholder="e.g. APP- or Residence"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">
              Status Filter
            </label>
            <select
              className="w-full px-3 py-2 bg-surface-container-low border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-on-surface cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>In Review</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Draft</option>
              <option>Action Required</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All Statuses");
              }}
              className="w-full bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-secondary font-medium">
            Please wait, loading application details...
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div
              ref={(element) => {
                cardRefs.current[app.id] = element;
              }}
              key={app.id}
              className={`group bg-surface-container-lowest border rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                activeFocusId === app.id
                  ? "border-primary ring-2 ring-primary/40 animate-pulse"
                  : "border-outline-variant hover:border-primary"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    app.status === "Approved"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : app.status === "Action Required"
                        ? "bg-yellow-100 text-yellow-800"
                        : app.status === "Rejected"
                          ? "bg-error-container text-on-error-container"
                          : app.status === "In Review"
                            ? "bg-primary-container text-white"
                            : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {app.status === "Approved"
                      ? "verified"
                      : app.status === "Action Required"
                        ? "error"
                        : app.status === "Rejected"
                          ? "warning"
                          : app.status === "In Review"
                            ? "description"
                            : "edit_note"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                      {app.id}
                    </span>
                    {app.category && (
                      <span className="px-1.5 py-0.5 bg-surface-container-high text-on-secondary-container text-[9px] font-bold rounded uppercase tracking-wide">
                        {app.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-on-surface">
                    {app.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        calendar_today
                      </span>
                      {app.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        location_on
                      </span>
                      {app.meta}
                    </span>
                    {app.serialNumber && (
                      <span className="flex items-center gap-1 text-green-700 font-bold">
                        <span className="material-symbols-outlined text-[14px]">
                          verified_user
                        </span>
                        {app.serialNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-outline mb-0.5 uppercase tracking-wide">
                    Current Status
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${app.statusBg} ${app.statusColor}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${app.statusDot}`}
                    ></span>
                    <span className="text-xs font-semibold">{app.status}</span>
                  </div>
                </div>
                {app.status === "Draft" ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={deletingDraftId === app.documentId}
                      onClick={() => handleDeleteDraft(app)}
                      className="border border-error text-error font-semibold text-xs px-4 py-2 rounded-lg hover:bg-error-container active:scale-95 transition-all flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                      {deletingDraftId === app.documentId
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                    <Link
                      href={app.link || "/new-application"}
                      className="bg-primary text-white font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
                    >
                      Resume
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-end gap-2">
                    {app.status === "Approved" && app.downloadUrl && (
                      <a
                        href={app.downloadUrl}
                        download
                        className="bg-green-700 text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-green-800 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          download
                        </span>
                        PDF
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="bg-surface-container-highest text-primary font-semibold text-xs px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      View Details
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant border-dashed rounded-xl p-12 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">
              search_off
            </span>
            <h4 className="text-sm font-bold text-on-surface">
              No applications found
            </h4>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs font-medium">
              No applications found.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info / Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-8">
        <div className="bg-surface-container border border-outline-variant p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              assignment_turned_in
            </span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              Total Approved
            </div>
            <div className="text-sm font-bold text-primary">
              {approvedCount} Applications
            </div>
          </div>
        </div>
        <div className="bg-surface-container border border-outline-variant p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              pending
            </span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              In Progress
            </div>
            <div className="text-sm font-bold text-primary">
              {inReviewCount} Applications
            </div>
          </div>
        </div>
        <div className="bg-surface-container border border-outline-variant p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              error_outline
            </span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              Pending Action
            </div>
            <div className="text-sm font-bold text-yellow-700">
              {actionRequiredCount} Applications
            </div>
          </div>
        </div>
        <div className="bg-surface-container border border-outline-variant p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-error flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              warning
            </span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              Rejected
            </div>
            <div className="text-sm font-bold text-error">
              {rejectedCount} Applications
            </div>
          </div>
        </div>
      </div>

      {/* Details Side-Drawer / Modal (Premium Overlay) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/55 animate-fade-in">
          {/* Backdrop Click Dismisses */}
          <div
            className="absolute inset-0"
            onClick={() => setSelectedApp(null)}
          ></div>

          {/* Drawer Body */}
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl will-change-transform animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-outline tracking-wider uppercase block">
                  {selectedApp.id}
                </span>
                <h3 className="text-base font-bold text-primary leading-tight mt-0.5">
                  {selectedApp.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container p-1 rounded-full cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Status Section */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/45 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Application Status
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedApp.statusBg} ${selectedApp.statusColor}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedApp.statusDot}`}
                    ></span>
                    {selectedApp.status}
                  </div>
                </div>

                {selectedApp.serialNumber && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-green-700 text-sm shrink-0">
                      verified_user
                    </span>
                    <div>
                      <p className="text-green-900 font-bold">
                        AI-Validated Serial Number
                      </p>
                      <p className="text-green-800 font-semibold">
                        {selectedApp.serialNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedApp.officeRemark && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-1.5">
                    Office Remark
                  </h4>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm leading-6 text-on-surface">
                    <FormattedOfficeRemark text={selectedApp.officeRemark} />
                  </div>
                </div>
              )}

              {/* Application Details Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-1.5">
                  Document Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      Date Filed
                    </span>
                    <span className="font-bold text-on-surface mt-0.5 block">
                      {selectedApp.date}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      Authority Agency
                    </span>
                    <span className="font-bold text-on-surface mt-0.5 block">
                      {selectedApp.meta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-1.5">
                  Audit Timeline
                </h4>
                <div className="relative border-l border-outline-variant/60 ml-3 pl-5 space-y-5 py-1">
                  {selectedApp.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 bg-white ${
                          step.done
                            ? "border-primary"
                            : "border-outline-variant"
                        }`}
                      ></span>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold ${
                              step.done
                                ? "text-primary"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {step.title}
                          </span>
                          <span className="text-[10px] text-outline font-semibold">
                            {step.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Missing Document Section */}
              {selectedApp.status === "Action Required" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-1.5">
                    Upload Required Document
                  </h4>
                  <div
                    className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <span className="material-symbols-outlined text-3xl text-outline mb-2 block">
                      cloud_upload
                    </span>
                    <p className="text-xs font-semibold text-on-surface">
                      Drag & drop your file here
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      or click to browse · PDF, JPG, PNG accepted
                    </p>
                  </div>

                  {resubmitFile && (
                    <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                          description
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">
                            {resubmitFile.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {(resubmitFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResubmitFile(null);
                        }}
                        className="material-symbols-outlined text-on-surface-variant hover:text-error text-[18px] p-1 rounded-full hover:bg-error-container/30 transition cursor-pointer shrink-0"
                      >
                        close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-3">
              {selectedApp.status === "Approved" && selectedApp.downloadUrl && (
                <a
                  href={selectedApp.downloadUrl}
                  download
                  className="flex-1 bg-green-700 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-green-800 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    download
                  </span>
                  Download PDF
                </a>
              )}
              {selectedApp.status === "Action Required" && (
                <button
                  disabled={!resubmitFile || resubmitLoading}
                  onClick={() => handleResubmit(selectedApp)}
                  className="flex-1 bg-primary text-white font-bold text-xs py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resubmitLoading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Uploading{resubmitProgress !== null ? ` ${resubmitProgress}%` : ""}...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">
                        cloud_upload
                      </span>
                      Submit Document
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setResubmitFile(null);
                }}
                className="flex-grow border border-outline text-secondary text-xs font-bold py-2.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer text-center"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 right-6 md:right-10 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold z-50 animate-fade-in">
          <span className="material-symbols-outlined text-green-400 text-sm">
            check_circle
          </span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function getResubmissionErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (code === "storage/unauthorized") {
    return "Upload was denied. Please contact the office if the problem continues.";
  }

  if (code === "storage/canceled") {
    return "Upload timed out. Check your connection and try again.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "Upload could not connect to storage. Check your connection and try again.";
  }

  return "Upload failed. Please try again.";
}

function mapFirestoreApplication(
  id: string,
  data: Record<string, unknown>,
): Application & { sortTime: number } {
  const submittedDate = toDate(data.submittedAt);
  const status = mapStatus(data.status, submittedDate);
  const submittedAt = formatFirestoreDate(data.submittedAt);
  const updatedAt = formatFirestoreDate(data.updatedAt);
  const approvedAt = formatFirestoreDate(data.approvedAt);
  const rejectedAt = formatFirestoreDate(data.rejectedAt);
  const updatedDate = toDate(data.updatedAt);
  const serialNumber = readString(data.serialNumber);
  const officeRemark = readString(
    data.officeComment || data.rejectionReason || data.staffComment,
  );
  const formSlug = readString(data.formSlug) || readString(data.type);
  const title =
    readString(data.formType) || readString(data.title) || "Office Application";
  const displayDate = status === "Draft" ? updatedAt : submittedAt;

  return {
    documentId: id,
    id:
      readString(data.referenceNumber) ||
      readString(data.applicationId) ||
      readString(data.id) ||
      id,
    type: title,
    formSlug,
    category: mapCategory(formSlug),
    title,
    date: displayDate,
    meta: readString(data.district) || "Mukim",
    status,
    ...statusStyle(status),
    link: status === "Draft" ? getApplicationHref(formSlug) : undefined,
    serialNumber: serialNumber || undefined,
    officeRemark: officeRemark || undefined,
    downloadUrl:
      status === "Approved" ? `/api/applications/${id}/pdf` : undefined,
    timeline: buildTimeline(status, displayDate, approvedAt, rejectedAt),
    sortTime:
      (status === "Draft" ? updatedDate : submittedDate)?.getTime() || 0,
  };
}

function stripSortTime({
  sortTime,
  ...application
}: Application & { sortTime: number }) {
  void sortTime;
  return application;
}

function buildTimeline(
  status: Application["status"],
  submittedAt: string,
  approvedAt: string,
  rejectedAt: string,
) {
  return [
    {
      title: "Application Submitted",
      date: submittedAt,
      desc: "Application record created in Firestore.",
      done: true,
    },
    {
      title: "Under Review",
      date: submittedAt,
      desc: "Awaiting clerk and office validation.",
      done: true,
    },
    {
      title: status === "Rejected" ? "Rejected" : "Approved & Issued",
      date:
        status === "Approved"
          ? approvedAt
          : status === "Rejected"
            ? rejectedAt
            : "In Review",
      desc:
        status === "Approved"
          ? "Digital certificate and serial number are ready."
          : status === "Rejected"
            ? "Application did not pass review."
            : "Final approval and PDF issuance pending.",
      done: status === "Approved" || status === "Rejected",
    },
  ];
}

function mapStatus(
  value: unknown,
  submittedAt: Date | null = null,
): Application["status"] {
  const status = readString(value).toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "in review") return "In Review";
  if (status === "action required") return "Action Required";
  if (status === "draft") return submittedAt ? "In Review" : "Draft";
  return "In Review";
}

function getApplicationHref(formSlug: string) {
  if (formSlug === "residential") {
    return "/residential_verification";
  }

  if (formSlug === "income") {
    return "/income_verification";
  }

  if (formSlug === "ic-appeal" || formSlug === "ic_penalty") {
    return "/ic_penalty_appeal";
  }

  return "/new-application";
}

function statusStyle(status: Application["status"]) {
  if (status === "Approved") {
    return {
      statusColor: "text-green-800",
      statusBg: "bg-green-100",
      statusDot: "bg-green-600",
    };
  }

  if (status === "Action Required") {
    return {
      statusColor: "text-yellow-800",
      statusBg: "bg-yellow-100",
      statusDot: "bg-yellow-600",
    };
  }

  if (status === "Rejected") {
    return {
      statusColor: "text-on-error-container",
      statusBg: "bg-error-container",
      statusDot: "bg-error",
    };
  }

  if (status === "Draft") {
    return {
      statusColor: "text-on-surface-variant",
      statusBg: "bg-surface-container-high",
      statusDot: "bg-outline",
    };
  }

  return {
    statusColor: "text-on-secondary-container",
    statusBg: "bg-secondary-container",
    statusDot: "bg-on-secondary-container",
  };
}

function FormattedOfficeRemark({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split("\n").map((line, index) => {
        const cleanedLine = cleanRemarkLine(line);

        if (!cleanedLine) {
          return null;
        }

        return <p key={`${index}-${cleanedLine}`}>{cleanedLine}</p>;
      })}
    </div>
  );
}

function cleanRemarkLine(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

function formatFirestoreDate(value: unknown) {
  const date = toDate(value);
  if (!date) {
    return "In Review";
  }
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}
