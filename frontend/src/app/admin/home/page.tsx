"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API } from "../../../lib";

type Banner = {
  id: number;
  smallHeading?: string | null;
  title: string;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  imageUrl: string;
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

type Category = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
};

type ProductCollection = {
  id: number;
  name: string;
  slug: string;
};

type ProductImage = {
  id: number;
  url: string;
  type: string;
  sortOrder: number;
};

type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  active: boolean;
  showOnHome?: boolean;
  homePosition?: number;
  category?: Category | null;
  collection?: ProductCollection | null;
  images?: ProductImage[];
  inventory?: {
    stockQuantity: number;
    reservedQuantity: number;
    soldQuantity: number;
    lowStockThreshold: number;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type BannerForm = {
  smallHeading: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  sortOrder: string;
};

type CollectionForm = {
  name: string;
  slug: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  sortOrder: string;
};

const EMPTY_BANNER: BannerForm = {
  smallHeading: "",
  title: "",
  description: "",
  buttonText: "SHOP NOW",
  buttonLink: "/sarees",
  active: true,
  sortOrder: "0",
};

const EMPTY_COLLECTION: CollectionForm = {
  name: "",
  slug: "",
  description: "",
  buttonText: "SHOP NOW",
  buttonLink: "/sarees",
  active: true,
  sortOrder: "0",
};

async function readResponse<T>(
  response: Response
): Promise<{ success: boolean; message: string; data?: T }> {
  const text = await response.text();

  if (!text) {
    return {
      success: response.ok,
      message: response.ok
        ? "Request completed"
        : `Request failed with status ${response.status}`,
    };
  }

  try {
    const parsed = JSON.parse(text);

    if (
      parsed &&
      typeof parsed === "object" &&
      ("success" in parsed || "data" in parsed || "message" in parsed)
    ) {
      return {
        success:
          typeof parsed.success === "boolean"
            ? parsed.success
            : response.ok,
        message:
          parsed.message ||
          (response.ok
            ? "Request completed"
            : `Request failed with status ${response.status}`),
        data: parsed.data,
      };
    }

    return {
      success: response.ok,
      message: response.ok ? "Request completed" : "Request failed",
      data: parsed,
    };
  } catch {
    return {
      success: response.ok,
      message: text,
    };
  }
}

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

function getImage(product: Product) {
  return (
    product.images
      ?.slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || ""
  );
}

export default function AdminHomePage() {
  const router = useRouter();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [collections, setCollections] = useState<HomeCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [bannerForm, setBannerForm] =
    useState<BannerForm>(EMPTY_BANNER);

  const [collectionForm, setCollectionForm] =
    useState<CollectionForm>(EMPTY_COLLECTION);

  const [bannerImage, setBannerImage] =
    useState<File | null>(null);

  const [collectionImage, setCollectionImage] =
    useState<File | null>(null);

  const [bannerImagePreview, setBannerImagePreview] =
    useState("");

  const [collectionImagePreview, setCollectionImagePreview] =
    useState("");

  const [editingBannerId, setEditingBannerId] =
    useState<number | null>(null);

  const [editingCollectionId, setEditingCollectionId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingCollection, setSavingCollection] =
    useState(false);

  const [savingProductId, setSavingProductId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        bannersResponse,
        collectionsResponse,
        productsResponse,
      ] = await Promise.all([
        fetch(`${API}/admin/home/banners`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }),

        fetch(`${API}/admin/home/collections`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }),

        fetch(`${API}/admin/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }),
      ]);

      if (
        bannersResponse.status === 401 ||
        collectionsResponse.status === 401 ||
        productsResponse.status === 401
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRoles");

        router.replace("/login?redirect=/admin/home");
        return;
      }

      if (
        bannersResponse.status === 403 ||
        collectionsResponse.status === 403 ||
        productsResponse.status === 403
      ) {
        router.replace("/");
        return;
      }

      const bannerResult =
        await readResponse<Banner[]>(bannersResponse);

      const collectionResult =
        await readResponse<HomeCollection[]>(
          collectionsResponse
        );

      const productResult =
        await readResponse<Product[]>(productsResponse);

      if (!bannersResponse.ok || !bannerResult.success) {
        throw new Error(
          bannerResult.message || "Unable to load banners"
        );
      }

      if (
        !collectionsResponse.ok ||
        !collectionResult.success
      ) {
        throw new Error(
          collectionResult.message ||
            "Unable to load collections"
        );
      }

      if (!productsResponse.ok || !productResult.success) {
        throw new Error(
          productResult.message ||
            "Unable to load products"
        );
      }

      setBanners(
        Array.isArray(bannerResult.data)
          ? bannerResult.data
          : []
      );

      setCollections(
        Array.isArray(collectionResult.data)
          ? collectionResult.data
          : []
      );

      setProducts(
        Array.isArray(productResult.data)
          ? productResult.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Home CMS"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBannerImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setBannerImage(file);
    setBannerImagePreview(URL.createObjectURL(file));
  }

  function handleCollectionImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setCollectionImage(file);
    setCollectionImagePreview(URL.createObjectURL(file));
  }

  function resetBannerForm() {
    setBannerForm(EMPTY_BANNER);
    setBannerImage(null);
    setBannerImagePreview("");
    setEditingBannerId(null);
  }

  function resetCollectionForm() {
    setCollectionForm(EMPTY_COLLECTION);
    setCollectionImage(null);
    setCollectionImagePreview("");
    setEditingCollectionId(null);
  }

  function editBanner(banner: Banner) {
    setEditingBannerId(banner.id);

    setBannerForm({
      smallHeading: banner.smallHeading || "",
      title: banner.title || "",
      description: banner.description || "",
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      active: banner.active,
      sortOrder: String(banner.sortOrder ?? 0),
    });

    setBannerImage(null);
    setBannerImagePreview(banner.imageUrl || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function editCollection(collection: HomeCollection) {
    setEditingCollectionId(collection.id);

    setCollectionForm({
      name: collection.name || "",
      slug: collection.slug || "",
      description: collection.description || "",
      buttonText: collection.buttonText || "",
      buttonLink: collection.buttonLink || "",
      active: collection.active,
      sortOrder: String(collection.sortOrder ?? 0),
    });

    setCollectionImage(null);
    setCollectionImagePreview(
      collection.imageUrl || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveBanner(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    if (!bannerForm.title.trim()) {
      setError("Banner title is required.");
      return;
    }

    if (!editingBannerId && !bannerImage) {
      setError("Please select a banner image.");
      return;
    }

    try {
      setSavingBanner(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append(
        "smallHeading",
        bannerForm.smallHeading
      );

      formData.append(
        "title",
        bannerForm.title
      );

      formData.append(
        "description",
        bannerForm.description
      );

      formData.append(
        "buttonText",
        bannerForm.buttonText
      );

      formData.append(
        "buttonLink",
        bannerForm.buttonLink
      );

      formData.append(
        "active",
        String(bannerForm.active)
      );

      formData.append(
        "sortOrder",
        String(
          Number.isFinite(Number(bannerForm.sortOrder))
            ? Number(bannerForm.sortOrder)
            : 0
        )
      );

      if (bannerImage) {
        formData.append("image", bannerImage);
      }

      const url = editingBannerId
        ? `${API}/admin/home/banners/${editingBannerId}`
        : `${API}/admin/home/banners`;

      const response = await fetch(url, {
        method: editingBannerId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result =
        await readResponse<Banner>(response);

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to save banner"
        );
      }

      setSuccess(
        editingBannerId
          ? "Banner updated successfully."
          : "Banner created successfully."
      );

      resetBannerForm();
      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save banner"
      );
    } finally {
      setSavingBanner(false);
    }
  }

  async function deleteBanner(id: number) {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    const confirmed = window.confirm(
      "Delete this home banner permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API}/admin/home/banners/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await readResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to delete banner"
        );
      }

      setSuccess("Banner deleted successfully.");
      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete banner"
      );
    }
  }

  async function toggleBanner(
    banner: Banner
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/admin/home/banners/${banner.id}/status?active=${!banner.active}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await readResponse<Banner>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update banner status"
        );
      }

      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update banner status"
      );
    }
  }

  async function saveCollection(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    if (!collectionForm.name.trim()) {
      setError("Collection name is required.");
      return;
    }

    if (!collectionForm.slug.trim()) {
      setError("Collection slug is required.");
      return;
    }

    try {
      setSavingCollection(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append(
        "name",
        collectionForm.name
      );

      formData.append(
        "slug",
        collectionForm.slug
      );

      formData.append(
        "description",
        collectionForm.description
      );

      formData.append(
        "buttonText",
        collectionForm.buttonText
      );

      formData.append(
        "buttonLink",
        collectionForm.buttonLink
      );

      formData.append(
        "active",
        String(collectionForm.active)
      );

      formData.append(
        "sortOrder",
        String(
          Number.isFinite(
            Number(collectionForm.sortOrder)
          )
            ? Number(collectionForm.sortOrder)
            : 0
        )
      );

      if (collectionImage) {
        formData.append(
          "image",
          collectionImage
        );
      }

      const url = editingCollectionId
        ? `${API}/admin/home/collections/${editingCollectionId}`
        : `${API}/admin/home/collections`;

      const response = await fetch(url, {
        method: editingCollectionId
          ? "PUT"
          : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result =
        await readResponse<HomeCollection>(
          response
        );

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to save collection"
        );
      }

      setSuccess(
        editingCollectionId
          ? "Collection updated successfully."
          : "Collection created successfully."
      );

      resetCollectionForm();
      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save collection"
      );
    } finally {
      setSavingCollection(false);
    }
  }

  async function deleteCollection(id: number) {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    const confirmed = window.confirm(
      "Delete this collection permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API}/admin/home/collections/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await readResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to delete collection"
        );
      }

      setSuccess(
        "Collection deleted successfully."
      );

      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete collection"
      );
    }
  }

  async function toggleCollection(
    collection: HomeCollection
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/admin/home/collections/${collection.id}/status?active=${!collection.active}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await readResponse<HomeCollection>(
          response
        );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update collection status"
        );
      }

      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update collection status"
      );
    }
  }

  async function updateHomeProduct(
    product: Product,
    showOnHome: boolean,
    homePosition: number
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login?redirect=/admin/home");
      return;
    }

    try {
      setSavingProductId(product.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API}/admin/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            description: null,
            categoryId:
              product.category?.id ?? null,
            collectionId:
              product.collection?.id ?? null,
            price: product.price,
            discountPrice:
              product.discountPrice ?? null,
            stock:
              product.inventory?.stockQuantity ?? 0,
            lowStockThreshold:
              product.inventory
                ?.lowStockThreshold ?? 3,
            fabric: null,
            weave: null,
            zariType: null,
            occasion: null,
            showOnHome,
            homePosition,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          }),
        }
      );

      const result =
        await readResponse<Product>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update home product"
        );
      }

      setSuccess(
        `${product.name} home placement updated.`
      );

      await loadHomeData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update home product"
      );
    } finally {
      setSavingProductId(null);
    }
  }

  const homeProducts = products
    .filter((product) => product.active)
    .sort(
      (a, b) =>
        Number(a.homePosition ?? 999999) -
        Number(b.homePosition ?? 999999)
    );

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            KASHI BANARAS
          </div>

          <h1 style={titleStyle}>
            Home Page Management
          </h1>

          <p style={subtitleStyle}>
            Manage your website hero, collections
            and featured sarees from one place.
          </p>
        </div>

        <div style={headerActions}>
          <Link
            href="/admin"
            style={secondaryButtonStyle}
          >
            ADMIN DASHBOARD
          </Link>

          <Link
            href="/"
            target="_blank"
            style={primaryButtonStyle}
          >
            VIEW WEBSITE
          </Link>
        </div>
      </header>

      <div style={contentStyle}>
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {success && (
          <div style={successStyle}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={loadingStyle}>
            Loading Home CMS...
          </div>
        ) : (
          <>
            {/* ========================= */}
            {/* HERO BANNERS */}
            {/* ========================= */}

            <section style={sectionStyle}>
              <SectionHeading
                eyebrow="01 — HERO"
                title="Hero Banners"
                description="Control the main visual banner shown at the top of your Home page."
              />

              <div style={formCardStyle}>
                <div style={formHeaderStyle}>
                  <div>
                    <h3 style={formTitleStyle}>
                      {editingBannerId
                        ? "Edit Hero Banner"
                        : "Create Hero Banner"}
                    </h3>

                    <p style={mutedStyle}>
                      Upload a real Cloudinary image
                      and control all banner content.
                    </p>
                  </div>

                  {editingBannerId && (
                    <button
                      type="button"
                      onClick={resetBannerForm}
                      style={secondaryButtonStyle}
                    >
                      CANCEL EDIT
                    </button>
                  )}
                </div>

                <form
                  onSubmit={saveBanner}
                  style={formGridStyle}
                >
                  <Field label="SMALL HEADING">
                    <input
                      value={bannerForm.smallHeading}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          smallHeading:
                            e.target.value,
                        })
                      }
                      placeholder="THE WEAVE OF HERITAGE"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="MAIN HEADING *">
                    <input
                      value={bannerForm.title}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="PURE BANARASI SAREES"
                      style={inputStyle}
                      required
                    />
                  </Field>

                  <Field label="DESCRIPTION">
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          description:
                            e.target.value,
                        })
                      }
                      placeholder="Write your hero description..."
                      style={{
                        ...inputStyle,
                        minHeight: 110,
                        resize: "vertical",
                      }}
                    />
                  </Field>

                  <div style={twoColumnStyle}>
                    <Field label="BUTTON TEXT">
                      <input
                        value={bannerForm.buttonText}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            buttonText:
                              e.target.value,
                          })
                        }
                        placeholder="SHOP SAREES"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="BUTTON LINK">
                      <input
                        value={bannerForm.buttonLink}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            buttonLink:
                              e.target.value,
                          })
                        }
                        placeholder="/sarees"
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div style={twoColumnStyle}>
                    <Field label="SORT ORDER">
                      <input
                        type="number"
                        value={bannerForm.sortOrder}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            sortOrder:
                              e.target.value,
                          })
                        }
                        min="0"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="STATUS">
                      <label
                        style={checkboxLabelStyle}
                      >
                        <input
                          type="checkbox"
                          checked={bannerForm.active}
                          onChange={(e) =>
                            setBannerForm({
                              ...bannerForm,
                              active:
                                e.target.checked,
                            })
                          }
                        />
                        <span>
                          Show this banner on
                          website
                        </span>
                      </label>
                    </Field>
                  </div>

                  <Field label="BANNER IMAGE *">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImage}
                      style={fileInputStyle}
                    />

                    {bannerImagePreview && (
                      <div
                        style={
                          imagePreviewContainerStyle
                        }
                      >
                        <img
                          src={bannerImagePreview}
                          alt="Banner preview"
                          style={bannerPreviewStyle}
                        />
                      </div>
                    )}
                  </Field>

                  <div style={formActionsStyle}>
                    <button
                      type="submit"
                      disabled={savingBanner}
                      style={primaryButtonStyle}
                    >
                      {savingBanner
                        ? "SAVING..."
                        : editingBannerId
                          ? "UPDATE BANNER"
                          : "CREATE BANNER"}
                    </button>
                  </div>
                </form>
              </div>

              <div style={listGridStyle}>
                {banners.length === 0 ? (
                  <EmptyState
                    title="No hero banners"
                    text="Create your first Home page hero banner above."
                  />
                ) : (
                  banners
                    .slice()
                    .sort(
                      (a, b) =>
                        a.sortOrder - b.sortOrder
                    )
                    .map((banner) => (
                      <article
                        key={banner.id}
                        style={cardStyle}
                      >
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          style={cardImageStyle}
                        />

                        <div style={cardBodyStyle}>
                          <div
                            style={cardTopRowStyle}
                          >
                            <span
                              style={
                                banner.active
                                  ? activeBadgeStyle
                                  : inactiveBadgeStyle
                              }
                            >
                              {banner.active
                                ? "LIVE"
                                : "INACTIVE"}
                            </span>

                            <span
                              style={positionBadgeStyle}
                            >
                              #{banner.sortOrder}
                            </span>
                          </div>

                          {banner.smallHeading && (
                            <div
                              style={
                                cardEyebrowStyle
                              }
                            >
                              {banner.smallHeading}
                            </div>
                          )}

                          <h3
                            style={
                              cardTitleStyle
                            }
                          >
                            {banner.title}
                          </h3>

                          {banner.description && (
                            <p
                              style={
                                cardDescriptionStyle
                              }
                            >
                              {banner.description}
                            </p>
                          )}

                          <div
                            style={
                              cardActionsStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                editBanner(
                                  banner
                                )
                              }
                              style={
                                smallButtonStyle
                              }
                            >
                              EDIT
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleBanner(
                                  banner
                                )
                              }
                              style={
                                smallButtonStyle
                              }
                            >
                              {banner.active
                                ? "HIDE"
                                : "ACTIVATE"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteBanner(
                                  banner.id
                                )
                              }
                              style={
                                dangerButtonStyle
                              }
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </section>

            {/* ========================= */}
            {/* COLLECTIONS */}
            {/* ========================= */}

            <section style={sectionStyle}>
              <SectionHeading
                eyebrow="02 — COLLECTIONS"
                title="Exclusive Collections"
                description="Create the collection cards displayed on the Home page."
              />

              <div style={formCardStyle}>
                <div style={formHeaderStyle}>
                  <div>
                    <h3 style={formTitleStyle}>
                      {editingCollectionId
                        ? "Edit Collection"
                        : "Create Collection"}
                    </h3>

                    <p style={mutedStyle}>
                      Collection images are uploaded
                      to Cloudinary.
                    </p>
                  </div>

                  {editingCollectionId && (
                    <button
                      type="button"
                      onClick={resetCollectionForm}
                      style={secondaryButtonStyle}
                    >
                      CANCEL EDIT
                    </button>
                  )}
                </div>

                <form
                  onSubmit={saveCollection}
                  style={formGridStyle}
                >
                  <div style={twoColumnStyle}>
                    <Field label="COLLECTION NAME *">
                      <input
                        value={collectionForm.name}
                        onChange={(e) =>
                          setCollectionForm({
                            ...collectionForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Bridal Banarasi"
                        style={inputStyle}
                        required
                      />
                    </Field>

                    <Field label="SLUG *">
                      <input
                        value={collectionForm.slug}
                        onChange={(e) =>
                          setCollectionForm({
                            ...collectionForm,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              ),
                          })
                        }
                        placeholder="bridal-banarasi"
                        style={inputStyle}
                        required
                      />
                    </Field>
                  </div>

                  <Field label="DESCRIPTION">
                    <textarea
                      value={
                        collectionForm.description
                      }
                      onChange={(e) =>
                        setCollectionForm({
                          ...collectionForm,
                          description:
                            e.target.value,
                        })
                      }
                      placeholder="Collection description..."
                      style={{
                        ...inputStyle,
                        minHeight: 100,
                        resize: "vertical",
                      }}
                    />
                  </Field>

                  <div style={twoColumnStyle}>
                    <Field label="BUTTON TEXT">
                      <input
                        value={
                          collectionForm.buttonText
                        }
                        onChange={(e) =>
                          setCollectionForm({
                            ...collectionForm,
                            buttonText:
                              e.target.value,
                          })
                        }
                        placeholder="SHOP NOW"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="BUTTON LINK">
                      <input
                        value={
                          collectionForm.buttonLink
                        }
                        onChange={(e) =>
                          setCollectionForm({
                            ...collectionForm,
                            buttonLink:
                              e.target.value,
                          })
                        }
                        placeholder="/sarees?collection=bridal"
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div style={twoColumnStyle}>
                    <Field label="SORT ORDER">
                      <input
                        type="number"
                        value={
                          collectionForm.sortOrder
                        }
                        onChange={(e) =>
                          setCollectionForm({
                            ...collectionForm,
                            sortOrder:
                              e.target.value,
                          })
                        }
                        min="0"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="STATUS">
                      <label
                        style={checkboxLabelStyle}
                      >
                        <input
                          type="checkbox"
                          checked={
                            collectionForm.active
                          }
                          onChange={(e) =>
                            setCollectionForm({
                              ...collectionForm,
                              active:
                                e.target.checked,
                            })
                          }
                        />
                        <span>
                          Show collection on
                          website
                        </span>
                      </label>
                    </Field>
                  </div>

                  <Field label="COLLECTION IMAGE">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleCollectionImage
                      }
                      style={fileInputStyle}
                    />

                    {collectionImagePreview && (
                      <div
                        style={
                          imagePreviewContainerStyle
                        }
                      >
                        <img
                          src={
                            collectionImagePreview
                          }
                          alt="Collection preview"
                          style={collectionPreviewStyle}
                        />
                      </div>
                    )}
                  </Field>

                  <div style={formActionsStyle}>
                    <button
                      type="submit"
                      disabled={
                        savingCollection
                      }
                      style={primaryButtonStyle}
                    >
                      {savingCollection
                        ? "SAVING..."
                        : editingCollectionId
                          ? "UPDATE COLLECTION"
                          : "CREATE COLLECTION"}
                    </button>
                  </div>
                </form>
              </div>

              <div style={collectionGridStyle}>
                {collections.length === 0 ? (
                  <EmptyState
                    title="No collections"
                    text="Create your first Home page collection above."
                  />
                ) : (
                  collections
                    .slice()
                    .sort(
                      (a, b) =>
                        a.sortOrder - b.sortOrder
                    )
                    .map((collection) => (
                      <article
                        key={collection.id}
                        style={collectionCardStyle}
                      >
                        {collection.imageUrl ? (
                          <img
                            src={
                              collection.imageUrl
                            }
                            alt={
                              collection.name
                            }
                            style={
                              collectionImageStyle
                            }
                          />
                        ) : (
                          <div
                            style={
                              collectionNoImageStyle
                            }
                          >
                            NO IMAGE
                          </div>
                        )}

                        <div
                          style={
                            collectionCardBodyStyle
                          }
                        >
                          <div
                            style={
                              cardTopRowStyle
                            }
                          >
                            <span
                              style={
                                collection.active
                                  ? activeBadgeStyle
                                  : inactiveBadgeStyle
                              }
                            >
                              {collection.active
                                ? "LIVE"
                                : "INACTIVE"}
                            </span>

                            <span
                              style={
                                positionBadgeStyle
                              }
                            >
                              #{collection.sortOrder}
                            </span>
                          </div>

                          <h3
                            style={
                              cardTitleStyle
                            }
                          >
                            {collection.name}
                          </h3>

                          <div
                            style={
                              slugStyle
                            }
                          >
                            /{collection.slug}
                          </div>

                          {collection.description && (
                            <p
                              style={
                                cardDescriptionStyle
                              }
                            >
                              {
                                collection.description
                              }
                            </p>
                          )}

                          <div
                            style={
                              cardActionsStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                editCollection(
                                  collection
                                )
                              }
                              style={
                                smallButtonStyle
                              }
                            >
                              EDIT
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCollection(
                                  collection
                                )
                              }
                              style={
                                smallButtonStyle
                              }
                            >
                              {collection.active
                                ? "HIDE"
                                : "ACTIVATE"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteCollection(
                                  collection.id
                                )
                              }
                              style={
                                dangerButtonStyle
                              }
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </section>

            {/* ========================= */}
            {/* HOME SAREES */}
            {/* ========================= */}

            <section style={sectionStyle}>
              <SectionHeading
                eyebrow="03 — PRODUCTS"
                title="Home Page Sarees"
                description="Choose which real products appear in the Home page product section and control their order."
              />

              <div style={infoBoxStyle}>
                <strong>
                  How this works
                </strong>

                <span>
                  Turn on “Show on Home” for a
                  product and give it a position.
                  Position 1 appears first, then 2,
                  3 and so on.
                </span>
              </div>

              <div style={productTableWrapperStyle}>
                {homeProducts.length === 0 ? (
                  <EmptyState
                    title="No active products"
                    text="Create active products first from Product Management."
                  />
                ) : (
                  <div
                    style={
                      productTableStyle
                    }
                  >
                    <div
                      style={
                        productTableHeaderStyle
                      }
                    >
                      <span>PRODUCT</span>
                      <span>CATEGORY</span>
                      <span>PRICE</span>
                      <span>HOME</span>
                      <span>POSITION</span>
                      <span>ACTION</span>
                    </div>

                    {homeProducts.map(
                      (product) => (
                        <HomeProductRow
                          key={product.id}
                          product={product}
                          saving={
                            savingProductId ===
                            product.id
                          }
                          onSave={
                            updateHomeProduct
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .home-admin-two-column {
            grid-template-columns: 1fr !important;
          }

          .home-admin-product-header {
            display: none !important;
          }

          .home-admin-product-row {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }

        @media (max-width: 700px) {
          .home-admin-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .home-admin-header-actions {
            width: 100% !important;
          }

          .home-admin-header-actions a {
            flex: 1 !important;
            text-align: center !important;
          }

          .home-admin-content {
            padding: 24px 16px !important;
          }
        }
      `}</style>
    </main>
  );
}

