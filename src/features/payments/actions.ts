"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function confirmManualPayment(formData: FormData) {
  const parsed = z.object({
    paymentRequestId: z.uuid(),
    projectId: z.string().min(1),
    changeOrderId: z.string().min(1),
    method: z.string().trim().min(2).max(100),
    reference: z.string().trim().max(500)
  }).safeParse({
    paymentRequestId: formData.get("paymentRequestId"),
    projectId: formData.get("projectId"),
    changeOrderId: formData.get("changeOrderId"),
    method: formData.get("method"),
    reference: formData.get("reference") ?? ""
  });
  if (!parsed.success) redirect("/projects?error=Invalid%20payment%20confirmation");
  if (!isSupabaseConfigured) {
    redirect(`/projects/${parsed.data.projectId}/change-orders/${parsed.data.changeOrderId}?preview=manual`);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_manual_payment", {
    p_payment_request_id: parsed.data.paymentRequestId,
    p_payment_method: parsed.data.method,
    p_reference: parsed.data.reference || null,
    p_receipt_file_id: null
  });
  if (error) {
    redirect(
      `/projects/${parsed.data.projectId}/change-orders/${parsed.data.changeOrderId}?error=${encodeURIComponent(error.message)}`
    );
  }
  revalidatePath(`/projects/${parsed.data.projectId}/change-orders/${parsed.data.changeOrderId}`);
  redirect(`/projects/${parsed.data.projectId}/change-orders/${parsed.data.changeOrderId}?confirmed=1`);
}
