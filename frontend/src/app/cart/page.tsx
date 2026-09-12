"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Header from "../../components/Header";
import {
  Cart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../../lib";

const formatPrice = (value: unknown): string => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

const toNumber = (value: unknown): number => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD CART
   * =========================================================
   *
   * Cart data comes ONLY from backend.
   *
   * No demo products.
   * No static products.
   * No local cart data.
   */
  async function loadCart() {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();

      setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err);

      if (
        err instanceof Error &&
        err.message === "LOGIN_REQUIRED"
      ) {
        setError("Please login to view your cart.");
      } else {
        setError("Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }

  /*
   * Load cart when page opens.
   */
  useEffect(() => {
    loadCart();
  }, []);

  /*
   * =========================================================
   * UPDATE QUANTITY
   * =========================================================
   *
   * Quantity is updated through backend.
   */
  async function handleQuantity(
    itemId: number,
    quantity: number
  ) {
    if (quantity < 1) {
      return;
    }

    try {
      setError("");

      const updatedCart =
        await updateCartQuantity(
          itemId,
          quantity
        );

      setCart(updatedCart);
    } catch (err) {
      console.error(
        "Failed to update cart quantity:",
        err
      );

      if (
        err instanceof Error &&
        err.message === "LOGIN_REQUIRED"
      ) {
        setError("Please login to update your cart.");
      } else {
        setError(
          "Unable to update cart quantity."
        );
      }
    }
  }

  /*
   * =========================================================
   * REMOVE ITEM
   * =========================================================
   *
   * Item is removed through backend.
   */
  async function handleRemove(itemId: number) {
    try {
      setError("");

      const updatedCart =
        await removeFromCart(itemId);

      setCart(updatedCart);
    } catch (err) {
      console.error(
        "Failed to remove cart item:",
        err
      );

      if (
        err instanceof Error &&
        err.message === "LOGIN_REQUIRED"
      ) {
        setError("Please login to update your cart.");
      } else {
        setError(
          "Unable to remove this product."
        );
      }
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
            <span>YOUR SELECTION</span>
            <h2>Shopping Bag</h2>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            Loading your cart...
          </div>
        </main>
      </>
    );
  }

  /*
   * =========================================================
   * BACKEND CART DATA
   * =========================================================
   *
   * These fields exactly match:
   *
   * CartResponse:
   * - items
   * - totalQuantity
   * - subtotal
   * - shipping
   * - total
   */
  const items = cart?.items ?? [];

  const subtotal = toNumber(
    cart?.subtotal
  );

  const shipping = toNumber(
    cart?.shipping
  );

  const total = toNumber(
    cart?.total
  );

  const totalQuantity = toNumber(
    cart?.totalQuantity
  );

  return (
    <>
      <Header />

      <main className="section">
        {/* =================================================
            PAGE HEADER
        ================================================== */}
        <div className="section-title">
          <span>YOUR SELECTION</span>
          <h2>Shopping Bag</h2>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              border: "1px solid #d8b56a",
              background: "#fffaf0",
              color: "#333",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            EMPTY CART
        ================================================== */}
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
            }}
          >
            <h2>
              Your shopping bag is empty.
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 25,
              }}
            >
              Discover our collection of
              handcrafted Banarasi sarees.
            </p>

            <Link
              href="/sarees"
              className="gold-btn"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="cart-layout">

            {/* =================================================
                CART ITEMS
            ================================================== */}
            <div className="cart-items">

              {items.map((item) => {

                /*
                 * IMPORTANT:
                 *
                 * Backend CartItemResponse uses:
                 *
                 * imageUrl
                 * unitPrice
                 * totalPrice
                 *
                 * NOT:
                 *
                 * image
                 * price
                 * itemTotal
                 */

                const imageUrl =
                  item.imageUrl;

                const unitPrice =
                  toNumber(item.unitPrice);

                const quantity =
                  Math.max(
                    1,
                    toNumber(item.quantity)
                  );

                const itemTotal =
                  toNumber(item.totalPrice);

                return (
                  <article
                    className="cart-row"
                    key={item.id}
                  >

                    {/* =================================================
                        PRODUCT IMAGE
                    ================================================== */}
                    <Link
                      href={
                        item.slug
                          ? `/product/${item.slug}`
                          : "#"
                      }
                      className="cart-product-image"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            fontSize: "11px",
                            color: "#81786d",
                            padding: "15px",
                          }}
                        >
                          PRODUCT IMAGE
                          <br />
                          NOT AVAILABLE
                        </div>
                      )}
                    </Link>

                    {/* =================================================
                        PRODUCT INFORMATION
                    ================================================== */}
                    <div className="cart-product-info">

                      <span className="eyebrow">
                        BANARASI SAREE
                      </span>

                      <Link
                        href={
                          item.slug
                            ? `/product/${item.slug}`
                            : "#"
                        }
                      >
                        <h2>
                          {item.name}
                        </h2>
                      </Link>

                      {/* SKU */}
                      {item.sku && (
                        <p>
                          SKU: {item.sku}
                        </p>
                      )}

                      {/* PRICE */}
                      <strong>
                        ₹{formatPrice(unitPrice)}
                      </strong>

                      {/* =================================================
                          QUANTITY
                      ================================================== */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginTop: 18,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          Quantity
                        </span>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            border:
                              "1px solid #ddd",
                          }}
                        >

                          {/* MINUS */}
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(
                                item.id,
                                quantity - 1
                              )
                            }
                            disabled={
                              quantity <= 1
                            }
                            aria-label="Decrease quantity"
                            style={{
                              width: 38,
                              height: 38,
                              border: "none",
                              background:
                                "transparent",
                              cursor:
                                quantity <= 1
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                quantity <= 1
                                  ? 0.4
                                  : 1,
                            }}
                          >
                            −
                          </button>

                          {/* CURRENT QUANTITY */}
                          <span
                            style={{
                              minWidth: 35,
                              textAlign: "center",
                            }}
                          >
                            {quantity}
                          </span>

                          {/* PLUS */}
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(
                                item.id,
                                quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            style={{
                              width: 38,
                              height: 38,
                              border: "none",
                              background:
                                "transparent",
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>

                        </div>
                      </div>

                      {/* =================================================
                          REMOVE
                      ================================================== */}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(item.id)
                        }
                        style={{
                          marginTop: 16,
                          padding: 0,
                          border: "none",
                          background:
                            "transparent",
                          textDecoration:
                            "underline",
                          cursor: "pointer",
                        }}
                      >
                        REMOVE
                      </button>

                    </div>

                    {/* =================================================
                        ITEM TOTAL
                    ================================================== */}
                    <div className="cart-item-total">
                      <span>Total</span>

                      <strong>
                        ₹{formatPrice(itemTotal)}
                      </strong>
                    </div>

                  </article>
                );
              })}

            </div>

            {/* =================================================
                ORDER SUMMARY
            ================================================== */}
            <aside className="cart-summary">

              <h2>
                Order Summary
              </h2>

              {/* ITEMS */}
              <div className="cart-summary-row">

                <span>
                  Items ({totalQuantity})
                </span>

                <strong>
                  ₹{formatPrice(subtotal)}
                </strong>

              </div>

              {/* SHIPPING */}
              <div className="cart-summary-row">

                <span>
                  Shipping
                </span>

                <strong>
                  {shipping === 0
                    ? "FREE"
                    : `₹${formatPrice(
                        shipping
                      )}`}
                </strong>

              </div>

              {/* DIVIDER */}
              <div className="cart-summary-divider" />

              {/* TOTAL */}
              <div className="cart-summary-row cart-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹{formatPrice(total)}
                </strong>

              </div>

              <small>
                Complimentary shipping across
                India.
              </small>

              {/* CHECKOUT */}
              <Link
                href="/checkout"
                className="gold-btn"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 22,
                }}
              >
                PROCEED TO CHECKOUT
              </Link>

              {/* CONTINUE SHOPPING */}
              <Link
                href="/sarees"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 15,
                }}
              >
                Continue Shopping
              </Link>

            </aside>

          </div>
        )}
      </main>
    </>
  );
}