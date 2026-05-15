"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye, EyeOff, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "../UserProvider"

export default function Page() {
  const { user, setUser } = useUser()
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [realname, setuserealname] = useState("")
  const [userlogined, setuserlogined] = useState(false)
  const [loggedUser, setLoggedUser] = useState<{username?: string, email?: string} | null>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("mode") === "register") {
      setIsRegistering(true)
    }

    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    if (token && userStr) {
      const user = JSON.parse(userStr)
      setLoggedUser(user)
      setuserealname(user.username || "")
      setuserlogined(true)
    }
  }, [])
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    

    try {
      if (isRegistering) {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Registration failed");
        }

        console.log("Registered:", data);

       
        setIsRegistering(false);
      } else {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await res.json();

        const user=data.user.username
        setuserealname(user)
        

        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }

        // 🔥 IMPORTANT: store token
        if (data.token) {
          localStorage.setItem("token", data.token);
          setuserlogined(true)
        } else if (data.accessToken) {
          
          localStorage.setItem("token", data.accessToken);
        } else {
          throw new Error("No token returned from server");
        }

        // optional: store user
        if (data.user) {
          
          setUser(data.user)
        }

       
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error(err.message);
      alert(err.message); 
    } finally {
    
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 font-sans text-white selection:bg-blue-500/30">
      <section className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <h1 className="mb-8 text-center text-3xl font-semibold">{realname?realname:"Trading Sim"}</h1>

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

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs font-medium uppercase text-neutral-500">
            or continue with
          </span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <button
            type="button"
            aria-label="Continue with Google"
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C20.187 1.44 17.4 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
          </button>
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