function HomeProductRow({
  product,
  saving,
  onSave,
}: {
  product: Product;
  saving: boolean;
  onSave: (
    product: Product,
    showOnHome: boolean,
    homePosition: number
  ) => Promise<void>;
}) {
  const [showOnHome, setShowOnHome] =
    useState(Boolean(product.showOnHome));

  const [position, setPosition] =
    useState(
      String(product.homePosition ?? 0)
    );

  useEffect(() => {
    setShowOnHome(Boolean(product.showOnHome));
    setPosition(
      String(product.homePosition ?? 0)
    );
  }, [
    product.showOnHome,
    product.homePosition,
  ]);

  const image = getImage(product);

  return (
    <div
      className="home-admin-product-row"
      style={productRowStyle}
    >
      <div style={productInfoStyle}>
        {image ? (
          <img
            src={image}
            alt={product.name}
            style={productThumbStyle}
          />
        ) : (
          <div style={productThumbPlaceholder}>
            NO IMAGE
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <strong style={productNameStyle}>
            {product.name}
          </strong>

          <span style={productSkuStyle}>
            SKU: {product.sku}
          </span>
        </div>
      </div>

      <div style={productCategoryStyle}>
        {product.category?.name || "—"}
      </div>

      <div style={productPriceStyle}>
        ₹
        {Number(
          product.discountPrice ??
            product.price
        ).toLocaleString("en-IN")}
      </div>

      <div>
        <label
          style={toggleLabelStyle}
        >
          <input
            type="checkbox"
            checked={showOnHome}
            onChange={(e) =>
              setShowOnHome(
                e.target.checked
              )
            }
          />

          <span>
            {showOnHome
              ? "SHOW"
              : "HIDDEN"}
          </span>
        </label>
      </div>

      <div>
        <input
          type="number"
          min="1"
          value={position}
          disabled={!showOnHome}
          onChange={(e) =>
            setPosition(e.target.value)
          }
          style={{
            ...positionInputStyle,
            opacity: showOnHome ? 1 : 0.5,
          }}
        />
      </div>

      <div>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              product,
              showOnHome,
              Math.max(
                1,
                Number(position) || 1
              )
            )
          }
          style={smallButtonStyle}
        >
          {saving ? "SAVING..." : "SAVE"}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div style={sectionHeadingStyle}>
      <div style={eyebrowStyle}>
        {eyebrow}
      </div>

      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <p style={sectionDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}
      </span>

      {children}
    </label>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyIconStyle}>
        ✦
      </div>

      <h3 style={emptyTitleStyle}>
        {title}
      </h3>

      <p style={emptyTextStyle}>
        {text}
      </p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f7f4ee",
  color: "#2c2925",
};

