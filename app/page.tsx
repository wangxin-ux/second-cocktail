import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[12%] h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/[0.035] blur-3xl"
      />

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <p className="mb-7 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-white/40">
          second
        </p>

        <h1 className="text-balance text-[2.65rem] font-medium leading-[1.06] tracking-[-0.055em] text-stone-100 sm:text-5xl">
          Your night deserves a second story.
        </h1>

        <p className="mt-5 max-w-xs text-sm leading-6 text-white/38">
          A drink shaped around you. Then, one person worth meeting.
        </p>

        <Link
          href="/profile"
          className="mt-12 min-h-14 w-full rounded-full border border-white/15 bg-white px-6 text-sm font-semibold tracking-[-0.01em] text-neutral-950 transition-colors duration-200 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:bg-stone-300"
        >
          <span className="flex min-h-14 items-center justify-center">
            Begin Tonight
          </span>
        </Link>
      </section>
    </main>
  );
}
