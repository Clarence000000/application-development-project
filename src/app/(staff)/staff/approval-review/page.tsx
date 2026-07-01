"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SUPERADMIN_EMAIL, type UserRole } from "@/lib/user_auth";
import {
  createInAppNotification,
  triggerEmailNotification,
} from "@/lib/notifications";

type ApprovalStatus =
  | "Pending Review"
  | "Staff Vetted"
  | "Action Required"
  | "Approved"
  | "Rejected";

type ApplicationRecord = {
  documentId: string;
  id: string;
  uid: string;
  applicantName: string;
  idNumber: string;
  formName: string;
  submittedDate: string;
  district: string;
  status: ApprovalStatus;
  purpose: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  supportingNotes: string;
  sortTime: number;
  timeline: { title: string; date: string; done: boolean }[];
  isUrgent: boolean; // For reprioritization
  resubmittedDocumentUrl?: string;
};

const currentStaff = {
  name: "Staff Mukim Ayer Hitam",
  assignedDistrict: "Mukim Ayer Hitam",
};

const statusStyles: Record<ApprovalStatus, { badge: string; dot: string; icon: string }> = {
  "Pending Review": {
    badge: "bg-secondary-container text-on-secondary-container",
    dot: "bg-on-secondary-container",
    icon: "pending_actions",
  },
  "Staff Vetted": {
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-600",
    icon: "fact_check",
  },
  "Action Required": {
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-600",
    icon: "upload_file",
  },
  Approved: {
    badge: "bg-green-100 text-green-800",
    dot: "bg-green-600",
    icon: "verified",
  },
  Rejected: {
    badge: "bg-error-container text-on-error-container",
    dot: "bg-error",
    icon: "cancel",
  },
};

