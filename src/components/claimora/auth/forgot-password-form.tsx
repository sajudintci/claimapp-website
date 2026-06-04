"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthField, AuthSubmitButton, authInputClass } from "./auth-fields";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid work email"),
});

type ForgotInput = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Reset link sent to <strong>{getValues("email")}</strong>. Check your inbox (mock).
        </div>
        <Link
          href="/reset-password"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Continue to reset password →
        </Link>
        <Link href="/login" className="block text-sm text-slate-600 hover:text-slate-900">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        setSent(true);
      })}
    >
      <AuthField label="Work email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={authInputClass}
          placeholder="name@insurance.co.id"
        />
      </AuthField>

      <AuthSubmitButton loading={isSubmitting}>Send reset link</AuthSubmitButton>

      <Link href="/login" className="block text-center text-sm text-slate-600 hover:text-slate-900">
        Back to sign in
      </Link>
    </form>
  );
}
