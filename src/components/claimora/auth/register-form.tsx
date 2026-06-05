"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthField, AuthSubmitButton, authInputClass } from "./auth-fields";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid work email"),
    inviteCode: z.string().min(6, "Invitation code is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        router.push("/login");
      })}
    >
      <p className="rounded-lg border border-primary/20 bg-primary-50 px-3 py-2 text-xs text-primary-dark">
        Registration is invitation-only. Use the code sent by your insurance administrator.
      </p>

      <AuthField label="Full name" error={errors.fullName?.message}>
        <input
          {...register("fullName")}
          type="text"
          autoComplete="name"
          className={authInputClass}
          placeholder="Alya Rahma"
        />
      </AuthField>

      <AuthField label="Work email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={authInputClass}
          placeholder="name@insurance.co.id"
        />
      </AuthField>

      <AuthField label="Invitation code" error={errors.inviteCode?.message}>
        <input
          {...register("inviteCode")}
          type="text"
          className={authInputClass}
          placeholder="INV-XXXX-XXXX"
        />
      </AuthField>

      <AuthField label="Password" error={errors.password?.message}>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className={authInputClass}
          placeholder="Create a password"
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

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" {...register("acceptTerms")} className="mt-0.5 rounded border-slate-300" />
        <span>
          I agree to the claim data processing terms and secure environment policy.
        </span>
      </label>
      {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>}

      <AuthSubmitButton loading={isSubmitting}>Create account</AuthSubmitButton>

      <Link href="/login" className="block text-center text-sm text-slate-600 hover:text-slate-900">
        Already have an account? Sign in
      </Link>
    </form>
  );
}
