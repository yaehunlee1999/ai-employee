"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface OnboardingResponse {
  requires_email_confirmation: boolean;
}

function apiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return API_URL + path;
}

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/auth/onboarding"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restaurant_name: restaurantName,
          owner_name: ownerName,
          email,
          password,
          phone: phone || null,
          address: address || null
        })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.detail || "Unable to create your restaurant account");
      }

      const onboarding: OnboardingResponse = body;
      setSuccessMessage(
        onboarding.requires_email_confirmation
          ? "Your account is ready. Confirm your email, then sign in."
          : "Your restaurant account is ready. You can sign in now."
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create your restaurant account"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 text-stone-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          aria-label="AI Employee home"
          className="inline-flex items-center gap-2.5 font-semibold tracking-tight transition hover:text-stone-600"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-950 text-sm text-white">
            A
          </span>
          <span>AI Employee</span>
        </Link>

        <section className="mx-auto mt-8 w-full max-w-2xl border border-stone-200 bg-white p-6 shadow-sm sm:mt-10 sm:p-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Restaurant onboarding
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Set up your restaurant
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Create the owner account that keeps your reservations and AI receptionist in one place.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-stone-950">Restaurant details</h2>
                <span className="text-xs text-stone-500">Required fields</span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-800">Restaurant name</span>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(event) => setRestaurantName(event.target.value)}
                    className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                    autoComplete="organization"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-800">Owner name</span>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                    autoComplete="name"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-stone-500">
                  Use at least 8 characters.
                </span>
              </label>
            </div>

            <div className="border-t border-stone-200 pt-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-stone-950">Contact details</h2>
                <span className="text-xs text-stone-500">Optional</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Add these now if you would like them available for your restaurant profile.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-800">Phone (optional)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                    autoComplete="tel"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-800">Address (optional)</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="mt-2 h-11 w-full border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-200"
                    autoComplete="street-address"
                  />
                </label>
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="border-l-2 border-rose-600 bg-rose-50 px-3 py-2.5 text-sm leading-6 text-rose-800"
              >
                {error}
              </p>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                className="border-l-2 border-emerald-600 bg-emerald-50 px-3 py-3 text-sm leading-6 text-emerald-900"
              >
                <p>{successMessage}</p>
                <Link
                  href="/login"
                  className="mt-2 inline-block font-semibold underline decoration-emerald-300 underline-offset-4 transition hover:decoration-emerald-900"
                >
                  Go to login
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || Boolean(successMessage)}
              className="h-11 w-full bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Create restaurant account"}
            </button>
          </form>

          <p className="mt-6 border-t border-stone-200 pt-5 text-sm leading-6 text-stone-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-950"
            >
              Sign in
            </Link>
          </p>
        </section>

        <Link
          href="/"
          className="mx-auto mt-6 flex w-full max-w-2xl text-sm font-medium text-stone-500 transition hover:text-stone-950"
        >
          <span aria-hidden="true" className="mr-2">←</span>
          Back to AI Employee
        </Link>
      </div>
    </main>
  );
}
