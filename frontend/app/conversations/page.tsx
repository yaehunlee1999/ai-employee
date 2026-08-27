"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "../../components/dashboard-layout";
import {
  AuthenticationRequiredError,
  type Conversation,
  formatConversationDate,
  formatDuration,
  getStatusClasses,
  loadConversations
} from "../../lib/operations";

interface TranscriptMessage {
  speaker: string;
  text: string;
}

function getSourceLabel(source: Conversation["source"]) {
  return source === "vapi" ? "Vapi call" : "AI chat";
}

function normalizeSpeaker(speaker: string) {
  const normalized = speaker.toLowerCase();

  if (normalized.includes("assistant") || normalized.includes("steve") || normalized.includes("ai")) {
    return "Steve";
  }

  if (normalized.includes("customer") || normalized.includes("caller") || normalized.includes("user")) {
    return "Customer";
  }

  return speaker.trim() || "Conversation";
}

function parseTranscript(transcript: string | null) {
  if (!transcript?.trim()) {
    return [] as TranscriptMessage[];
  }

  const messages: TranscriptMessage[] = [];
  let current: TranscriptMessage | null = null;

  for (const line of transcript.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    const speakerMatch = trimmedLine.match(/^([^:]{1,40}):\s*(.+)$/);
    if (speakerMatch) {
      if (current) {
        messages.push(current);
      }

      current = {
        speaker: normalizeSpeaker(speakerMatch[1]),
        text: speakerMatch[2]
      };
      continue;
    }

    if (current) {
      current.text += " " + trimmedLine;
    } else {
      current = { speaker: "Conversation", text: trimmedLine };
    }
  }

  if (current) {
    messages.push(current);
  }

  return messages;
}

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: () => void;
}

function ConversationDetail({ conversation, onClose }: ConversationDetailProps) {
  const transcriptMessages = parseTranscript(conversation.transcript);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close conversation details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-stone-950/45"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Conversation details"
        className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#f7f6f2] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-200 bg-[#f7f6f2]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-sm font-semibold text-amber-700">{getSourceLabel(conversation.source)}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Conversation details</h2>
            <p className="mt-2 text-sm text-stone-500">{formatConversationDate(conversation.created_at)}</p>
          </div>
          <button type="button" autoFocus onClick={onClose} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-stone-50">
            Close
          </button>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Call summary</p>
            <p className="mt-3 leading-7 text-stone-700">{conversation.summary}</p>
            <dl className="mt-5 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-3">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Customer phone</dt><dd className="mt-1 text-sm font-medium">{conversation.customer_phone || "Unknown"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Duration</dt><dd className="mt-1 text-sm font-medium">{formatDuration(conversation.duration)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Reservation</dt><dd className="mt-1 text-sm font-medium">{conversation.reservation_created ? "Created" : "Not created"}</dd></div>
            </dl>
            <div className="mt-5 border-t border-stone-100 pt-5">
              <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(conversation.status)}>{conversation.status.replaceAll("_", " ")}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Transcript</p>
                <h3 className="mt-1 text-lg font-semibold">Full conversation</h3>
              </div>
              {conversation.recording_url && (
                <a href={conversation.recording_url} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">
                  Listen to recording
                </a>
              )}
            </div>
            {transcriptMessages.length > 0 ? (
              <div className="mt-5 space-y-3">
                {transcriptMessages.map((message, index) => {
                  const isSteve = message.speaker === "Steve";

                  return (
                    <div key={`${message.speaker}-${index}`} className={"max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 " + (isSteve ? "rounded-tl-sm bg-stone-100 text-stone-800" : "ml-auto rounded-tr-sm bg-stone-950 text-white")}>
                      <p className={"text-xs font-semibold " + (isSteve ? "text-stone-500" : "text-stone-300")}>{message.speaker}</p>
                      <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                {conversation.source === "vapi" ? "A transcript was not included with this call." : "AI chat records do not include a Vapi call transcript."}
              </p>
            )}
          </section>

          {conversation.analysis && (
            <details className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-stone-900">Call analysis</summary>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
                {JSON.stringify(conversation.analysis, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    loadConversations()
      .then((records) => {
        if (isActive) {
          setConversations(records);
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

        setError(reason instanceof Error ? reason.message : "Unable to load conversations");
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

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedConversation(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedConversation]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">AI receptionist activity</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Conversations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Review completed Vapi calls and AI chats. Select a record to read its complete conversation.</p>
          </div>
          <p className="text-sm text-stone-500">{conversations.length} total record{conversations.length === 1 ? "" : "s"}</p>
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-stone-500">Loading conversations…</div>
        ) : !error && (
          <section className="mt-7 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="divide-y divide-stone-100">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversation(conversation)}
                  className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-stone-50 sm:grid-cols-[minmax(11rem,.8fr)_minmax(0,2fr)_auto] sm:items-center sm:px-6"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{conversation.customer_phone || "Unknown caller"}</p>
                    <p className="mt-1 text-sm text-stone-500">{formatConversationDate(conversation.created_at)}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (conversation.source === "vapi" ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-stone-700")}>{getSourceLabel(conversation.source)}</span>
                      <span className="text-xs text-stone-500">{formatDuration(conversation.duration)}</span>
                      <span className="text-xs text-stone-500">{conversation.reservation_created ? "Reservation created" : "No reservation"}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-700">{conversation.summary}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + getStatusClasses(conversation.status)}>{conversation.status.replaceAll("_", " ")}</span>
                    <span className="text-sm font-semibold text-sky-700">View details →</span>
                  </div>
                </button>
              ))}
            </div>
            {conversations.length === 0 && (
              <div className="px-5 py-14 text-center">
                <p className="font-semibold">No conversation records yet</p>
                <p className="mt-2 text-sm text-stone-500">New Vapi calls and AI chat history will appear here.</p>
              </div>
            )}
          </section>
        )}
      </div>
      {selectedConversation && <ConversationDetail conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
    </DashboardLayout>
  );
}
