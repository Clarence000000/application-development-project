"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function NewApplicationPage() {
  const router = useRouter();

  const handleStartApplication = (route: string) => {
    router.push(route);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1 tracking-tight">New Application</h1>
        <p className="text-on-surface-variant text-sm max-w-3xl">
          Select the certificate or verification form you wish to apply for. Ensure you have all
          digital copies of the required documents ready before starting.
        </p>
      </div>

      {/* Bento Grid Layout for Application Types */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Application Card 1: Residential Verification Form */}
        <div className="lg:col-span-8 group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-primary transition-all flex flex-col md:flex-row">
          <div className="md:w-2/5 h-40 md:h-auto relative overflow-hidden">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="A clean, professional photograph of a modern residential neighborhood"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7lUXKTwDKrDMrOlZGhhRSfwFj4L-hpzfyoYoaxvIG4OFgosN1Cg8Xsd9ATQFAdsp-nkawKIjTqnus1O95OL3PdVM5ibvi7JwwoTpbQw6XBsya6kqo0pT0zW0PAywfpxEsY2SMsjkZO-gGidT0_7FLC8oKtc_SJq-Y2Jgi06bv9WBG0uvl5fiGHGcBwBjonnAeh4CxuzSRsXv-ncFInnvw9FAzJFoFYqrzwJqRPhIceHEXBJQ09pa7wfNesdzvsEYkD0tmxZDi60"
            />
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          <div className="p-5 md:w-3/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5 inline-block">
                    Residential
                  </span>
                  <h2 className="text-lg font-bold text-primary">Residential Verification Form</h2>
                </div>
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  home_pin
                </span>
              </div>
              <p className="text-on-surface-variant text-[13px] mb-4">
                Official verification of your current residential status in this district for
                administrative, school registration, or utility application purposes.
              </p>
              <div className="bg-surface-container-low p-3 rounded-lg mb-4">
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                  Required Documents
                </h3>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex items-center gap-2 text-[11px] text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      check_circle
                    </span>
                    IC Copy (Front &amp; Back)
                  </li>
                  <li className="flex items-center gap-2 text-[11px] text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      check_circle
                    </span>
                    Utility Bill (Water/Electric)
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => handleStartApplication("/residential_verification")}
              className="w-full bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Start Application</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Application Card 2: Income Verification Form */}
        <div className="lg:col-span-4 group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-primary transition-all flex flex-col">
          <div className="h-32 relative overflow-hidden">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="A focused close-up of professional financial documents"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2t5q-IA3VggjH18A-p7Ws6z-CQ_elKFmeqw7VqvAOiQSLETmQyco9Lwpjky4XL4DL627-2GVf-eZoyNt_E6IzKELWd3PbWplIys2-3GZqV8ya1QTkRvXbFs4X9B9d05d_4KekrcsKOMTsFjHkNLJrBNGFnhN0jCHoVZo5m495Jp2Fbn-nHD5sxTdZnS_ibcJTF0tbR0MI-J_2XfL91uBHv9rTZ7YJwGwCsBMDINY0HU1M35I1b2mNorvCUGqBMtYgLe2fTZE1p1c"
            />
          </div>
          <div className="p-5 flex flex-col flex-grow justify-between">
            <div>
              <div className="mb-2">
                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5 inline-block">
                  Finance
                </span>
                <h2 className="text-lg font-bold text-primary">Income Verification Form</h2>
              </div>
              <p className="text-on-surface-variant text-[13px] mb-4">
                Verification of household income specifically for self-employed individuals.
              </p>
              <div className="bg-surface-container-low p-3 rounded-lg mb-4">
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                  Required Documents
                </h3>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[11px] text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      check_circle
                    </span>
                    Income Declaration Form
                  </li>
                  <li className="flex items-center gap-2 text-[11px] text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      check_circle
                    </span>
                    Supporting Evidence
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => handleStartApplication("/income_verification")}
              className="w-full bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Start Application</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Application Card 3: Identity Card Fine Appeal */}
        <div className="lg:col-span-12 group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-primary transition-all flex flex-col lg:flex-row">
          <div className="p-6 lg:w-3/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Appeal
                </span>
                <h2 className="text-xl font-bold text-primary">Identity Card Fine Appeal</h2>
              </div>
              <p className="text-on-surface-variant text-[14px] mb-6 max-w-xl">
                Formal appeal for the reduction or waiver of fines related to IC loss or damage due
                to theft, natural disasters, or extreme financial hardship.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                    Eligibility
                  </h3>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Available to B40 category citizens or those affected by documented emergency
                    circumstances.
                  </p>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                    Required Documents
                  </h3>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-[12px] text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        description
                      </span>
                      Police Report (For theft/loss)
                    </li>
                    <li className="flex items-center gap-2 text-[12px] text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        description
                      </span>
                      B40 Verification (If applicable)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleStartApplication("/ic_penalty_appeal")}
                className="sm:w-56 bg-primary text-on-primary font-bold py-3 px-6 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Start Application</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button className="sm:w-56 border border-outline text-primary font-bold py-3 px-6 rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-sm cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Read Guidelines</span>
              </button>
            </div>
          </div>

          <div className="lg:w-2/5 h-48 lg:h-auto relative overflow-hidden"> {/* Fixed overflow image when hover */}
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              alt="A professional view of a legal appeal document"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAsKcbTnSwDPMm9tCLRnPs0cWQClVKWF66iz00lln45N8pfL4Lwt5i3bd8ktUwDhAzF8yHnrUWR7zPn6-yxmT6umsgrHMcog1BO_mDFKGjbd93brqXVQabjEB8h_lcMTfT_dQDmyEWXmEUBkXusvdbTFl0NG_Bhh2WwlpOVvVhsED2USUK35kuGwcWU6OvDrxJdpwwV0HzH7ltMcYpcfGUrae8Oy7MCCjvBiDXpcbkoVsNpk2DYq3Ao89d3iuOy24SQPmlQdSo3ec"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-transparent to-transparent hidden lg:block"></div>
          </div>
        </div>
      </div>

      {/* FAQ / Help Section */}
      <section className="mt-8 bg-primary-container text-on-primary-container p-6 rounded-xl flex flex-col md:flex-row items-center gap-6">
        <div className="text-center md:text-left flex-1">
          <h3 className="text-lg font-bold mb-1">Need assistance with your application?</h3>
          <p className="text-on-primary-container/80 text-[13px]">
            Our help desk is available from 8:00 AM to 5:00 PM on working days to assist you.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a
            className="bg-on-primary text-primary-container px-5 py-2.5 rounded-lg font-bold text-[13px] hover:bg-opacity-90 transition-all"
            href="#"
          >
            Help Center
          </a>
          <a
            className="border border-on-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-[13px] hover:bg-white/10 transition-all"
            href="#"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
