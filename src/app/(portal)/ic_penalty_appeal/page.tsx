import ApplicationFormPage from "@/components/ApplicationFormPage";
import { getApplicationForm } from "@/lib/applicationForms";

export default function ICPenaltyAppealPage() {
  const config = getApplicationForm("ic-appeal");

  if (!config) {
    return null;
  }

  return <ApplicationFormPage config={config} />;
}
