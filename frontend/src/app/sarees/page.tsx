import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import SareesToolbar from "../../components/SareesToolbar";
import { getProducts, Product } from "../../lib";

export const dynamic = "force-dynamic";

type SareesPageProps = {
  searchParams: {
    category?: string;
    collection?: string;
    sort?: string;
  };
};

export default async function Sarees({
  searchParams,
}: SareesPageProps) {
  let products: Product[] = [];
  let productsError = "";

  try {
    products = await getProducts();
  } catch (error) {
    console.error("Failed to load sarees:", error);
    productsError = "Unable to load products right now.";
  }

  const categorySlug = searchParams?.category?.trim().toLowerCase();
  const collectionSlug = searchParams?.collection?.trim().toLowerCase();
  const sort = searchParams?.sort || "recommended";

  let filteredProducts = [...products];

  /*
   * Category filtering
   *
   * Example:
   * /sarees?category=wedding
   */
  if (categorySlug) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category?.slug?.toLowerCase() === categorySlug
    );
  }

  if (collectionSlug) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.collection?.slug?.toLowerCase() === collectionSlug
    );
  }

  /*
   * Sorting
   */
  switch (sort) {
    case "low":
      filteredProducts.sort((a, b) => {
        const priceA =
          Number(a.discountPrice) > 0 &&
          Number(a.discountPrice) < Number(a.price)
            ? Number(a.discountPrice)
            : Number(a.price);

        const priceB =
          Number(b.discountPrice) > 0 &&
          Number(b.discountPrice) < Number(b.price)
            ? Number(b.discountPrice)
            : Number(b.price);

        return priceA - priceB;
      });
      break;

    case "high":
      filteredProducts.sort((a, b) => {
        const priceA =
          Number(a.discountPrice) > 0 &&
          Number(a.discountPrice) < Number(a.price)
            ? Number(a.discountPrice)
            : Number(a.price);

        const priceB =
          Number(b.discountPrice) > 0 &&
          Number(b.discountPrice) < Number(b.price)
            ? Number(b.discountPrice)
            : Number(b.price);

        return priceB - priceA;
      });
      break;

    case "newest":
      filteredProducts.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });
      break;

    case "recommended":
    default:
      /*
       * Keep backend order for Recommended.
       * No fake recommendation logic is introduced.
       */
      break;
  }

  return (
    <>
      <Header />

      <main className="section">
        <div className="section-title">
          <span>THE KASHI EDIT</span>

          <h2>
            {collectionSlug
              ? `${collectionSlug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                  )} Collection`
              : categorySlug
              ? `${categorySlug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                  )} Sarees`
              : "Banarasi Sarees"}
          </h2>

          <p>
            Handpicked weaves for weddings, celebrations
            and modern heirlooms.
          </p>
        </div>

        <SareesToolbar
          count={filteredProducts.length}
          sort={sort}
        />

        {productsError ? (
          <div className="center">
            <p>{productsError}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="center">
            <p>
              {collectionSlug
                ? "No sarees available in this collection right now."
                : categorySlug
                ? "No sarees available in this collection right now."
                : "No products available right now."}
            </p>
          </div>
        ) : (
          <div className="products">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                p={product}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}