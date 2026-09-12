import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "../../../components/Header";
import AddToCartButton from "../../../components/AddToCartButton";
import AiColorStudio from "../../../components/AiColorStudio";
import ProductGallery from "../../../components/ProductGallery";

import {
  getProductBySlug,
  getProductImage,
} from "../../../lib";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const product =
    await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const images = [...(product.images || [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0)
  );

  const primaryImage =
    getProductImage(product);

  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const sellingPrice = hasDiscount
    ? product.discountPrice!
    : product.price;

  return (
    <>
      <Header />

      <main className="product-detail">

        <div className="product-breadcrumb">
          <Link href="/">Home</Link>

          <span>/</span>

          <Link href="/sarees">
            Sarees
          </Link>

          <span>/</span>

          <span>{product.name}</span>
        </div>

        <section className="product-detail-grid">

          <ProductGallery
            product={product}
            showSaleBadge={hasDiscount}
          />

          <div className="product-detail-info">

            <span className="eyebrow">
              {product.category?.name ||
                "BANARASI SAREE"}
            </span>

            <h1>{product.name}</h1>

            <div className="product-rating">
              <span>★★★★★</span>
              <small>5.0</small>
            </div>

            <div className="product-price">

              <strong>
                ₹
                {sellingPrice.toLocaleString(
                  "en-IN"
                )}
              </strong>

              {hasDiscount && (
                <del>
                  ₹
                  {product.price.toLocaleString(
                    "en-IN"
                  )}
                </del>
              )}

            </div>

            {hasDiscount && (
              <p className="discount-text">
                You save ₹
                {(
                  product.price -
                  product.discountPrice!
                ).toLocaleString("en-IN")}
              </p>
            )}

            <div className="product-divider" />

            {product.description && (
              <div className="product-description">

                <h3>Description</h3>

                <p>
                  {product.description}
                </p>

              </div>
            )}

            <div className="product-specifications">

              <h3>Product Details</h3>

              {product.fabric && (
                <div className="spec-row">
                  <span>Fabric</span>
                  <strong>
                    {product.fabric}
                  </strong>
                </div>
              )}

              {product.weave && (
                <div className="spec-row">
                  <span>Weave</span>
                  <strong>
                    {product.weave}
                  </strong>
                </div>
              )}

              {product.zariType && (
                <div className="spec-row">
                  <span>Zari Type</span>
                  <strong>
                    {product.zariType}
                  </strong>
                </div>
              )}

              {product.occasion && (
                <div className="spec-row">
                  <span>Occasion</span>
                  <strong>
                    {product.occasion}
                  </strong>
                </div>
              )}

              {product.category && (
                <div className="spec-row">
                  <span>Category</span>
                  <strong>
                    {product.category.name}
                  </strong>
                </div>
              )}

              <div className="spec-row">
                <span>SKU</span>
                <strong>
                  {product.sku}
                </strong>
              </div>

            </div>

            <div className="product-actions">

              <AddToCartButton
                productId={product.id}
              />

              <button
                type="button"
                className="outline-btn product-wishlist"
              >
                ♡ ADD TO WISHLIST
              </button>

            </div>

            <div className="product-service-info">

              <div>
                <strong>
                  FREE SHIPPING
                </strong>

                <span>
                  Worldwide delivery available
                </span>
              </div>

              <div>
                <strong>
                  AUTHENTIC BANARASI
                </strong>

                <span>
                  Handwoven by skilled artisans
                </span>
              </div>

              <div>
                <strong>
                  SECURE PAYMENT
                </strong>

                <span>
                  Safe and secure checkout
                </span>
              </div>

            </div>

          </div>

        </section>

        <AiColorStudio
          productId={product.id}
          productName={product.name}
          originalImage={primaryImage}
          colors={product.colors || []}
        />

      </main>
    </>
  );
}