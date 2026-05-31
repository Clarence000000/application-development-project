"use client";

import React, { useEffect, useState } from "react";
import type { MyKadOcrResult } from "@/lib/mykadOcr";

type MyKadScanPanelProps = {
  onAutofill: (result: MyKadOcrResult) => void;
};

export default function MyKadScanPanel({ onAutofill }: MyKadScanPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<MyKadOcrResult | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setMessage("Sila pilih fail imej MyKad yang sah.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage("Saiz imej tidak boleh melebihi 5MB.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setMessage("");
  }

  async function scanMyKad() {
    if (!file) {
      setMessage("Sila pilih imej MyKad sebelum mengimbas.");
      return;
    }

    setIsScanning(true);
    setMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ocr/mykad", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Imbasan gagal. Sila cuba semula atau isi secara manual.");
        return;
      }

      setResult(payload);
      onAutofill(payload);
      setMessage("Maklumat MyKad berjaya diimbas dan diisi ke dalam borang.");
    } catch {
      setMessage("Imbasan tidak berjaya. Sila semak sambungan internet atau isi secara manual.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <section className="border border-outline-variant bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">document_scanner</span>
            <h2 className="text-lg font-bold text-primary">Imbas MyKad</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Muat naik imej MyKad yang jelas untuk membantu mengisi maklumat asas secara
            automatik. Jika imbasan tidak berjaya, pemohon masih boleh mengisi borang
            secara manual.
          </p>
        </div>
        <span className="w-fit bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-secondary-container">
          Pilihan
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <label
            htmlFor="mykad-image"
            className="flex min-h-40 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-outline-variant bg-surface-container-lowest p-5 text-center hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
            <span className="mt-2 text-sm font-bold text-on-surface">
              Pilih imej MyKad
            </span>
            <span className="mt-1 text-xs text-on-surface-variant">
              JPG, PNG, atau WebP sehingga 5MB
            </span>
          </label>
          <input
            id="mykad-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {file && (
            <div className="mt-3 flex flex-col gap-3 border border-outline-variant bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">{file.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={scanMyKad}
                disabled={isScanning}
                className="bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning ? "Mengimbas..." : "Imbas MyKad"}
              </button>
            </div>
          )}
        </div>

        <div className="border border-outline-variant bg-surface-container-lowest p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Pratonton imej MyKad"
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-center text-xs text-on-surface-variant">
              Pratonton imej akan dipaparkan di sini.
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 border-l-4 px-4 py-3 text-sm ${
            result
              ? "border-green-600 bg-green-50 text-green-800"
              : "border-primary bg-surface-container-low text-on-surface"
          }`}
        >
          {message}
        </div>
      )}

      {result && (
        <dl className="mt-4 grid grid-cols-1 gap-3 border border-outline-variant bg-surface-container-lowest p-4 text-sm md:grid-cols-3">
          <ResultItem label="Nama" value={result.name || "Tidak dikesan"} />
          <ResultItem label="No. Kad Pengenalan" value={result.icNumber || "Tidak dikesan"} />
          <ResultItem label="Jantina" value={result.gender || "Tidak dikesan"} />
        </dl>
      )}
    </section>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
