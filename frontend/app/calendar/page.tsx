"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "../../components/dashboard-layout";
import {
  AuthenticationRequiredError,
  type Reservation,
  formatReservationDate,
  formatReservationTime,
  getLocalDateKey,
  getStatusClasses,
  loadCurrentReservations,
  sortReservations
} from "../../lib/operations";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKey(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const numberOfDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= numberOfDays; day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export default function CalendarPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    loadCurrentReservations()
      .then((records) => {
        if (isActive) {
          setReservations(records);
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

        setError(reason instanceof Error ? reason.message : "Unable to load calendar");
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

  const reservationsByDate = useMemo(() => {
    const grouped = new Map<string, Reservation[]>();

    for (const reservation of reservations) {
      const existing = grouped.get(reservation.reservation_date) || [];
      existing.push(reservation);
      grouped.set(reservation.reservation_date, existing);
    }

    for (const records of grouped.values()) {
      records.sort((first, second) =>
        first.reservation_time.localeCompare(second.reservation_time)
      );
    }

    return grouped;
  }, [reservations]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedReservations = useMemo(
    () => sortReservations(reservationsByDate.get(selectedDate) || []),
    [reservationsByDate, selectedDate]
  );
  const today = getLocalDateKey(new Date());

  function changeMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
  }

  function selectDate(date: Date) {
    const dateKey = getLocalDateKey(date);
    setSelectedDate(dateKey);

    if (monthKey(date) !== monthKey(visibleMonth)) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-stone-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">Service planning</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Reservation calendar</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Select a date to see the reservations your restaurant is expecting. Each count reflects the existing reservation records.
          </p>
        </header>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
        )}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-stone-500">Loading calendar…</div>
        ) : (
          <section className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
            <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-lg transition hover:bg-stone-50"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold">{formatMonth(visibleMonth)}</h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-lg transition hover:bg-stone-50"
                >
                  →
                </button>
              </div>

              <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                {weekdayLabels.map((day) => <div key={day} className="pb-3">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 border-l border-t border-stone-100">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-20 border-b border-r border-stone-100 bg-stone-50/50 sm:min-h-24" />;
                  }

                  const dateKey = getLocalDateKey(date);
                  const reservationCount = reservationsByDate.get(dateKey)?.length || 0;
                  const isSelected = selectedDate === dateKey;
                  const isToday = today === dateKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(date)}
                      aria-pressed={isSelected}
                      className={
                        "min-h-20 border-b border-r border-stone-100 p-2 text-left transition hover:bg-amber-50 sm:min-h-24 sm:p-3 " +
                        (isSelected ? "bg-amber-100/80 ring-1 ring-inset ring-amber-300" : "bg-white")
                      }
                    >
                      <span className={"grid h-7 w-7 place-items-center rounded-full text-sm font-semibold " + (isToday ? "bg-stone-950 text-white" : "text-stone-800")}>
                        {date.getDate()}
                      </span>
                      {reservationCount > 0 && (
                        <span className="mt-2 inline-flex rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">
                          {reservationCount} booking{reservationCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </article>

            <aside className="rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-100 px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold text-amber-700">Selected day</p>
                <h2 className="mt-1 text-xl font-semibold">{formatReservationDate(selectedDate)}</h2>
                <p className="mt-2 text-sm text-stone-500">{selectedReservations.length} reservation{selectedReservations.length === 1 ? "" : "s"}</p>
              </div>
              <div className="divide-y divide-stone-100">
                {selectedReservations.map((reservation) => (
                  <article key={reservation.id} className="px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatReservationTime(reservation.reservation_time)} · {reservation.customer?.name || "Guest"}</p>
                        <p className="mt-1 text-sm text-stone-500">{reservation.guests} guests{reservation.customer?.phone ? ` · ${reservation.customer.phone}` : ""}</p>
                      </div>
                      <span className={"inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(reservation.status)}>{reservation.status}</span>
                    </div>
                  </article>
                ))}
                {selectedReservations.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-stone-500">No reservations scheduled for this date.</div>
                )}
              </div>
            </aside>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
