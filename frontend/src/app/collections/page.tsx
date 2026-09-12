import Link from "next/link";

import Header from "../../components/Header";
import { API, isUsableImageUrl } from "../../lib";

export const dynamic = "force-dynamic";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  buttonLink?: string | null;
  active: boolean;
  sortOrder: number;
};

type ProductImage = {
  id: number;
  url: string;
  type?: string;
  sortOrder?: number;
};

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
};

type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;

  category: ProductCategory | null;

  price: number;
  discountPrice?: number | null;

  active: boolean;

  images: ProductImage[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};


/* =========================================================
   GET CATEGORIES
========================================================= */

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(
      `${API}/home/collections`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Categories API failed with status ${response.status}`
      );
    }

    const result =
      (await response.json()) as Category[];

    if (
      !Array.isArray(result)
    ) {
      throw new Error("Unable to load collections.");
    }

    return result.filter(
      (category) =>
        category.active &&
        Boolean(category.slug)
    );
  } catch (error) {
    console.error(
      "Failed to fetch categories:",
      error
    );

    return [];
  }
}


/* =========================================================
   GET PRODUCTS
========================================================= */

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${API}/products`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Products API failed with status ${response.status}`
      );
    }

    const result =
      (await response.json()) as ApiResponse<Product[]>;

    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      throw new Error(
        result.message ||
          "Unable to load products."
      );
    }

    return result.data.filter(
      (product) =>
        product.active
    );
  } catch (error) {
    console.error(
      "Failed to fetch products:",
      error
    );

    return [];
  }
}


/* =========================================================
   GET CATEGORY IMAGE
========================================================= */

function getCategoryImage(
  category: Category,
  products: Product[]
): string | null {

  /*
   * 1. Prefer category's own database image.
   */

  if (
    category.imageUrl &&
    category.imageUrl.trim()
  ) {
    return category.imageUrl.trim();
  }


  /*
   * 2. If category has no image,
   *    use the first real product image
   *    belonging to this category.
   */

  const categoryProduct =
    products.find(
      (product) =>
        product.category?.slug ===
          category.slug &&
        product.images?.length > 0
    );

  if (
    categoryProduct &&
    categoryProduct.images.length > 0
  ) {

    const sortedImages = [
      ...categoryProduct.images,
    ].sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) -
        Number(b.sortOrder ?? 0)
    );

    const image =
      sortedImages.find(
        (item) =>
          item.url &&
          item.url.trim()
      );

    if (image) {
      return image.url.trim();
    }
  }


  /*
   * No image in database.
   */

  return null;
}


/* =========================================================
   DESCRIPTION
========================================================= */

function getDescription(
  category: Category
): string {

  if (
    category.description &&
    category.description.trim()
  ) {
    return category.description.trim();
  }

  return `Explore our ${category.name} collection of authentic Banarasi sarees, carefully selected for timeless elegance and traditional craftsmanship.`;
}


/* =========================================================
   PAGE
========================================================= */

export default async function CollectionsPage() {

  const categories = await getCategories();


  return (
    <>
      <Header />

      <main className="collections-page">

        {/* =================================================
            HERO
        ================================================== */}

        <section className="collections-hero">

          <span className="eyebrow">
            THE KASHI EDIT
          </span>

          <h1>
            Our
            <br />
            <em>Collections</em>
          </h1>

          <p>
            Discover carefully curated Banarasi sarees
            for every celebration, tradition and timeless
            moment.
          </p>

        </section>


        {/* =================================================
            COLLECTIONS
        ================================================== */}

        <section className="collections-grid-section">

          {categories.length > 0 ? (

            <div className="collections-page-grid">

              {categories.map(
                (category, index) => {

                  const imageUrl = isUsableImageUrl(category.imageUrl)
                    ? category.imageUrl
                    : null;

                  return (
                    <Link
                      key={category.id}
                      href={
                        !category.buttonLink ||
                        category.buttonLink === "/sarees"
                          ? `/sarees?collection=${encodeURIComponent(
                              category.slug
                            )}`
                          : category.buttonLink
                      }
                      className="collection-page-card"
                    >

                      {/* IMAGE */}

                      <div className="collection-page-image">

                        {imageUrl ? (

                          <img
                            src={imageUrl}
                            alt={`${category.name} collection`}
                          />

                        ) : (

                          <div className="collection-image-missing">

                            <span>
                              {category.name}
                            </span>

                            <small>
                              IMAGE NOT AVAILABLE
                            </small>

                          </div>

                        )}

                      </div>


                      {/* CONTENT */}

                      <div className="collection-page-content">

                        <span>
                          COLLECTION{" "}
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <h2>
                          {category.name}
                        </h2>

                        <p>
                          {getDescription(
                            category
                          )}
                        </p>

                        <b>
                          EXPLORE COLLECTION →
                        </b>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          ) : (

            /* =================================================
               EMPTY STATE
            ================================================== */

            <div className="collections-empty">

              <span className="eyebrow">
                COLLECTIONS
              </span>

              <h2>
                Collections are currently
                <br />
                <em>unavailable.</em>
              </h2>

              <p>
                We are preparing our Banarasi
                collections for you.
              </p>

              <Link
                href="/sarees"
                className="gold-btn"
              >
                VIEW ALL SAREES
              </Link>

            </div>

          )}

        </section>


        {/* =================================================
            CTA
        ================================================== */}

        <section className="collections-cta">

          <span className="eyebrow">
            FIND YOUR WEAVE
          </span>

          <h2>
            Explore the complete
            <br />
            <em>Banarasi collection.</em>
          </h2>

          <Link
            href="/sarees"
            className="gold-btn"
          >
            VIEW ALL SAREES
          </Link>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================== */}

      <footer className="collections-footer">

        <div className="collections-footer-inner">

          <div className="brand">

            <span className="brand-mark">
              ✦
            </span>

            <span>
              KASHI
              <small>
                BANARAS
              </small>
            </span>

          </div>

          <p>
            Pure Banarasi. Modern heirlooms.
          </p>

          <div className="footer-links">

            <Link href="/shipping-policy">
              Shipping
            </Link>

            <Link href="/return-policy">
              Returns
            </Link>

            <Link href="/privacy">
              Privacy
            </Link>

            <Link href="/#contact">
              Contact
            </Link>

          </div>

        </div>

        <div className="collections-footer-bottom">
          © 2026 Kashi Banaras. Crafted in Banaras.
        </div>

      </footer>
    </>
  );
}