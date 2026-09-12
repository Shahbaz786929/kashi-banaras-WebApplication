"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "../../../lib";

type Customer = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  active: boolean;
  createdAt: string;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API}/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        setError(result.message || "Unable to load customers.");
        return;
      }

      setCustomers(result.data);
    }

    loadCustomers().catch(() => setError("Unable to load customers."));
  }, []);

  return (
    <div className="admin">
      <div className="admin-nav"><Link href="/admin">← Dashboard</Link><b>CUSTOMERS</b><span /></div>
      <main className="admin-main">
        <h1>Customers</h1>
        {error && <p>{error}</p>}
        {customers.length === 0 && !error ? <p>No customers registered yet.</p> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>{customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.fullName}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || "-"}</td>
                <td>{customer.active ? "ACTIVE" : "INACTIVE"}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </main>
    </div>
  );
}
