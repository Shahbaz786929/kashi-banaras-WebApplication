"use client";

import Header from "../../components/Header";
import {
  Cart,
  createAddress,
  createOrder,
  getCart,
} from "../../lib";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const WHATSAPP_NUMBER = "916393973678";

type FormState = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

const formatPrice = (value: unknown): string => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

export default function Checkout() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] = useState("");

  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] =
    useState("");
  const [orderAmount, setOrderAmount] =
    useState(0);

  const [whatsappUrl, setWhatsappUrl] =
    useState("");

  /*
   * =========================================================
   * LOAD CART
   * =========================================================
   */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "accessToken"
          );

        if (!token) {
          router.replace(
            "/login?redirect=/checkout"
          );
          return;
        }

        const data = await getCart();

        if (
          !data ||
          !Array.isArray(data.items) ||
          data.items.length === 0
        ) {
          setError(
            "Your cart is empty. Please add a product before checkout."
          );
          return;
        }

        setCart(data);
      } catch (err) {
        console.error(
          "Checkout cart error:",
          err
        );

        if (
          err instanceof Error &&
          err.message === "LOGIN_REQUIRED"
        ) {
          router.replace(
            "/login?redirect=/checkout"
          );
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your cart."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  /*
   * =========================================================
   * FORM CHANGE
   * =========================================================
   */

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * =========================================================
   * WHATSAPP MESSAGE
   * =========================================================
   */

  function buildWhatsAppMessage(
    orderNo: string,
    amount: number
  ) {
    const lines: string[] = [];

    lines.push(
      "🛍️ *NEW ORDER - KASHI BANARAS*"
    );

    lines.push("");
    lines.push(
      `*Order Number:* ${orderNo}`
    );

    lines.push("");
    lines.push("*CUSTOMER DETAILS*");
    lines.push(
      `Name: ${form.fullName.trim()}`
    );
    lines.push(
      `Phone: ${form.phone.trim()}`
    );

    lines.push("");
    lines.push("*DELIVERY ADDRESS*");
    lines.push(
      form.line1.trim()
    );

    if (form.line2.trim()) {
      lines.push(
        form.line2.trim()
      );
    }

    lines.push(
      `${form.city.trim()}, ${form.state.trim()} - ${form.postalCode.trim()}`
    );

    lines.push("");
    lines.push("*ORDER ITEMS*");

    if (cart?.items?.length) {
      cart.items.forEach(
        (item, index) => {
          lines.push(
            `${index + 1}. ${item.name}`
          );

          lines.push(
            `   SKU: ${item.sku}`
          );

          lines.push(
            `   Qty: ${item.quantity}`
          );

          lines.push(
            `   Price: ₹${formatPrice(
              item.unitPrice
            )}`
          );

          lines.push(
            `   Total: ₹${formatPrice(
              item.totalPrice
            )}`
          );
        }
      );
    }

    lines.push("");
    lines.push("*PAYMENT*");
    lines.push(
      "Method: Cash on Delivery"
    );

    lines.push("");
    lines.push(
      `*ORDER TOTAL: ₹${formatPrice(amount)}*`
    );

    lines.push("");
    lines.push(
      "Please confirm this order."
    );

    return lines.join("\n");
  }

  /*
   * =========================================================
   * PLACE ORDER
   * =========================================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!cart || cart.items.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    const token =
      localStorage.getItem(
        "accessToken"
      );

    if (!token) {
      router.replace(
        "/login?redirect=/checkout"
      );
      return;
    }

    const fullName =
      form.fullName.trim();
    const phone =
      form.phone.trim();
    const line1 =
      form.line1.trim();
    const line2 =
      form.line2.trim();
    const city =
      form.city.trim();
    const state =
      form.state.trim();
    const postalCode =
      form.postalCode.trim();

    if (!fullName) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) {
      setError(
        "Please enter a valid phone number."
      );
      return;
    }

    if (!line1) {
      setError(
        "Please enter your address."
      );
      return;
    }

    if (!city) {
      setError(
        "Please enter your city."
      );
      return;
    }

    if (!state) {
      setError(
        "Please enter your state."
      );
      return;
    }

    if (!postalCode) {
      setError(
        "Please enter your PIN code."
      );
      return;
    }

    if (!/^[0-9]{4,10}$/.test(postalCode)) {
      setError(
        "Please enter a valid PIN code."
      );
      return;
    }

    setPlacingOrder(true);
    setError("");

    /*
     * Open a blank tab immediately so the browser does not
     * block the WhatsApp tab after the async API calls.
     */
    let whatsappWindow: Window | null = null;

    try {
      whatsappWindow =
        window.open(
          "",
          "_blank"
        );

      /*
       * =====================================================
       * 1. SAVE SHIPPING ADDRESS
       * =====================================================
       */

      const address =
        await createAddress({
          label: "Checkout",
          fullName,
          phone,
          line1,
          line2: line2 || null,
          city,
          state,
          postalCode,
          country: "India",
          isDefault: true,
        });

      /*
       * =====================================================
       * 2. CREATE REAL ORDER IN DATABASE
       * =====================================================
       *
       * Backend will:
       * - create orders row
       * - create order_items rows
       * - calculate total from cart
       * - clear cart items
       */

      const order =
        await createOrder(
          address.id,
          address.id,
          "COD"
        );

      /*
       * =====================================================
       * 3. BUILD WHATSAPP ORDER MESSAGE
       * =====================================================
       */

      const amount =
        Number(order.amount) ||
        Number(cart.total) ||
        0;

      const message =
        buildWhatsAppMessage(
          order.orderNumber,
          amount
        );

      const url =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(
          message
        )}`;

      setOrderNumber(
        order.orderNumber
      );

      setOrderAmount(amount);
      setWhatsappUrl(url);
      setDone(true);

      /*
       * Send customer to WhatsApp in the
       * already-opened tab.
       */
      if (whatsappWindow) {
        whatsappWindow.location.href =
          url;
      }
    } catch (err) {
      console.error(
        "Place order error:",
        err
      );

      if (whatsappWindow) {
        whatsappWindow.close();
      }

      if (
        err instanceof Error &&
        err.message === "LOGIN_REQUIRED"
      ) {
        router.replace(
          "/login?redirect=/checkout"
        );
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <>
        <Header />

        <main className="section">
          <div className="section-title">
            <span>
              SECURE CHECKOUT
            </span>

            <h2>
              Complete your order
            </h2>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            Loading your order...
          </div>
        </main>
      </>
    );
  }

  /*
   * =========================================================
   * SUCCESS
   * =========================================================
   */

  if (done) {
    return (
      <>
        <Header />

        <main className="section">
          <div className="section-title">
            <span>
              ORDER CONFIRMED
            </span>

            <h2>
              Thank you.
            </h2>
          </div>

          <div
            className="success"
            style={{
              maxWidth: 700,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <span>✦</span>

            <h2>
              Your order has been placed.
            </h2>

            <p>
              Your order number is:
            </p>

            <strong
              style={{
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              {orderNumber}
            </strong>

            <p
              style={{
                marginTop: 16,
              }}
            >
              Order total:
              <strong>
                {" "}
                ₹
                {formatPrice(
                  orderAmount
                )}
              </strong>
            </p>

            <p
              style={{
                marginTop: 20,
                lineHeight: 1.7,
              }}
            >
              Your order has been saved
              successfully. The order details
              have been prepared for WhatsApp.
            </p>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gold-btn"
                style={{
                  display:
                    "inline-block",
                  marginTop: 20,
                  textDecoration:
                    "none",
                }}
              >
                SEND ORDER ON WHATSAPP →
              </a>
            )}

            <div
              style={{
                marginTop: 25,
              }}
            >
              <a
                href="/orders"
                style={{
                  marginRight: 20,
                }}
              >
                View My Orders
              </a>

              <a href="/">
                Continue Shopping
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * =========================================================
   * EMPTY CART / ERROR
   * =========================================================
   */

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Header />

        <main className="section">
          <div className="section-title">
            <span>
              SECURE CHECKOUT
            </span>

            <h2>
              Complete your order
            </h2>
          </div>

          <div
            className="success"
            style={{
              maxWidth: 700,
              margin: "0 auto",
            }}
          >
            <h2>
              Your cart is empty
            </h2>

            <p>
              Please add a product to your
              cart before checkout.
            </p>

            <a
              href="/sarees"
              className="gold-btn"
              style={{
                display:
                  "inline-block",
                marginTop: 20,
                textDecoration:
                  "none",
              }}
            >
              CONTINUE SHOPPING
            </a>
          </div>
        </main>
      </>
    );
  }

  /*
   * =========================================================
   * CHECKOUT FORM
   * =========================================================
   */

  return (
    <>
      <Header />

      <main className="section">
        <div className="section-title">
          <span>
            SECURE CHECKOUT
          </span>

          <h2>
            Complete your order
          </h2>
        </div>

        {error && (
          <div
            style={{
              maxWidth: 1100,
              margin:
                "0 auto 25px",
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

        <div className="checkout">
          <form
            className="checkout-form"
            onSubmit={handleSubmit}
          >
            <h3>
              Shipping address
            </h3>

            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={(event) =>
                updateField(
                  "fullName",
                  event.target.value
                )
              }
              required
            />

            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              required
            />

            <input
              type="text"
              placeholder="Address line 1"
              value={form.line1}
              onChange={(event) =>
                updateField(
                  "line1",
                  event.target.value
                )
              }
              required
            />

            <input
              type="text"
              placeholder="Address line 2"
              value={form.line2}
              onChange={(event) =>
                updateField(
                  "line2",
                  event.target.value
                )
              }
            />

            <div className="two">
              <input
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                required
              />

              <input
                type="text"
                placeholder="State"
                value={form.state}
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="PIN code"
              value={form.postalCode}
              onChange={(event) =>
                updateField(
                  "postalCode",
                  event.target.value
                )
              }
              required
            />

            <h3
              style={{
                marginTop: 30,
              }}
            >
              Payment
            </h3>

            <div className="payment-note">
              <strong>
                Cash on Delivery
              </strong>

              <br />

              Your order will be placed
              immediately and our team will
              receive the order details on
              WhatsApp.
            </div>

            <button
              type="submit"
              className="gold-btn"
              disabled={placingOrder}
            >
              {placingOrder
                ? "PLACING ORDER..."
                : "PLACE ORDER"}
            </button>
          </form>

          <aside className="order-box">
            <span>
              ORDER SUMMARY
            </span>

            <div
              style={{
                marginTop: 20,
              }}
            >
              {cart.items.map(
                (item) => (
                  <div
                    key={item.id}
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 15,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin:
                            0,
                          fontSize:
                            21,
                        }}
                      >
                        {item.name}
                      </h3>

                      <p
                        style={{
                          margin:
                            "5px 0",
                        }}
                      >
                        Qty{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <strong>
                      ₹
                      {formatPrice(
                        item.totalPrice
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <hr />

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                marginTop: 15,
              }}
            >
              <span>
                Items
              </span>

              <strong>
                {cart.totalQuantity}
              </strong>
            </div>

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                marginTop: 12,
              }}
            >
              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {formatPrice(
                  cart.subtotal
                )}
              </strong>
            </div>

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                marginTop: 12,
              }}
            >
              <span>
                Shipping
              </span>

              <strong>
                {Number(
                  cart.shipping
                ) === 0
                  ? "FREE"
                  : `₹${formatPrice(
                      cart.shipping
                    )}`}
              </strong>
            </div>

            <hr />

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <span>
                Total
              </span>

              <h2>
                ₹
                {formatPrice(
                  cart.total
                )}
              </h2>
            </div>

            <p>
              Complimentary shipping
              across India.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}