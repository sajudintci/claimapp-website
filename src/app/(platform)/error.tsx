"use client";

import { ErrorState } from "@/components/claimora/states";

export default function Error({ error }: { error: Error }) {
  return <ErrorState message={error.message} />;
}
