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
  { label: "Citizen", value: "warganegara" },
  { label: "Non-citizen", value: "bukan-warganegara" },
];

const residentialStatusOptions: FieldOption[] = [
  { label: "Own home", value: "sendiri" },
  { label: "Rental", value: "sewa" },
  { label: "Employer-provided", value: "majikan" },
  { label: "Others", value: "lain-lain" },
];

const maritalStatusOptions: FieldOption[] = [
  { label: "Single", value: "bujang" },
  { label: "Married", value: "berkahwin" },
  { label: "Divorced", value: "cerai" },
  { label: "Widowed", value: "kematian" },
];

export const applicationForms: ApplicationFormConfig[] = [
  {
    slug: "residential",
    title: "Residential Verification Form",
    shortTitle: "Residential Verification",
    category: "Residential",
    description:
      "Apply for verification of your residence status in your village, subdistrict, or district.",
    href: "/residential_verification",
    icon: "home_pin",
    estimatedTime: "5-7 minutes",
    fields: [
      {
        name: "name",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "Name as shown on your identity card",
      },
      {
        name: "idNumber",
        label: "Identity Card / Passport Number",
        type: "text",
        required: true,
        placeholder: "Example: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Citizenship Status",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "icAddress",
        label: "Identity Card Address",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "residentialAddress",
        label: "Residential Address",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "residentialStatus",
        label: "Residence Status",
        type: "select",
        required: true,
        options: residentialStatusOptions,
      },
      {
        name: "otherResidentialStatus",
        label: "Other Residence Status",
        type: "text",
        placeholder: "Fill in if you selected Others",
      },
      {
        name: "durationYears",
        label: "Residence Duration (Years)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "durationMonths",
        label: "Residence Duration (Months)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "durationDays",
        label: "Residence Duration (Days)",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        name: "maritalStatus",
        label: "Marital Status",
        type: "select",
        required: true,
        options: maritalStatusOptions,
      },
      {
        name: "referenceNumber",
        label: "Related Reference Number",
        type: "text",
        placeholder: "If any",
      },
      {
        name: "occupation",
        label: "Occupation",
        type: "text",
        required: true,
      },
      {
        name: "purpose",
        label: "Application Purpose",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "State the purpose of this verification request",
      },
    ],
  },
  {
    slug: "income",
    title: "Income Verification Form",
    shortTitle: "Income Verification",
    category: "Income",
    description:
      "Apply for income verification if you do not have a salary slip or fixed income statement.",
    href: "/income_verification",
    icon: "payments",
    estimatedTime: "4-6 minutes",
    fields: [
      {
        name: "name",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "Name as shown on your identity card",
      },
      {
        name: "idNumber",
        label: "Identity Card / Passport Number",
        type: "text",
        required: true,
        placeholder: "Example: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Citizenship Status",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "occupation",
        label: "Occupation",
        type: "text",
        required: true,
        placeholder: "Enter Unemployed if applicable",
      },
      {
        name: "income",
        label: "Monthly Income (RM)",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        name: "residentialAddress",
        label: "Residential Address",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "purpose",
        label: "Application Purpose",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "State the purpose of this verification request",
      },
    ],
  },
  {
    slug: "ic-appeal",
    title: "Identity Card Fine Reduction / Appeal Form",
    shortTitle: "Identity Card Fine Appeal",
    category: "Appeal",
    description:
      "Apply to appeal for a fine reduction related to damaged or lost identity cards.",
    href: "/ic_penalty_appeal",
    icon: "assignment",
    estimatedTime: "6-8 minutes",
    fields: [
      {
        name: "name",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "Name as shown on your identity card",
      },
      {
        name: "idNumber",
        label: "Identity Card / Passport Number",
        type: "text",
        required: true,
        placeholder: "Example: 010203-01-1234",
      },
      {
        name: "citizenship",
        label: "Citizenship Status",
        type: "select",
        required: true,
        options: citizenshipOptions,
      },
      {
        name: "phoneNumber",
        label: "Phone Number",
        type: "text",
        required: true,
        placeholder: "Example: 0123456789",
      },
      {
        name: "residentialAddress",
        label: "Residential Address",
        type: "textarea",
        required: true,
        fullWidth: true,
      },
      {
        name: "caseType",
        label: "Case Type",
        type: "select",
        required: true,
        options: [
          { label: "Lost Identity Card", value: "kehilangan" },
          { label: "Damaged Identity Card", value: "kerosakan" },
        ],
      },
      {
        name: "incidentDate",
        label: "Incident Date",
        type: "date",
        required: true,
      },
      {
        name: "fineAmount",
        label: "Fine Amount (RM)",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        name: "incidentDetails",
        label: "Case Details",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Briefly describe the damage or loss incident",
      },
      {
        name: "appealReason",
        label: "Reason for Fine Reduction Appeal",
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Explain why you are requesting a fine reduction",
      },
    ],
  },
];

export function getApplicationForm(slug: ApplicationSlug) {
  return applicationForms.find((form) => form.slug === slug);
}
