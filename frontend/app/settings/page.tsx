"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase/client";
import DashboardLayout from "../../components/dashboard-layout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RestaurantSettings {
  restaurant_name: string;
  vapi_assistant_id: string | null;
}

class AuthenticationRequiredError extends Error {}

function apiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return API_URL + path;
}

async function getAuthorizationHeader() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  return {
    Authorization: "Bearer " + session.access_token
  };
}

async function loadRestaurantSettings() {
  const response = await fetch(apiUrl("/settings"), {
    headers: await getAuthorizationHeader()
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Unable to load receptionist settings");
  }

  return (await response.json()) as RestaurantSettings;
}

export default function SettingsPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [savedAssistantId, setSavedAssistantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadRestaurantSettings()
      .then((settings) => {
        if (!isActive) {
          return;
        }

        setRestaurantName(settings.restaurant_name);
        setAssistantId(settings.vapi_assistant_id || "");
        setSavedAssistantId(settings.vapi_assistant_id);
      })
      .catch((reason: unknown) => {
        if (!isActive) {
          return;
        }

        if (reason instanceof AuthenticationRequiredError) {
          router.replace("/login");
          return;
        }

        setError(
          reason instanceof Error ? reason.message : "Unable to load receptionist settings"
        );
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

  async function saveVapiAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(apiUrl("/settings/vapi"), {
        method: "PATCH",
        headers: {
          ...(await getAuthorizationHeader()),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vapi_assistant_id: assistantId.trim() || null
        })
      });

      if (response.status === 401) {
        throw new AuthenticationRequiredError();
      }

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.detail || "Unable to update Vapi settings");
      }

      const settings = body as RestaurantSettings;
      setRestaurantName(settings.restaurant_name);
      setAssistantId(settings.vapi_assistant_id || "");
      setSavedAssistantId(settings.vapi_assistant_id);
      setSuccessMessage(
        settings.vapi_assistant_id
          ? "DineBell receptionist connection saved."
          : "DineBell receptionist disconnected."
      );
    } catch (reason) {
      if (reason instanceof AuthenticationRequiredError) {
        router.replace("/login");
        return;
      }

      setError(
        reason instanceof Error ? reason.message : "Unable to update receptionist settings"
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex min-h-[70vh] items-center justify-center p-8 text-zinc-600">
          Loading receptionist settings...
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950 sm:p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            DineBell receptionist settings
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {restaurantName || "Restaurant"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Connect the DineBell receptionist that should answer calls and capture reservations for this restaurant.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="text-sm font-medium">DineBell connection status</p>
          <p
            className={
              "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
              (savedAssistantId
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200")
            }
          >
            {savedAssistantId ? "Connected" : "Not connected"}
          </p>
          {savedAssistantId && (
            <p className="mt-3 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
              {savedAssistantId}
            </p>
          )}
        </div>

        <form onSubmit={saveVapiAssistant} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Vapi assistant ID</span>
            <input
              type="text"
              value={assistantId}
              onChange={(event) => setAssistantId(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-blue-400 dark:focus:ring-blue-950"
              placeholder="assistant_..."
              autoComplete="off"
            />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            This securely connects DineBell to your configured Vapi assistant. Leave it empty and save to disconnect.
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/50 dark:text-rose-200"
            >
              {error}
            </p>
          )}
          {successMessage && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200"
            >
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isSaving ? "Saving..." : "Save DineBell connection"}
          </button>
        </form>
      </section>
    </main>
    </DashboardLayout>
  );
}
