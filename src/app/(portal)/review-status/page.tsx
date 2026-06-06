"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";

interface Application {
  id: string;
  type: string;
  category?: string;
  title: string;
  date: string;
  meta: string;
  status: "In Review" | "Approved" | "Action Required" | "Rejected" | "Draft";
  statusColor: string;
  statusBg: string;
  statusDot: string;
  warning?: string;
  link?: string;
  downloadUrl?: string;
  serialNumber?: string;
  timeline: { title: string; date: string; desc: string; done: boolean }[];
}

const mapStatusStyles = (status: string) => {
  switch (status) {
    case "Approved":
      return {
        status: "Approved" as const,
        statusColor: "text-green-800",
        statusBg: "bg-green-100",
        statusDot: "bg-green-600",
      };
    case "Action Required":
      return {
        status: "Action Required" as const,
        statusColor: "text-on-error-container",
        statusBg: "bg-error-container",
        statusDot: "bg-error",
      };
    case "Draft":
      return {
        status: "Draft" as const,
        statusColor: "text-on-surface-variant",
        statusBg: "bg-surface-container-high",
        statusDot: "bg-outline",
      };
    default: // "Pending" or "In Review"
      return {
        status: "In Review" as const,
        statusColor: "text-on-secondary-container",
        statusBg: "bg-secondary-container",
        statusDot: "bg-on-secondary-container",
      };
  }
};

const mapCategory = (type: string) => {
  switch (type) {
    case "residential":
      return "Residential";
    case "income":
      return "Finance";
    case "ic_penalty":
      return "Appeal";
    default:
      return "General";
  }
};

export default function ReviewStatusPage() {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const querySnap = await getDocs(
            query(
              collection(db, "applications"),
              where("userId", "==", user.uid),
            ),
          );
          const appsList = querySnap.docs
            .map((documentSnapshot) =>
              mapFirestoreApplication(
                documentSnapshot.id,
                documentSnapshot.data(),
              ),
            )
            .sort((left, right) => right.sortTime - left.sortTime)
            .map(({ sortTime: _sortTime, ...application }) => application);

          setApplications(appsList);
        } catch (err) {
          console.error("Error loading application statuses: ", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
            Sila tunggu, memuatkan maklumat permohonan...
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
                      : app.status === "Action Required" ||
                          app.status === "Rejected"
                        ? "bg-error-container text-on-error-container"
                        : app.status === "In Review"
                          ? "bg-primary-container text-white"
                          : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {app.status === "Approved"
                      ? "verified"
                      : app.status === "Action Required" ||
                          app.status === "Rejected"
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
                    {app.warning && (
                      <span className="flex items-center gap-1 text-error font-semibold">
                        <span className="material-symbols-outlined text-[14px]">
                          error
                        </span>
                        {app.warning}
                      </span>
                    )}
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
                  <Link
                    href={app.link || "/new-application"}
                    className="bg-primary text-white font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
                  >
                    Resume
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_forward
                    </span>
                  </Link>
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
              Tiada permohonan ditemui.
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
          <div className="w-9 h-9 rounded-full bg-error flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              error_outline
            </span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              Pending Action
            </div>
            <div className="text-sm font-bold text-error">
              {actionRequiredCount} Applications
            </div>
          </div>
        </div>
        <div className="bg-surface-container border border-outline-variant p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-error flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              error_outline
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm animate-fade-in">
          {/* Backdrop Click Dismisses */}
          <div
            className="absolute inset-0"
            onClick={() => setSelectedApp(null)}
          ></div>

          {/* Drawer Body */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
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

                {selectedApp.warning && (
                  <div className="bg-error-container/30 border border-error/15 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-error text-sm shrink-0">
                      warning
                    </span>
                    <p className="text-on-error-container font-semibold">
                      Action Needed: {selectedApp.warning}
                    </p>
                  </div>
                )}

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
                  onClick={() => {
                    setSelectedApp(null);
                    triggerToast(
                      "Action resolved. Upload submitted successfully!",
                    );
                  }}
                  className="flex-1 bg-primary text-white font-bold text-xs py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    cloud_upload
                  </span>
                  Upload Missing Copy
                </button>
              )}
              <button
                onClick={() => setSelectedApp(null)}
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

function mapFirestoreApplication(
  id: string,
  data: Record<string, unknown>,
): Application & { sortTime: number } {
  const status = mapStatus(data.status);
  const submittedAt = formatFirestoreDate(data.submittedAt);
  const approvedAt = formatFirestoreDate(data.approvedAt);
  const rejectedAt = formatFirestoreDate(data.rejectedAt);
  const submittedDate = toDate(data.submittedAt);
  const serialNumber = readString(data.serialNumber);
  const title =
    readString(data.formType) ||
    readString(data.title) ||
    "Permohonan Penghulu";

  return {
    id:
      readString(data.referenceNumber) ||
      readString(data.applicationId) ||
      readString(data.id) ||
      id,
    type: title,
    category: readString(data.formSlug) || readString(data.type),
    title,
    date: submittedAt,
    meta: readString(data.meta) || "Pejabat Penghulu",
    status,
    ...statusStyle(status),
    serialNumber: serialNumber || undefined,
    downloadUrl:
      status === "Approved" ? `/api/applications/${id}/pdf` : undefined,
    warning:
      status === "Rejected"
        ? readString(data.rejectionReason) || "Application rejected"
        : undefined,
    timeline: buildTimeline(status, submittedAt, approvedAt, rejectedAt),
    sortTime: submittedDate?.getTime() || 0,
  };
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
      desc: "Awaiting clerk and Penghulu validation.",
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

function mapStatus(value: unknown): Application["status"] {
  const status = readString(value).toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "in review") return "In Review";
  if (status === "action required") return "Action Required";
  return "In Review";
}

function statusStyle(status: Application["status"]) {
  if (status === "Approved") {
    return {
      statusColor: "text-green-800",
      statusBg: "bg-green-100",
      statusDot: "bg-green-600",
    };
  }

  if (status === "Action Required" || status === "Rejected") {
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
