"use client";
import { useFormState, useFormStatus } from "react-dom";
import { loginPassword, sendMagic } from "./actions";
import Globe from "@/components/Globe";

const initial = { error: undefined as string | undefined, ok: undefined as string | undefined };

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" style={{ width: "100%" }} disabled={pending}>
      {pending ? "One moment…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [pwState, pwAction] = useFormState(loginPassword, initial);
  const [magicState, magicAction] = useFormState(sendMagic, initial);

  return (
    <div className="auth">
      <div className="authbox">
        <div className="authhead">
          <span className="mk">
            <img src="/brand/globe.png" alt="EVP" />
          </span>
          <span>
            <div className="co">Expert Vacation Planners</div>
            <div className="sub">Command 26</div>
          </span>
        </div>
        <div className="authbody">
          {pwState?.error && <div className="err">{pwState.error}</div>}
          {magicState?.error && <div className="err">{magicState.error}</div>}
          {magicState?.ok && <div className="ok">{magicState.ok}</div>}

          <form action={pwAction}>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" autoComplete="email" placeholder="you@expertvacationplanners.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
            </div>
            <SubmitBtn label="Sign in" />
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="eyebrow" style={{ color: "var(--slate)" }}>or</span>
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <form action={magicAction}>
            <div className="field">
              <label>Email a sign-in link</label>
              <input name="email" type="email" autoComplete="email" placeholder="you@expertvacationplanners.com" required />
            </div>
            <button className="btn ghost" type="submit" style={{ width: "100%" }}>
              Send magic link
            </button>
          </form>
        </div>
        <div className="authfoot">
          Team travel run by someone who has been on the bus. · Orlando, FL
        </div>
      </div>
    </div>
  );
}
