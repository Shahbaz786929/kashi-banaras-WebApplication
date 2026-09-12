import Link from "next/link";

import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import {
  API,
  Product,
  getProductImage,
  isUsableImageUrl,
} from "../lib";

export const dynamic = "force-dynamic";

type HomeBanner = {
  id: number;
  imageUrl: string;
  smallHeading?: string | null;
  title: string;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  active: boolean;
  sortOrder: number;
};

type HomeCollection = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  active: boolean;
  sortOrder: number;
};

/*
 * =========================================================
 * HOME DATA
 * =========================================================
 *
 * Backend public HomeController:
 *
 * GET /api/home/banners
 * GET /api/home/collections
 * GET /api/home/products
 *
 * All three endpoints return direct JSON arrays.
 *
 * We intentionally DO NOT use:
 *
 * /products/home-content
 *
 * because that was the old homepage API.
 */

async function getHomeData(): Promise<{
  banners: HomeBanner[];
  collections: HomeCollection[];
  products: Product[];
}> {
  try {
    const [
      bannersResponse,
      collectionsResponse,
      productsResponse,
    ] = await Promise.all([
      fetch(`${API}/home/banners`, {
        cache: "no-store",
      }),

      fetch(`${API}/home/collections`, {
        cache: "no-store",
      }),

      fetch(`${API}/home/products`, {
        cache: "no-store",
      }),
    ]);

    /*
     * Read all responses as text first.
     *
     * This prevents JSON parsing from breaking the
     * complete Home page when one endpoint returns
     * an unexpected response.
     */

    const [
      bannersText,
      collectionsText,
      productsText,
    ] = await Promise.all([
      bannersResponse.text(),
      collectionsResponse.text(),
      productsResponse.text(),
    ]);

    let banners: HomeBanner[] = [];
    let collections: HomeCollection[] = [];
    let products: Product[] = [];

    /* =====================================================
       BANNERS
       ===================================================== */

    if (
      bannersResponse.ok &&
      bannersText
    ) {
      try {
        const data =
          JSON.parse(bannersText);

        if (Array.isArray(data)) {
          banners = data.filter(
            (banner): banner is HomeBanner =>
              Boolean(
                banner &&
                banner.active === true &&
                typeof banner.imageUrl ===
                  "string" &&
                banner.imageUrl.trim() &&
                typeof banner.title ===
                  "string"
              )
          );
        }

      } catch (error) {
        console.error(
          "Failed to parse home banners:",
          error
        );
      }

    } else {

      console.error(
        "Home banners API failed:",
        bannersResponse.status,
        bannersText
      );

    }

    /* =====================================================
       COLLECTIONS
       ===================================================== */

    if (
      collectionsResponse.ok &&
      collectionsText
    ) {
      try {
        const data =
          JSON.parse(collectionsText);

        if (Array.isArray(data)) {
          collections =
            data.filter(
              (
                collection
              ): collection is HomeCollection =>
                Boolean(
                  collection &&
                  collection.active === true
                )
            );
        }

      } catch (error) {

        console.error(
          "Failed to parse home collections:",
          error
        );

      }

    } else {

      console.error(
        "Home collections API failed:",
        collectionsResponse.status,
        collectionsText
      );

    }

    /* =====================================================
       HOME PRODUCTS
       ===================================================== */

    if (
      productsResponse.ok &&
      productsText
    ) {
      try {
        const data =
          JSON.parse(productsText);

        if (Array.isArray(data)) {

          products =
            data.filter(
              (
                product
              ): product is Product =>
                Boolean(
                  product &&
                  product.active === true &&
                  product.showOnHome === true
                )
            );

        }

      } catch (error) {

        console.error(
          "Failed to parse home products:",
          error
        );

      }

    } else {

      console.error(
        "Home products API failed:",
        productsResponse.status,
        productsText
      );

    }

    /* =====================================================
       SORT BANNERS
       ===================================================== */

    banners.sort(
      (a, b) =>
        Number(
          a.sortOrder ?? 0
        ) -
        Number(
          b.sortOrder ?? 0
        )
    );

    /* =====================================================
       SORT COLLECTIONS
       ===================================================== */

    collections.sort(
      (a, b) =>
        Number(
          a.sortOrder ?? 0
        ) -
        Number(
          b.sortOrder ?? 0
        )
    );

    /* =====================================================
       SORT PRODUCTS
       ===================================================== */

    products.sort(
      (a, b) =>
        Number(
          a.homePosition ?? 0
        ) -
        Number(
          b.homePosition ?? 0
        )
    );

    return {
      banners,
      collections,
      products,
    };

  } catch (error) {

    console.error(
      "Failed to load Home page data:",
      error
    );

    return {
      banners: [],
      collections: [],
      products: [],
    };
  }
}

/* =========================================================
   HOME PAGE
   ========================================================= */

