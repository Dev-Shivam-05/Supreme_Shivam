import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] flex-col justify-center overflow-hidden pt-36">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="container-x relative">
        <div className="hud tick mb-6">Error · 404</div>
        <h1 className="font-poster display-1 text-accent">DNF</h1>
        <p className="mt-6 max-w-md text-lg text-fg-muted">
          Did not finish — this page never made it to the grid. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex w-fit items-center gap-2 bg-accent px-6 py-3.5 font-semibold text-accent-ink"
        >
          Back to start
        </Link>
      </div>
    </section>
  );
}
