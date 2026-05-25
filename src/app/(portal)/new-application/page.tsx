"use client";

import Link from "next/link";
import { applicationForms } from "@/lib/applicationForms";

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="border-b border-outline-variant pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">
          Perkhidmatan Permohonan
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
          Permohonan Perakuan Penghulu
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
          Pilih jenis permohonan yang ingin dihantar. Pemohon hanya perlu mengisi
          maklumat permohonan pada peringkat ini. Dokumen sokongan akan diminta oleh
          pihak pejabat selepas semakan awal dibuat.
        </p>
      </section>

      <section className="grid grid-cols-1 border border-outline-variant bg-white md:grid-cols-3">
        <ServiceInfo title="Peringkat Semasa" description="Pengisian maklumat permohonan" />
        <ServiceInfo title="Tindakan Pejabat" description="Semakan dan makluman seterusnya" />
        <ServiceInfo title="Dokumen Sokongan" description="Diminta selepas semakan pejabat" />
      </section>

      <section className="space-y-3" aria-label="Jenis permohonan">
        {applicationForms.map((form) => (
          <Link
            href={form.href}
            key={form.slug}
            className="group grid gap-4 border border-outline-variant border-l-4 border-l-primary bg-white p-5 transition hover:bg-surface-container-lowest hover:shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-primary text-white">
              <span className="material-symbols-outlined">{form.icon}</span>
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="bg-secondary-container px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-secondary-container">
                  {form.category}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Anggaran masa: {form.estimatedTime}
                </span>
              </div>
              <h2 className="text-lg font-bold text-primary">{form.title}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-on-surface-variant">
                {form.description}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="text-sm font-bold text-primary">Mula Permohonan</span>
              <span className="material-symbols-outlined text-primary transition group-hover:translate-x-1">
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h2 className="text-sm font-bold text-primary">Makluman</h2>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Pastikan maklumat yang diisi adalah tepat. Sebarang dokumen tambahan,
              tarikh hadir ke pejabat, atau tindakan susulan akan dimaklumkan melalui
              status permohonan.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceInfo({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-outline-variant p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{title}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
