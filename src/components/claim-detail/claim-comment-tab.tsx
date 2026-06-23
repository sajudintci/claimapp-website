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
    <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No comments yet. Add a note for reviewers or approvers.
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {comment.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{comment.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(comment.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
              </div>
            </article>
          ))
        )}

      <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add an approval note…"
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={addComment}
          disabled={!draft.trim()}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}