const headerStyle = {
  padding: "38px 5%",
  background: "#211c19",
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 30,
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  fontSize: 11,
  letterSpacing: "0.22em",
  fontWeight: 700,
  color: "#b99662",
  marginBottom: 10,
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 54px)",
  fontWeight: 500,
  letterSpacing: "-0.03em",
};

const subtitleStyle = {
  margin: "12px 0 0",
  maxWidth: 650,
  color: "#d8d0c7",
  lineHeight: 1.7,
  fontSize: 14,
};

const headerActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
};

const contentStyle = {
  width: "min(1400px, 92%)",
  margin: "0 auto",
  padding: "50px 0 90px",
};

const sectionStyle = {
  marginBottom: 75,
};

const sectionHeadingStyle = {
  marginBottom: 25,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 42px)",
  fontWeight: 500,
  letterSpacing: "-0.025em",
};

const sectionDescriptionStyle = {
  maxWidth: 720,
  margin: "10px 0 0",
  color: "#756e66",
  lineHeight: 1.7,
  fontSize: 14,
};

const formCardStyle = {
  background: "#fff",
  border: "1px solid #e5ded5",
  padding: "28px",
  marginBottom: 25,
  boxShadow: "0 12px 40px rgba(44,41,37,0.05)",
};

const formHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 25,
};

