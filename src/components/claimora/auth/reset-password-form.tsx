"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthField, AuthSubmitButton, authInputClass } from "./auth-fields";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include one uppercase letter")
      .regex(/[0-9]/, "Include one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetInput = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        router.push("/login");
      })}
    >
      <AuthField label="New password" error={errors.password?.message}>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className={authInputClass}
          placeholder="Create a strong password"
        />
      </AuthField>

      <AuthField label="Confirm password" error={errors.confirmPassword?.message}>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className={authInputClass}
          placeholder="Re-enter password"
        />
      </AuthField>

      <AuthSubmitButton loading={isSubmitting}>Update password</AuthSubmitButton>

      <Link href="/login" className="block text-center text-sm text-slate-600 hover:text-slate-900">
        Back to sign in
      </Link>
    </form>
  );
}
