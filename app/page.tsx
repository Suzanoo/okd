import { isPublicMode } from "@/config/access.config";
import Image from "next/image";
import Link from "next/link";
import { SiLinktree } from "react-icons/si";

import { APP_NAME } from "@/config/app.config";
import { siteConfig } from "@/config/site.config";

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[2rem] border border-border bg-surface/90 shadow-card backdrop-blur-sm",
        "transition duration-300 hover:-translate-y-1 hover:shadow-card-lg",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { hero, overview, progress, timelapse, news } = siteConfig;

  const heroTitle = hero.title.trim();
  const heroTitleText = heroTitle.replace(/\s*🙉\s*🙈\s*🙊\s*$/, "").trim();
  const monkeyEmoji = heroTitle
    .slice(heroTitleText.length)
    .trim()
    .replace(/\s+/g, " ");
  const hasMonkeyEmoji = heroTitleText !== heroTitle;

  return (
    <main className="bg-background text-foreground transition-colors duration-300">
      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.title}
          fill
          priority
          className="object-cover brightness-[0.86] saturate-[0.9] dark:brightness-[0.72]"
        />
        {/* <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/38 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-slate-950/20" /> */}

        <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-5 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
              {hero.eyebrow}
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              <span>{heroTitleText}</span>
              {hasMonkeyEmoji ? (
                <span className="mt-2 block whitespace-nowrap text-[0.78em] sm:text-[0.82em] lg:ml-4 lg:mt-0 lg:inline-block lg:align-baseline">
                  {monkeyEmoji}
                </span>
              ) : null}
            </h1>

            {hero.description ? (
              <p className="mt-5 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
                {hero.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={hero.primaryAction.href}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:opacity-90"
              >
                {hero.primaryAction.label}
              </Link>
              <Link
                href={hero.secondaryAction.href}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                {isPublicMode() ? "Open Progress" : hero.secondaryAction.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="overview"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[0.95fr_1.05fr] lg:px-8"
      >
        <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-surface-2 shadow-card">
          <Image
            src={overview.image}
            alt={overview.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-slate-950/35 to-transparent dark:block" />
        </div>
        <div className="flex flex-col justify-center">
          <SectionHeading
            eyebrow={overview.eyebrow}
            title={overview.title}
            description={overview.description}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {overview.facts.map((item) => (
              <Card key={item.label} className="p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-foreground">
                  {item.value}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="progress"
        className="border-y border-border bg-surface/65 transition-colors duration-300"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow={progress.eyebrow}
              title={progress.title}
              description={progress.description}
            />
            <Card className="mt-8 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-6xl font-semibold tracking-tight text-foreground">
                    {progress.overall}%
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {progress.updatedAt}
                  </div>
                </div>
                <div className="rounded-full border border-success/25 bg-success/10 px-4 py-2 text-sm font-semibold text-success">
                  {progress.status}
                </div>
              </div>
              <div className="mt-8 grid gap-5">
                <ProgressBar label="Plan" value={progress.plan} />
                <ProgressBar label="Actual" value={progress.actual} />
              </div>
            </Card>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-surface-2 shadow-card">
            <Image
              src={progress.image}
              alt={progress.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-slate-950/35 to-transparent dark:block" />
          </div>
        </div>
      </section>

      <section
        id="timelapse"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[0.95fr_1.05fr] lg:px-8"
      >
        <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-surface-2 shadow-card">
          <Image
            src={timelapse.image}
            alt={timelapse.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-5 left-5 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-card">
            Latest video
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <SectionHeading
            eyebrow={timelapse.eyebrow}
            title={timelapse.title}
            description={timelapse.description}
          />
          <div className="mt-8">
            <Link
              href={timelapse.href}
              className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:opacity-90"
            >
              {timelapse.buttonLabel}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="news"
        className="border-t border-border bg-surface/65 transition-colors duration-300"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={news.eyebrow} title={news.title} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {news.items.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-lg"
              >
                <div className="relative aspect-[4/3] bg-surface-2">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 hidden bg-gradient-to-t from-slate-950/35 to-transparent dark:block" />
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {item.date}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface-3 px-5 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {APP_NAME} CM
          </span>

          <div className="flex items-center gap-4">
            <a
              href="https://linktr.ee/muxentrain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <SiLinktree className="h-4 w-4 text-green-500" />
              <span>muxentrain</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
