"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "../../components/dashboard-layout";
import {
  AuthenticationRequiredError,
  type Conversation,
  type Reservation,
  type RestaurantAdmin,
  formatConversationDate,
  formatDuration,
  formatReservationDate,
  formatReservationTime,
  getLocalDateKey,
  getStatusClasses,
  getAuthorizationHeaders,
  loadConversations,
  loadCurrentReservations,
  loadCurrentRestaurantAdmin,
  sortReservations
} from "../../lib/operations";

interface OverviewData {
  restaurantAdmin: RestaurantAdmin;
  reservations: Reservation[];
  conversations: Conversation[];
}

function LoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8 text-sm text-stone-500">
      Loading your restaurant overview…
    </div>
  );
}

async function loadOverview() {
  const headers = await getAuthorizationHeaders();
  const [restaurantAdmin, reservations, conversations] = await Promise.all([
    loadCurrentRestaurantAdmin(headers),
    loadCurrentReservations(headers),
    loadConversations(headers)
  ]);

  return { restaurantAdmin, reservations, conversations } satisfies OverviewData;
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    loadOverview()
      .then((data) => {
        if (isActive) {
          setOverview(data);
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

        setError(reason instanceof Error ? reason.message : "Unable to load overview");
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

  const sortedReservations = useMemo(
    () => sortReservations(overview?.reservations || []),
    [overview]
  );
  const summary = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const reservations = overview?.reservations || [];

    return {
      today: reservations.filter((reservation) => reservation.reservation_date === today).length,
      confirmed: reservations.filter(
        (reservation) => reservation.status.toLowerCase() === "confirmed"
      ).length,
      cancelled: reservations.filter(
        (reservation) => reservation.status.toLowerCase() === "cancelled"
      ).length,
      aiCalls: (overview?.conversations || []).filter(
        (conversation) => conversation.source === "vapi"
      ).length
    };
  }, [overview]);

  if (isLoading) {
    return <DashboardLayout><LoadingState /></DashboardLayout>;
  }

  if (error || !overview) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-10 sm:px-8">
          <section className="w-full rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-700">Overview unavailable</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {error || "Unable to load your restaurant account."}
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Sign in again
            </Link>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const kpis = [
    { label: "Today’s reservations", value: summary.today, detail: "Scheduled for today", tone: "text-sky-700" },
    { label: "Confirmed", value: summary.confirmed, detail: "Active bookings", tone: "text-emerald-700" },
    { label: "Cancelled", value: summary.cancelled, detail: "Reservation changes", tone: "text-rose-700" },
    { label: "Calls handled", value: summary.aiCalls, detail: "Handled by DineBell", tone: "text-violet-700" }
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">Restaurant operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Good to see you, {overview.restaurantAdmin.name || "owner"}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Your restaurant&apos;s digital receptionist keeps every call, reservation, and guest conversation in view.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/calendar" className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-stone-500 hover:bg-stone-50">
              View calendar
            </Link>
            <Link href="/reservations" className="inline-flex items-center justify-center rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700">
              Manage reservations
            </Link>
          </div>
        </header>

        <section aria-label="Today’s operational summary" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <article key={kpi.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-stone-600">{kpi.label}</p>
              <p className={"mt-3 text-3xl font-semibold tracking-tight " + kpi.tone}>{kpi.value}</p>
              <p className="mt-2 text-sm text-stone-500">{kpi.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">Upcoming reservations</h2>
                <p className="mt-1 text-sm text-stone-500">Ordered by date and service time.</p>
              </div>
              <Link href="/reservations" className="text-sm font-semibold text-sky-700 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-stone-100">
              {sortedReservations.slice(0, 5).map((reservation) => (
                <div key={reservation.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">{reservation.customer?.name || "Guest"}</p>
                    <p className="mt-1 text-sm text-stone-500">{formatReservationDate(reservation.reservation_date)} · {formatReservationTime(reservation.reservation_time)} · {reservation.guests} guests</p>
                  </div>
                  <span className={"inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(reservation.status)}>
                    {reservation.status}
                  </span>
                </div>
              ))}
              {sortedReservations.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-stone-500">No reservations yet.</div>
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">Recent receptionist activity</h2>
                <p className="mt-1 text-sm text-stone-500">Latest calls and guest conversations handled by DineBell.</p>
              </div>
              <Link href="/conversations" className="text-sm font-semibold text-sky-700 hover:underline">Open history</Link>
            </div>
            <div className="divide-y divide-stone-100">
              {overview.conversations.slice(0, 4).map((conversation) => (
                <Link key={conversation.id} href="/conversations" className="block px-5 py-4 transition hover:bg-stone-50 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-900">{conversation.source === "vapi" ? "DineBell call" : "Guest conversation"}</p>
                    <span className="whitespace-nowrap text-xs text-stone-500">{formatDuration(conversation.duration)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{conversation.summary}</p>
                  <p className="mt-2 text-xs text-stone-500">{formatConversationDate(conversation.created_at)}</p>
                </Link>
              ))}
              {overview.conversations.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-stone-500">DineBell conversations will appear here once calls begin.</div>
              )}
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