export default function ApprovalReviewPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | ApprovalStatus>("All");
  const [search, setSearch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [staffDistrict, setStaffDistrict] = useState(currentStaff.assignedDistrict);
  const [staffName, setStaffName] = useState(currentStaff.name);
  const [staffRole, setStaffRole] = useState<UserRole>("Admin");

  const isSuperAdmin = staffRole === "SuperAdmin";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const staffSnapshot = await getDoc(doc(db, "users", user.uid));
        if (!staffSnapshot.exists()) return;

        const staffData = staffSnapshot.data();
        const district = readString(staffData.district);
        const name = readString(staffData.name);
        const role =
          readString(staffData.email, user.email).toLowerCase() === SUPERADMIN_EMAIL
            ? "SuperAdmin"
            : readUserRole(staffData.role);

        setStaffRole(role);

        if (district) {
          setStaffDistrict(district);
        }

        if (name) {
          setStaffName(name);
        }
      } catch (error) {
        console.error("Failed to load staff district", error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    const applicationQueueQuery = isSuperAdmin
      ? query(collection(db, "applications"))
      : query(
          collection(db, "applications"),
          where("district", "==", staffDistrict),
        );

    const unsubscribe = onSnapshot(
      applicationQueueQuery,
      async (snapshot) => {
        try {
          const mappedApplications = await Promise.all(
            snapshot.docs
            .filter((applicationSnapshot) => {
              return readString(applicationSnapshot.data().status).toLowerCase() !== "draft";
            })
            .map(async (applicationSnapshot) => {
              const application = applicationSnapshot.data();
              const uid = readString(application.uid, application.userId);
              const userSnapshot = uid
                ? await getDoc(doc(db, "users", uid))
                : null;
              const user = userSnapshot?.exists() ? userSnapshot.data() : {};

              return mapApplicationRecord(
                applicationSnapshot.id,
                application,
                user,
              );
            }),
          );

          if (isActive) {
            setApplications(
              mappedApplications.sort((left, right) => {
                // 1. If one is urgent and the other isn't, float urgent to top
                if (left.isUrgent && !right.isUrgent) return -1;
                if (!left.isUrgent && right.isUrgent) return 1;

                // 2. If both are urgent, sort oldest first to address critical items first
                if (left.isUrgent && right.isUrgent) {
                  return left.sortTime - right.sortTime;
                }

                // 3. For all standard non-urgent items, sort newest first
                return right.sortTime - left.sortTime;
              }),
            );
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Failed to load application queue", error);
          if (isActive) {
            setIsLoading(false);
          }
        }
      },
      (error) => {
        console.error("Application queue listener failed", error);
        if (isActive) {
          setIsLoading(false);
        }
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isSuperAdmin, staffDistrict]);

  const selectedApplication = applications.find(
    (application) => application.documentId === selectedId,
  );

  const assignedApplications = useMemo(() => applications, [applications]);

  const filteredApplications = useMemo(() => {
    return assignedApplications.filter((application) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        application.id.toLowerCase().includes(query) ||
        application.applicantName.toLowerCase().includes(query) ||
        application.formName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignedApplications, search, statusFilter]);

  const counts = useMemo(
    () => ({
      pending: assignedApplications.filter((application) => application.status === "Pending Review").length,
      vetted: assignedApplications.filter((application) => application.status === "Staff Vetted").length,
      actionRequired: assignedApplications.filter((application) => application.status === "Action Required").length,
      approved: assignedApplications.filter((application) => application.status === "Approved").length,
      rejected: assignedApplications.filter((application) => application.status === "Rejected").length,
    }),
    [assignedApplications],
  );

  const updateStatus = async (nextStatus: ApprovalStatus) => {
    if (!selectedApplication) return;

    const note = remarks.trim();

    try {
      setIsUpdating(true);
      await updateDoc(
        doc(db, "applications", selectedApplication.documentId),
        buildApplicationStatusUpdate(nextStatus, note, staffName),
      );
      const notificationCopy = buildDecisionNotificationCopy(
        selectedApplication,
        nextStatus,
        note,
      );
      const notificationId = notificationCopy
        ? await createInAppNotification({
            uid: selectedApplication.uid,
            title: notificationCopy.title,
            message: notificationCopy.message,
            applicationId: selectedApplication.documentId,
            referenceNumber: selectedApplication.id,
            applicationTitle: selectedApplication.formName,
            eventType: "status_updated",
          })
        : null;
      const notificationResults = await Promise.allSettled([
        triggerDecisionEmail(selectedApplication, nextStatus, note, notificationId),
        triggerDecisionSms(selectedApplication, nextStatus, notificationId),
      ]);
      const failedNotifications = notificationResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedNotifications.length === 0) {
        showToast(`${selectedApplication.id} updated to ${nextStatus}.`);
      } else {
        console.error("Some decision notifications failed", failedNotifications);
        showToast(`${selectedApplication.id} updated, but notification failed.`);
      }
      setRemarks("");
    } catch (error) {
      console.error("Failed to update application status", error);
      showToast("Application status could not be updated.");
    } finally {
      setIsUpdating(false);
    }
  };

  const requestMissingDocument = async () => {
    if (!selectedApplication) return;

    const note =
      remarks.trim() ||
      `Additional documents are required for your ${selectedApplication.formName} application (${selectedApplication.id}). Please review the request and upload the required document.`;

    try {
      setIsUpdating(true);
      await updateDoc(doc(db, "applications", selectedApplication.documentId), {
        status: "Action Required",
        staffVetted: true,
        staffVettedAt: serverTimestamp(),
        officeComment: note,
        actionRequiredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const notificationId = await createInAppNotification({
        uid: selectedApplication.uid,
        title: "Action Required",
        message: note,
        applicationId: selectedApplication.documentId,
        referenceNumber: selectedApplication.id,
        applicationTitle: selectedApplication.formName,
        eventType: "document_requested",
      });
      try {
        await triggerEmailNotification({
          uid: selectedApplication.uid,
          recipientEmail: selectedApplication.emailAddress,
          recipientName: selectedApplication.applicantName,
          notificationId,
          applicationId: selectedApplication.documentId,
          referenceNumber: selectedApplication.id,
          applicationTitle: selectedApplication.formName,
          eventType: "document_requested",
          status: "Action Required",
          message: note,
          actionUrl: `/review-status?focus=${encodeURIComponent(selectedApplication.id)}`,
        });
        showToast(`${selectedApplication.id} missing document request recorded.`);
      } catch (emailError) {
        console.error("Failed to send missing document notification", emailError);
        showToast(`${selectedApplication.id} updated, but email failed.`);
      }
      setRemarks("");
    } catch (error) {
      console.error("Failed to request missing document", error);
      showToast("Missing document request could not be sent.");
    } finally {
      setIsUpdating(false);
    }
  };

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2800);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Staff Workspace
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-primary">
            Approval Review
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-secondary">
            {isSuperAdmin
              ? "Review submissions across all seven mukims."
              : "Review applications assigned to your administrative area only."}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            {isSuperAdmin ? "Scope: All mukims" : `Assigned area: ${staffDistrict}`}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5 xl:w-auto">
          <StatusSummary label="Pending" value={counts.pending} tone="bg-secondary-container text-on-secondary-container" />
          <StatusSummary label="Vetted" value={counts.vetted} tone="bg-blue-100 text-blue-800" />
          <StatusSummary label="Action" value={counts.actionRequired} tone="bg-yellow-100 text-yellow-800" />
          <StatusSummary label="Approved" value={counts.approved} tone="bg-green-100 text-green-800" />
          <StatusSummary label="Rejected" value={counts.rejected} tone="bg-error-container text-on-error-container" />
        </div>
      </header>

      <section className="rounded-lg border border-outline-variant bg-white p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-primary">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                search
              </span>
              <input
                className="w-full rounded-lg border border-outline bg-surface-container-low py-2 pl-10 pr-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
                placeholder="Search by application ID, applicant, or form name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-primary">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-outline bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | ApprovalStatus)}
            >
              <option>All</option>
              <option>Pending Review</option>
              <option>Staff Vetted</option>
              <option>Action Required</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 md:col-span-2"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
            }}
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-outline-variant bg-white">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-primary">Application Queue</h2>
            <p className="text-[11px] font-medium text-on-surface-variant">
              {isLoading
                ? "Loading application records..."
                : `${filteredApplications.length} ${
                    isSuperAdmin ? "total" : "assigned"
                  } record(s) shown`}
            </p>
          </div>
          <span className="material-symbols-outlined text-outline">view_list</span>
        </div>

        <div className="hidden xl:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">district</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => {
                const style = statusStyles[application.status];

                return (
                  <tr
                    key={application.documentId}
                    className={`border-t border-outline-variant transition ${
                      application.isUrgent 
                        ? "bg-amber-100/70 hover:bg-amber-200/80" 
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                          <span className="material-symbols-outlined text-[19px]">{style.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-primary">{application.id}</span>
                          {/* URGENT INDICATOR TAG */}
                          {application.isUrgent && (
                            <span className="inline-flex w-fit items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 animate-pulse">
                              <span className="material-symbols-outlined text-[11px]">warning</span>
                              &gt;3 Days Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-on-surface">
                      {application.applicantName}
                      <p className="mt-0.5 text-[11px] font-medium text-on-surface-variant">
                        {application.idNumber}
                      </p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-xs font-medium text-on-surface-variant">
                      {application.formName}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-on-surface">
                      {application.district}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                      {application.submittedDate}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                        onClick={() => setSelectedId(application.documentId)}
                      >
                        View
                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-outline-variant xl:hidden">
          {filteredApplications.map((application) => {
            const style = statusStyles[application.status];

            return (
              <button
                key={application.documentId}
                className="w-full px-4 py-3 text-left transition hover:bg-surface-container-low"
                onClick={() => setSelectedId(application.documentId)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                    <span className="material-symbols-outlined text-[19px]">{style.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-outline">
                        {application.id}
                      </span>
                      <StatusBadge status={application.status} />
                    </div>
                    <h2 className="mt-1 truncate text-sm font-bold text-on-surface">
                      {application.applicantName}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-on-surface-variant">
                      {application.formName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {application.submittedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {application.district}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!isLoading && filteredApplications.length === 0 && (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
            <p className="mt-2 text-sm font-bold text-on-surface">No matching applications</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Adjust the search keyword or status filter.
            </p>
          </div>
        )}
      </section>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm">
          <button
            className="absolute inset-0 cursor-default"
            aria-label="Close application detail"
            onClick={() => {
              setSelectedId(null);
              setRemarks("");
            }}
          />
          <section className="relative flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-outline">
                  {selectedApplication.id}
                </span>
                <h2 className="mt-1 text-lg font-bold leading-tight text-primary">
                  {selectedApplication.formName}
                </h2>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {selectedApplication.applicantName}
                </p>
              </div>
              <button
                className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container"
                onClick={() => {
                  setSelectedId(null);
                  setRemarks("");
                }}
              >
                close
              </button>
            </div>

            <div className="border-b border-outline-variant px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Application Detail
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Review supporting information and record the latest decision.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedApplication.status} />
                  <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-bold text-on-surface-variant">
                    {selectedApplication.district}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5">
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                    Applicant Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem label="IC Number" value={selectedApplication.idNumber} />
                    <DetailItem label="Phone Number" value={selectedApplication.phoneNumber} />
                    <DetailItem label="Email" value={selectedApplication.emailAddress} />
                    <DetailItem label="District" value={selectedApplication.district} />
                    <DetailItem label="Submitted Date" value={selectedApplication.submittedDate} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DetailItem label="Address" value={selectedApplication.address} />
                    <DetailItem label="Purpose" value={selectedApplication.purpose} />
                  </div>
                </section>

                {selectedApplication.resubmittedDocumentUrl && (
                  <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                      Resubmitted Document
                    </h3>
                    <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-700 text-[18px]">attach_file</span>
                        <a
                          href={selectedApplication.resubmittedDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-green-800 hover:underline"
                        >
                          View Resubmitted Document
                        </a>
                      </div>
                      <span className="rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white">
                        NEW
                      </span>
                    </div>
                  </section>
                )}

                <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                      Review Notes
                    </h3>
                    <div className="min-h-24 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface">
                      {selectedApplication.supportingNotes}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                      New Remark
                    </h3>
                    <textarea
                      className="min-h-32 w-full rounded-lg border border-outline bg-white p-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
                      placeholder="Record staff remarks before updating the decision"
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                    />
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                    Approval Record
                  </h3>
                  <div className="space-y-2">
                    {selectedApplication.timeline.map((step) => (
                      <div
                        key={step.title}
                        className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[17px] ${
                              step.done ? "text-primary" : "text-outline"
                            }`}
                          >
                            {step.done ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          <p
                            className={`truncate text-xs font-bold ${
                              step.done ? "text-primary" : "text-on-surface-variant"
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>
                        <p className="shrink-0 text-[11px] font-medium text-on-surface-variant">
                          {step.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                    Decision Actions
                  </h3>
                  <div className="mt-3 space-y-2">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-bold text-primary transition hover:bg-surface-container"
                      disabled={isUpdating}
                      onClick={() => updateStatus("Staff Vetted")}
                    >
                      <span className="material-symbols-outlined text-[16px]">fact_check</span>
                      Mark as Staff Vetted
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-800 transition hover:bg-yellow-100"
                      disabled={isUpdating}
                      onClick={requestMissingDocument}
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      Request Missing Document
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                      disabled={isUpdating}
                      onClick={() => updateStatus("Approved")}
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Approve
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-error px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                      disabled={isUpdating}
                      onClick={() => updateStatus("Rejected")}
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Reject
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-3 text-xs font-semibold text-inverse-on-surface shadow-lg">
          <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

async function triggerDecisionEmail(
  application: ApplicationRecord,
  nextStatus: ApprovalStatus,
  remarks: string,
  notificationId: string | null,
) {
  if (
    nextStatus === "Staff Vetted" ||
    nextStatus === "Pending Review" ||
    nextStatus === "Action Required"
  ) {
    return;
  }

  await triggerEmailNotification({
    uid: application.uid,
    recipientEmail: application.emailAddress,
    recipientName: application.applicantName,
    notificationId: notificationId || undefined,
    applicationId: application.documentId,
    referenceNumber: application.id,
    applicationTitle: application.formName,
    eventType: "status_updated",
    status: nextStatus,
    message: remarks || buildDecisionMessage(application, nextStatus),
    actionUrl: `/review-status?focus=${encodeURIComponent(application.id)}`,
  });
}

async function triggerDecisionSms(
  application: ApplicationRecord,
  nextStatus: ApprovalStatus,
  notificationId: string | null,
) {
  if (nextStatus !== "Approved" && nextStatus !== "Rejected") {
    return;
  }

  const phoneNumber = application.phoneNumber.trim();
  if (!phoneNumber || phoneNumber === "-") {
    return;
  }

  const response = await fetch("/api/twilio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: application.id,
      applicantName: application.applicantName,
      formName: application.formName,
      phoneNumber,
      status: nextStatus,
      uid: application.uid,
      notificationId,
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "SMS notification failed.");
  }
}

function buildDecisionNotificationCopy(
  application: ApplicationRecord,
  nextStatus: ApprovalStatus,
  remarks: string,
) {
  if (
    nextStatus === "Staff Vetted" ||
    nextStatus === "Pending Review" ||
    nextStatus === "Action Required"
  ) {
    return null;
  }

  return {
    title: `Application ${nextStatus}`,
    message: remarks || buildDecisionMessage(application, nextStatus),
  };
}

function buildDecisionMessage(
  application: ApplicationRecord,
  nextStatus: ApprovalStatus,
) {
  if (nextStatus === "Approved") {
    return `Your ${application.formName} application (${application.id}) has been approved. You may view the latest status and download the approved document when it is available.`;
  }

  if (nextStatus === "Rejected") {
    return `Your ${application.formName} application (${application.id}) has been rejected. Please review the reason provided by the office.`;
  }

  return `Your ${application.formName} application (${application.id}) has a new update.`;
}

function buildApplicationStatusUpdate(
  nextStatus: ApprovalStatus,
  remarks: string,
  staffName: string,
) {
  const staffUser = auth.currentUser;
  const baseUpdate = {
    updatedAt: serverTimestamp(),
    officeComment: remarks || null,
  };

  if (nextStatus === "Staff Vetted") {
    return {
      ...baseUpdate,
      staffVetted: true,
      staffVettedAt: serverTimestamp(),
    staffVettedBy: staffUser?.email || staffName,
      staffVettedByUid: staffUser?.uid || null,
    };
  }

  if (nextStatus === "Approved") {
    return {
      ...baseUpdate,
      status: "Approved",
      staffVetted: true,
      approvedAt: serverTimestamp(),
      approvedBy: staffUser?.email || staffName,
      approvedByUid: staffUser?.uid || null,
      rejectedAt: null,
      rejectionReason: null,
    };
  }

  if (nextStatus === "Rejected") {
    return {
      ...baseUpdate,
      status: "Rejected",
      staffVetted: true,
      rejectedAt: serverTimestamp(),
      rejectionReason: remarks || "Application rejected by the office.",
      approvedAt: null,
      approvedBy: null,
      approvedByUid: null,
    };
  }

  return baseUpdate;
}

function mapApplicationRecord(
  documentId: string,
  application: Record<string, unknown>,
  user: Record<string, unknown>,
): ApplicationRecord {
  const values = readRecord(application.values, application.formData);
  const status = mapApprovalStatus(application);
  const submittedDate = formatFirestoreDate(application.submittedAt);
  const submittedAt = toDate(application.submittedAt);
  let isUrgent = false;
  if (submittedAt && status !== "Approved" && status !== "Rejected") {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    isUrgent = submittedAt < threeDaysAgo;
  }
  const staffVettedAt = formatFirestoreDate(application.staffVettedAt);
  const approvedAt = formatFirestoreDate(application.approvedAt);
  const rejectedAt = formatFirestoreDate(application.rejectedAt);
  const actionRequiredAt = formatFirestoreDate(application.actionRequiredAt);

  return {
    documentId,
    id:
      readString(application.referenceNumber, application.applicationId) ||
      documentId,
    uid: readString(application.uid, application.userId),
    applicantName: readString(values.name, user.name) || "Unknown Applicant",
    idNumber: readString(values.idNumber, user.icNumber) || "-",
    formName:
      readString(application.formType, application.title) ||
      "Office Application",
    submittedDate,
    district:
      readString(application.district, application.district, application.meta) ||
      currentStaff.assignedDistrict,
    status,
    purpose: readString(values.purpose, values.appealReason) || "-",
    address:
      readString(
        values.residentialAddress,
        values.icAddress,
        user.addressCurrent,
        user.addressIC,
      ) || "-",
    phoneNumber: readString(values.phoneNumber, user.phoneNumber) || "-",
    emailAddress: readString(user.email, application.email, values.email),
    supportingNotes:
      readString(
        application.officeComment,
        application.rejectionReason,
        application.staffComment,
      ) || "No staff remarks recorded yet.",
    sortTime: submittedAt?.getTime() || 0,
    isUrgent,
    resubmittedDocumentUrl: readString(values.resubmittedDocumentUrl) || undefined,
    timeline: [
      {
        title: "Application Submitted",
        date: submittedDate,
        done: true,
      },
      {
        title: "Staff Vetting",
        date:
          status === "Staff Vetted" ||
          status === "Approved" ||
          status === "Rejected" ||
          status === "Action Required"
            ? staffVettedAt
            : "Pending",
        done:
          status === "Staff Vetted" ||
          status === "Approved" ||
          status === "Rejected" ||
          status === "Action Required",
      },
      {
        title:
          status === "Action Required"
            ? "Action Required"
            : "Office Decision",
        date:
          status === "Approved"
            ? approvedAt
            : status === "Rejected"
              ? rejectedAt
              : status === "Action Required"
                ? actionRequiredAt
                : "Pending",
        done:
          status === "Approved" ||
          status === "Rejected" ||
          status === "Action Required",
      },
    ],
  };
}

function mapApprovalStatus(application: Record<string, unknown>): ApprovalStatus {
  const status = readString(application.status).toLowerCase();

  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "action required") return "Action Required";
  if (application.staffVetted === true) return "Staff Vetted";

  return "Pending Review";
}

function formatFirestoreDate(value: unknown) {
  const date = toDate(value);

  if (!date) {
    return "Pending";
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

function readRecord(...values: unknown[]) {
  const found = values.find((value) => value && typeof value === "object");
  return found ? (found as Record<string, unknown>) : {};
}

function readString(...values: unknown[]) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof found === "string" ? found.trim() : "";
}

function readUserRole(value: unknown): UserRole {
  if (value === "Applicant" || value === "Admin" || value === "SuperAdmin") {
    return value;
  }

  return "Admin";
}

function StatusSummary({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`min-w-24 rounded-lg px-3 py-2 text-center ${tone}`}>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const style = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-outline-variant bg-surface-container-low p-3 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}
