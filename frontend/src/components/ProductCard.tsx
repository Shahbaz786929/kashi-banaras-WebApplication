"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Product,
  getProductImage,
  getProductPrice,
  getWishlist,
  toggleWishlist,
  addToCart,
} from "../lib";

type ProductCardProps = {
  p: Product;
};

export default function ProductCard({ p }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getProductImage(p);
  const price = getProductPrice(p);

  useEffect(() => {
    let mounted = true;

    async function loadWishlistState() {
      try {
        const wishlist = await getWishlist();

        if (!mounted) {
          return;
        }

        const exists = wishlist.some(
          (item) => Number(item.productId) === Number(p.id)
        );

        setIsWishlisted(exists);
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (
          error instanceof Error &&
          error.message === "LOGIN_REQUIRED"
        ) {
          setIsWishlisted(false);
          return;
        }

        console.error("Wishlist state error:", error);
      }
    }

    loadWishlistState();

    return () => {
      mounted = false;
    };
  }, [p.id]);

  async function handleWishlist(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (wishlistLoading) {
      return;
    }

    setWishlistLoading(true);

    try {
      const newState = await toggleWishlist(p.id);

      setIsWishlisted(newState);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "LOGIN_REQUIRED"
      ) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;

        return;
      }

      console.error("Wishlist update error:", error);
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (cartLoading) {
      return;
    }

    setCartLoading(true);

    try {
      await addToCart(p.id, 1);

      window.dispatchEvent(new Event("cart-updated"));

      alert("Product added to cart");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "LOGIN_REQUIRED"
      ) {
        sessionStorage.setItem(
          "pendingAddToCart",
          JSON.stringify({
            productId: p.id,
            quantity: 1,
          })
        );

        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;

        return;
      }

      console.error("Add to cart error:", error);
    } finally {
      setCartLoading(false);
    }
  }

  return (
    <article className="product-card">
      <Link
        href={`/product/${p.slug}`}
        className="product-card-link"
      >
        <div className="product-image">
          {imageUrl && !imageFailed ? (
            <Image
              src={imageUrl}
              alt={p.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="product-card-image"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="product-image-placeholder">
              <span>No image</span>
            </div>
          )}

          {p.discountPrice &&
            p.discountPrice > 0 &&
            p.discountPrice < p.price && (
              <span className="sale-badge">
                SALE
              </span>
            )}

          <button
            type="button"
            className={`wishlist-button ${
              isWishlisted
                ? "wishlist-button-active"
                : ""
            }`}
            aria-label={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
            title={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
            disabled={wishlistLoading}
            onClick={handleWishlist}
          >
            <Heart
              size={21}
              strokeWidth={1.8}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>

        <div className="product-info">
          <div className="product-category">
            {p.category?.name || "BANARASI"}
          </div>

          <h3>{p.name}</h3>

          <div className="product-sku">
            SKU: {p.sku}
          </div>

          <div className="product-price">
            {p.discountPrice &&
            p.discountPrice > 0 &&
            p.discountPrice < p.price ? (
              <>
                <span className="discount-price">
                  ₹
                  {Number(
                    p.discountPrice
                  ).toLocaleString("en-IN")}
                </span>

                <span className="original-price">
                  ₹
                  {Number(
                    p.price
                  ).toLocaleString("en-IN")}
                </span>
              </>
            ) : (
              <span>
                ₹
                {Number(price).toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="product-add-cart"
        disabled={cartLoading}
        onClick={handleAddToCart}
        title="Add to cart"
      >
        <ShoppingBag size={16} />

        {cartLoading
          ? "ADDING..."
          : "ADD TO CART"}
      </button>

      <style jsx>{`
        .product-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
        }

        .product-card-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .product-image {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #eee8dc;
        }

        .product-card-image {
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .product-card:hover
          .product-card-image {
          transform: scale(1.03);
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b8378;
          font-size: 13px;
        }

        .sale-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;

          padding: 7px 10px;

          background: #11100e;
          color: #d6ad5b;

          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
        }

        .wishlist-button {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;

          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;
          border-radius: 50%;

          background: rgba(
            255,
            255,
            255,
            0.92
          );

          color: #11100e;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .wishlist-button:hover {
          transform: scale(1.05);
          background: #11100e;
          color: #d6ad5b;
        }

        .wishlist-button-active {
          background: #11100e;
          color: #d6ad5b;
        }

        .wishlist-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .product-info {
          padding: 18px 2px 12px;
        }

        .product-category {
          margin-bottom: 7px;

          color: #a47a35;

          font-size: 9px;
          font-weight: 600;

          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .product-info h3 {
          margin: 0;

          color: #171512;

          font-family:
            "Cormorant Garamond",
            Georgia,
            serif;

          font-size: 25px;
          font-weight: 500;
          line-height: 1.05;
        }

        .product-sku {
          margin-top: 7px;

          color: #8c8377;

          font-size: 9px;
          letter-spacing: 0.8px;
        }

        .product-price {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-top: 12px;

          font-size: 15px;
          font-weight: 600;
        }

        .discount-price {
          color: #171512;
        }

        .original-price {
          color: #9a9185;
          font-size: 12px;
          text-decoration: line-through;
          font-weight: 400;
        }

        .product-add-cart {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          margin-top: 4px;
          padding: 12px 14px;

          border: 1px solid #c8a55a;

          background: transparent;
          color: #171512;

          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .product-add-cart:hover {
          background: #c8a55a;
          color: #11100e;
        }

        .product-add-cart:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        @media (max-width: 768px) {
          .wishlist-button {
            width: 38px;
            height: 38px;

            top: 10px;
            right: 10px;
          }

          .sale-badge {
            top: 10px;
            left: 10px;
          }

          .product-info {
            padding-top: 14px;
          }

          .product-info h3 {
            font-size: 21px;
          }

          .product-add-cart {
            font-size: 9px;
            padding: 11px 8px;
          }
        }
      `}</style>
    </article>
  );
}