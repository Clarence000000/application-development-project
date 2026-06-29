"use client";

export const STAFF_AI_CONTEXT_EVENT = "staff-ai-page-context-updated";

export type StaffAiContextDetail = {
  context: string;
};

export function publishStaffAiPageContext(context: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<StaffAiContextDetail>(STAFF_AI_CONTEXT_EVENT, {
      detail: { context },
    }),
  );
}

export function subscribeStaffAiPageContext(
  onChange: (context: string) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleContextUpdate = (event: Event) => {
    const detail = (event as CustomEvent<StaffAiContextDetail>).detail;
    onChange(detail?.context || "");
  };

  window.addEventListener(STAFF_AI_CONTEXT_EVENT, handleContextUpdate);

  return () => {
    window.removeEventListener(STAFF_AI_CONTEXT_EVENT, handleContextUpdate);
  };
}
