export type MyKadOcrResult = {
  name: string;
  icNumber: string;
  address: string;
  gender?: string;
  religion?: string;
  citizenship?: string;
  rawText: string;
};

const RELIGIONS = ["ISLAM", "BUDDHA", "KRISTIAN", "HINDU", "SIKH"];

export function parseMyKadOcrText(rawText: string): MyKadOcrResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);

  const icNumber = extractIcNumber(rawText);
  const name = extractName(lines, icNumber);
  const gender = extractGender(lines, icNumber);
  const religion = extractReligion(lines);
  const citizenship = extractCitizenship(lines);
  const address = extractAddress(lines, { name, icNumber, gender, religion, citizenship });

  return {
    name,
    icNumber,
    address,
    gender,
    religion,
    citizenship,
    rawText,
  };
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").replace(/[|]/g, "I").trim();
}

function extractIcNumber(text: string) {
  const match = text.match(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/);
  return match ? match[0].replace(/\s/g, "-").replace(/--+/g, "-") : "";
}

function extractName(lines: string[], icNumber: string) {
  const skipWords = [
    "MALAYSIA",
    "KAD PENGENALAN",
    "IDENTITY CARD",
    "WARGANEGARA",
    "LELAKI",
    "PEREMPUAN",
    "ISLAM",
    "BUDDHA",
    "KRISTIAN",
    "HINDU",
    "SIKH",
  ];

  const icIndex = lines.findIndex((line) => (icNumber ? line.includes(icNumber) : /\d{6}/.test(line)));
  const searchStart = icIndex >= 0 ? icIndex + 1 : 0;

  for (let index = searchStart; index < lines.length; index += 1) {
    const line = lines[index];
    const upper = line.toUpperCase();

    if (skipWords.some((word) => upper.includes(word))) {
      continue;
    }

    if (/^\d/.test(line) || /\d{5}/.test(line)) {
      continue;
    }

    if (upper.length >= 5 && /^[A-Z @'./-]+$/.test(upper)) {
      return titleCase(upper);
    }
  }

  return "";
}

function extractGender(lines: string[], icNumber: string) {
  const joined = lines.join(" ").toUpperCase();

  if (joined.includes("LELAKI")) {
    return "Lelaki";
  }

  if (joined.includes("PEREMPUAN")) {
    return "Perempuan";
  }

  const lastDigit = icNumber.replace(/\D/g, "").slice(-1);
  if (!lastDigit) {
    return undefined;
  }

  return Number(lastDigit) % 2 === 0 ? "Perempuan" : "Lelaki";
}

function extractReligion(lines: string[]) {
  const joined = lines.join(" ").toUpperCase();
  return RELIGIONS.find((religion) => joined.includes(religion));
}

function extractCitizenship(lines: string[]) {
  const joined = lines.join(" ").toUpperCase();
  return joined.includes("WARGANEGARA") ? "warganegara" : undefined;
}

function extractAddress(
  lines: string[],
  known: {
    name: string;
    icNumber: string;
    gender?: string;
    religion?: string;
    citizenship?: string;
  }
) {
  const addressLines: string[] = [];
  const nameUpper = known.name.toUpperCase();

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (
      upper.includes("MALAYSIA") ||
      upper.includes("KAD PENGENALAN") ||
      upper.includes("IDENTITY CARD") ||
      upper.includes("WARGANEGARA") ||
      upper.includes("LELAKI") ||
      upper.includes("PEREMPUAN") ||
      upper === known.religion ||
      upper === nameUpper ||
      (known.icNumber && upper.includes(known.icNumber))
    ) {
      continue;
    }

    const looksLikeAddress =
      /^\d/.test(upper) ||
      /\b(JALAN|LORONG|TAMAN|KAMPUNG|KG|BANDAR|PERSIARAN|NO\.?|POSKOD|SELANGOR|JOHOR|KEDAH|KELANTAN|MELAKA|NEGERI|PAHANG|PERAK|PERLIS|PULAU|SABAH|SARAWAK|TERENGGANU|KUALA|PUTRAJAYA|LABUAN)\b/.test(
        upper
      );

    if (looksLikeAddress) {
      addressLines.push(line);
    }
  }

  return addressLines.join(", ");
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}
