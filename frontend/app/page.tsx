import Link from "next/link";

import VapiDemo from "../components/vapi-demo";

const problems = [
  [
    "01",
    "Missed calls become missed covers",
    "When the team is serving tables, an unanswered caller often books somewhere else."
  ],
  [
    "02",
    "Busy hours pull staff off the floor",
    "Collecting names, times, and party sizes by phone interrupts the service guests can see."
  ],
  [
    "03",
    "Reservations get lost in the rush",
    "Paper notes and voicemail callbacks make it harder to know what was promised."
  ]
];

const solutions = [
  [
    "Answers every restaurant call",
    "DineBell's AI receptionist is ready while your team is busy, after hours, or with guests."
  ],
  [
    "Captures reservation details",
    "Steve collects the name, phone number, date, time, and party size for every booking."
  ],
  [
    "Keeps your service in view",
    "Review reservations, call summaries, and guest conversations from one calm, clear dashboard."
  ]
];

const valueStrip = [
  "Never miss a reservation call",
  "Capture more bookings",
  "Keep staff focused on guests"
];

function ProductPreview({ type }: { type: "reservations" | "conversations" | "analytics" }) {
  if (type === "reservations") {
    return (
      <>
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-sm">
          <span className="font-medium text-stone-500">Today&apos;s service</span>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            Confirmed
          </span>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">7:30 PM · 4 guests</p>
              <p className="mt-1 text-xs text-stone-500">Maya R.</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
            <div>
              <p className="font-semibold">8:00 PM · 2 guests</p>
              <p className="mt-1 text-xs text-stone-500">James T.</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </>
    );
  }

  if (type === "conversations") {
    return (
      <>
        <div className="rounded-xl bg-sky-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            DineBell call · Completed
          </p>
          <p className="mt-2 text-sm font-medium text-stone-900">
            Table for four confirmed for Friday evening.
          </p>
        </div>
        <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
          <p className="font-medium">Caller asked about tonight&apos;s availability.</p>
          <p className="mt-1 text-xs text-stone-500">Conversation summary available</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <p className="text-sm font-semibold">Weekly activity</p>
        <span className="text-xs font-medium text-stone-500">Last 7 days</span>
      </div>
      <div className="mt-5 flex h-20 items-end gap-2" aria-label="Reservation trend preview">
        {[38, 58, 42, 76, 53, 68, 88].map((height, index) => (
          <div key={index} className="flex flex-1 items-end">
            <div className="w-full rounded-t-sm bg-stone-900" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Reservation trends and call outcomes at a glance.
      </p>
    </>
  );
}

function HeroProductCard() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        aria-hidden="true"
        className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2.5rem] bg-amber-200/40 blur-3xl"
      />
      <section
        aria-label="DineBell call and reservation preview"
        className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl shadow-stone-300/30"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-950 text-sm font-semibold text-white">
              D
            </span>
            <div>
              <p className="text-sm font-semibold">DineBell</p>
              <p className="mt-0.5 text-xs text-stone-500">Restaurant line</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />Live call
            </span>
            <p className="mt-1 font-mono text-xs text-stone-400">00:42</p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                DineBell receptionist
              </p>
              <p className="mt-1 text-sm font-semibold">Steve is handling the call</p>
            </div>
            <div aria-label="Voice activity" className="flex h-7 items-center gap-1">
              <span className="h-2 w-1 rounded-full bg-stone-400" />
              <span className="h-5 w-1 rounded-full bg-stone-700" />
              <span className="h-3 w-1 rounded-full bg-stone-500" />
              <span className="h-6 w-1 rounded-full bg-stone-900" />
              <span className="h-3 w-1 rounded-full bg-stone-500" />
              <span className="h-5 w-1 rounded-full bg-stone-700" />
              <span className="h-2 w-1 rounded-full bg-stone-400" />
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-6">
            <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-stone-700">
              <p className="mb-1 text-xs font-semibold text-stone-500">Steve</p>
              Good evening. How can I help with your reservation?
            </div>
            <div className="ml-auto max-w-[84%] rounded-2xl rounded-tr-sm bg-stone-950 px-4 py-3 text-white">
              I&apos;d like a table for four this Friday at 7:30.
            </div>
            <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-stone-700">
              Absolutely. I&apos;ll confirm the details for you.
            </div>
          </div>

          <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Reservation status
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">Ready to confirm</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                4 guests
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-emerald-200 pt-3 text-xs text-emerald-900">
              <span>Friday · 7:30 PM</span>
              <span>Captured by Steve</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f7f6f2] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-950 text-sm text-white">
              D
            </span>
            <span>DineBell</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-stone-600 transition hover:text-stone-950 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,.94fr)_minmax(420px,.86fr)] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
              Always available for restaurants
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
              DineBell
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              The AI receptionist that never misses a restaurant call.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-stone-600 sm:text-lg">
              DineBell answers every call, captures reservations, and keeps guest conversations in one place—so your team can stay focused on service.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:items-start">
              <div>
                <p className="mb-3 text-sm font-semibold text-stone-800">
                  Talk to Steve, DineBell&apos;s AI receptionist.
                </p>
                <VapiDemo />
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                Set up DineBell <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <a
                href="#how-it-works"
                className="text-center text-sm font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950 sm:text-left"
              >
                See how it works
              </a>
            </div>
          </div>
          <HeroProductCard />
        </section>

        <section aria-label="DineBell value" className="border-y border-stone-200 py-5">
          <div className="grid gap-3 text-center sm:grid-cols-3 sm:gap-0">
            {valueStrip.map((value, index) => (
              <p
                key={value}
                className={
                  "text-sm font-semibold text-stone-700 " +
                  (index > 0 ? "sm:border-l sm:border-stone-200" : "")
                }
              >
                {value}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">The problem</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              The phone should not be the busiest table in your restaurant.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {problems.map(([number, title, description]) => (
              <article key={number} className="border-t border-stone-300 pt-5">
                <p className="font-mono text-xs text-stone-400">{number}</p>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-stone-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-start lg:px-10">
          <div className="md:sticky md:top-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">The DineBell difference</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              A calm, capable digital host—on the phone.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-stone-600">
              DineBell manages call details while your team takes care of the dining room.
            </p>
          </div>
          <div className="divide-y divide-stone-200 border-t border-stone-200">
            {solutions.map(([title, description], index) => (
              <article key={title} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
                <span className="font-mono text-sm text-stone-400">0{index + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 leading-7 text-stone-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-stone-950 py-20 text-stone-50 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">How it works</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              From a ringing phone to a confirmed table in three steps.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-stone-400">
              No new routine for your host team. DineBell keeps every outcome visible in your owner dashboard.
            </p>
          </div>
          <ol className="mt-10 grid gap-0 border-y border-white/15 md:grid-cols-3 md:divide-x md:divide-white/15">
            {[
              [
                "01",
                "A guest calls",
                "They call your restaurant line whenever it suits them—during service or after hours."
              ],
              [
                "02",
                "DineBell answers",
                "Steve responds naturally, gathers booking details, and records the reservation."
              ],
              [
                "03",
                "You stay in control",
                "Review reservations, conversation history, and call activity from your secure dashboard."
              ]
            ].map(([number, title, description]) => (
              <li
                key={number}
                className="border-b border-white/15 px-0 py-7 last:border-b-0 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
              >
                <p className="text-sm font-semibold text-amber-300">{number}</p>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-stone-300">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-700">Built for restaurant owners</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Every call and reservation, all in one place.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              ["Reservations", "See today at a glance", "reservations"],
              ["Conversations", "Know what every caller needed", "conversations"],
              ["Analytics", "Understand call performance", "analytics"]
            ].map(([label, title, type]) => (
              <article key={label} className="border border-stone-200 bg-stone-50 p-3">
                <div className="bg-white p-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <p className="text-sm font-semibold">{label}</p>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <div className="mt-5">
                    <ProductPreview type={type as "reservations" | "conversations" | "analytics"} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-5xl border border-amber-400 bg-amber-300 px-6 py-12 text-center sm:px-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-950/70">DineBell for your restaurant</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-4xl">
            Give every caller a helpful answer—even when the dining room is full.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-stone-800">
            Set up your always-available digital receptionist and keep every reservation in view from day one.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex rounded-full bg-stone-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Get started with DineBell <span aria-hidden="true" className="ml-2">→</span>
          </Link>
          <p className="mt-5 text-sm text-amber-950/80">
            Questions?{" "}
            <a
              href="mailto:hello@dinebell.app"
              className="font-semibold underline decoration-amber-950/40 underline-offset-4 transition hover:decoration-amber-950"
            >
              Contact us at hello@dinebell.app
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>© 2026 DineBell. Better restaurant service, one answered call at a time.</p>
          <div className="flex gap-5">
            <Link href="/login" className="transition hover:text-stone-950">Owner sign in</Link>
            <Link href="/signup" className="transition hover:text-stone-950">Get started</Link>
            <a
              href="mailto:hello@dinebell.app"
              aria-label="Contact DineBell at hello@dinebell.app"
              className="transition hover:text-stone-950"
            >
              hello@dinebell.app
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
