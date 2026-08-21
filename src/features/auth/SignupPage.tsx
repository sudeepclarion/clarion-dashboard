import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/http";
import { clearActiveTeamId, setSessionToken } from "@/lib/auth";

const FREE_HINT =
  "Use your company email (not Gmail, Yahoo, Outlook, etc.). Your organization is created from the email domain.";

const previewFromEmail = (email: string): string | null => {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain.includes(".")) return null;
  const label = domain.split(".")[0] ?? domain;
  const name = label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return name || null;
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const orgPreview = useMemo(() => previewFromEmail(email), [email]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.auth.signup(name, email, password);
      clearActiveTeamId();
      setSessionToken(result.token);
      navigate("/?onboarding=1", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-900 p-6">
      <Panel className="w-full max-w-md p-6">
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <Wordmark />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Start free trial</h1>
            <p className="mt-1 text-sm text-ink-muted">
              7 days free. {FREE_HINT}
            </p>
          </div>
          <Field label="Your name">
            <Input
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Work email">
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>
          {orgPreview ? (
            <p className="text-2xs text-ink-muted">
              Organization: <span className="font-medium text-ink">{orgPreview}</span>
            </p>
          ) : null}
          <Field label="Password">
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>
          {error ? <p className="text-sm text-signal-critical">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Create account
          </Button>
          <p className="text-center text-2xs text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-ink underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </Panel>
    </div>
  );
};
