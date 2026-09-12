"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "../lib";

type AddToCartButtonProps = {
  productId: number;
};

export default function AddToCartButton({
  productId,
}: AddToCartButtonProps) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {

    if (loading) {
      return;
    }

    setLoading(true);

    try {

      await addToCart(productId, 1);

      router.push("/cart");

    } catch (error) {

      if (
        error instanceof Error &&
        error.message === "LOGIN_REQUIRED"
      ) {
        router.push("/login");
        return;
      }

      alert(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="gold-btn product-add-cart"
      onClick={handleAddToCart}
      disabled={loading}
    >
      {loading ? "ADDING..." : "ADD TO CART"}
    </button>
  );
}