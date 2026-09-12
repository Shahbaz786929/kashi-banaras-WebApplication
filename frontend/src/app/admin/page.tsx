"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API } from "../../lib";

type DashboardData = {
  customers: number;
  products: number;
  orders: number;
};

type DashboardResponse = {
  success: boolean;
  message: string;
  data?: DashboardData;
};

type AdminCardProps = {
  href: string;
  number: string | number;
  title: string;
  description: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] =
    useState<DashboardData>({
      customers: 0,
      products: 0,
      orders: 0,
    });

  useEffect(() => {
    async function loadDashboard() {
      const token =
        localStorage.getItem("accessToken");

      const rolesText =
        localStorage.getItem("userRoles");

      if (!token) {
        router.replace(
          "/login?redirect=/admin"
        );
        return;
      }

      let roles: string[] = [];

      try {
        roles = rolesText
          ? JSON.parse(rolesText)
          : [];
      } catch {
        roles = [];
      }

      const isAdmin = roles.some(
        (role) =>
          role.toUpperCase() === "ROLE_ADMIN"
      );

      if (!isAdmin) {
        router.replace("/");
        return;
      }

      try {
        const response = await fetch(
          `${API}/admin/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const text =
          await response.text();

        let result: DashboardResponse;

        try {
          result =
            JSON.parse(
              text
            ) as DashboardResponse;
        } catch {
          throw new Error(
            text ||
              `Dashboard request failed (${response.status})`
          );
        }

        if (response.status === 401) {
          localStorage.removeItem(
            "accessToken"
          );
          localStorage.removeItem(
            "userRoles"
          );

          router.replace(
            "/login?redirect=/admin"
          );

          return;
        }

        if (response.status === 403) {
          router.replace("/");
          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Unable to load dashboard."
          );
        }

        setStats(result.data);
      } catch (err) {
        console.error(
          "Admin dashboard error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function logout() {
    localStorage.removeItem(
      "accessToken"
    );
    localStorage.removeItem("userId");
    localStorage.removeItem(
      "userEmail"
    );
    localStorage.removeItem(
      "userFullName"
    );
    localStorage.removeItem(
      "userRoles"
    );

    router.replace("/login");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f4ee",
          color: "#2c2925",
        }}
      >
        <p>
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f4ee",
        color: "#2c2925",
      }}
    >
      {/* ================================
          HEADER
      ================================= */}

      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #ded8ce",
          padding: "18px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#2c2925",
            fontFamily:
              "Georgia, serif",
            fontSize: "22px",
            letterSpacing: "2px",
          }}
        >
          ✦ KASHI

          <span
            style={{
              display: "block",
              fontFamily:
                "Arial, sans-serif",
              fontSize: "9px",
              letterSpacing: "4px",
              marginTop: "2px",
            }}
          >
            BANARAS
          </span>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              letterSpacing: "1px",
              textTransform:
                "uppercase",
            }}
          >
            Admin Panel
          </span>

          <button
            type="button"
            onClick={logout}
            style={{
              border:
                "1px solid #b9afa2",
              background:
                "transparent",
              padding:
                "9px 16px",
              cursor:
                "pointer",
              fontSize: "11px",
              letterSpacing:
                "1px",
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* ================================
          CONTENT
      ================================= */}

      <section
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding:
            "45px 25px 70px",
        }}
      >
        {/* PAGE TITLE */}

        <div
          style={{
            marginBottom: "35px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              letterSpacing:
                "3px",
              color: "#81786d",
            }}
          >
            KASHI BANARAS
          </span>

          <h1
            style={{
              margin:
                "10px 0 8px",
              fontFamily:
                "Georgia, serif",
              fontSize:
                "42px",
              fontWeight: 400,
              letterSpacing:
                "-1px",
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth:
                "650px",
              color:
                "#81786d",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            Manage your Kashi Banaras
            store, products, orders
            and complete Home page
            content from here.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom:
                "25px",
              padding:
                "14px 16px",
              background:
                "#fff1ef",
              border:
                "1px solid #dfaaa4",
              color:
                "#9b4037",
              fontSize:
                "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* ================================
            STATISTICS
        ================================= */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom:
              "45px",
          }}
        >
          <StatCard
            href="/admin/customers"
            number={stats.customers}
            title="CUSTOMERS"
            description="Registered customers"
          />

          <StatCard
            href="/admin/products"
            number={stats.products}
            title="PRODUCTS"
            description="Products in catalogue"
          />

          <StatCard
            href="/admin/orders"
            number={stats.orders}
            title="ORDERS"
            description="Orders received"
          />
        </section>

        {/* ================================
            MANAGEMENT
        ================================= */}

        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <span
            style={{
              fontSize:
                "10px",
              letterSpacing:
                "3px",
              color:
                "#a47d49",
              fontWeight:
                700,
            }}
          >
            MANAGEMENT
          </span>

          <h2
            style={{
              margin:
                "8px 0 0",
              fontFamily:
                "Georgia, serif",
              fontSize:
                "30px",
              fontWeight:
                400,
            }}
          >
            Store Management
          </h2>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {/* HOME PAGE */}

          <AdminCard
            href="/admin/home"
            number="01"
            title="HOME PAGE"
            description="Manage hero banners, exclusive collections and the sarees displayed on your Home page."
          />

          {/* PRODUCTS */}

          <AdminCard
            href="/admin/products"
            number="02"
            title="PRODUCTS"
            description="Create, edit, activate, deactivate and manage product images, pricing, inventory and Home placement."
          />

          {/* ORDERS */}

          <AdminCard
            href="/admin/orders"
            number="03"
            title="ORDERS"
            description="View customer orders and update order status from the admin panel."
          />

          {/* CATEGORIES */}

          <AdminCard
            href="/admin/categories"
            number="04"
            title="CATEGORIES"
            description="Manage saree categories, category names, slugs, images and active status."
          />

          {/* CUSTOMERS */}

          <AdminCard
            href="/admin/customers"
            number="05"
            title="CUSTOMERS"
            description="View and manage registered customers and their account information."
          />

          {/* STORE */}

          <Link
            href="/"
            target="_blank"
            style={{
              textDecoration:
                "none",
              background:
                "#211c19",
              color:
                "#ffffff",
              border:
                "1px solid #211c19",
              padding:
                "28px 25px",
              minHeight:
                "175px",
              display:
                "flex",
              flexDirection:
                "column",
              justifyContent:
                "space-between",
              transition:
                "transform 0.2s ease",
            }}
          >
            <div
              style={{
                fontSize:
                  "10px",
                letterSpacing:
                  "3px",
                color:
                  "#b99662",
              }}
            >
              06
            </div>

            <div>
              <h3
                style={{
                  margin:
                    "0 0 8px",
                  fontFamily:
                    "Georgia, serif",
                  fontSize:
                    "24px",
                  fontWeight:
                    400,
                }}
              >
                VIEW STORE
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    "#d5cdc4",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.6,
                }}
              >
                Open the customer
                website and verify
                your live store.
              </p>
            </div>

            <div
              style={{
                fontSize:
                  "10px",
                letterSpacing:
                  "2px",
                color:
                  "#b99662",
              }}
            >
              OPEN STORE →
            </div>
          </Link>
        </section>

        {/* ================================
            HOME CMS QUICK ACCESS
        ================================= */}

        <section
          style={{
            marginTop:
              "55px",
            background:
              "#eee7dd",
            border:
              "1px solid #ded4c7",
            padding:
              "30px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "20px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <span
                style={{
                  fontSize:
                    "10px",
                  letterSpacing:
                    "3px",
                  color:
                    "#a47d49",
                  fontWeight:
                    700,
                }}
              >
                HOME PAGE CMS
              </span>

              <h3
                style={{
                  margin:
                    "8px 0 6px",
                  fontFamily:
                    "Georgia, serif",
                  fontSize:
                    "25px",
                  fontWeight:
                    400,
                }}
              >
                Everything on Home
                should be manageable
              </h3>

              <p
                style={{
                  margin: 0,
                  maxWidth:
                    "650px",
                  color:
                    "#70685f",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.7,
                }}
              >
                Hero banners, collections
                and featured sarees are
                controlled from the Home
                Page Management section.
              </p>
            </div>

            <Link
              href="/admin/home"
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                padding:
                  "13px 20px",
                background:
                  "#a47d49",
                border:
                  "1px solid #a47d49",
                color:
                  "#ffffff",
                textDecoration:
                  "none",
                fontSize:
                  "10px",
                letterSpacing:
                  "1.5px",
                fontWeight:
                  700,
              }}
            >
              MANAGE HOME PAGE →
            </Link>
          </div>
        </section>
      </section>

      {/* ================================
          RESPONSIVE
      ================================= */}

      <style jsx global>{`
        @media (max-width: 700px) {
          .admin-dashboard-content {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ========================================
   STAT CARD
======================================== */

function StatCard({
  href,
  number,
  title,
  description,
}: {
  href: string;
  number: number;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #ded8ce",
        padding: "25px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          fontFamily:
            "Georgia, serif",
          fontSize:
            "38px",
          lineHeight:
            1,
          marginBottom:
            "14px",
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize:
            "10px",
          letterSpacing:
            "2px",
          fontWeight:
            700,
          color:
            "#a47d49",
          marginBottom:
            "7px",
        }}
      >
        {title}
      </div>

      <p
        style={{
          margin: 0,
          color:
            "#81786d",
          fontSize:
            "12px",
        }}
      >
        {description}
      </p>
    </Link>
  );
}

/* ========================================
   ADMIN CARD
======================================== */

function AdminCard({
  href,
  number,
  title,
  description,
}: AdminCardProps) {
  return (
    <Link
      href={href}
      style={{
        textDecoration:
          "none",
        color:
          "#2c2925",
        background:
          "#ffffff",
        border:
          "1px solid #ded8ce",
        padding:
          "28px 25px",
        minHeight:
          "175px",
        display:
          "flex",
        flexDirection:
          "column",
        justifyContent:
          "space-between",
        transition:
          "transform 0.2s ease",
      }}
    >
      <div
        style={{
          fontSize:
            "10px",
          letterSpacing:
            "3px",
          color:
            "#a47d49",
          fontWeight:
            700,
        }}
      >
        {number}
      </div>

      <div>
        <h3
          style={{
            margin:
              "0 0 8px",
            fontFamily:
              "Georgia, serif",
            fontSize:
              "24px",
            fontWeight:
              400,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            color:
              "#81786d",
            fontSize:
              "13px",
            lineHeight:
              1.6,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          fontSize:
            "10px",
          letterSpacing:
            "2px",
          color:
            "#a47d49",
          marginTop:
            "18px",
        }}
      >
        MANAGE →
      </div>
    </Link>
  );
}