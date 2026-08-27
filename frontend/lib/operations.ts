import { supabase } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: string;
  notes: string | null;
  customer?: {
    name: string;
    phone: string | null;
  };
}

export interface RestaurantAdmin {
  restaurant_id: string;
  email: string;
  name: string | null;
  role: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  customer_phone: string | null;
  summary: string;
  transcript: string | null;
  recording_url: string | null;
  duration: number | null;
  analysis: Record<string, unknown> | null;
  source: "vapi" | "ai_chat";
  reservation_created: boolean;
  status: string;
}

export class AuthenticationRequiredError extends Error {}

export type AuthorizationHeaders = Record<string, string>;

export function apiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return API_URL + path;
}

export async function getAuthorizationHeaders(): Promise<AuthorizationHeaders> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  return { Authorization: "Bearer " + session.access_token };
}

async function readError(response: Response, fallbackMessage: string) {
  const body = await response.json().catch(() => null);
  return body?.detail || fallbackMessage;
}

export async function loadCurrentRestaurantAdmin(headers?: AuthorizationHeaders) {
  const response = await fetch(apiUrl("/auth/me"), {
    headers: headers || await getAuthorizationHeaders()
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load your restaurant account"));
  }

  return (await response.json()) as RestaurantAdmin;
}

export async function loadCurrentReservations(headers?: AuthorizationHeaders) {
  const response = await fetch(apiUrl("/reservations"), {
    headers: headers || await getAuthorizationHeaders()
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load reservations"));
  }

  return (await response.json()) as Reservation[];
}

export async function loadConversations(headers?: AuthorizationHeaders) {
  const response = await fetch(apiUrl("/conversations"), {
    headers: headers || await getAuthorizationHeaders()
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load conversations"));
  }

  return (await response.json()) as Conversation[];
}

export async function cancelReservationById(reservationId: string) {
  const response = await fetch(apiUrl("/reservations/" + reservationId), {
    method: "DELETE",
    headers: await getAuthorizationHeaders()
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Unable to cancel reservation"));
  }
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

export function getReservationTimestamp(reservation: Reservation) {
  const timestamp = new Date(
    reservation.reservation_date + "T" + reservation.reservation_time
  ).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export function sortReservations(reservations: Reservation[]) {
  return [...reservations].sort(
    (first, second) =>
      getReservationTimestamp(first) - getReservationTimestamp(second)
  );
}

export function formatReservationDate(value: string, includeYear = true) {
  const date = new Date(value + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {})
  }).format(date);
}

export function formatReservationTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(2000, 0, 1, hour, minute));
}

export function formatConversationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatDuration(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const totalSeconds = Math.round(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    case "call_ended":
      return "bg-sky-100 text-sky-800";
    case "no_reservation":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-stone-100 text-stone-700";
  }
}
