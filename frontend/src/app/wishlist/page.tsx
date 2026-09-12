"use client";

import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";

import {
  getProducts,
  getWishlist,
  Product,
} from "../../lib";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWishlist() {
      setLoading(true);
      setError("");
      setLoginRequired(false);

      try {
        /*
         * Get actual wishlist items of logged-in user.
         */
        const wishlist = await getWishlist();

        /*
         * Get actual products from database.
         */
        const allProducts = await getProducts();

        if (!mounted) return;

        /*
         * Only show products which exist
         * in the user's wishlist.
         */
        const wishlistProductIds = new Set(
          wishlist.map((item) => Number(item.productId))
        );

        const wishlistProducts = allProducts.filter(
          (product) =>
            wishlistProductIds.has(Number(product.id))
        );

        setProducts(wishlistProducts);
      } catch (err) {
        if (!mounted) return;

        if (
          err instanceof Error &&
          err.message === "LOGIN_REQUIRED"
        ) {
          setLoginRequired(true);
        } else {
          console.error(
            "Wishlist loading error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load wishlist"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Header />

      <main className="wishlist-page">
        <div className="wishlist-heading">
          <span>SAVED FOR LATER</span>

          <h1>Your Wishlist</h1>

          <p>
            Keep the sarees you love close.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="wishlist-message">
            <div className="wishlist-loader" />
            <p>Loading your wishlist...</p>
          </div>
        )}

        {/* Login Required */}
        {!loading && loginRequired && (
          <div className="wishlist-message">
            <h2>Login to view your wishlist</h2>

            <p>
              Sign in to save your favourite
              Banarasi sarees and access them
              anytime.
            </p>

            <Link
              href="/login?redirect=/wishlist"
              className="wishlist-login-btn"
            >
              LOGIN TO CONTINUE
            </Link>
          </div>
        )}

        {/* Error */}
        {!loading &&
          !loginRequired &&
          error && (
            <div className="wishlist-message">
              <h2>Unable to load wishlist</h2>

              <p>{error}</p>

              <button
                type="button"
                className="wishlist-retry-btn"
                onClick={() =>
                  window.location.reload()
                }
              >
                TRY AGAIN
              </button>
            </div>
          )}

        {/* Empty Wishlist */}
        {!loading &&
          !loginRequired &&
          !error &&
          products.length === 0 && (
            <div className="wishlist-message">
              <h2>Your wishlist is empty</h2>

              <p>
                Explore our collection and save
                the sarees you love.
              </p>

              <Link
                href="/sarees"
                className="wishlist-login-btn"
              >
                EXPLORE SAREES
              </Link>
            </div>
          )}

        {/* Wishlist Products */}
        {!loading &&
          !loginRequired &&
          !error &&
          products.length > 0 && (
            <section className="wishlist-products">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  p={product}
                />
              ))}
            </section>
          )}
      </main>

      <style jsx>{`
        .wishlist-page {
          min-height: 70vh;

          padding: 90px 7vw 100px;

          background: #f7f1e7;
        }

        .wishlist-heading {
          text-align: center;

          margin-bottom: 70px;
        }

        .wishlist-heading span {
          display: block;

          margin-bottom: 12px;

          color: #aa7c36;

          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
        }

        .wishlist-heading h1 {
          margin: 0;

          color: #17130f;

          font-family: "Cormorant Garamond", serif;

          font-size: clamp(44px, 5vw, 68px);
          line-height: 1;
          font-weight: 500;
        }

        .wishlist-heading p {
          margin: 18px 0 0;

          color: #756c60;

          font-size: 15px;
        }

        .wishlist-products {
          display: grid;

          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );

          gap: 22px;

          max-width: 1400px;

          margin: 0 auto;
        }

        .wishlist-message {
          min-height: 260px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          text-align: center;
        }

        .wishlist-message h2 {
          margin: 0;

          color: #181512;

          font-family: "Cormorant Garamond", serif;

          font-size: 34px;
          font-weight: 500;
        }

        .wishlist-message p {
          max-width: 460px;

          margin: 14px auto 24px;

          color: #756c60;

          font-size: 14px;
          line-height: 1.7;
        }

        .wishlist-login-btn,
        .wishlist-retry-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-width: 190px;

          padding: 14px 24px;

          border: none;

          background: #c99d4d;

          color: #11100e;

          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.8px;

          text-decoration: none;

          cursor: pointer;
        }

        .wishlist-login-btn:hover,
        .wishlist-retry-btn:hover {
          background: #b88b3d;
        }

        .wishlist-loader {
          width: 28px;
          height: 28px;

          margin-bottom: 16px;

          border: 2px solid #d8c7aa;
          border-top-color: #a77a34;

          border-radius: 50%;

          animation: wishlist-spin 0.8s linear
            infinite;
        }

        .wishlist-message > p:last-child {
          margin-bottom: 0;
        }

        @keyframes wishlist-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .wishlist-products {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 768px) {
          .wishlist-page {
            padding: 60px 16px 70px;
          }

          .wishlist-heading {
            margin-bottom: 45px;
          }

          .wishlist-heading h1 {
            font-size: 46px;
          }

          .wishlist-heading p {
            font-size: 13px;
          }

          .wishlist-products {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );

            gap: 14px;
          }

          .wishlist-message {
            min-height: 300px;
          }

          .wishlist-message h2 {
            font-size: 30px;
          }
        }

        @media (max-width: 480px) {
          .wishlist-products {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
}