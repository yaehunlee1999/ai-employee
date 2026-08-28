import Link from "next/link";

import { DineBellIcon, DineBellWordmark } from "../components/dinebell-brand";
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
        <div className="flex items-center justify-between border-b border-[#eee4d9] pb-3 text-sm">
          <span className="font-medium text-[#766d66]">Today&apos;s service</span>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            Confirmed
          </span>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">7:30 PM · 4 guests</p>
              <p className="mt-1 text-xs text-[#8b7e73]">Maya R.</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between border-t border-[#eee4d9] pt-3">
            <div>
              <p className="font-semibold">8:00 PM · 2 guests</p>
              <p className="mt-1 text-xs text-[#8b7e73]">James T.</p>
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
        <div className="rounded-xl bg-[#f7eee4] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5a40]">
            DineBell call · Completed
          </p>
          <p className="mt-2 text-sm font-medium text-stone-900">
            Table for four confirmed for Friday evening.
          </p>
        </div>
        <div className="mt-3 border-t border-[#eee4d9] pt-3 text-sm">
          <p className="font-medium">Caller asked about tonight&apos;s availability.</p>
          <p className="mt-1 text-xs text-[#8b7e73]">Conversation summary available</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[#eee4d9] pb-3">
        <p className="text-sm font-semibold">Weekly activity</p>
        <span className="text-xs font-medium text-[#8b7e73]">Last 7 days</span>
      </div>
      <div className="mt-5 flex h-20 items-end gap-2" aria-label="Reservation trend preview">
        {[38, 58, 42, 76, 53, 68, 88].map((height, index) => (
          <div key={index} className="flex flex-1 items-end">
            <div className="w-full rounded-t-sm bg-[#a88b6b]" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#8b7e73]">
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
        className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2.5rem] bg-[#dfc8b0]/50 blur-3xl"
      />
      <section
        aria-label="DineBell call and reservation preview"
        className="overflow-hidden rounded-[1.75rem] border border-[#e7ddd2] bg-[#fffdf9] shadow-[0_24px_65px_rgba(78,58,42,0.15)]"
      >
        <div className="flex items-center justify-between border-b border-[#eee4d9] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#b59675] text-[#25211f] shadow-sm">
              <DineBellIcon className="h-5 w-5" />
            </span>
            <div>
              <DineBellWordmark className="text-lg" />
              <p className="mt-1 text-xs text-[#8b7e73]">Restaurant line</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e513a]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />Live call
            </span>
            <p className="mt-1 font-mono text-xs text-[#a69b91]">00:42</p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between rounded-xl bg-[#f7eee4] px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7058]">
                DineBell receptionist
              </p>
              <p className="mt-1 text-sm font-semibold text-[#403934]">Steve is handling the call</p>
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
            <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-[#f0e6db] px-4 py-3 text-[#403934]">
              <p className="mb-1 text-xs font-semibold text-[#8b7e73]">Steve</p>
              Good evening. How can I help with your reservation?
            </div>
            <div className="ml-auto max-w-[84%] rounded-2xl rounded-tr-sm bg-[#25211f] px-4 py-3 text-[#fffdf9]">
              I&apos;d like a table for four this Friday at 7:30.
            </div>
            <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-[#f0e6db] px-4 py-3 text-[#403934]">
              Absolutely. I&apos;ll confirm the details for you.
            </div>
          </div>

          <div className="mt-6 border border-[#d9c5ad] bg-[#fbf4eb] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5a40]">
                  Reservation status
                </p>
                <p className="mt-1 text-sm font-semibold text-[#403934]">Ready to confirm</p>
              </div>
              <span className="rounded-full bg-[#fffdf9] px-2.5 py-1 text-xs font-semibold text-[#6e513a] ring-1 ring-[#d9c5ad]">
                4 guests
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#e4d3bd] pt-3 text-xs text-[#6e513a]">
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
    <main className="dinebell-page overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <Link href="/" className="flex items-center transition hover:opacity-75">
            <DineBellWordmark priority className="text-[1.8rem]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-[#766d66] transition hover:text-[#25211f] sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#25211f] px-4 py-2 text-sm font-semibold text-[#fffdf9] transition hover:bg-[#403934]"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,.94fr)_minmax(420px,.86fr)] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-[#dfd0c1] bg-[#fffdf9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a6655]">
              Always available for restaurants
            </p>
            <div className="mt-6">
              <DineBellWordmark className="text-[2.35rem] sm:text-[2.8rem]" />
            </div>
            <h1 className="mt-2 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              The AI receptionist that never misses a restaurant call.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#6f655d] sm:text-lg">
              DineBell answers every call, captures reservations, and keeps guest conversations in one place—so your team can stay focused on service.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:items-start">
              <div>
                <p className="mb-3 text-sm font-semibold text-[#5f4632]">
                  Talk to Steve, DineBell&apos;s AI receptionist.
                </p>
                <VapiDemo />
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#25211f] px-6 py-3.5 text-sm font-semibold text-[#fffdf9] shadow-[0_10px_24px_rgba(37,33,31,0.16)] transition hover:bg-[#403934]"
              >
                Set up DineBell <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <a
                href="#how-it-works"
                className="text-center text-sm font-semibold text-[#6e513a] underline decoration-[#cdb292] underline-offset-4 transition hover:text-[#25211f] sm:text-left"
              >
                See how it works
              </a>
            </div>
          </div>
          <HeroProductCard />
        </section>

        <section aria-label="DineBell value" className="border-y border-[#e4d8cb] py-5">
          <div className="grid gap-3 text-center sm:grid-cols-3 sm:gap-0">
            {valueStrip.map((value, index) => (
              <p
                key={value}
                className={
                  "text-sm font-semibold text-[#5f554e] " +
                  (index > 0 ? "sm:border-l sm:border-[#e4d8cb]" : "")
                }
              >
                {value}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-[#fffdf9] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a88b6b]">The problem</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              The phone should not be the busiest table in your restaurant.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {problems.map(([number, title, description]) => (
              <article key={number} className="border-t border-[#dfd0c1] pt-5">
                <p className="font-mono text-xs text-[#a88b6b]">{number}</p>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[#766d66]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-start lg:px-10">
          <div className="md:sticky md:top-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a88b6b]">The DineBell difference</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              A calm, capable digital host—on the phone.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#766d66]">
              DineBell manages call details while your team takes care of the dining room.
            </p>
          </div>
          <div className="divide-y divide-[#e4d8cb] border-t border-[#e4d8cb]">
            {solutions.map(([title, description], index) => (
              <article key={title} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
                <span className="font-mono text-sm text-[#a88b6b]">0{index + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 leading-7 text-[#766d66]">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#25211f] py-20 text-[#fffdf9] sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d7b998]">How it works</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              From a ringing phone to a confirmed table in three steps.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-[#c8bbb0]">
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
                <p className="text-sm font-semibold text-[#d7b998]">{number}</p>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[#d8cdc3]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#fffdf9] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a88b6b]">Built for restaurant owners</p>
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
              <article key={label} className="border border-[#e7ddd2] bg-[#f8f3ed] p-3 shadow-[0_12px_30px_rgba(70,53,39,0.05)]">
                <div className="bg-[#fffdf9] p-5">
                  <div className="flex items-center justify-between border-b border-[#eee4d9] pb-4">
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
        <div className="dinebell-bronze-panel mx-auto max-w-5xl px-6 py-12 text-center sm:px-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5f4632]">DineBell for your restaurant</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-4xl">
            Give every caller a helpful answer—even when the dining room is full.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-[#403934]">
            Set up your always-available digital receptionist and keep every reservation in view from day one.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex rounded-full bg-[#25211f] px-6 py-3.5 text-sm font-semibold text-[#fffdf9] shadow-[0_10px_20px_rgba(37,33,31,0.18)] transition hover:bg-[#403934]"
          >
            Get started with DineBell <span aria-hidden="true" className="ml-2">→</span>
          </Link>
          <p className="mt-5 text-sm text-[#5f4632]">
            Questions?{" "}
            <a
              href="mailto:hello@dinebell.app"
              className="font-semibold underline decoration-[#7a5a40]/45 underline-offset-4 transition hover:decoration-[#7a5a40]"
            >
              Contact us at hello@dinebell.app
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-[#e7ddd2] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#766d66] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <DineBellWordmark className="text-xl" />
            <span className="h-4 w-px bg-[#d8ccc0]" />
            <p>© 2026</p>
          </div>
          <div className="flex gap-5">
            <Link href="/login" className="transition hover:text-[#25211f]">Owner sign in</Link>
            <Link href="/signup" className="transition hover:text-[#25211f]">Get started</Link>
            <a
              href="mailto:hello@dinebell.app"
              aria-label="Contact DineBell at hello@dinebell.app"
              className="transition hover:text-[#25211f]"
            >
              hello@dinebell.app
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