export default async function Home() {

  /*
   * Load everything from the new public Home APIs.
   */

  const homeData =
    await getHomeData();

  const banners =
    homeData.banners;

  const collections =
    homeData.collections;

  const homeProducts =
    homeData.products;

  /*
   * The AI section also uses real products from
   * the Home page instead of static products.
   */

  const products =
    homeProducts;

  /*
   * Find first real product having an image.
   */

  const firstProductWithImage =
    products.find(
      (product) =>
        Boolean(
          getProductImage(product)
        )
    );

  /*
   * First active banner becomes the Hero.
   */

  const hero =
    banners.length > 0
      ? banners[0]
      : null;

  return (
    <>
      <Header />

      <main>

        {/* =================================================
            HERO
        ================================================== */}

        {hero ? (

          <section className="hero">

            <div className="hero-copy">

              {hero.smallHeading && (
                <span className="eyebrow">
                  {hero.smallHeading}
                </span>
              )}

              <h1>
                {formatHeading(
                  hero.title
                )}
              </h1>

              {hero.description && (
                <p>
                  {hero.description}
                </p>
              )}

              {hero.buttonText && (
                <Link
                  className="gold-btn"
                  href={
                    hero.buttonLink ||
                    "/sarees"
                  }
                >
                  {hero.buttonText}
                </Link>
              )}

            </div>

            <div className="hero-art">

              {isUsableImageUrl(hero.imageUrl) ? (

                <img
                  src={hero.imageUrl}
                  alt={
                    hero.title ||
                    "Kashi Banaras"
                  }
                />

              ) : (

                <div className="product-image-empty">
                  Banner image unavailable
                </div>

              )}

            </div>

          </section>

        ) : (

          /*
           * No active banner exists.
           *
           * No database image is available.
           */

          <section className="hero">

            <div className="hero-copy">

              <span className="eyebrow">
                KASHI BANARAS
              </span>

              <h1>
                PURE
                <br />
                <em>BANARASI</em>
                <br />
                SAREES
              </h1>

              <p>
                Our homepage banner is
                currently being prepared.
              </p>

              <Link
                className="gold-btn"
                href="/sarees"
              >
                EXPLORE COLLECTION
              </Link>

            </div>

            <div className="hero-art">

              <div className="product-image-empty">
                No active homepage banner
              </div>

            </div>

          </section>

        )}

        {/* =================================================
            BENEFITS
        ================================================== */}

        <section className="benefits">

          <div>
            ✦ <b>PURE SILK</b>

            <span>
              100% Authentic Banarasi
            </span>
          </div>

          <div>
            ♢ <b>HANDWOVEN</b>

            <span>
              By skilled artisans
            </span>
          </div>

          <div>
            ❖ <b>PURE ZARI</b>

            <span>
              Gold & silver weave
            </span>
          </div>

          <div>
            ◈ <b>WORLDWIDE</b>

            <span>
              Delivery available
            </span>
          </div>

        </section>

        {/* =================================================
            COLLECTIONS
        ================================================== */}

        {collections.length > 0 && (

          <section className="section dark">

            <div className="section-title">

              <span>
                CURATED FOR YOU
              </span>

              <h2>
                Exclusive Collections
              </h2>

            </div>

            <div className="collections">

              {collections.map(
                (collection) => {

                  const href =
                    !collection.buttonLink ||
                    collection.buttonLink === "/sarees"
                      ? `/sarees?collection=${encodeURIComponent(
                          collection.slug
                        )}`
                      : collection.buttonLink;

                  return (

                    <Link
                      key={collection.id}
                      href={href}
                    >

                      {isUsableImageUrl(collection.imageUrl) ? (

                        <img
                          src={
                            collection.imageUrl
                          }
                          alt={
                            collection.name
                          }
                        />

                      ) : (

                        <div className="product-image-empty">
                          Collection image unavailable
                        </div>

                      )}

                      <b>
                        {collection.name}
                      </b>

                      {collection.description && (
                        <span>
                          {
                            collection.description
                          }
                        </span>
                      )}

                      <small>
                        {
                          collection.buttonText ||
                          "SHOP NOW →"
                        }
                      </small>

                    </Link>

                  );
                }
              )}

            </div>

          </section>

        )}

        {/* =================================================
            BESTSELLERS
        ================================================== */}

        <section className="section">

          <div className="section-title">

            <span>
              THE EDIT
            </span>

            <h2>
              Bestsellers
            </h2>

          </div>

          {homeProducts.length > 0 ? (

            <div className="products">

              {homeProducts.map(
                (product) => (

                  <ProductCard
                    key={product.id}
                    p={product}
                  />

                )
              )}

            </div>

          ) : (

            <div className="center">

              <p>
                No sarees have been selected
                for the homepage yet.
              </p>

            </div>

          )}

          <div className="center">

            <Link
              className="outline-btn"
              href="/sarees"
            >
              VIEW ALL SAREES
            </Link>

          </div>

        </section>

        {/* =================================================
            AI BANNER
        ================================================== */}

        <section className="ai-banner">

          <div>

            <span className="eyebrow">
              MEET YOUR NEW DRESSING ROOM
            </span>

            <h2>
              See it. Love it.
              <br />
              <em>
                Make it yours.
              </em>
            </h2>

            <p>
              Preview your favourite
              Banarasi saree in a new
              colour with our AI Color
              Studio.
            </p>

            {firstProductWithImage && (

              <Link
                className="gold-btn"
                href={`/product/${firstProductWithImage.slug}`}
              >
                TRY AI COLOR STUDIO
              </Link>

            )}

          </div>

          <div className="ai-swatches">

            {products
              .filter(
                (product) =>
                  Boolean(
                    getProductImage(
                      product
                    )
                  )
              )
              .slice(0, 2)
              .map(
                (product) => (

                  <div
                    key={product.id}
                  >

                    <img
                      src={
                        getProductImage(
                          product
                        )
                      }
                      alt={
                        product.name
                      }
                    />

                    <span>
                      {product.name}
                    </span>

                  </div>

                )
              )}

          </div>

        </section>

        {/* =================================================
            STORY
        ================================================== */}

        <section
          className="story"
          id="story"
        >

          <div>

            <span className="eyebrow">
              ROOTED IN TRADITION
            </span>

            <h2>
              Crafted with
              <br />
              <em>
                passion.
              </em>
            </h2>

            <p>
              Every Kashi Banaras saree
              carries the patience of a
              master weaver and the soul
              of Banaras. From intricate
              zari to timeless motifs,
              every thread is a piece of
              heritage.
            </p>

            <Link
              className="gold-btn"
              href="/about"
            >
              OUR STORY
            </Link>

          </div>

          <div className="stats">

            <b>
              500+
              <small>
                ARTISANS
              </small>
            </b>

            <b>
              100+
              <small>
                DESIGNS
              </small>
            </b>

            <b>
              10K+
              <small>
                HAPPY CUSTOMERS
              </small>
            </b>

            <b>
              25+
              <small>
                YEARS OF LEGACY
              </small>
            </b>

          </div>

        </section>

      </main>

      {/* =================================================
          CONTACT
        ================================================== */}

      <section
        className="contact-section"
        id="contact"
      >

        <div className="contact-inner">

          <div className="contact-intro">

            <span className="eyebrow">
              VISIT • CALL • CONNECT
            </span>

            <h2>
              We would love to
              <br />
              <em>
                hear from you.
              </em>
            </h2>

            <p>
              Looking for a beautiful
              Banarasi saree or need help
              choosing the perfect weave?
              Our team at Shahbaz Silk &
              Saree is here to help.
            </p>

          </div>

          <div className="contact-details">

            {/* =================================================
                SHOP
            ================================================== */}

            <div className="contact-item">

              <span className="contact-icon">
                ✦
              </span>

              <div>

                <small>
                  OUR SHOP
                </small>

                <h3>
                  Shahbaz Silk &amp; Saree
                </h3>

                <p>
                  Katra Road,
                  <br />
                  Muberakpur, Azamgarh
                </p>

              </div>

            </div>

            {/* =================================================
                CALL
            ================================================== */}

            <div className="contact-item">

              <span className="contact-icon">
                ☎
              </span>

              <div>

                <small>
                  CALL US
                </small>

                <h3>
                  <a
                    href="tel:+916393973678"
                  >
                    +91 63939 73678
                  </a>
                </h3>

                <p>
                  Speak with us directly
                  <br />
                  for assistance.
                </p>

              </div>

            </div>

            {/* =================================================
                WHATSAPP
            ================================================== */}

            <div className="contact-item">

              <span className="contact-icon">
                ◈
              </span>

              <div>

                <small>
                  WHATSAPP
                </small>

                <h3>
                  <a
                    href="https://wa.me/916393973678"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +91 63939 73678
                  </a>
                </h3>

                <p>
                  Chat with us directly
                  <br />
                  on WhatsApp.
                </p>

                <a
                  className="whatsapp-btn"
                  href="https://wa.me/916393973678"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CHAT ON WHATSAPP →
                </a>

              </div>

            </div>

            {/* =================================================
                EMAIL
            ================================================== */}

            <div className="contact-item">

              <span className="contact-icon">
                ✉
              </span>

              <div>

                <small>
                  EMAIL
                </small>

                <h3>
                  Email support
                </h3>

                <p>
                  Our email address will be
                  <br />
                  added once provided.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          FOOTER
      ================================================== */}

      <footer className="site-footer">

        <div className="footer-main">

          <div className="footer-brand">

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
              Pure Banarasi.
              Modern heirlooms.
            </p>

          </div>

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

            <a href="#contact">
              Contact
            </a>

          </div>

        </div>

        <div className="footer-bottom">

          <small>
            © 2026 Kashi Banaras.
            Crafted in Banaras.
          </small>

          <span>
            Shahbaz Silk &amp; Saree
          </span>

        </div>

      </footer>

    </>
  );
}

/* ===========================================================
   HEADING FORMATTER
   =========================================================== */

function formatHeading(
  value: string
) {

  const words =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length <= 2) {

    return (
      <>
        {value}
      </>
    );
  }

  const first =
    words
      .slice(0, -1)
      .join(" ");

  const last =
    words[
      words.length - 1
    ];

  return (
    <>
      {first}

      <br />

      <em>
        {last}
      </em>
    </>
  );
}