"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/client";
import { Button, Field, Input } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
      const next = search.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(apiError(err, "Unable to sign in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Email address">
        <Input icon={<Mail className="h-4 w-4" />} type="email" autoComplete="email" required placeholder="admin@techcatalystsummit.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
      </Field>
      <Field label="Password">
        <div className="relative">
          <Input icon={<Lock className="h-4 w-4" />} type={show ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-11" />
          <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-muted hover:text-ink" aria-label="Toggle password visibility">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      {error && <div className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      <Button type="submit" loading={loading} className="h-12 w-full text-[15px]">
        Sign in to console {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="bg-sidebar relative hidden overflow-hidden lg:block">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#0dc9c9]/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-[#0e3cad]/50 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px" }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TechCatalyst_White.png" alt="" className="h-14 w-auto" />
            <div>
              <div className="font-display text-2xl">Tech Catalyst Summit</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7fe8e8]">Admin Console</div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#5ff0f0]" /> Event management, reimagined
            </div>
            <h1 className="font-display text-5xl leading-[1.08] xl:text-6xl">
              Run every summit <span className="text-brand-gradient">from one place.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/65">
              Manage events, galleries, speakers and partners — and follow up on every community application, sponsor lead and survey response coming in from the website.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <CalendarDays className="h-5 w-5" />, t: "Events & media", d: "Editions, venues, galleries" },
              { icon: <Users className="h-5 w-5" />, t: "Community CRM", d: "Applications & leads" },
              { icon: <ShieldCheck className="h-5 w-5" />, t: "Role-based access", d: "Super admin, admin, editor" },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#5ff0f0]">{x.icon}</div>
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="text-xs text-white/55">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="bg-sidebar grid h-12 w-12 place-items-center rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/TechCatalyst_White.png" alt="" className="h-8 w-auto" />
            </div>
            <div className="font-display text-xl text-ink">Tech Catalyst Summit</div>
          </div>
          <h2 className="font-display text-4xl text-ink">Welcome back</h2>
          <p className="mt-2 mb-8 text-sm text-muted">Sign in with your admin credentials to continue.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-10 text-center text-xs text-muted">© {new Date().getFullYear()} Tech Catalyst Summit · Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
