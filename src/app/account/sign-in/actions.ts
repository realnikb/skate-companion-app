"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: SignInState = { status: "idle" };

async function sendLink(
  _state: SignInState,
  formData: FormData,
  shouldCreateUser: boolean,
): Promise<SignInState> {
  void _state;
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const requestedNext = valueFromForm(formData, "next");
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

  if (!origin) {
    return {
      status: "error",
      message: "We couldn't start sign-in. Please try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser,
    },
  });

  if (error) {
    console.error("Supabase magic-link send failed", {
      code: error.code,
      status: error.status,
      message: error.message,
      origin,
    });

    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        status: "error",
        message:
          "Too many sign-in emails were requested. Please wait a few minutes and try again.",
      };
    }

    return {
      status: "error",
      message:
        "We couldn't send the email. Please wait a moment and try again.",
    };
  }

  return {
    status: "success",
    message: "Check your inbox. We sent you a secure sign-in link.",
  };
}

function valueFromForm(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function sendSignInLink(
  state: SignInState = initialState,
  formData: FormData,
) {
  return sendLink(state, formData, false);
}

export async function sendSignUpLink(
  state: SignInState = initialState,
  formData: FormData,
) {
  return sendLink(state, formData, true);
}
