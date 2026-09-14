import { useEffect, useState } from "react";
import { Brand } from "./Navigation";
import { AppShell } from "./AppShell";
import { loadTheme } from "./SettingsPage";
import { supabase } from "./supabase";

export function AuthGate() {
  const [session, setSession] = useState<unknown>(null);
  const [ready, setReady] = useState(!supabase || import.meta.env.MODE === "test");
  useEffect(() => {
    document.documentElement.dataset.theme = loadTheme();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready)
    return (
      <section className="loading-state" role="status">
        <span className="loader" />
        <Brand />
        <p>Preparing your fleet workspace…</p>
      </section>
    );
  return !supabase || import.meta.env.MODE === "test" || session ? <AppShell /> : <Login />;
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <main className="login-page">
      <div className="login-visual">
        <Brand />
        <div>
          <p className="eyebrow">Fleet operations</p>
          <h1>
            Every vehicle.
            <br />
            One clear view.
          </h1>
          <p>Manage your fleet, maintenance, and service history from one connected workspace.</p>
        </div>
      </div>
      <form
        className="panel login-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          if (!supabase) return;
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) setError(error.message);
        }}
      >
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in to Fleet</h2>
        <p>Use your Summit West Signs account to continue.</p>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
