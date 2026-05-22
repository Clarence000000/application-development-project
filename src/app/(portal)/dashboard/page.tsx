"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-0.5">Welcome, Ahmad</h1>
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
            onClick={() => handleCardClick("/new-application")}
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
            onClick={() => handleCardClick("/new-application")}
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
            onClick={() => handleCardClick("/new-application")}
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
            {/* Status Row 1 */}
            <div
              className="bg-white border border-outline-variant rounded-lg p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleCardClick("/review-status")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-xl">payments</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Pengesahan Pendapatan</p>
                  <p className="text-[11px] text-on-surface-variant">Submitted on 28 Oct 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                  In Review
                </span>
                <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
              </div>
            </div>

            {/* Status Row 2 */}
            <div
              className="bg-white border border-outline-variant rounded-lg p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleCardClick("/review-status")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-xl">home_pin</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Pengesahan Bermastautin</p>
                  <p className="text-[11px] text-on-surface-variant">Completed on 12 Oct 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider">
                  Approved
                </span>
                <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
              </div>
            </div>

            {/* Status Row 3 */}
            <div
              className="bg-white border border-outline-variant rounded-lg p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleCardClick("/review-status")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-yellow-600 text-xl">
                    receipt_long
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Rayuan Denda IC</p>
                  <p className="text-[11px] text-on-surface-variant">Draft saved on 30 Oct 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                  Draft
                </span>
                <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
              </div>
            </div>
          </div>

          {/* Empty State Placeholder */}
          <div className="p-8 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center bg-surface-container-lowest">
            <div className="mb-2 text-outline">
              <span className="material-symbols-outlined text-3xl">history_edu</span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-[180px]">
              History of older applications will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
