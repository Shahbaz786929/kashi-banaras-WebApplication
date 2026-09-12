"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API } from "../../lib";

type RegisterResponse = {
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

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const response = await fetch(
        `${API}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password,
          }),
        }
      );

      const text = await response.text();

      let result: RegisterResponse;

      try {

        result = JSON.parse(
          text
        ) as RegisterResponse;

      } catch {

        throw new Error(
          text ||
          `Registration failed with status ${response.status}`
        );
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {

        throw new Error(
          result.message ||
          "Registration failed"
        );
      }

      /*
       * Registration successful.
       *
       * Backend registration API
       * already returns JWT token.
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

      console.log(
        "Registration successful:",
        result.data
      );

      /*
       * User is already logged in.
       * Go directly to home.
       */

      router.push("login");
      router.refresh();

    } catch (err) {

      console.error(
        "Registration failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="login-wrap">

      <form
        className="auth"
        onSubmit={handleSubmit}
      >

        <Link
          className="brand"
          href="/"
        >
          ✦ KASHI
          <small>BANARAS</small>
        </Link>

        <h1>
          Begin your journey.
        </h1>

        <p>
          Create your Kashi Banaras
          customer account.
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

        <label htmlFor="fullName">
          Full name
        </label>

        <input
          id="fullName"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
          placeholder="Enter your full name"
          autoComplete="name"
          required
        />

        <label htmlFor="email">
          Email
        </label>

        <input
          id="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
        />

        <label htmlFor="phone">
          Phone
        </label>

        <input
          id="phone"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          type="tel"
          placeholder="Enter your phone number"
          autoComplete="tel"
          required
        />

        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "CREATING ACCOUNT..."
            : "CREATE ACCOUNT"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
          }}
        >
          Already have an account?{" "}
          <Link href="/login">
            Sign in
          </Link>
        </p>

      </form>

    </div>
  );
}