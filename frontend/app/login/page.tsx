"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 text-stone-950 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <section className="w-full max-w-md">
          <Link
            href="/"
            aria-label="DineBell home"
            className="inline-flex items-center gap-2.5 font-semibold tracking-tight transition hover:text-stone-600"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-950 text-sm text-white">
              D
            </span>
            <span>DineBell</span>
          </Link>

          <div className="mt-8 border border-stone-200 bg-white p-6 shadow-sm sm:mt-10 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Restaurant operations
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                Welcome back
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">
                Sign in to manage your reservations, guest conversations, and DineBell receptionist.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <p
                  role="alert"
                  className="border-l-2 border-rose-600 bg-rose-50 px-3 py-2.5 text-sm leading-6 text-rose-800"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 border-t border-stone-200 pt-5 text-sm leading-6 text-stone-600">
              New restaurant owner?{" "}
              <Link
                href="/signup"
                className="font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-950"
              >
                Create your restaurant account
              </Link>
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-stone-500 transition hover:text-stone-950"
          >
            <span aria-hidden="true" className="mr-2">←</span>
            Back to DineBell
          </Link>
        </section>
      </div>
    </main>
  );
}
