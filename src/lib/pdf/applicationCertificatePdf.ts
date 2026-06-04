import { readFile } from "fs/promises";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type CertificateFormType = "residential" | "income" | "ic-appeal";

export type CertificateApplicant = {
  name: string;
  idNumber: string;
  citizenship?: string;
  icAddress?: string;
  residentialAddress?: string;
  residentialStatus?: string;
  otherResidentialStatus?: string;
  durationYears?: string;
  durationMonths?: string;
  durationDays?: string;
  maritalStatus?: string;
  referenceNumber?: string;
  occupation?: string;
  income?: string;
  purpose?: string;
  phoneNumber?: string;
  caseType?: string;
  incidentDate?: string;
  fineAmount?: string;
  incidentDetails?: string;
  appealReason?: string;
};

export type CertificateApproval = {
  approvedBy: string;
  approvedAt: string;
  officeComment: string;
};

export type CertificatePdfData = {
  applicationId: string;
  referenceNumber: string;
  formType: CertificateFormType;
  submittedAt?: string;
  serialNumber?: string;
  applicant: CertificateApplicant;
  approval: CertificateApproval;
};

type PdfField = {
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  maxLines?: number;
  lineGap?: number;
};

const textColor = rgb(0, 0, 0);
const checkColor = rgb(0.02, 0.2, 0.09);

export async function generateApplicationCertificatePdf(
  data: CertificatePdfData,
) {
  const templateBytes = await readFile(getTemplatePath(data.formType));
  const pdfDoc = await PDFDocument.load(templateBytes);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const firstPage = pdfDoc.getPage(0);
  const secondPage = pdfDoc.getPage(1);

  if (data.formType === "residential") {
    fillResidentialPdf(firstPage, secondPage, data, regularFont, boldFont);
  } else if (data.formType === "income") {
    fillIncomePdf(firstPage, secondPage, data, regularFont, boldFont);
  } else {
    fillIcAppealPdf(firstPage, secondPage, data, regularFont, boldFont);
  }

  return pdfDoc.save();
}

