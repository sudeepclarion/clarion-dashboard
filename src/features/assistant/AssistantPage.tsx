import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, SendHorizontal, Trash2, Wrench } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Capabilities, ChatJob, ChatMessage, DashboardState } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format/dates";
import { renderMarkdown } from "@/lib/format/markdown";
import { ApiError } from "@/lib/api/http";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForJob = async (jobId: string): Promise<ChatJob> => {
  let job = await api.chat.job(jobId);
  while (job.status === "running") {
    await sleep(1200);
    job = await api.chat.job(job.id);
  }
  if (job.status === "failed") {
    throw new ApiError(job.error ?? "Assistant turn failed", 500, "chat_failed");
  }
  return job;
};

/** Start a chat turn and poll until the backend finishes (avoids proxy 504s). */
const sendAndWait = async (message: string): Promise<ChatJob> => {
  const started = await api.chat.send(message);
  return waitForJob(started.id);
};

const CAPABILITY_LABELS: Array<{ key: keyof Capabilities; label: string }> = [
  { key: "ai", label: "Reasoning model" },
  { key: "jira", label: "Jira tickets" },
  { key: "jiraBoard", label: "Jira board sync" },
  { key: "slack", label: "Slack channels" },
  { key: "slackSocket", label: "Slack conversations" },
  { key: "github", label: "GitHub activity" },
];

const SUGGESTIONS = [
  "Summarise this week and tell me who's at risk of slipping",
  "Move the refund flow deadline out by 7 days — the client pushed the release",
  "Rahul says the webhook is basically done, just docs left",
  "Which overdue tickets have no owner?",
  "Put everything updated in the last 14 days into the current sprint",
];

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser && "justify-end")}>
      {!isUser ? (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-clarion/20 to-violet-electric/20 ring-1 ring-inset ring-cyan-clarion/25">
          <Bot className="h-3.5 w-3.5 text-cyan-clarion" />
        </span>
      ) : null}

      <div className={cn("min-w-0 max-w-[46rem]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5",
            isUser
              ? "bg-surface-raised text-xs leading-relaxed text-ink ring-1 ring-inset ring-hairline"
              : "border border-hairline bg-surface/70"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className="prose-clarion"
              // Model-authored Markdown, escaped before rendering by renderMarkdown.
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}
        </div>

        {message.actions.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.actions.map((action, index) => (
              <Badge key={index} mono className="bg-cyan-clarion/[0.08] text-cyan-clarion ring-cyan-clarion/20">
                <Wrench className="h-2.5 w-2.5" />
                {action.tool}
              </Badge>
            ))}
          </div>
        ) : null}

        <p className="mt-1 text-[10px] text-ink-faint">{relativeTime(message.at)}</p>
      </div>
    </div>
  );
};

export const AssistantPage = ({ state }: { state: DashboardState }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [resuming, setResuming] = useState(false);
  const resumedJobId = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const aiReady = state.integrations.capabilities.ai;

  const history = useQuery({
    queryKey: queryKeys.chat,
    queryFn: () => api.chat.history(),
  });

  const send = useMutation({
    mutationFn: (message: string) => sendAndWait(message),
    onMutate: async () => {
      // User message is persisted immediately — show it while the model works.
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat });
    },
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat });
      if (job.result?.boardChanged) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.state });
      }
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat });
    },
  });

  const clear = useMutation({
    mutationFn: () => api.chat.clear(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat }),
  });

  const messages = history.data?.history ?? [];
  const thinking = send.isPending || resuming;

  // If the page reloads mid-turn, keep polling the in-flight job.
  useEffect(() => {
    const active = history.data?.activeJob;
    if (!active || active.status !== "running" || send.isPending) return;
    if (resumedJobId.current === active.id) return;
    resumedJobId.current = active.id;

    let cancelled = false;
    setResuming(true);
    void (async () => {
      try {
        const job = await waitForJob(active.id);
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: queryKeys.chat });
        if (job.result?.boardChanged) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.state });
        }
      } catch {
        if (!cancelled) await queryClient.invalidateQueries({ queryKey: queryKeys.chat });
      } finally {
        if (!cancelled) setResuming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [history.data?.activeJob, send.isPending, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  const submit = (): void => {
    const message = input.trim();
    if (!message || thinking) return;
    setInput("");
    send.mutate(message);
  };

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="Ask Clarion"
        description="It answers from live board, sprint, Jira, Slack and repo data — and only changes something when you actually ask for a change."
        actions={
          messages.length ? (
            <IconButton label="Clear conversation" variant="danger" onClick={() => clear.mutate()}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          ) : null
        }
      />

      {!aiReady ? <AiUnavailableNotice feature="The assistant" /> : null}

      <Panel flush className="flex h-[calc(100vh-24rem)] min-h-[24rem] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!messages.length && !thinking ? (
            <div className="mx-auto max-w-2xl py-8">
              <div className="text-center">
                <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-clarion/20 to-violet-electric/20 ring-1 ring-inset ring-cyan-clarion/25">
                  <Bot className="h-5 w-5 text-cyan-clarion" />
                </span>
                <p className="text-sm font-medium text-ink">What do you need?</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Questions get answers. Statements about work get recorded. Requests get applied.
                </p>
              </div>

              <div className="mt-5 space-y-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={!aiReady}
                    onClick={() => setInput(suggestion)}
                    className="w-full rounded-lg border border-hairline bg-surface/60 px-3 py-2 text-left text-xs text-ink-muted transition-colors hover:border-cyan-clarion/30 hover:text-ink disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {thinking ? (
            <div className="flex items-center gap-2.5 text-xs text-ink-faint">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-clarion/20 to-violet-electric/20">
                <Bot className="h-3.5 w-3.5 animate-pulse text-cyan-clarion" />
              </span>
              Thinking, reading the board, and applying anything you asked for…
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {send.error ? (
          <div className="px-4 pb-2">
            <Callout tone="error">{(send.error as Error).message}</Callout>
          </div>
        ) : null}

        <div className="border-t border-hairline p-3">
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              value={input}
              disabled={!aiReady}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter is a newline — the convention people expect.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Tell Clarion what changed, or ask about the team…"
              className="flex-1"
            />
            <Button
              variant="primary"
              size="lg"
              icon={<SendHorizontal className="h-4 w-4" />}
              disabled={!aiReady || !input.trim() || thinking}
              loading={thinking}
              onClick={submit}
            >
              Send
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-ink-faint">
            Enter to send · Shift + Enter for a new line · destructive changes always need an explicit request
          </p>
        </div>
      </Panel>

      <Panel className="mt-4">
        <PanelHeader
          title="What it can reach"
          description="The assistant is only offered tools for integrations you have configured, so it can never claim data it cannot actually read."
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CAPABILITY_LABELS.map(({ key, label }) => {
            const enabled = state.integrations.capabilities[key];
            return (
              <Badge
                key={key}
                className={
                  enabled
                    ? "bg-signal-positive/10 text-signal-positive ring-signal-positive/25"
                    : "bg-base-900/60 text-ink-faint"
                }
              >
                {label}
              </Badge>
            );
          })}
        </div>
      </Panel>
    </>
  );
};
