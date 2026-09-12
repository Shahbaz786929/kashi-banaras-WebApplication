"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";

import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import { getProducts, Product } from "../../lib";

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (mounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Search products error:", err);

        if (mounted) {
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Search actual backend product data.
   *
   * Fields checked:
   * - product name
   * - SKU
   * - slug
   * - description
   * - fabric
   * - weave
   * - zari type
   * - occasion
   * - category name
   */
  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.sku,
        product.slug,
        product.description,
        product.fabric,
        product.weave,
        product.zariType,
        product.occasion,
        product.category?.name,
        product.category?.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [products, query]);

  return (
    <>
      <Header />

      <main className="search-page">

        {/* PAGE HEADER */}
        <section className="search-header">
          <div className="search-heading">
            <span>DISCOVER YOUR WEAVE</span>

            <h1>Search Sarees</h1>

            <p>
              Find your perfect Banarasi saree from our
              collection.
            </p>
          </div>

          {/* SEARCH INPUT */}
          <div className="search-box">
            <Search size={20} />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search sarees, fabric, weave, SKU..."
              autoFocus
              aria-label="Search sarees"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* RESULT COUNT */}
          {!loading && !error && (
            <div className="search-result-info">
              {query.trim() ? (
                <>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "product"
                    : "products"}{" "}
                  found
                </>
              ) : (
                <>
                  {products.length}{" "}
                  {products.length === 1
                    ? "product"
                    : "products"}{" "}
                  available
                </>
              )}
            </div>
          )}
        </section>

        {/* RESULTS */}
        <section className="search-results">

          {loading && (
            <div className="search-status">
              <div className="search-spinner" />
              <p>Loading sarees...</p>
            </div>
          )}

          {!loading && error && (
            <div className="search-status search-error">
              <h2>Something went wrong</h2>

              <p>{error}</p>

              <button
                type="button"
                className="gold-btn"
                onClick={() => window.location.reload()}
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredProducts.length === 0 && (
              <div className="search-status">
                <h2>No sarees found</h2>

                <p>
                  We couldn't find any product matching
                  "{query}".
                </p>

                <button
                  type="button"
                  className="gold-btn"
                  onClick={() => setQuery("")}
                >
                  VIEW ALL SAREES
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="products search-products">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    p={product}
                  />
                ))}
              </div>
            )}
        </section>

        {/* BACK TO COLLECTION */}
        <div className="search-back">
          <Link href="/sarees">
            VIEW COMPLETE COLLECTION →
          </Link>
        </div>
      </main>

      <style jsx>{`
        .search-page {
          min-height: calc(100vh - 150px);
          background: #f7f2e8;
          color: #171411;
          padding-bottom: 80px;
        }

        .search-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 70px 30px 35px;
        }

        .search-heading {
          text-align: center;
          margin-bottom: 35px;
        }

        .search-heading span {
          display: block;

          margin-bottom: 10px;

          color: #a47b32;

          font-size: 11px;
          font-weight: 600;

          letter-spacing: 3px;
        }

        .search-heading h1 {
          margin: 0;

          font-family: "Cormorant Garamond", serif;

          font-size: clamp(42px, 6vw, 68px);

          line-height: 0.95;

          font-weight: 500;

          color: #171411;
        }

        .search-heading p {
          margin: 18px auto 0;

          max-width: 520px;

          color: #665f56;

          font-size: 15px;
          line-height: 1.7;
        }

        .search-box {
          max-width: 760px;

          height: 58px;

          margin: 0 auto;

          display: flex;
          align-items: center;

          gap: 14px;

          padding: 0 18px;

          box-sizing: border-box;

          background: #fffdf8;

          border: 1px solid #d8cbb6;

          box-shadow:
            0 10px 30px rgba(30, 20, 10, 0.06);
        }

        .search-box > :global(svg) {
          flex-shrink: 0;

          color: #9a742f;
        }

        .search-box input {
          width: 100%;

          height: 100%;

          border: none;
          outline: none;

          background: transparent;

          color: #171411;

          font-family: "DM Sans", sans-serif;

          font-size: 14px;
        }

        .search-box input::placeholder {
          color: #9a9389;
        }

        .search-box button {
          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          width: 32px;
          height: 32px;

          padding: 0;

          border: none;

          background: transparent;

          color: #665f56;

          cursor: pointer;
        }

        .search-box button:hover {
          color: #a47b32;
        }

        .search-result-info {
          max-width: 760px;

          margin: 15px auto 0;

          text-align: right;

          color: #776f65;

          font-size: 12px;

          letter-spacing: 0.5px;
        }

        .search-results {
          max-width: 1200px;

          margin: 0 auto;

          padding: 10px 30px 0;
        }

        .search-products {
          width: 100%;
        }

        .search-status {
          min-height: 300px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 50px 20px;
        }

        .search-status h2 {
          margin: 0;

          font-family: "Cormorant Garamond", serif;

          font-size: 38px;

          font-weight: 500;

          color: #171411;
        }

        .search-status p {
          margin: 12px 0 25px;

          color: #70685e;

          font-size: 14px;
        }

        .search-spinner {
          width: 30px;
          height: 30px;

          margin-bottom: 18px;

          border: 2px solid #d8cbb6;

          border-top-color: #a47b32;

          border-radius: 50%;

          animation: searchSpin 0.8s linear infinite;
        }

        @keyframes searchSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .search-error h2 {
          color: #6b2727;
        }

        .search-back {
          text-align: center;

          margin-top: 55px;
        }

        .search-back a {
          color: #8d692b;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 2px;

          text-decoration: none;
        }

        .search-back a:hover {
          color: #171411;
        }

        @media (max-width: 768px) {
          .search-page {
            padding-bottom: 50px;
          }

          .search-header {
            padding: 45px 18px 25px;
          }

          .search-heading {
            margin-bottom: 25px;
          }

          .search-heading h1 {
            font-size: 45px;
          }

          .search-heading p {
            font-size: 13px;
            line-height: 1.6;
          }

          .search-box {
            height: 54px;

            padding: 0 14px;

            gap: 10px;
          }

          .search-box input {
            font-size: 13px;
          }

          .search-results {
            padding: 5px 14px 0;
          }

          .search-result-info {
            font-size: 11px;
          }

          .search-status {
            min-height: 250px;
          }

          .search-status h2 {
            font-size: 32px;
          }
        }

        @media (max-width: 400px) {
          .search-header {
            padding-left: 14px;
            padding-right: 14px;
          }

          .search-heading h1 {
            font-size: 40px;
          }

          .search-box {
            height: 52px;
          }

          .search-box input {
            font-size: 12px;
          }

          .search-results {
            padding-left: 10px;
            padding-right: 10px;
          }
        }
      `}</style>
    </>
  );
}