export default function SupportSettingsPage() {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined">help</span>
            <h2>Support</h2>
          </div>
      </div>
      <div className="max-w-xl p-6 space-y-2 text-sm text-on-surface">
        <button className="flex w-full items-center justify-between rounded-lg border border-outline-variant px-3 py-2 font-semibold hover:bg-gray-50">
          Help centre
          <span className="material-symbols-outlined text-[18px] text-secondary">
            chevron_right
          </span>
        </button>
        <button className="flex w-full items-center justify-between rounded-lg border border-outline-variant px-3 py-2 font-semibold hover:bg-gray-50">
          Send feedback
          <span className="material-symbols-outlined text-[18px] text-secondary">
            chevron_right
          </span>
        </button>
      </div>
    </section>
  );
}