function fillResidentialPdf(
  page: PDFPage,
  secondPage: PDFPage,
  data: CertificatePdfData,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const applicant = data.applicant;

  drawValue(page, applicant.name, regularFont, {
    x: 91,
    y: 612,
    maxWidth: 335,
  });
  drawValue(page, applicant.idNumber, regularFont, {
    x: 91,
    y: 559,
    maxWidth: 247,
  });
  drawCheck(
    page,
    getOptionPoint(applicant.citizenship, citizenshipPoints),
    boldFont,
  );
  drawValue(page, applicant.icAddress, regularFont, {
    x: 91,
    y: 480,
    maxWidth: 310,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawValue(page, applicant.residentialAddress, regularFont, {
    x: 91,
    y: 401,
    maxWidth: 302,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawCheck(
    page,
    getOptionPoint(applicant.residentialStatus, residentialStatusPoints),
    boldFont,
  );
  drawValue(page, applicant.otherResidentialStatus, regularFont, {
    x: 372,
    y: 319,
    maxWidth: 345,
  });
  drawValue(page, applicant.durationYears || "0", regularFont, {
    x: 275,
    y: 280,
    maxWidth: 40,
  });
  drawValue(page, applicant.durationMonths || "0", regularFont, {
    x: 352,
    y: 280,
    maxWidth: 40,
  });
  drawValue(page, applicant.durationDays || "0", regularFont, {
    x: 423,
    y: 280,
    maxWidth: 40,
  });
  drawCheck(
    page,
    getOptionPoint(applicant.maritalStatus, maritalStatusPoints),
    boldFont,
  );
  drawValue(page, applicant.referenceNumber || "-", regularFont, {
    x: 434,
    y: 214,
    maxWidth: 252,
  });
  drawValue(page, applicant.occupation, regularFont, {
    x: 91,
    y: 162,
    maxWidth: 370,
  });
  drawValue(page, applicant.purpose, regularFont, {
    x: 91,
    y: 110,
    maxWidth: 424,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawValue(
    page,
    `No. Rujukan: ${data.referenceNumber || data.applicationId}`,
    regularFont,
    {
      x: 440,
      y: 805,
      size: 8,
      maxWidth: 165,
    },
  );
  drawValue(page, `No. Siri: ${data.serialNumber || "-"}`, regularFont, {
    x: 440,
    y: 793,
    size: 8,
    maxWidth: 165,
  });
  //second page
  drawValue(secondPage, applicant.name, regularFont, {
    x: 194,
    y: 641.5,
    maxWidth: 335,
  });
  drawValue(secondPage, applicant.idNumber, regularFont, {
    x: 194,
    y: 615,
    maxWidth: 247,
  });
  drawPerakuanDate(secondPage, data, regularFont, {
    x: 426,
    y: 672,
    maxWidth: 75,
  });
  drawApproval(secondPage, data, regularFont, boldFont, {
    comment: { x: 73, y: 500, maxWidth: 436, maxLines: 2, lineGap: 17.5 },
    date: { x: 426, y: 447, maxWidth: 75 },
    name: { x: 158, y: 417, maxWidth: 255 },
  });
}

function fillIncomePdf(
  page: PDFPage,
  secondPage: PDFPage,
  data: CertificatePdfData,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const applicant = data.applicant;

  drawValue(page, applicant.name, regularFont, {
    x: 91,
    y: 612,
    maxWidth: 335,
  });
  drawValue(page, applicant.idNumber, regularFont, {
    x: 91,
    y: 559,
    maxWidth: 247,
  });
  drawCheck(
    page,
    getOptionPoint(applicant.citizenship, citizenshipPoints),
    boldFont,
  );
  drawValue(page, applicant.occupation, regularFont, {
    x: 91,
    y: 479,
    maxWidth: 360,
  });
  drawValue(page, formatMonion(applicant.income), regularFont, {
    x: 91,
    y: 426,
    maxWidth: 350,
  });
  drawValue(page, applicant.residentialAddress, regularFont, {
    x: 91,
    y: 373,
    maxWidth: 302,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawValue(page, applicant.purpose, regularFont, {
    x: 91,
    y: 294,
    maxWidth: 424,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawValue(
    page,
    `No. Rujukan: ${data.referenceNumber || data.applicationId}`,
    regularFont,
    {
      x: 373,
      y: 805,
      size: 8,
      maxWidth: 165,
    },
  );
  drawValue(page, `No. Siri: ${data.serialNumber || "-"}`, regularFont, {
    x: 373,
    y: 793,
    size: 8,
    maxWidth: 165,
  });
  //second page
  drawValue(secondPage, applicant.name, regularFont, {
    x: 194,
    y: 641.5,
    maxWidth: 335,
  });
  drawValue(secondPage, applicant.idNumber, regularFont, {
    x: 194,
    y: 615,
    maxWidth: 247,
  });
  drawPerakuanDate(secondPage, data, regularFont, {
    x: 426,
    y: 672,
    maxWidth: 75,
  });
  drawApproval(secondPage, data, regularFont, boldFont, {
    comment: { x: 73, y: 500, maxWidth: 436, maxLines: 2, lineGap: 17.5 },
    date: { x: 426, y: 447, maxWidth: 75 },
    name: { x: 158, y: 417, maxWidth: 255 },
  });
}

function fillIcAppealPdf(
  page: PDFPage,
  secondPage: PDFPage,
  data: CertificatePdfData,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const applicant = data.applicant;

  drawValue(page, applicant.name, regularFont, {
    x: 91,
    y: 612,
    maxWidth: 335,
  });
  drawValue(page, applicant.idNumber, regularFont, {
    x: 91,
    y: 559,
    maxWidth: 247,
  });
  drawCheck(
    page,
    getOptionPoint(applicant.citizenship, citizenshipPoints),
    boldFont,
  );
  drawValue(page, applicant.phoneNumber, regularFont, {
    x: 91,
    y: 479,
    maxWidth: 310,
  });
  drawValue(page, applicant.residentialAddress, regularFont, {
    x: 91,
    y: 426,
    maxWidth: 302,
    maxLines: 2,
    lineGap: 17.5,
  });
  drawCheck(page, getOptionPoint(applicant.caseType, caseTypePoints), boldFont);
  drawValue(page, formatDate(applicant.incidentDate), regularFont, {
    x: 260,
    y: 320,
    maxWidth: 345,
  });
  drawValue(page, formatMonion(applicant.fineAmount), regularFont, {
    x: 260,
    y: 293,
    maxWidth: 100,
  });
  drawValue(page, applicant.incidentDetails, regularFont, {
    x: 91,
    y: 240,
    maxWidth: 426,
    maxLines: 3,
    lineGap: 17.5,
  });
  drawValue(page, applicant.appealReason, regularFont, {
    x: 91,
    y: 135,
    maxWidth: 426,
    maxLines: 3,
    lineGap: 17.5,
  });
  drawValue(
    page,
    `No. Rujukan: ${data.referenceNumber || data.applicationId}`,
    regularFont,
    {
      x: 383,
      y: 805,
      size: 8,
      maxWidth: 165,
    },
  );
  drawValue(page, `No. Siri: ${data.serialNumber || "-"}`, regularFont, {
    x: 383,
    y: 793,
    size: 8,
    maxWidth: 195,
  });
  //second page
  drawValue(secondPage, applicant.name, regularFont, {
    x: 194,
    y: 641.5,
    maxWidth: 335,
  });
  drawValue(secondPage, applicant.idNumber, regularFont, {
    x: 194,
    y: 615,
    maxWidth: 247,
  });
  drawPerakuanDate(secondPage, data, regularFont, {
    x: 426,
    y: 672,
    maxWidth: 75,
  });
  drawApproval(secondPage, data, regularFont, boldFont, {
    comment: { x: 73, y: 500, maxWidth: 436, maxLines: 2, lineGap: 17.5 },
    date: { x: 426, y: 447, maxWidth: 75 },
    name: { x: 158, y: 417, maxWidth: 255 },
  });
}

function drawPerakuanDate(
  page: PDFPage,
  data: CertificatePdfData,
  regularFont: PDFFont,
  field: PdfField,
) {
  drawValue(
    page,
    formatDate(data.submittedAt || new Date().toISOString()),
    regularFont,
    field,
  );
}

function drawApproval(
  page: PDFPage,
  data: CertificatePdfData,
  regularFont: PDFFont,
  boldFont: PDFFont,
  fields: {
    comment: PdfField;
    date: PdfField;
    name: PdfField;
  },
) {
  drawValue(page, data.approval.officeComment, regularFont, fields.comment);
  drawValue(
    page,
    formatDate(data.approval.approvedAt),
    regularFont,
    fields.date,
  );
  drawValue(page, data.approval.approvedBy, boldFont, fields.name);
}

function drawValue(
  page: PDFPage,
  value: string | undefined,
  font: PDFFont,
  field: PdfField,
) {
  const size = field.size || 9;
  const lines = wrapText(
    printable(value),
    font,
    size,
    field.maxWidth || 999,
  ).slice(0, field.maxLines || 1);

  const lineGap = field.lineGap ?? 3;

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: field.x,
      y: field.y - index * (size + lineGap),
      size,
      font,
      color: textColor,
    });
  });
}

function drawCheck(
  page: PDFPage,
  point: { x: number; y: number } | undefined,
  font: PDFFont,
) {
  if (!point) {
    return;
  }

  page.drawText("X", {
    x: point.x,
    y: point.y,
    size: 11,
    font,
    color: checkColor,
  });
}

function getTemplatePath(formType: CertificateFormType) {
  const filename =
    formType === "residential"
      ? "borang-bermastautin-template.pdf"
      : formType === "income"
        ? "borang-pendapatan-template.pdf"
        : "borang-rayuan-denda-template.pdf";

  return path.join(process.cwd(), "public", "templates", filename);
}

const citizenshipPoints = [
  { labels: ["warganegara"], x: 162.5, y: 527 },
  { labels: ["bukan warganegara", "bukan-warganegara"], x: 299, y: 527 },
];

const residentialStatusPoints = [
  { labels: ["sendiri"], x: 300.5, y: 341 },
  { labels: ["sewa"], x: 360.5, y: 341 },
  { labels: ["majikan"], x: 429, y: 341 },
  { labels: ["lain-lain", "lainlain"], x: 548, y: 341 },
];

const maritalStatusPoints = [
  { labels: ["bujang"], x: 299.5, y: 236 },
  { labels: ["berkahwin"], x: 381.5, y: 236 },
  { labels: ["cerai"], x: 439, y: 236 },
  { labels: ["kematian"], x: 514, y: 236 },
];

const caseTypePoints = [
  { labels: ["kehilangan"], x: 398, y: 368 },
  { labels: ["kerosakan"], x: 398, y: 341.5 },
];

function getOptionPoint(
  selected: string | undefined,
  points: { labels: string[]; x: number; y: number }[],
) {
  const normalizedSelected = normalize(selected);
  return points.find((point) =>
    point.labels.some((label) => normalizedSelected === normalize(label)),
  );
}

function wrapText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const wordParts = splitLongWord(word, font, size, maxWidth);

    for (const part of wordParts) {
      const next = current ? `${current} ${part}` : part;

      if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
        lines.push(current);
        current = part;
      } else {
        current = next;
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function splitLongWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) {
    return [word];
  }

  const parts: string[] = [];
  let current = "";

  for (const char of word) {
    const next = current + char;

    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      parts.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function printable(value?: string) {
  return sanitize(value?.trim() || "-");
}

function sanitize(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "");
}

function formatMonion(value?: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return printable(value);
  }
  return `RM ${amount.toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalize(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}