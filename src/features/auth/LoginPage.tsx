import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/http";
import { setSessionToken } from "@/lib/auth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.auth.login(email, password);
      setSessionToken(result.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed.");
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Use the account created for your org in the Clarion admin console.
            </p>
          </div>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm text-signal-critical">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Continue
          </Button>
        </form>
      </Panel>
    </div>
  );
};
