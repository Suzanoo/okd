import Image from "next/image";
import Link from "next/link";

import { APP_NAME, BG_IMAGE } from "@/config/app.config";

const publicStats = [
  { label: "Project", value: "OKMD", detail: "Construction Management" },
  {
    label: "Scope",
    value: "BOQ • Report • Media",
    detail: "Public + Stakeholder",
  },
  { label: "Status", value: "V1 Roadmap", detail: "Foundation → IA → Release" },
];

const stakeholderActions = [
  {
    href: "/boq",
    label: "BOQ Control",
    description: "Quantity, cost, WBS summary and package query.",
  },
  {
    href: "/report",
    label: "Progress Report",
    description: "Plan vs Actual, S-curve, KPI and activity progress.",
  },
  {
    href: "/media",
    label: "Media Records",
    description: "Timelapse, photo logs and visual project records.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-white">
      <Image
        src={BG_IMAGE}
        alt={`${APP_NAME} construction management background`}
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/80" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-8 sm:px-6 lg:px-8">
        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
              OKMD Construction Management
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Project control center for public visibility and stakeholder work.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              ศูนย์กลางข้อมูลโครงการสำหรับติดตามภาพรวม ความก้าวหน้า BOQ
              และบันทึกภาพงานก่อสร้างของโครงการ OKMD
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                View progress
              </Link>
              <Link
                href="/boq"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Stakeholder workspace
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
            <div className="grid gap-3">
              {publicStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                Stakeholder modules
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Work area</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stakeholderActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div className="text-lg font-semibold">{item.label}</div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-white/65">
                  {item.description}
                </p>
                <div className="mt-5 text-sm font-medium text-white/85">
                  Open{" "}
                  <span className="inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="pb-6 text-xs text-white/45">
          © {new Date().getFullYear()} {APP_NAME} CM • V1 Roadmap
        </footer>
      </div>
    </main>
  );
}
