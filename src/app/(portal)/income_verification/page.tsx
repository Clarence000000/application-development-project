import ApplicationFormPage from "@/components/ApplicationFormPage";
import { getApplicationForm } from "@/lib/applicationForms";

export default function IncomeVerificationPage() {
  const config = getApplicationForm("income");

  if (!config) {
    return null;
  }

  return <ApplicationFormPage config={config} />;
}
