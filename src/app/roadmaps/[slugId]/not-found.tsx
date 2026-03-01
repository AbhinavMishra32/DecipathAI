import Link from "next/link";
import { MapTrifold } from "@phosphor-icons/react/dist/ssr";

export default function RoadmapNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <MapTrifold
          weight="thin"
          className="mx-auto h-20 w-20 text-indigo-400/60 dark:text-indigo-300/40"
        />
        <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
          Roadmap not found
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This roadmap doesn&apos;t exist or isn&apos;t publicly shared.
        </p>
        <Link
          href="/roadmaps"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
