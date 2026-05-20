"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState, useCallback } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../UserProvider"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type AuthUser = {
  id: number
  username: string
  email: string
}

type AuthResponse = {
  message?: string
  error?: string
  token?: string
  user?: AuthUser
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function Page() {
  const { setUser } = useUser()
  const [isRegistering, setIsRegistering] = useState(() => {
    if (typeof window === "undefined") return false
    return new URLSearchParams(window.location.search).get("mode") === "register"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()

  const persistSession = useCallback((data: AuthResponse) => {
    if (!data.token) {
      throw new Error("No token returned from server")
    }

    localStorage.setItem("token", data.token)
    if (data.user) {
      setUser(data.user)
      localStorage.setItem("user", JSON.stringify(data.user))
      if (data.user.username) {
        localStorage.setItem("username", data.user.username)
      }
    }
  }, [setUser])

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("")
    setMessage("")

    try {
      const endpoint = isRegistering
        ? `${API_URL}/api/auth/register`
        : `${API_URL}/api/auth/login`

      const body = isRegistering
        ? { username, email, password }
        : { email, password }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json() as AuthResponse

      if (!res.ok) {
        throw new Error(data.error || data.message || (isRegistering ? "Registration failed" : "Login failed"))
      }

      if (isRegistering) {
        setMessage(data.message || "Registration successful")
        setIsRegistering(false)
        setPassword("")
        return
      }

      persistSession(data)

      router.push("/dashboard")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong"))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 font-sans text-white selection:bg-blue-500/30">
      <section className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <h1 className="mb-8 text-center text-3xl font-semibold">
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 rounded-xl bg-neutral-800 p-1">
          <button
            type="button"
            onClick={() => setIsRegistering(false)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              !isRegistering
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegistering(true)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              isRegistering
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="ml-1 block text-xs font-medium text-neutral-400"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-transparent bg-neutral-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="ml-1 block text-xs font-medium text-neutral-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-500 bg-neutral-950 px-4 py-3 text-sm text-white outline-none shadow-[0_0_0_1px_rgba(59,130,246,0.3)] transition placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="ml-1 block text-xs font-medium text-neutral-400"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-transparent bg-neutral-800 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition hover:bg-white/5 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99]"
          >
            {isRegistering ? "Create account" : "Continue"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs text-zinc-500">
            <span className="bg-neutral-900 px-3">or continue with</span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError("")
              try {
                const res = await fetch(`${API_URL}/api/auth/google`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idToken: credentialResponse.credential }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Google login failed")
                persistSession(data)
                router.push("/dashboard")
              } catch (err: unknown) {
                setError(getErrorMessage(err, "Google sign-in failed"))
              }
            }}
            onError={() => setError("Google sign-in failed")}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-neutral-400">
          <Link href="/">
            <button className="transition hover:text-white">
              return to home
            </button>
          </Link>

          <button type="button" className="transition hover:text-white">
            Terms & Privacy
          </button>
        </div>
      </section>
    </main>
  );
}
