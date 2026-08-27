"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase/client";
import DashboardLayout from "../../components/dashboard-layout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DailyReservationCount {
  date: string;
  count: number;
}

interface AnalyticsData {
  reservations_created: number;
  confirmed_reservations: number;
  cancelled_reservations: number;
  ai_calls_handled: number;
  booked_vapi_calls: number;
  calls_without_booking: number;
  call_to_booking_rate: number;
  recent_7_days_reservations: DailyReservationCount[];
}

class AuthenticationRequiredError extends Error {}

function apiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return API_URL + path;
}

function formatDay(value: string) {
  const date = new Date(value + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

async function loadAnalytics() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  const response = await fetch(apiUrl("/analytics"), {
    headers: {
      Authorization: "Bearer " + session.access_token
    }
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Unable to load analytics");
  }

  return (await response.json()) as AnalyticsData;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    loadAnalytics()
      .then((data) => {
        if (isActive) {
          setAnalytics(data);
        }
      })
      .catch((reason: unknown) => {
        if (!isActive) {
          return;
        }

        if (reason instanceof AuthenticationRequiredError) {
          router.replace("/login");
          return;
        }

        setError(reason instanceof Error ? reason.message : "Unable to load analytics");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  const maximumDailyReservations = useMemo(
    () => Math.max(...(analytics?.recent_7_days_reservations.map((day) => day.count) || [0]), 1),
    [analytics]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex min-h-[70vh] items-center justify-center p-8 text-sm text-stone-500">
          Loading analytics...
        </main>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout>
        <main className="flex min-h-[70vh] items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">Analytics unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-rose-700">{error || "Unable to load analytics"}</p>
            <Link href="/dashboard" className="mt-5 inline-flex rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50">
              Back to overview
            </Link>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  const kpiCards = [
    {
      label: "Reservations created",
      value: analytics.reservations_created,
      description: "All reservation records",
      valueClassName: "text-stone-950"
    },
    {
      label: "Confirmed reservations",
      value: analytics.confirmed_reservations,
      description: "Current confirmed bookings",
      valueClassName: "text-emerald-700"
    },
    {
      label: "AI calls handled",
      value: analytics.ai_calls_handled,
      description: "Distinct Vapi call IDs",
      valueClassName: "text-sky-700"
    },
    {
      label: "Call to booking rate",
      value: analytics.call_to_booking_rate + "%",
      description: analytics.booked_vapi_calls + " booked Vapi call" + (analytics.booked_vapi_calls === 1 ? "" : "s"),
      valueClassName: "text-amber-700"
    }
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">
              Restaurant operations
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Analytics
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              A clear view of reservation creation and the calls your AI receptionist handled.
            </p>
          </div>
          <Link
            href="/conversations"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-stone-500 hover:bg-stone-50"
          >
            Review conversations
          </Link>
        </header>

        <section
          aria-label="Analytics key performance indicators"
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {kpiCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-stone-600">{card.label}</p>
              <p className={"mt-3 text-3xl font-semibold tracking-tight " + card.valueClassName}>
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.55fr)]">
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.02em]">Recent reservation trend</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Reservations created during the last seven calendar days.
                </p>
              </div>
              <Link href="/reservations" className="text-sm font-semibold text-sky-700 hover:underline">
                View reservations
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-4" aria-label="Reservations created per day">
              {analytics.recent_7_days_reservations.map((day) => {
                const height = (day.count / maximumDailyReservations) * 100;

                return (
                  <div key={day.date} className="flex min-w-0 flex-col items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums text-stone-800">{day.count}</p>
                    <div className="flex h-40 w-full max-w-14 items-end bg-stone-100 p-1">
                      <div
                        className="w-full bg-stone-950"
                        style={{ height: day.count === 0 ? "0%" : Math.max(height, 6) + "%" }}
                        title={day.count + " reservations created on " + day.date}
                      />
                    </div>
                    <p className="text-center text-xs leading-4 text-stone-500">{formatDay(day.date)}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Reservation changes
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-700">
              {analytics.cancelled_reservations}
            </p>
            <h2 className="mt-2 text-lg font-semibold">Cancelled reservations</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Current reservation records with a cancelled status.
            </p>

            {analytics.ai_calls_handled > 0 ? (
              <div className="mt-6 border-t border-stone-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Recorded call outcomes
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-stone-600">Calls linked to a booking</dt>
                    <dd className="font-semibold text-emerald-700">{analytics.booked_vapi_calls}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-stone-600">Calls without a recorded booking</dt>
                    <dd className="font-semibold text-stone-900">{analytics.calls_without_booking}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-stone-500">
                  Only reservations linked to the same restaurant&apos;s Vapi calls are counted as bookings.
                </p>
              </div>
            ) : (
              <p className="mt-6 border-t border-stone-100 pt-5 text-sm leading-6 text-stone-500">
                Call outcomes will appear after the first Vapi call is recorded.
              </p>
            )}
          </article>
        </section>
      </main>
    </DashboardLayout>
  );
}
