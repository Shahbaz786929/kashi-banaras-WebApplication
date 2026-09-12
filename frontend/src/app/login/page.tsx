"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API } from "../../lib";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    userId: number;
    email: string;
    fullName: string;
    roles: string[];
  };
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const text = await response.text();

      let result: LoginResponse;

      try {
        result = JSON.parse(text) as LoginResponse;
      } catch {
        throw new Error(
          text || `Login failed with status ${response.status}`
        );
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Invalid email or password"
        );
      }

      /*
       * SAVE AUTH DATA
       */
      localStorage.setItem(
        "accessToken",
        result.data.accessToken
      );

      localStorage.setItem(
        "userId",
        String(result.data.userId)
      );

      localStorage.setItem(
        "userEmail",
        result.data.email
      );

      localStorage.setItem(
        "userFullName",
        result.data.fullName
      );

      localStorage.setItem(
        "userRoles",
        JSON.stringify(result.data.roles)
      );

      /*
       * CHECK USER ROLE
       */
      const roles = result.data.roles || [];

      const isAdmin = roles.some(
        (role) => role.toUpperCase() === "ROLE_ADMIN"
      );

      /*
       * ADMIN
       * → Admin Panel
       */
      if (isAdmin) {
        router.push("/admin");
        router.refresh();
        return;
      }

      /*
       * CUSTOMER
       * → Requested page OR Home
       */
      const redirect = searchParams.get("redirect");

      let redirectTo = "/";

      if (
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//")
      ) {
        redirectTo = redirect;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="auth" onSubmit={handleSubmit}>
        <Link className="brand" href="/">
          ✦ KASHI
          <small>BANARAS</small>
        </Link>

        <h1>Welcome back.</h1>

        <p>
          Enter your details to continue your journey through
          Banaras.
        </p>

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              border: "1px solid #c94b4b",
              color: "#c94b4b",
              background: "#fff7f7",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <label htmlFor="email">Email</label>

        <input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>

        <input
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
          }}
        >
          New here?{" "}
          <Link href="/register">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}