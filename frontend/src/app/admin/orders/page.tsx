"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "../../../lib";

type OrderItem = {
  id: number;
  productId?: number | null;

  productName: string;
  sku?: string | null;
  slug?: string | null;

  imageUrl?: string | null;

  fabric?: string | null;
  weave?: string | null;
  zariType?: string | null;
  occasion?: string | null;

  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

type Order = {
  id: number;
  orderNumber: string;

  customerName: string;
  customerEmail: string;

  fullName?: string;
  phone?: string;

  address?: string;

  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  taxAmount?: number;

  totalAmount: number;

  status: string;
  createdAt: string;

  items?: OrderItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

export default function AdminOrders() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const [detailsLoadingId, setDetailsLoadingId] =
    useState<number | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  function getToken() {

    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    return localStorage.getItem(
      "accessToken"
    );
  }

  async function parseResponse<T>(
    response: Response
  ): Promise<ApiResponse<T>> {

    const text =
      await response.text();

    if (!text) {

      return {
        success: false,
        message:
          `Request failed with status ${response.status}.`,
      };
    }

    try {

      return JSON.parse(
        text
      ) as ApiResponse<T>;

    } catch {

      return {
        success: false,
        message: text,
      };
    }
  }

  function redirectToLogin() {

    if (
      typeof window !== "undefined"
    ) {

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "userRoles"
      );

      window.location.href =
        "/login?redirect=/admin/orders";
    }
  }

  async function loadOrders() {

    const token =
      getToken();

    if (!token) {

      redirectToLogin();
      return;
    }

    setLoading(true);
    setError("");

    try {

      const response =
        await fetch(
          `${API}/admin/orders`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      if (
        response.status === 401
      ) {

        redirectToLogin();
        return;
      }

      if (
        response.status === 403
      ) {

        throw new Error(
          "You are not authorized to view customer orders."
        );
      }

      const result =
        await parseResponse<Order[]>(
          response
        );

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.data)
      ) {

        throw new Error(
          result.message ||
            "Unable to load orders."
        );
      }

      setOrders(
        result.data
      );

      setError("");

    } catch (err) {

      console.error(
        "Admin orders error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {

    void loadOrders();

  }, []);

  async function loadOrderDetails(
    orderId: number
  ) {

    const token =
      getToken();

    if (!token) {

      redirectToLogin();
      return;
    }

    setDetailsLoadingId(
      orderId
    );

    setError("");

    try {

      const response =
        await fetch(
          `${API}/admin/orders/${orderId}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      if (
        response.status === 401
      ) {

        redirectToLogin();
        return;
      }

      const result =
        await parseResponse<Order>(
          response
        );

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {

        throw new Error(
          result.message ||
            "Unable to load order details."
        );
      }

      setOrders(
        current =>
          current.map(
            order =>
              order.id === orderId
                ? {
                    ...order,
                    ...result.data,
                  }
                : order
          )
      );

      setExpandedId(
        orderId
      );

    } catch (err) {

      console.error(
        "Order details error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load order details."
      );

    } finally {

      setDetailsLoadingId(
        null
      );
    }
  }

  async function toggleDetails(
    order: Order
  ) {

    if (
      expandedId === order.id
    ) {

      setExpandedId(null);
      return;
    }

    if (
      !order.items
    ) {

      await loadOrderDetails(
        order.id
      );

      return;
    }

    setExpandedId(
      order.id
    );
  }

  async function updateStatus(
    orderId: number,
    status: string
  ) {

    const token =
      getToken();

    if (!token) {

      redirectToLogin();
      return;
    }

    setUpdatingId(
      orderId
    );

    setError("");
    setNotice("");

    try {

      const response =
        await fetch(
          `${API}/admin/orders/${orderId}/status?status=${encodeURIComponent(
            status
          )}`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      if (
        response.status === 401
      ) {

        redirectToLogin();
        return;
      }

      const result =
        await parseResponse<Order>(
          response
        );

      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result.message ||
            "Unable to update order status."
        );
      }

      if (
        result.data
      ) {

        setOrders(
          current =>
            current.map(
              order =>
                order.id === orderId
                  ? {
                      ...order,
                      ...result.data,
                    }
                  : order
            )
        );
      } else {

        setOrders(
          current =>
            current.map(
              order =>
                order.id === orderId
                  ? {
                      ...order,
                      status,
                    }
                  : order
            )
        );
      }

      setNotice(
        `Order status changed to ${status.replaceAll(
          "_",
          " "
        )}.`
      );

    } catch (err) {

      console.error(
        "Order status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );

    } finally {

      setUpdatingId(
        null
      );
    }
  }

  function formatPrice(
    value: unknown
  ) {

    const amount =
      Number(value);

    if (
      !Number.isFinite(amount)
    ) {

      return "0";
    }

    return amount.toLocaleString(
      "en-IN"
    );
  }

  function formatDate(
    value: string
  ) {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;
    }

    return date.toLocaleString(
      "en-IN"
    );
  }

  return (
    <div className="admin admin-orders-page">

      <div className="admin-nav">

        <Link href="/admin">
          ← Dashboard
        </Link>

        <b>ORDERS</b>

        <span />

      </div>

      <main className="admin-main">

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 20,
            flexWrap:
              "wrap",
          }}
        >

          <div>

            <h1>
              Orders
            </h1>

            <p>
              Orders placed by your customers.
            </p>

          </div>

          <button
            type="button"
            className="outline-btn"
            onClick={() =>
              void loadOrders()
            }
            disabled={loading}
          >
            {loading
              ? "LOADING..."
              : "REFRESH"}
          </button>

        </div>

        {error && (
          <div
            style={{
              marginTop: 20,
              padding:
                "14px 16px",
              border:
                "1px solid #d98b80",
              background:
                "#fff7f5",
              color:
                "#9b4037",
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            style={{
              marginTop: 20,
              padding:
                "14px 16px",
              border:
                "1px solid #9ac7aa",
              background:
                "#f4fbf6",
              color:
                "#2a6c45",
            }}
          >
            {notice}
          </div>
        )}

        <div
          style={{
            marginTop: 25,
            marginBottom: 15,
            color:
              "#81786d",
          }}
        >
          {orders.length}{" "}
          {orders.length === 1
            ? "order"
            : "orders"}
        </div>

        {loading ? (

          <div
            style={{
              padding: 30,
              background:
                "#fff",
              border:
                "1px solid #d9d0c2",
            }}
          >
            Loading orders...
          </div>

        ) : orders.length === 0 ? (

          <div
            style={{
              padding: 30,
              background:
                "#fff",
              border:
                "1px solid #d9d0c2",
              color:
                "#81786d",
            }}
          >
            No orders yet.
          </div>

        ) : (

          <div
            style={{
              overflowX:
                "auto",
              background:
                "#fff",
              border:
                "1px solid #d9d0c2",
            }}
          >

            <table
              className="admin-table admin-orders-table"
              style={{
                width:
                  "100%",
                minWidth:
                  1350,
              }}
            >

              <thead>

                <tr>

                  <th>
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Delivery Address
                  </th>

                  <th>
                    Products
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Details
                  </th>

                </tr>

              </thead>

              <tbody>

                {orders.map(
                  order => (

                    <tr
                      key={
                        order.id
                      }
                    >

                      <td
                        style={{
                          verticalAlign:
                            "top",
                        }}
                      >

                        <strong>
                          {
                            order.orderNumber
                          }
                        </strong>

                        <br />

                        <small>
                          ID:{" "}
                          {
                            order.id
                          }
                        </small>

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                          minWidth:
                            180,
                        }}
                      >

                        <strong>
                          {
                            order.customerName ||
                            order.fullName ||
                            "—"
                          }
                        </strong>

                        <br />

                        <small>
                          {
                            order.customerEmail ||
                            "—"
                          }
                        </small>

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                          minWidth:
                            300,
                          maxWidth:
                            380,
                          lineHeight:
                            1.6,
                        }}
                      >

                        <strong>
                          {
                            order.fullName ||
                            order.customerName ||
                            "—"
                          }
                        </strong>

                        <br />

                        <span>
                          📞{" "}
                          {
                            order.phone ||
                            "Phone not available"
                          }
                        </span>

                        <br />

                        <span>
                          {
                            order.address ||
                            "Address not available"
                          }
                        </span>

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                          minWidth:
                            260,
                        }}
                      >

                        {order.items &&
                        order.items.length >
                          0 ? (

                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap: 12,
                            }}
                          >

                            {order.items.map(
                              item => (

                                <div
                                  key={
                                    item.id
                                  }
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: 12,
                                  }}
                                >

                                  {item.imageUrl ? (

                                    <img
                                      src={
                                        item.imageUrl
                                      }
                                      alt={
                                        item.productName
                                      }
                                      style={{
                                        width:
                                          70,
                                        height:
                                          90,
                                        objectFit:
                                          "cover",
                                        border:
                                          "1px solid #ddd4c7",
                                        background:
                                          "#f4f0e8",
                                        flexShrink:
                                          0,
                                      }}
                                    />

                                  ) : (

                                    <div
                                      style={{
                                        width:
                                          70,
                                        height:
                                          90,
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "center",
                                        textAlign:
                                          "center",
                                        fontSize:
                                          10,
                                        color:
                                          "#81786d",
                                        border:
                                          "1px solid #ddd4c7",
                                        background:
                                          "#f4f0e8",
                                        flexShrink:
                                          0,
                                      }}
                                    >
                                      IMAGE
                                      <br />
                                      NOT
                                      <br />
                                      AVAILABLE
                                    </div>

                                  )}

                                  <div>

                                    <strong>
                                      {
                                        item.productName
                                      }
                                    </strong>

                                    <br />

                                    <small>
                                      Qty:{" "}
                                      {
                                        item.quantity
                                      }
                                    </small>

                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <span
                            style={{
                              color:
                                "#81786d",
                            }}
                          >
                            Product details
                            unavailable
                          </span>

                        )}

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
                        }}
                      >

                        <strong>
                          ₹
                          {
                            formatPrice(
                              order.totalAmount
                            )
                          }
                        </strong>

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                        }}
                      >

                        <select
                          value={
                            order.status
                          }
                          disabled={
                            updatingId ===
                            order.id
                          }
                          onChange={
                            event =>
                              void updateStatus(
                                order.id,
                                event.target.value
                              )
                          }
                          style={{
                            minWidth:
                              155,
                            padding:
                              "8px 10px",
                            border:
                              "1px solid #b8ad9d",
                            background:
                              "#fff",
                          }}
                        >

                          {ORDER_STATUSES.map(
                            status => (

                              <option
                                key={
                                  status
                                }
                                value={
                                  status
                                }
                              >
                                {status.replaceAll(
                                  "_",
                                  " "
                                )}
                              </option>

                            )
                          )}

                        </select>

                        {updatingId ===
                          order.id && (

                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                6,
                            }}
                          >
                            Updating...
                          </small>

                        )}

                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          formatDate(
                            order.createdAt
                          )
                        }
                      </td>

                      <td
                        style={{
                          verticalAlign:
                            "top",
                        }}
                      >

                        <button
                          type="button"
                          className="outline-btn"
                          onClick={() =>
                            void toggleDetails(
                              order
                            )
                          }
                          disabled={
                            detailsLoadingId ===
                            order.id
                          }
                        >
                          {detailsLoadingId ===
                          order.id
                            ? "LOADING..."
                            : expandedId ===
                              order.id
                            ? "HIDE"
                            : "VIEW"}
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

            {orders.map(
              order => {

                if (
                  expandedId !==
                  order.id
                ) {
                  return null;
                }

                return (

                  <div
                    key={
                      `details-${order.id}`
                    }
                    style={{
                      borderTop:
                        "1px solid #d9d0c2",
                      padding:
                        25,
                      background:
                        "#faf8f3",
                    }}
                  >

                    <h2
                      style={{
                        marginTop:
                          0,
                      }}
                    >
                      Order Details —{" "}
                      {
                        order.orderNumber
                      }
                    </h2>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(260px,1fr))",
                        gap: 20,
                      }}
                    >

                      <div
                        style={{
                          padding:
                            20,
                          background:
                            "#fff",
                          border:
                            "1px solid #d9d0c2",
                        }}
                      >

                        <h3>
                          Customer
                        </h3>

                        <p>
                          <strong>
                            Name:
                          </strong>{" "}
                          {
                            order.fullName ||
                            order.customerName ||
                            "—"
                          }
                        </p>

                        <p>
                          <strong>
                            Email:
                          </strong>{" "}
                          {
                            order.customerEmail
                          }
                        </p>

                        <p>
                          <strong>
                            Phone:
                          </strong>{" "}
                          {
                            order.phone ||
                            "—"
                          }
                        </p>

                      </div>

                      <div
                        style={{
                          padding:
                            20,
                          background:
                            "#fff",
                          border:
                            "1px solid #d9d0c2",
                        }}
                      >

                        <h3>
                          Delivery Address
                        </h3>

                        <p
                          style={{
                            lineHeight:
                              1.7,
                          }}
                        >
                          {
                            order.address ||
                            "Address not available"
                          }
                        </p>

                      </div>

                      <div
                        style={{
                          padding:
                            20,
                          background:
                            "#fff",
                          border:
                            "1px solid #d9d0c2",
                        }}
                      >

                        <h3>
                          Order Total
                        </h3>

                        <p>
                          <strong>
                            Subtotal:
                          </strong>{" "}
                          ₹
                          {
                            formatPrice(
                              order.subtotal
                            )
                          }
                        </p>

                        <p>
                          <strong>
                            Discount:
                          </strong>{" "}
                          ₹
                          {
                            formatPrice(
                              order.discountAmount
                            )
                          }
                        </p>

                        <p>
                          <strong>
                            Shipping:
                          </strong>{" "}
                          {Number(
                            order.shippingFee
                          ) === 0
                            ? "FREE"
                            : `₹${formatPrice(
                                order.shippingFee
                              )}`}
                        </p>

                        <p>
                          <strong>
                            Total:
                          </strong>{" "}
                          ₹
                          {
                            formatPrice(
                              order.totalAmount
                            )
                          }
                        </p>

                      </div>

                    </div>

                    <div
                      style={{
                        marginTop:
                          20,
                        padding:
                          20,
                        background:
                          "#fff",
                        border:
                          "1px solid #d9d0c2",
                      }}
                    >

                      <h3>
                        Ordered Sarees
                      </h3>

                      {!order.items ||
                      order.items.length ===
                        0 ? (

                        <p>
                          No product
                          details available.
                        </p>

                      ) : (

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill,minmax(300px,1fr))",
                            gap: 20,
                          }}
                        >

                          {order.items.map(
                            item => (

                              <div
                                key={
                                  item.id
                                }
                                style={{
                                  border:
                                    "1px solid #d9d0c2",
                                  background:
                                    "#fff",
                                }}
                              >

                                {item.imageUrl ? (

                                  <img
                                    src={
                                      item.imageUrl
                                    }
                                    alt={
                                      item.productName
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        300,
                                      objectFit:
                                        "cover",
                                      display:
                                        "block",
                                    }}
                                  />

                                ) : (

                                  <div
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        300,
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      textAlign:
                                        "center",
                                      color:
                                        "#81786d",
                                      background:
                                        "#f4f0e8",
                                    }}
                                  >
                                    PRODUCT IMAGE
                                    <br />
                                    NOT AVAILABLE
                                  </div>

                                )}

                                <div
                                  style={{
                                    padding:
                                      18,
                                  }}
                                >

                                  <h3
                                    style={{
                                      marginTop:
                                        0,
                                      marginBottom:
                                        8,
                                    }}
                                  >
                                    {
                                      item.productName
                                    }
                                  </h3>

                                  <p>
                                    <strong>
                                      SKU:
                                    </strong>{" "}
                                    {
                                      item.sku ||
                                      "—"
                                    }
                                  </p>

                                  <p>
                                    <strong>
                                      Quantity:
                                    </strong>{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>

                                  <p>
                                    <strong>
                                      Unit Price:
                                    </strong>{" "}
                                    ₹
                                    {
                                      formatPrice(
                                        item.unitPrice
                                      )
                                    }
                                  </p>

                                  <p>
                                    <strong>
                                      Total:
                                    </strong>{" "}
                                    ₹
                                    {
                                      formatPrice(
                                        item.totalPrice
                                      )
                                    }
                                  </p>

                                  {item.fabric && (
                                    <p>
                                      <strong>
                                        Fabric:
                                      </strong>{" "}
                                      {
                                        item.fabric
                                      }
                                    </p>
                                  )}

                                  {item.weave && (
                                    <p>
                                      <strong>
                                        Weave:
                                      </strong>{" "}
                                      {
                                        item.weave
                                      }
                                    </p>
                                  )}

                                  {item.zariType && (
                                    <p>
                                      <strong>
                                        Zari:
                                      </strong>{" "}
                                      {
                                        item.zariType
                                      }
                                    </p>
                                  )}

                                  {item.occasion && (
                                    <p>
                                      <strong>
                                        Occasion:
                                      </strong>{" "}
                                      {
                                        item.occasion
                                      }
                                    </p>
                                  )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </main>

    </div>
  );
}