const formTitleStyle = {
  margin: 0,
  fontSize: 21,
  fontWeight: 600,
};

const mutedStyle = {
  margin: "7px 0 0",
  color: "#8a8177",
  fontSize: 13,
};

const formGridStyle = {
  display: "grid",
  gap: 18,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const fieldStyle = {
  display: "grid",
  gap: 7,
  minWidth: 0,
};

const labelStyle = {
  fontSize: 10,
  letterSpacing: "0.15em",
  fontWeight: 700,
  color: "#625b53",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #d9d1c7",
  background: "#fcfaf7",
  color: "#2c2925",
  padding: "13px 14px",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
};

const fileInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px dashed #cfc4b7",
  background: "#fcfaf7",
  padding: 18,
  fontSize: 13,
};

const checkboxLabelStyle = {
  minHeight: 46,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  border: "1px solid #d9d1c7",
  background: "#fcfaf7",
  fontSize: 13,
};

const formActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  paddingTop: 5,
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #a47d49",
  background: "#a47d49",
  color: "#fff",
  padding: "12px 18px",
  textDecoration: "none",
  fontSize: 10,
  letterSpacing: "0.13em",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #bdb2a7",
  background: "transparent",
  color: "#4c463f",
  padding: "11px 16px",
  textDecoration: "none",
  fontSize: 10,
  letterSpacing: "0.12em",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle = {
  border: "1px solid #c8bdb0",
  background: "#fff",
  color: "#3e3934",
  padding: "9px 12px",
  fontSize: 9,
  letterSpacing: "0.11em",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...smallButtonStyle,
  border: "1px solid #c98f89",
  color: "#a0473f",
};

