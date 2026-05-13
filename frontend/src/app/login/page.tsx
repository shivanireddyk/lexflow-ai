"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    try {

      setLoading(true);

      const response = await api.post(
        "/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      router.push("/");

    } catch (error) {

      console.error(
        "Login failed",
        error
      );

      alert("Invalid credentials");

    } finally {

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-md">

        <h1 className="text-3xl font-bold text-white mb-2">
          LexFlow AI
        </h1>

        <p className="text-slate-400 mb-8">
          Secure Legal Operations Platform
        </p>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 text-white font-medium"
          >

            {loading
              ? "Signing In..."
              : "Sign In"}

          </button>

        </div>

      </div>

    </main>
  );
}