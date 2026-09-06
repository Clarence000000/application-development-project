export type ApplicationTitleKey =
  | "residentialVerification"
  | "incomeVerification"
  | "identityCardFineReduction";

export type ApplicationCopyKeys = {
  title: ApplicationTitleKey;
  shortTitle:
    | "residentialVerificationShort"
    | "incomeVerificationShort"
    | "identityCardFineAppeal";
  description:
    | "residentialDescription"
    | "incomeDescription"
    | "identityCardFineDescription";
};

export function getApplicationTitleKey(
  formSlug: unknown,
): ApplicationTitleKey | null {
  return getApplicationCopyKeys(formSlug)?.title || null;
}

export function getApplicationCopyKeys(
  formSlug: unknown,
): ApplicationCopyKeys | null {
  switch (formSlug) {
    case "residential":
      return {
        title: "residentialVerification",
        shortTitle: "residentialVerificationShort",
        description: "residentialDescription",
      };
    case "income":
      return {
        title: "incomeVerification",
        shortTitle: "incomeVerificationShort",
        description: "incomeDescription",
      };
    case "ic-appeal":
    case "ic_penalty":
      return {
        title: "identityCardFineReduction",
        shortTitle: "identityCardFineAppeal",
        description: "identityCardFineDescription",
      };
    default:
      return null;
  }
}
