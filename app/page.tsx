import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { buttonClass } from "@/app/_components/WorkspaceControls";

const workflows = [
  { href: "/boq", title: "BOQ Viewer", description: "เปิด BOQ เลือก WBS และดูรายการกับกราฟสรุป — read-only workbook navigation.", image: siteConfig.overview.image },
  { href: "/query", title: "Query", description: "ค้นหาภาษาไทย / English กรอง จัดกลุ่ม และส่งออก CSV / PDF จากทั้งชีต โดยไม่ขึ้นกับ WBS ใน Viewer.", image: siteConfig.progress.image },
  { href: "/report", title: "Progress Report", description: "อ่าน Plan / Actual จาก progress และ progress_table เลือก cutoff รายสัปดาห์หรือรายเดือน พร้อมแยกข้อมูล live และ snapshot.", image: siteConfig.timelapse.image },
] as const;

export default function HomePage() {
  return (
    <main className="home-page bg-background text-foreground">
      <section className="relative overflow-hidden">
        <Image src={siteConfig.hero.image} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 text-white">
          <p className="text-sm font-semibold">OKD · Workbook workspace</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">เลือกเครื่องมือ เริ่มจาก workbook ของคุณ</h1>
          <p className="mt-6 max-w-2xl leading-8">Browse BOQ, search quantities and review progress. ตัวอย่างในแอปเป็นข้อมูลสังเคราะห์ ไม่ใช่สถานะโครงการจริง</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/boq" className={buttonClass}>Open BOQ Viewer</Link>
            <Link href="/report" className={buttonClass}>Open Progress Report</Link>
          </div>
        </div>
      </section>
      <section aria-label="Choose a workflow" className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="text-2xl font-semibold">Tools / เครื่องมือ</h2>
        <p className="mt-3 text-muted-foreground">เลือก BOQ ครั้งเดียว แล้วสลับ Viewer และ Query ในแท็บเดียวกันได้ การ refresh จะล้าง workbook ในหน่วยความจำและต้องเลือกใหม่</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {workflows.map(tool => <article key={tool.href} className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
            <div className="relative aspect-[4/3]"><Image src={tool.image} alt="" fill className="object-cover" /></div>
            <div className="p-5"><h3 className="text-xl font-semibold">{tool.title}</h3><p className="my-4 leading-7 text-muted-foreground">{tool.description}</p><Link href={tool.href} className={buttonClass}>Open {tool.title}</Link></div>
          </article>)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-12">
        <h2 className="text-2xl font-semibold">Media</h2>
        <p className="my-4 text-muted-foreground">เปิด playlist วิดีโอเดิมผ่าน YouTube ต้องใช้อินเทอร์เน็ต ภาพประกอบบนหน้านี้ไม่ใช่รายงานความก้าวหน้าหรือหลักฐานสถานะล่าสุด</p>
        <Link href="/media" className={buttonClass}>Open Media</Link>
        <div aria-label="Illustrations" className="mt-6 grid gap-5 sm:grid-cols-3">
          {siteConfig.news.items.map(item => <div key={item.image} className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src={item.image} alt="" fill className="object-cover" /></div>)}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">BOQ and Report files are processed in your browser, not uploaded to a server. Report has its own workbook and starts with a synthetic sample. It does not share BOQ data.</p>
      </section>
    </main>
  );
}
