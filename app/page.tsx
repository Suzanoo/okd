import Image from "next/image";
import Link from "next/link";

import { APP_NAME, BG_IMAGE } from "@/config/app.config";

const projectHighlights = [
  {
    label: "Project type",
    value: "Construction Management",
    detail:
      "Public visibility and stakeholder workspace for OKMD project control.",
  },
  {
    label: "Current focus",
    value: "Progress • Cost • Records",
    detail:
      "Track project status through BOQ, progress reports and visual records.",
  },
  {
    label: "Platform stage",
    value: "V1 Roadmap",
    detail:
      "Foundation, information architecture, public website and dashboard.",
  },
];

const publicSections = [
  {
    title: "Project overview",
    description:
      "พื้นที่สื่อสารภาพรวมโครงการ ให้ผู้เกี่ยวข้องเห็นสถานะและทิศทางเดียวกัน",
  },
  {
    title: "Progress visibility",
    description:
      "ติดตามความก้าวหน้าโครงการผ่านรายงาน Plan vs Actual และ S-curve",
  },
  {
    title: "Visual records",
    description:
      "รวม timelapse และบันทึกภาพงานก่อสร้าง เพื่อใช้เป็นหลักฐานและสื่อสารความคืบหน้า",
  },
];

const stakeholderModules = [
  {
    href: "/boq",
    title: "BOQ Control",
    description: "Quantity, cost, WBS summary and package query.",
  },
  {
    href: "/report",
    title: "Progress Report",
    description: "Plan vs Actual, S-curve, KPI and activity progress.",
  },
  {
    href: "/media",
    title: "Media Records",
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

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/50 to-black/90" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-8 sm:px-6 lg:px-8">
        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
              OKMD Construction Management
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              One project control center for visibility, progress and records.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              ศูนย์กลางข้อมูลโครงการ OKMD สำหรับสื่อสารภาพรวม ติดตามความก้าวหน้า
              ตรวจสอบต้นทุน และเก็บบันทึกภาพงานก่อสร้างอย่างเป็นระบบ
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/media"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                View project records
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
              {projectHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-white/60">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-white/45">
              Public website
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built for people who need the project story first.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
              หน้าแรกนี้ทำหน้าที่อธิบายว่าโครงการคืออะไร อยู่ในสถานะใด
              และมีข้อมูลสำคัญอะไรให้ติดตาม ก่อนพาผู้ใช้งานจริงเข้าสู่ workspace
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {publicSections.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-md"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                Stakeholder workspace
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Work modules
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/55">
              สำหรับผู้เกี่ยวข้องที่ต้องเข้าทำงานกับข้อมูลโครงการโดยตรง
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stakeholderModules.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div className="text-lg font-semibold">{item.title}</div>
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

        <footer className="border-t border-white/10 py-6 text-xs text-white/45">
          © {new Date().getFullYear()} {APP_NAME} CM • Public Website Phase
        </footer>
      </div>
    </main>
  );
}
