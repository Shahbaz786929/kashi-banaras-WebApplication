"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API } from "../../lib";

type User = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

type MeResponse = {
  success: boolean;
  message: string;
  data?: User;
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API}/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const text = await response.text();

        let result: MeResponse;

        try {
          result = JSON.parse(text) as MeResponse;
        } catch {
          throw new Error(
            text || `Unable to load account. Status: ${response.status}`
          );
        }

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userFullName");
          localStorage.removeItem("userRoles");

          router.replace("/login");
          return;
        }

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Unable to load account");
        }

        setUser(result.data);
      } catch (err) {
        console.error("Account loading failed:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your account."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userRoles");

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-container">
          <p>Loading your account...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="account-page">
        <div className="account-container">
          <h1>My Account</h1>

          <div className="account-error">
            {error}
          </div>

          <Link href="/login" className="account-button">
            SIGN IN
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <div className="account-header">
          <div>
            <p className="account-eyebrow">KASHI BANARAS</p>
            <h1>My Account</h1>
            <p className="account-welcome">
              Welcome back, {user.fullName || "Customer"}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="account-logout"
          >
            LOG OUT
          </button>
        </div>

        <section className="account-card">
          <div className="account-card-title">
            <h2>Personal Information</h2>
          </div>

          <div className="account-details">
            <div className="account-detail">
              <span>FULL NAME</span>
              <strong>{user.fullName || "—"}</strong>
            </div>

            <div className="account-detail">
              <span>EMAIL</span>
              <strong>{user.email || "—"}</strong>
            </div>

            <div className="account-detail">
              <span>PHONE</span>
              <strong>{user.phone || "—"}</strong>
            </div>
          </div>
        </section>

        <section className="account-actions">
          <Link href="/orders" className="account-action-card">
            <span>MY ORDERS</span>
            <small>View your orders and purchases</small>
            <b>→</b>
          </Link>

          <Link href="/wishlist" className="account-action-card">
            <span>WISHLIST</span>
            <small>View your saved sarees</small>
            <b>→</b>
          </Link>

          <Link href="/cart" className="account-action-card">
            <span>SHOPPING BAG</span>
            <small>Continue shopping or checkout</small>
            <b>→</b>
          </Link>
        </section>
      </div>
    </main>
  );
}