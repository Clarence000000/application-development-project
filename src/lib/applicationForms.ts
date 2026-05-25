export type ApplicationSlug = "residential" | "income" | "ic-appeal";

export type FieldOption = {
  label: string;
  value: string;
};

export type FormField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  fullWidth?: boolean;
  helperText?: string;
};

export type ApplicationFormConfig = {
  slug: ApplicationSlug;
  title: string;
  shortTitle: string;
  category: string;
  description: string;
  href: string;
  icon: string;
  estimatedTime: string;
  fields: FormField[];
};

const citizenshipOptions: FieldOption[] = [
  { label: "Warganegara", value: "warganegara" },
  { label: "Bukan Warganegara", value: "bukan-warganegara" },
];

const residentialStatusOptions: FieldOption[] = [
  { label: "Sendiri", value: "sendiri" },
  { label: "Sewa", value: "sewa" },
  { label: "Majikan", value: "majikan" },
  { label: "Lain-lain", value: "lain-lain" },
];

const maritalStatusOptions: FieldOption[] = [
  { label: "Bujang", value: "bujang" },
  { label: "Berkahwin", value: "berkahwin" },
  { label: "Cerai", value: "cerai" },
  { label: "Kematian", value: "kematian" },
];

export const applicationForms: ApplicationFormConfig[] = [
  {
    slug: "residential",
    title: "Borang Pengesahan Bermastautin",
    shortTitle: "Pengesahan Bermastautin",
    category: "Kediaman",
    description:
      "Permohonan pengesahan status bermastautin dalam kampung, mukim, atau daerah tempat kediaman.",
    href: "/residential_verification",
    icon: "home_pin",
    estimatedTime: "5-7 minit",
    fields: [
      {
        name: "name",
        label: "Nama",
        type: "text",
        required: true,
        placeholder: "Nama seperti dalam Kad Pengenalan",
      },
      {
        name: "idNumber",
        label: "No. Kad Pengenalan / Passport",
        type: "text",
        required: true,
        placeholder: "Contoh: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Status Kewarganegaraan",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "icAddress",
        label: "Alamat dalam Kad Pengenalan",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "residentialAddress",
        label: "Alamat Bermastautin",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "residentialStatus",
        label: "Status Tempat Tinggal",
        type: "select",
        required: true,
        options: residentialStatusOptions,
      },
      {
        name: "otherResidentialStatus",
        label: "Lain-lain Status Tempat Tinggal",
        type: "text",
        placeholder: "Isi jika memilih Lain-lain",
      },
      {
        name: "durationYears",
        label: "Tempoh Bermastautin (Tahun)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "durationMonths",
        label: "Tempoh Bermastautin (Bulan)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "durationDays",
        label: "Tempoh Bermastautin (Hari)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "maritalStatus",
        label: "Status Diri",
        type: "select",
        required: true,
        options: maritalStatusOptions,
      },
      {
        name: "referenceNumber",
        label: "No. Rujukan Berkaitan",
        type: "text",
        placeholder: "Jika ada",
      },
      {
        name: "occupation",
        label: "Pekerjaan",
        type: "text",
        required: true,
      },
      {
        name: "purpose",
        label: "Tujuan Permohonan",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Nyatakan tujuan permohonan pengesahan ini",
      },
    ],
  },
  {
    slug: "income",
    title: "Borang Pengesahan Pendapatan",
    shortTitle: "Pengesahan Pendapatan",
    category: "Pendapatan",
    description:
      "Permohonan pengesahan pendapatan bagi pemohon yang tidak mempunyai slip gaji atau penyata pendapatan tetap.",
    href: "/income_verification",
    icon: "payments",
    estimatedTime: "4-6 minit",
    fields: [
      {
        name: "name",
        label: "Nama",
        type: "text",
        required: true,
        placeholder: "Nama seperti dalam Kad Pengenalan",
      },
      {
        name: "idNumber",
        label: "No. Kad Pengenalan / Passport",
        type: "text",
        required: true,
        placeholder: "Contoh: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Status Kewarganegaraan",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "occupation",
        label: "Pekerjaan",
        type: "text",
        required: true,
        placeholder: "Isi Tidak Bekerja jika berkaitan",
      },
      {
        name: "income",
        label: "Pendapatan Bulanan (RM)",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        name: "residentialAddress",
        label: "Alamat Tempat Tinggal",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "purpose",
        label: "Tujuan Permohonan",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Nyatakan tujuan permohonan pengesahan ini",
      },
    ],
  },
  {
    slug: "ic-appeal",
    title: "Borang Pengurangan / Rayuan Bayaran Denda Kad Pengenalan",
    shortTitle: "Rayuan Denda Kad Pengenalan",
    category: "Rayuan",
    description:
      "Permohonan rayuan pengurangan bayaran denda bagi kes kerosakan atau kehilangan Kad Pengenalan.",
    href: "/ic_penalty_appeal",
    icon: "assignment",
    estimatedTime: "6-8 minit",
    fields: [
      {
        name: "name",
        label: "Nama",
        type: "text",
        required: true,
        placeholder: "Nama seperti dalam Kad Pengenalan",
      },
      {
        name: "idNumber",
        label: "No. Kad Pengenalan / Passport",
        type: "text",
        required: true,
        placeholder: "Contoh: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Status Kewarganegaraan",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "phoneNumber",
        label: "No. Telefon",
        type: "text",
        required: true,
        placeholder: "Contoh: 0123456789",
      },
      {
        name: "residentialAddress",
        label: "Alamat Tempat Tinggal",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "caseType",
        label: "Jenis Kes",
        type: "select",
        required: true,
        options: [
          { label: "Kehilangan Kad Pengenalan", value: "kehilangan" },
          { label: "Kerosakan Kad Pengenalan", value: "kerosakan" },
        ],
      },
      {
        name: "incidentDate",
        label: "Tarikh Kejadian",
        type: "date",
        required: true,
      },
      {
        name: "fineAmount",
        label: "Jumlah Denda (RM)",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        name: "incidentDetails",
        label: "Keterangan Kes",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Terangkan ringkas kejadian kerosakan atau kehilangan Kad Pengenalan",
      },
      {
        name: "appealReason",
        label: "Sebab Rayuan Pengurangan Bayaran",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Terangkan sebab pemohon memohon pengurangan bayaran denda",
      },
    ],
  },
];

export function getApplicationForm(slug: ApplicationSlug) {
  return applicationForms.find((form) => form.slug === slug);
}