const imagePreviewContainerStyle = {
  border: "1px solid #e2d9cf",
  background: "#f7f3ed",
  overflow: "hidden",
};

const bannerPreviewStyle = {
  display: "block",
  width: "100%",
  height: 300,
  objectFit: "cover" as const,
};

const collectionPreviewStyle = {
  display: "block",
  width: "100%",
  height: 260,
  objectFit: "cover" as const,
};

const listGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 20,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5ded5",
  overflow: "hidden",
};

const cardImageStyle = {
  display: "block",
  width: "100%",
  height: 230,
  objectFit: "cover" as const,
};

const cardBodyStyle = {
  padding: 20,
};

const cardTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 13,
};

const activeBadgeStyle = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#e5eee4",
  color: "#466443",
  fontSize: 9,
  letterSpacing: "0.1em",
  fontWeight: 700,
};

const inactiveBadgeStyle = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#eee9e3",
  color: "#777069",
  fontSize: 9,
  letterSpacing: "0.1em",
  fontWeight: 700,
};

const positionBadgeStyle = {
  fontSize: 10,
  color: "#8a8177",
  fontWeight: 700,
};

const cardEyebrowStyle = {
  color: "#a47d49",
  fontSize: 10,
  letterSpacing: "0.15em",
  marginBottom: 7,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 21,
  fontWeight: 600,
};

