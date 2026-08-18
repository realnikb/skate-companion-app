"use client";

import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useActionState } from "react";

import { sendSignInLink, sendSignUpLink, type SignInState } from "./actions";
import styles from "./sign-in.module.scss";

const initialState: SignInState = { status: "idle" };

export function SignInForm({
  mode = "sign-in",
  nextPath,
}: {
  mode?: "sign-in" | "sign-up";
  nextPath?: string;
}) {
  const [state, action, pending] = useActionState(
    mode === "sign-up" ? sendSignUpLink : sendSignInLink,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className={styles.success} role="status">
        <CheckCircle2 />
        <h2>Check your inbox</h2>
        <p>{state.message}</p>
        <span>The link signs you in instantly—no password required.</span>
      </div>
    );
  }

  return (
    <form action={action} className={styles.form}>
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <label htmlFor="email">Email address</label>
      <div className={styles.inputWrap}>
        <Mail aria-hidden="true" />
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-describedby={state.message ? "sign-in-message" : undefined}
          aria-invalid={state.status === "error"}
        />
      </div>
      {state.message && (
        <p className={styles.error} id="sign-in-message" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Sending link…" : "Continue with email"}
        {!pending && <ArrowRight aria-hidden="true" />}
      </button>
      <small>
        {mode === "sign-up"
          ? "Your free account is created when you open the link."
          : "We’ll only sign you in if an account already exists."}
      </small>
    </form>
  );
}
