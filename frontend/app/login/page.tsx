"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase/client";
import { DineBellWordmark } from "../../components/dinebell-brand";

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
    <main className="dinebell-auth-shell min-h-screen px-5 py-6 text-[#25211f] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <section className="w-full max-w-md">
          <Link
            href="/"
            aria-label="DineBell home"
            className="inline-flex transition hover:opacity-75"
          >
            <DineBellWordmark priority className="text-[1.9rem]" />
          </Link>

          <div className="dinebell-auth-card mt-8 rounded-[1.5rem] p-6 sm:mt-10 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a88b6b]">
                Restaurant operations
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                Welcome back
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#766d66]">
                Sign in to manage your reservations, guest conversations, and DineBell receptionist.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-[#403934]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="dinebell-input mt-2 h-11 w-full px-3 text-sm transition placeholder:text-[#a69b91]"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#403934]">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="dinebell-input mt-2 h-11 w-full px-3 text-sm transition placeholder:text-[#a69b91]"
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
                className="dinebell-primary-button h-11 w-full px-4 text-sm font-semibold"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 border-t border-[#e7ddd2] pt-5 text-sm leading-6 text-[#766d66]">
              New restaurant owner?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#6e513a] underline decoration-[#cdb292] underline-offset-4 transition hover:text-[#25211f]"
              >
                Create your restaurant account
              </Link>
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[#766d66] transition hover:text-[#25211f]"
          >
            <span aria-hidden="true" className="mr-2">←</span>
            Back to DineBell
          </Link>
        </section>
      </div>
    </main>
  );
}