const cardDescriptionStyle = {
  margin: "10px 0 0",
  color: "#756e66",
  fontSize: 13,
  lineHeight: 1.65,
};

const cardActionsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 18,
};

const collectionGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 20,
};

const collectionCardStyle = {
  background: "#fff",
  border: "1px solid #e5ded5",
  overflow: "hidden",
};

const collectionImageStyle = {
  display: "block",
  width: "100%",
  height: 280,
  objectFit: "cover" as const,
};

const collectionNoImageStyle = {
  width: "100%",
  height: 280,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#eee8df",
  color: "#8b8279",
  fontSize: 10,
  letterSpacing: "0.15em",
};

const collectionCardBodyStyle = {
  padding: 20,
};

const slugStyle = {
  marginTop: 5,
  color: "#a47d49",
  fontSize: 11,
};

const infoBoxStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  padding: "16px 18px",
  marginBottom: 20,
  background: "#efe8de",
  border: "1px solid #e1d5c7",
  color: "#5f574f",
  fontSize: 13,
  lineHeight: 1.6,
};

const productTableWrapperStyle = {
  background: "#fff",
  border: "1px solid #e5ded5",
  overflow: "hidden",
};

const productTableStyle = {
  width: "100%",
};

const productTableHeaderStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px, 2fr) minmax(130px, 1fr) 130px 110px 110px 110px",
  gap: 15,
  padding: "14px 18px",
  background: "#211c19",
  color: "#fff",
  fontSize: 9,
  letterSpacing: "0.13em",
  fontWeight: 700,
};

const productRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px, 2fr) minmax(130px, 1fr) 130px 110px 110px 110px",
  gap: 15,
  alignItems: "center",
  padding: "15px 18px",
  borderBottom: "1px solid #eee8df",
};

const productInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const productThumbStyle = {
  width: 58,
  height: 72,
  objectFit: "cover" as const,
  flexShrink: 0,
  border: "1px solid #e4dbd0",
};

const productThumbPlaceholder = {
  width: 58,
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: "#eee8df",
  color: "#8c837a",
  fontSize: 8,
  textAlign: "center" as const,
};

const productNameStyle = {
  display: "block",
  fontSize: 14,
  lineHeight: 1.4,
};

const productSkuStyle = {
  display: "block",
  marginTop: 5,
  color: "#91887e",
  fontSize: 10,
};

const productCategoryStyle = {
  color: "#70685f",
  fontSize: 12,
};

const productPriceStyle = {
  fontSize: 13,
  fontWeight: 700,
};

const toggleLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 9,
  letterSpacing: "0.08em",
  fontWeight: 700,
};

const positionInputStyle = {
  width: 70,
  boxSizing: "border-box" as const,
  padding: "9px 8px",
  border: "1px solid #d6ccc0",
  background: "#fcfaf7",
};

const loadingStyle = {
  padding: 60,
  textAlign: "center" as const,
  color: "#827970",
};

const errorStyle = {
  marginBottom: 20,
  padding: "13px 16px",
  border: "1px solid #dfaaa4",
  background: "#fff1ef",
  color: "#9b4037",
  fontSize: 13,
};

const successStyle = {
  marginBottom: 20,
  padding: "13px 16px",
  border: "1px solid #b8ceb4",
  background: "#eff7ed",
  color: "#4b7047",
  fontSize: 13,
};

const emptyStateStyle = {
  gridColumn: "1 / -1",
  padding: "50px 25px",
  textAlign: "center" as const,
  border: "1px dashed #d5cbc0",
  background: "#fbf9f6",
};

const emptyIconStyle = {
  fontSize: 26,
  color: "#a47d49",
};

const emptyTitleStyle = {
  margin: "8px 0 5px",
  fontSize: 18,
};

const emptyTextStyle = {
  margin: 0,
  color: "#817970",
  fontSize: 13,
};