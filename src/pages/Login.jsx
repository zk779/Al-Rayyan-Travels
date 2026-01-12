import { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import logo from "../assets/logo-dark.png";
import logoLight from "../assets/logo-light.png";
import Hero from "../assets/home/hero.jpg";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:9000

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Adjust endpoint if needed: /auth/login, /api/auth/login etc.
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setError(data?.error || data?.message || "Login failed.");
        return;
      }

      // ✅ store in context + localStorage
      login({ token: data.token, user: data.user });

      // ✅ redirect
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-white">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-[#0b1220]/95 via-[#0b1220]/80 to-[#0b1220]/60" />
      <div className="fixed inset-0 -z-10 [background:radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="max-w-16 rounded-md border border-sky-600 shadow-[0_30px_30px_rgba(59,130,246,0.35)]">
              <img src={logo} alt="Al Rayyan Travels" className="z-10" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Al Rayyan
              </div>
              <div className="opacity-70">Travels.</div>
            </div>
          </Link>
        </header>

        <main className="grid flex-1 grid-cols-1 items-center gap-10 pb-10 lg:grid-cols-2">
          {/* Left */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute -right-14 top-0 hidden h-[620px] w-[260px] opacity-25 lg:block"
              viewBox="0 0 260 620"
              fill="none"
            >
              <path
                d="M210 10 C 140 70, 250 180, 160 250 C 80 320, 210 420, 90 500 C 10 560, 90 610, 40 610"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="6 10"
              />
            </svg>

            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-white/60 text-center md:text-left">
                WELCOME BACK
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-center md:text-left">
                Log in to your account<span className="text-sky-400">.</span>
              </h1>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/60">
                      Email
                    </label>
                    <div className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 focus-within:border-sky-400/40 focus-within:bg-white/[0.12]">
                      <span className="text-white/60 group-focus-within:text-sky-300">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="abcx@gmail.com"
                        className="h-full w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password + toggle */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/60">
                      Password
                    </label>
                    <div className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 focus-within:border-sky-400/40 focus-within:bg-white/[0.12]">
                      <span className="text-white/60 group-focus-within:text-sky-300">
                        <Lock className="h-4 w-4" />
                      </span>

                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        name="password"
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-full w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="text-white/40 hover:text-white/75 transition"
                        aria-label={
                          showPass ? "Hide password" : "Show password"
                        }
                      >
                        {showPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-sky-500/40"
                      />
                      Remember me
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-white/70 hover:text-white"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Error */}
                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-12 rounded-xl bg-sky-500 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:bg-sky-400 active:bg-sky-600 disabled:opacity-60"
                    >
                      {loading ? "Logging in..." : "Log in"}
                    </button>
                  </div>

                  <div className="pt-4 text-center text-xs text-white/50">
                    By logging in, you agree to our{" "}
                    <Link
                      to="/terms"
                      className="text-white/70 hover:text-white"
                    >
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link
                      to="/privacy"
                      className="text-white/70 hover:text-white"
                    >
                      Privacy
                    </Link>
                    .
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative hidden w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0b1220]/70 via-transparent to-[#0b1220]/10" />
            <img src={Hero} alt="" className="h-full w-full object-cover" />
            <div className="absolute bottom-2 right-8 flex items-center gap-2 opacity-90">
              <img src={logoLight} alt="" width={100} className="z-10" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
