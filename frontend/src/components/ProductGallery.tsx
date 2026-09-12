'use client';

import { useEffect, useMemo, useState } from "react";

import { Product, isUsableImageUrl } from "../lib";

type ProductGalleryProps = {
  product: Product;
  showSaleBadge?: boolean;
};

export default function ProductGallery({
  product,
  showSaleBadge = false,
}: ProductGalleryProps) {
  const galleryImages = useMemo(() => {
    return [...(product.images || [])]
      .filter((image) => isUsableImageUrl(image.url))
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
  }, [product.images]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);
  const [lightboxOpen, setLightboxOpen] =
    useState(false);

  useEffect(() => {
    if (
      galleryImages.length === 0 &&
      selectedIndex !== 0
    ) {
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex >= galleryImages.length) {
      setSelectedIndex(
        Math.max(0, galleryImages.length - 1)
      );
    }
  }, [galleryImages.length, selectedIndex]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        return;
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex((current) => {
          if (galleryImages.length === 0) {
            return 0;
          }

          return (current + 1) % galleryImages.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => {
          if (galleryImages.length === 0) {
            return 0;
          }

          return (
            (current - 1 + galleryImages.length) %
            galleryImages.length
          );
        });
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [galleryImages.length, lightboxOpen]);

  const selectedImage =
    galleryImages[selectedIndex]?.url || "";

  return (
    <div className="product-gallery">
      <div className="product-main-image">
        {selectedImage ? (
          <button
            type="button"
            className="product-main-image-button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Open image gallery for ${product.name}`}
          >
            <img
              src={selectedImage}
              alt={product.name}
            />
          </button>
        ) : (
          <div className="product-no-image">
            Image unavailable
          </div>
        )}

        {showSaleBadge && (
          <span className="badge">SALE</span>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="product-thumbnails">
          {galleryImages.map((image, index) => (
            <button
              key={image.id || `${image.url}-${index}`}
              type="button"
              className={
                selectedIndex === index
                  ? "product-thumbnail is-selected"
                  : "product-thumbnail"
              }
              onClick={() =>
                setSelectedIndex(index)
              }
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.url}
                alt={`${product.name} image ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && selectedImage && (
        <div
          className="product-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} gallery`}
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="product-gallery-lightbox-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="product-gallery-lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              Close
            </button>

            <button
              type="button"
              className="product-gallery-lightbox-nav prev"
              onClick={() =>
                setSelectedIndex((current) => {
                  if (galleryImages.length === 0) {
                    return 0;
                  }

                  return (
                    (current - 1 + galleryImages.length) %
                    galleryImages.length
                  );
                })
              }
            >
              ←
            </button>

            <img
              src={selectedImage}
              alt={`${product.name} gallery view`}
            />

            <button
              type="button"
              className="product-gallery-lightbox-nav next"
              onClick={() =>
                setSelectedIndex((current) => {
                  if (galleryImages.length === 0) {
                    return 0;
                  }

                  return (current + 1) % galleryImages.length;
                })
              }
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
