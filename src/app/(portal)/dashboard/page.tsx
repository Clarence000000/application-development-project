"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, type Timestamp } from "firebase/firestore";

interface Application {
  id: string;
  type: string;
  title: string;
  submittedAt: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch user's profile details
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.name) {
              setUserName(data.name);
            }
          }

          // 2. Fetch user's applications
          const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid)
          );
          const querySnap = await getDocs(q);
          const appsList: Application[] = [];
          querySnap.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            appsList.push({
              id: data.referenceNumber || data.applicationId || data.id || documentSnapshot.id,
              type: data.formSlug || data.type,
              title: data.formType || data.title || "Permohonan Penghulu",
              submittedAt: formatFirestoreDate(data.submittedAt),
              status: data.status || "Pending",
            });
          });
          // Sort client-side descending by submittedAt
          appsList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setApplications(appsList.slice(0, 3));
        } catch (err) {
          console.error("Error loading dashboard data: ", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-0.5">
          {isLoading ? "Sila tunggu..." : `Selamat Datang, ${userName || "Pemohon"}`}
        </h1>
        <p className="text-sm text-secondary">
          Quick access to your certificate applications and latest status.
        </p>
      </header>

      {/* Certificate Options */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-surface">Apply for a Certificate</h2>
          <Link
            className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
            href="/new-application"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Borang Pengesahan Bermastautin */}
          <div
            className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-primary-container transition-all cursor-pointer group flex flex-col"
            onClick={() => handleCardClick("/residential_verification")}
          >
            <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-white">
                home_pin
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1.5 leading-tight">
              Borang Pengesahan Bermastautin
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              Verification of permanent resident address in this sub-district.
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>Start Application</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Borang Pengesahan Pendapatan */}
          <div
            className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-primary-container transition-all cursor-pointer group flex flex-col"
            onClick={() => handleCardClick("/income_verification")}
          >
            <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-white">
                payments
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1.5 leading-tight">
              Borang Pengesahan Pendapatan
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              Income verification certificate for various official and welfare purposes.
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>Start Application</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Rayuan Bayaran Denda IC */}
          <div
            className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-primary-container transition-all cursor-pointer group flex flex-col"
            onClick={() => handleCardClick("/ic_penalty_appeal")}
          >
            <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-white">
                receipt_long
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1.5 leading-tight">
              Rayuan Bayaran Denda IC
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              Appeal for reduction of IC damage or loss fines with sub-district verification.
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>Start Application</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Application Status */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-surface">Application Status</h2>
          <Link
            className="text-primary text-sm font-semibold flex items-center hover:underline"
            href="/review-status"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-sm ml-1">open_in_new</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6 text-sm text-secondary font-medium">
                Sila tunggu, memuatkan status permohonan...
              </div>
            ) : applications.length > 0 ? (
              applications.map((app) => {
                const isApproved = app.status === "Approved";
                const isDraft = app.status === "Draft";
                const isActionRequired = app.status === "Action Required";

                // Icon and colors mapping
                let iconName = "description";
                let iconColor = "text-blue-600";
                let iconBg = "bg-blue-50";
                if (app.type === "residential") {
                  iconName = "home_pin";
                  iconColor = "text-green-600";
                  iconBg = "bg-green-50";
                } else if (app.type === "income") {
                  iconName = "payments";
                  iconColor = "text-blue-600";
                  iconBg = "bg-blue-50";
                } else if (app.type === "ic_penalty") {
                  iconName = "receipt_long";
                  iconColor = "text-yellow-600";
                  iconBg = "bg-yellow-50";
                }

                let statusText = "In Review";
                let statusClass = "bg-secondary-container text-on-secondary-container";
                if (isApproved) {
                  statusText = "Approved";
                  statusClass = "bg-green-100 text-green-800";
                } else if (isDraft) {
                  statusText = "Draft";
                  statusClass = "bg-surface-container-highest text-on-surface-variant";
                } else if (isActionRequired) {
                  statusText = "Action Required";
                  statusClass = "bg-error-container text-on-error-container";
                }

                const formattedDate = app.submittedAt;

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-outline-variant rounded-lg p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleCardClick("/review-status")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${iconColor} text-xl`}>{iconName}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{app.title}</p>
                        <p className="text-[11px] text-on-surface-variant">Dihantar pada {formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full ${statusClass} text-[10px] font-bold uppercase tracking-wider`}>
                        {statusText}
                      </span>
                      <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-outline-variant border-dashed rounded-lg p-6 text-center text-xs text-on-surface-variant">
                Tiada permohonan aktif ditemui. Sila klik "Apply for a Certificate" untuk membuat permohonan baru.
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="p-8 rounded-lg border border-outline-variant flex flex-col items-center justify-center text-center bg-surface-container-lowest">
            <div className="mb-2 text-primary">
              <span className="material-symbols-outlined text-3xl">history_edu</span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-[200px]">
              Sejarah permohonan anda dipaparkan mengikut kemas kini terbaru secara langsung dari sistem.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatFirestoreDate(value: unknown) {
  const date = toDate(value);
  if (!date) {
    return "Pending";
  }
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
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
