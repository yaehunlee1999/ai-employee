"use client";

import { useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";

type DemoCallState =
  | "ready"
  | "connecting"
  | "live"
  | "ended"
  | "microphone"
  | "error";

const statusLabels: Record<DemoCallState, string> = {
  ready: "Ready",
  connecting: "Connecting",
  live: "Live with Steve",
  ended: "Call ended",
  microphone: "Microphone access required",
  error: "Voice demo unavailable"
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error) {
    const event = error as { error?: unknown; message?: unknown; type?: unknown };

    if (typeof event.message === "string" && event.message) {
      return event.message;
    }

    if (event.error instanceof Error && event.error.message) {
      return event.error.message;
    }

    if (typeof event.error === "string" && event.error) {
      return event.error;
    }

    if (typeof event.type === "string" && event.type) {
      return event.type;
    }
  }

  return "Unable to start the voice demo. Please try again.";
}

function isMicrophoneError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return ["NotAllowedError", "NotFoundError", "NotReadableError", "SecurityError"].includes(
    error.name
  );
}

export default function VapiDemo() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const isConfigurationMissing = !publicKey || !assistantId;
  const [callState, setCallState] = useState<DemoCallState>(() =>
    isConfigurationMissing ? "error" : "ready"
  );
  const [detail, setDetail] = useState<string | null>(() =>
    isConfigurationMissing ? "Voice demo configuration is missing." : null
  );
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    let isMounted = true;
    let vapi: Vapi | null = null;

    if (!publicKey || !assistantId) {
      return;
    }

    const configuredPublicKey = publicKey;

    const handleCallStart = () => {
      if (!isMounted) {
        return;
      }

      setDetail(null);
      setCallState("live");
    };
    const handleCallEnd = () => {
      if (!isMounted) {
        return;
      }

      setIsEnding(false);
      setCallState("ended");
    };
    const handleError = (error: unknown) => {
      if (!isMounted) {
        return;
      }

      setIsEnding(false);
      setCallState("error");
      setDetail(getErrorMessage(error));
    };

    async function initializeVapi() {
      try {
        const { default: VapiClient } = await import("@vapi-ai/web");

        if (!isMounted) {
          return;
        }

        vapi = new VapiClient(configuredPublicKey);
        vapi.on("call-start", handleCallStart);
        vapi.on("call-end", handleCallEnd);
        vapi.on("error", handleError);
        vapiRef.current = vapi;
        setIsSdkReady(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCallState("error");
        setDetail(getErrorMessage(error));
      }
    }

    void initializeVapi();

    return () => {
      isMounted = false;

      if (!vapi) {
        return;
      }

      vapi.removeListener("call-start", handleCallStart);
      vapi.removeListener("call-end", handleCallEnd);
      vapi.removeListener("error", handleError);
      vapiRef.current = null;
      void vapi.stop().catch(() => undefined);
    };
  }, [assistantId, publicKey]);

  async function requestMicrophoneAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new DOMException(
        "This browser does not support microphone access.",
        "NotSupportedError"
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  }

  async function startDemoCall() {
    const vapi = vapiRef.current;

    if (!vapi || !assistantId) {
      setCallState("error");
      setDetail("Voice demo configuration is unavailable. Please refresh and try again.");
      return;
    }

    setDetail(null);
    setCallState("connecting");

    try {
      await requestMicrophoneAccess();
      const call = await vapi.start(assistantId);

      if (!call) {
        setCallState("error");
        setDetail("Unable to start the voice demo. Please try again.");
      }
    } catch (error) {
      if (isMicrophoneError(error)) {
        setCallState("microphone");
        setDetail("Allow microphone access in your browser, then try again.");
        return;
      }

      setCallState("error");
      setDetail(getErrorMessage(error));
    }
  }

  async function endDemoCall() {
    const vapi = vapiRef.current;

    if (!vapi) {
      return;
    }

    setIsEnding(true);

    try {
      await vapi.stop();
      setCallState("ended");
    } catch (error) {
      setCallState("error");
      setDetail(getErrorMessage(error));
    } finally {
      setIsEnding(false);
    }
  }

  const isLive = callState === "live";
  const isConnecting = callState === "connecting";
  const buttonLabel = isConnecting
    ? "Connecting..."
    : isLive || isEnding
      ? "End Demo Call"
      : "Talk to Steve";

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={isLive ? endDemoCall : startDemoCall}
        disabled={!isSdkReady || isConnecting || isEnding}
        className="inline-flex w-full items-center justify-center rounded-full border border-[#9a7d60] bg-[#a88b6b] px-6 py-3.5 text-sm font-semibold text-[#fffdf9] shadow-[0_10px_20px_rgba(113,84,57,0.2)] transition hover:border-[#806247] hover:bg-[#8f7155] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {buttonLabel}
      </button>
      <p
        aria-live="polite"
        className="mt-3 flex items-center justify-center gap-2 text-sm text-[#766d66] sm:justify-start"
      >
        <span
          aria-hidden="true"
          className={
            "h-2 w-2 rounded-full " +
            (isLive
              ? "bg-emerald-500"
              : isConnecting
                ? "animate-pulse bg-amber-500"
                : callState === "microphone" || callState === "error"
                  ? "bg-rose-500"
                  : "bg-stone-400")
          }
        />
        {statusLabels[callState]}
      </p>
      {detail && (
        <p role="alert" className="mt-2 max-w-sm text-center text-xs leading-5 text-rose-700 sm:text-left">
          {detail}
        </p>
      )}
    </div>
  );
}
