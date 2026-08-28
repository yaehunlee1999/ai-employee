"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "../../components/dashboard-layout";
import {
  AuthenticationRequiredError,
  type Reservation,
  cancelReservationById,
  formatReservationDate,
  formatReservationTime,
  getStatusClasses,
  loadCurrentReservations,
  sortReservations
} from "../../lib/operations";

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

        setError(reason instanceof Error ? reason.message : "Unable to load reservations");
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
    () => sortReservations(reservations),
    [reservations]
  );

  async function cancelReservation(reservationId: string) {
    setError(null);
    setCancellingId(reservationId);

    try {
      await cancelReservationById(reservationId);
      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: "cancelled" }
            : reservation
        )
      );
    } catch (reason) {
      if (reason instanceof AuthenticationRequiredError) {
        router.replace("/login");
        return;
      }

      setError(reason instanceof Error ? reason.message : "Unable to cancel reservation");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-stone-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">Guest bookings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Reservations</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Review every reservation in service-time order. Cancelling a booking updates the existing reservation record.
          </p>
        </header>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-stone-500">Loading reservations…</div>
        ) : (
          <section className="mt-7 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">All reservations</h2>
                <p className="mt-1 text-sm text-stone-500">{sortedReservations.length} total booking{sortedReservations.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th scope="col" className="px-6 py-4">Date</th>
                    <th scope="col" className="px-6 py-4">Time</th>
                    <th scope="col" className="px-6 py-4">Customer</th>
                    <th scope="col" className="px-6 py-4">Phone</th>
                    <th scope="col" className="px-6 py-4">Guests</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedReservations.map((reservation) => {
                    const isCancelled = reservation.status.toLowerCase() === "cancelled";
                    const isCancelling = cancellingId === reservation.id;

                    return (
                      <tr key={reservation.id} className={isCancelled ? "bg-stone-50/70 text-stone-500" : ""}>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-stone-900">{formatReservationDate(reservation.reservation_date)}</td>
                        <td className="whitespace-nowrap px-6 py-4">{formatReservationTime(reservation.reservation_time)}</td>
                        <td className="px-6 py-4 font-medium text-stone-900">{reservation.customer?.name || "Guest"}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-stone-600">{reservation.customer?.phone || "—"}</td>
                        <td className="px-6 py-4">{reservation.guests}</td>
                        <td className="px-6 py-4"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(reservation.status)}>{reservation.status}</span></td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={isCancelled || isCancelling}
                            onClick={() => cancelReservation(reservation.id)}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
                          >
                            {isCancelled ? "Cancelled" : isCancelling ? "Cancelling…" : "Cancel"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-stone-100 md:hidden">
              {sortedReservations.map((reservation) => {
                const isCancelled = reservation.status.toLowerCase() === "cancelled";
                const isCancelling = cancellingId === reservation.id;

                return (
                  <article key={reservation.id} className="px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900">{reservation.customer?.name || "Guest"}</p>
                        <p className="mt-1 text-sm text-stone-500">{formatReservationDate(reservation.reservation_date)} · {formatReservationTime(reservation.reservation_time)}</p>
                      </div>
                      <span className={"inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(reservation.status)}>{reservation.status}</span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-stone-500">Phone</dt><dd className="mt-1 font-medium">{reservation.customer?.phone || "—"}</dd></div>
                      <div><dt className="text-stone-500">Guests</dt><dd className="mt-1 font-medium">{reservation.guests}</dd></div>
                    </dl>
                    <button
                      type="button"
                      disabled={isCancelled || isCancelling}
                      onClick={() => cancelReservation(reservation.id)}
                      className="mt-5 w-full rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
                    >
                      {isCancelled ? "Reservation cancelled" : isCancelling ? "Cancelling…" : "Cancel reservation"}
                    </button>
                  </article>
                );
              })}
            </div>

            {sortedReservations.length === 0 && (
              <div className="px-5 py-14 text-center">
                <p className="font-semibold">No reservations yet</p>
                <p className="mt-2 text-sm text-stone-500">Reservations captured by DineBell will appear here.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
