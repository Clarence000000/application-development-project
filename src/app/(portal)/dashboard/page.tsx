"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getApplicationTitleKey } from "@/lib/applicationTitles";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";

interface Application {
  id: string;
  type: string;
  title: string;
  submittedAt: string;
  status: string;
}

type RawApplication = { id: string } & Record<string, unknown>;

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const applicationT = useTranslations("Applications");
  const navigation = useTranslations("Navigation");
  const locale = useLocale();
  const [userName, setUserName] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeApplications: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribeApplications?.();
      unsubscribeApplications = null;

      if (user) {
        try {
          setIsLoading(true);
          // 1. Fetch user's profile details
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && userSnap.data()?.name != "Not Scanned") {
            // User scanned IC and has a name
            setUserName(userSnap.data().name);
          } else {
            // User didn't scan IC or has no name, use email without domain
            const emailName = user.email
              ? user.email.split("@")[0]
              : t("defaultApplicant");
            setUserName(emailName);
          }

          // 2. Fetch user's applications
          const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
          );

          unsubscribeApplications = onSnapshot(
            q,
            (querySnap) => {
              const rawAppsList: RawApplication[] = querySnap.docs.map(
                (documentSnapshot) => ({
                  id: documentSnapshot.id,
                  ...(documentSnapshot.data() as Record<string, unknown>),
                }),
              );

              // 1. Sort by the raw Firestore timestamp FIRST (descending)
              rawAppsList.sort((a, b) => {
                const timeA = toDate(a.submittedAt)?.getTime() || 0;
                const timeB = toDate(b.submittedAt)?.getTime() || 0;
                return timeB - timeA;
              });

              // 2. Format and map to the specific properties need for the UI
              const appsList: Application[] = rawAppsList.map((data) => {
                const formSlug = readString(data.formSlug, data.type);
                const titleKey = getApplicationTitleKey(formSlug);

                return {
                  id: readString(
                    data.referenceNumber,
                    data.applicationId,
                    data.id,
                  ),
                  type: formSlug,
                  title: titleKey
                    ? applicationT(titleKey)
                    : readString(data.formType, data.title) ||
                      t("defaultFormTitle"),
                  submittedAt: formatFirestoreDate(data.submittedAt, locale),
                  status: readString(data.status) || "In Review",
                };
              });

              setApplications(appsList.slice(0, 3));
              setIsLoading(false);
            },
            (err) => {
              console.error("Error listening to dashboard applications: ", err);
              setIsLoading(false);
            },
          );
        } catch (err) {
          console.error("Error loading dashboard data: ", err);
          setIsLoading(false);
        }
      } else {
        setApplications([]);
        setUserName("");
        setIsLoading(false);
        router.push("/login");
      }
    });

    return () => {
      unsubscribeApplications?.();
      unsubscribe();
    };
  }, [router, locale, applicationT, t]);

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-0.5">
          {isLoading
            ? t("pleaseWait")
            : t("welcomeBack", { name: userName || t("defaultApplicant") })}
        </h1>
      </header>

      {/* Certificate Options */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-surface">
            {t("applyForCertificate")}
          </h2>
          <Link
            className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
            href="/new-application"
          >
            <span>{navigation("viewAll")}</span>
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
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
              {t("residentialTitle")}
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              {t("residentialDescription")}
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>{t("startApplication")}</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
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
              {t("incomeTitle")}
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              {t("incomeDescription")}
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>{t("startApplication")}</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
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
              {t("fineAppealTitle")}
            </h3>
            <p className="text-xs text-secondary mb-5 flex-grow">
              {t("fineAppealDescription")}
            </p>
            <button className="bg-primary-container text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer">
              <span>{t("startApplication")}</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Application Status */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-surface">
            {t("applicationStatus")}
          </h2>
          <Link
            className="text-primary text-sm font-semibold flex items-center hover:underline"
            href="/review-status"
          >
            <span>{navigation("viewAll")}</span>
            <span className="material-symbols-outlined text-sm ml-1">
              open_in_new
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6 text-sm text-secondary font-medium">
                {t("loadingStatus")}
              </div>
            ) : applications.length > 0 ? (
              applications.map((app) => {
                const isApproved = app.status === "Approved";
                const isDraft = app.status === "Draft";
                const isActionRequired = app.status === "Action Required";
                const isRejected = app.status === "Rejected";

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

                let statusText = t("inReview");
                let statusClass =
                  "bg-secondary-container text-on-secondary-container";
                if (isApproved) {
                  statusText = t("approved");
                  statusClass = "bg-green-100 text-green-800";
                } else if (isDraft) {
                  statusText = t("draft");
                  statusClass =
                    "bg-surface-container-highest text-on-surface-variant";
                } else if (isActionRequired) {
                  statusText = t("actionRequired");
                  statusClass = "bg-yellow-100 text-yellow-800";
                } else if (isRejected) {
                  statusText = t("rejected");
                  statusClass = "bg-red-100 text-red-800";
                }

                const formattedDate = app.submittedAt;

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-outline-variant rounded-lg p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer hover:border-primary"
                    onClick={() =>
                      router.push(
                        `/review-status?focus=${encodeURIComponent(app.id)}`,
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center`}
                      >
                        <span
                          className={`material-symbols-outlined ${iconColor} text-xl`}
                        >
                          {iconName}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {app.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {t("submittedOn", { date: formattedDate })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full ${statusClass} text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}
                      >
                        {statusText}
                      </span>
                      <span className="material-symbols-outlined text-outline text-lg">
                        chevron_right
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-outline-variant border-dashed rounded-lg p-6 text-center text-xs text-on-surface-variant">
                {t("noApplications")}
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="p-8 rounded-lg border border-outline-variant flex flex-col items-center justify-center text-center bg-surface-container-lowest">
            <div className="mb-2 text-primary">
              <span className="material-symbols-outlined text-3xl">
                history_edu
              </span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-[200px]">
              {t("historyDescription")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatFirestoreDate(value: unknown, locale = "en") {
  const date = toDate(value);
  if (!date) {
    return locale === "ms" ? "Menunggu" : "Pending";
  }
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readString(...values: unknown[]) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof found === "string" ? found.trim() : "";
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
