import ApplicationFormPage from "@/components/ApplicationFormPage";
import { getApplicationForm } from "@/lib/applicationForms";

export default function ResidentialVerificationPage() {
  const config = getApplicationForm("residential");

  if (!config) {
    return null;
  }

  return <ApplicationFormPage config={config} />;
}
