export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-24 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          Intelligent Verification Platform
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          System is running successfully on your computer!
        </p>
        <div className="mt-4 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-500">
            Next.js + Tailwind CSS + TypeScript + Firebase (Ready)
          </p>
        </div>
      </main>
    </div>
  );
}
