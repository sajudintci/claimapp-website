"use client";

import { useState } from "react";
import { generateId } from "@/lib/utils";

type CommentEntry = {
  id: string;
  author: string;
  initials: string;
  body: string;
  createdAt: string;
};

type ClaimCommentTabProps = {
  claimId: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ClaimCommentTab({ claimId }: ClaimCommentTabProps) {
  const storageKey = `claim-comments-${claimId}`;
  const [comments, setComments] = useState<CommentEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as CommentEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");

  function persist(next: CommentEntry[]) {
    setComments(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }

  function addComment() {
    const body = draft.trim();
    if (!body) return;
    const entry: CommentEntry = {
      id: generateId(),
      author: "You",
      initials: "YO",
      body,
      createdAt: new Date().toISOString(),
    };
    persist([entry, ...comments]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-500 dark:text-slate-400">
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="flex gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {comment.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{comment.author}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(comment.createdAt)}</p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{comment.body}</p>
              </div>
            </article>
          ))
        )}

      <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={addComment}
          disabled={!draft.trim()}
          className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}
