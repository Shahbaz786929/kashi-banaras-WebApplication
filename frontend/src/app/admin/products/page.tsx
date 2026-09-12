"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API } from "../../../lib";

type Category = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
};

type Collection = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
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
  description?: string | null;
  category: Category | null;
  collection?: Collection | null;
  price: number;
  discountPrice?: number | null;
  fabric?: string | null;
  weave?: string | null;
  zariType?: string | null;
  occasion?: string | null;
  active: boolean;

  showOnHome?: boolean;
  homePosition?: number;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;

  images?: ProductImage[];

  inventory?: {
    id: number;
    stockQuantity: number;
    reservedQuantity: number;
    soldQuantity: number;
    lowStockThreshold: number;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type FormState = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  collectionId: string;

  price: string;
  discountPrice: string;
  stock: string;
  lowStockThreshold: string;

  fabric: string;
  weave: string;
  zariType: string;
  occasion: string;

  showOnHome: boolean;
  homePosition: string;

  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const EMPTY_FORM: FormState = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  collectionId: "",

  price: "",
  discountPrice: "",
  stock: "0",
  lowStockThreshold: "3",

  fabric: "",
  weave: "",
  zariType: "",
  occasion: "",

  showOnHome: false,
  homePosition: "0",

  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

async function readJson<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      success: false,
      message: `Request failed with status ${response.status}`,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
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

export default function AdminProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

      async function loadData() {
        const token = getToken();

        if (!token) {
          router.replace("/login?redirect=/admin/products");
          return;
        }

        try {
          setLoading(true);
          setError("");

          const [productResponse, categoryResponse, collectionResponse] =
            await Promise.all([
              fetch(`${API}/admin/products`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }),

              fetch(`${API}/categories`, {
                cache: "no-store",
              }),

              fetch(`${API}/admin/home/collections`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }),
            ]);

          const productResult =
            await readJson<Product[]>(productResponse);

          const categoryResult =
            await readJson<Category[]>(categoryResponse);

          /*
           * IMPORTANT:
           * /admin/home/collections returns a raw array,
           * not an ApiResponse envelope.
           */
          const collectionText =
            await collectionResponse.text();

          let collectionData: Collection[] = [];

          if (collectionText) {
            try {
              const parsedCollection =
                JSON.parse(collectionText);

              if (Array.isArray(parsedCollection)) {
                collectionData = parsedCollection;
              } else if (
                parsedCollection &&
                Array.isArray(parsedCollection.data)
              ) {
                collectionData = parsedCollection.data;
              }
            } catch {
              throw new Error(
                "Unable to parse collections response."
              );
            }
          }

          if (productResponse.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userRoles");

            router.replace(
              "/login?redirect=/admin/products"
            );

            return;
          }

          if (productResponse.status === 403) {
            throw new Error(
              "You are not authorized to manage products."
            );
          }

          if (
            !productResponse.ok ||
            !productResult.success ||
            !Array.isArray(productResult.data)
          ) {
            throw new Error(
              productResult.message ||
                "Unable to load products."
            );
          }

          if (
            !categoryResponse.ok ||
            !categoryResult.success ||
            !Array.isArray(categoryResult.data)
          ) {
            throw new Error(
              categoryResult.message ||
                "Unable to load categories."
            );
          }

          if (!collectionResponse.ok) {
            throw new Error(
              "Unable to load collections."
            );
          }

          setProducts(productResult.data);

          setCategories(
            categoryResult.data.filter(
              (category) => category.active
            )
          );

          setCollections(collectionData);
        } catch (err) {
          console.error(
            "Admin products load error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load products."
          );
        } finally {
          setLoading(false);
        }
      }

  useEffect(() => {
    loadData();

    return () => {
      previewUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, []);

  function updateField(
    field: keyof FormState,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId === null && !current.slug
          ? makeSlug(value)
          : current.slug,
    }));
  }

  /*
   * IMPORTANT:
   * New files are APPENDED instead of replacing old selected files.
   */
  function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > 10 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      setError(
        "Only image files up to 10MB each are allowed."
      );

      event.target.value = "";
      return;
    }

    setError("");

    /*
     * Append new files to existing selection.
     */
    setSelectedFiles((current) => [
      ...current,
      ...files,
    ]);

    /*
     * Append new previews.
     */
    const newPreviewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls((current) => [
      ...current,
      ...newPreviewUrls,
    ]);

    /*
     * Reset input so selecting the same image again
     * is also detected by browser.
     */
    event.target.value = "";
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );

    setPreviewUrls((current) => {
      const url = current[index];

      if (url) {
        URL.revokeObjectURL(url);
      }

      return current.filter((_, i) => i !== index);
    });
  }

  function clearForm() {
    previewUrls.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setForm(EMPTY_FORM);
    setEditingId(null);
    setExistingImages([]);
    setSelectedFiles([]);
    setPreviewUrls([]);

    setError("");
    setSuccess("");
  }

  function editProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      sku: product.sku || "",
      name: product.name || "",
      slug: product.slug || "",

      description: product.description || "",

      categoryId: product.category
        ? String(product.category.id)
        : "",

      collectionId: product.collection
        ? String(product.collection.id)
        : "",

      price: String(product.price ?? ""),

      discountPrice:
        product.discountPrice == null
          ? ""
          : String(product.discountPrice),

      stock: String(
        product.inventory?.stockQuantity ?? 0
      ),

      lowStockThreshold: String(
        product.inventory?.lowStockThreshold ?? 3
      ),

      fabric: product.fabric || "",
      weave: product.weave || "",
      zariType: product.zariType || "",
      occasion: product.occasion || "",

      showOnHome: Boolean(
        product.showOnHome
      ),

      homePosition: String(
        product.homePosition ?? 0
      ),

      seoTitle: product.seoTitle || "",
      seoDescription:
        product.seoDescription || "",
      seoKeywords:
        product.seoKeywords || "",
    });

    setExistingImages(product.images || []);

    setSelectedFiles([]);
    setPreviewUrls([]);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImages(productId: number) {
    if (selectedFiles.length === 0) {
      return;
    }

    const token = getToken();

    if (!token) {
      throw new Error("LOGIN_REQUIRED");
    }

    const formData = new FormData();

    /*
     * Backend expects multipart field "files".
     */
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(
      `${API}/admin/products/${productId}/images`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      }
    );

    const result =
      await readJson<ProductImage[]>(
        response
      );

    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRoles");

      router.replace(
        "/login?redirect=/admin/products"
      );

      throw new Error("LOGIN_REQUIRED");
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          "Unable to upload product images."
      );
    }
  }

  async function submitForm(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.sku.trim()) {
      setError("Please enter SKU.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter product name.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (
      !form.price ||
      Number(form.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      form.discountPrice &&
      Number(form.discountPrice) >
        Number(form.price)
    ) {
      setError(
        "Discount price cannot be greater than regular price."
      );
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        router.replace(
          "/login?redirect=/admin/products"
        );
        return;
      }

      const payload = {
        sku: form.sku.trim(),

        name: form.name.trim(),

        slug:
          form.slug.trim() ||
          makeSlug(form.name),

        description:
          form.description.trim() || null,

        categoryId: Number(
          form.categoryId
        ),

        collectionId: form.collectionId
          ? Number(form.collectionId)
          : null,

        price: Number(form.price),

        discountPrice:
          form.discountPrice
            ? Number(form.discountPrice)
            : null,

        fabric:
          form.fabric.trim() || null,

        weave:
          form.weave.trim() || null,

        zariType:
          form.zariType.trim() || null,

        occasion:
          form.occasion.trim() || null,

        stock: Math.max(
          0,
          Number(form.stock || 0)
        ),

        lowStockThreshold: Math.max(
          0,
          Number(
            form.lowStockThreshold || 0
          )
        ),

        /*
         * HOME PAGE MANAGEMENT
         */
        showOnHome: form.showOnHome,

        homePosition: form.showOnHome
          ? Math.max(
              0,
              Number(
                form.homePosition || 0
              )
            )
          : 0,

        seoTitle:
          form.seoTitle.trim() || null,

        seoDescription:
          form.seoDescription.trim() || null,

        seoKeywords:
          form.seoKeywords.trim() || null,
      };

      const url =
        editingId !== null
          ? `${API}/admin/products/${editingId}`
          : `${API}/admin/products`;

      const response = await fetch(url, {
        method:
          editingId !== null
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const result =
        await readJson<Product>(response);

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to save product."
        );
      }

      const productId =
        result.data.id;

      /*
       * Upload selected images after product
       * has been created/updated.
       */
      await uploadImages(productId);

      setSuccess(
        selectedFiles.length > 0
          ? "Product saved and images uploaded successfully."
          : "Product saved successfully."
      );

      clearForm();

      await loadData();
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      if (
        err instanceof Error &&
        err.message ===
          "LOGIN_REQUIRED"
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    product: Product
  ) {
    try {
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        router.replace(
          "/login?redirect=/admin/products"
        );
        return;
      }

      const response = await fetch(
        `${API}/admin/products/${product.id}/status?active=${!product.active}`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const result =
        await readJson<Product>(response);

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to update product status."
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? result.data!
            : item
        )
      );

      setSuccess(
        product.active
          ? "Product deactivated successfully."
          : "Product activated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product status."
      );
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}" permanently?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        router.replace(
          "/login?redirect=/admin/products"
        );
        return;
      }

      const response = await fetch(
        `${API}/admin/products/${product.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const result =
        await readJson<unknown>(response);

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to delete product."
        );
      }

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id
        )
      );

      if (editingId === product.id) {
        clearForm();
      }

      setSuccess(
        "Product deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={centerStyle}>
          Loading products...
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link
          href="/admin"
          style={brandStyle}
        >
          ← KASHI ADMIN
        </Link>

        <div style={headerLinksStyle}>
          <Link
            href="/"
            style={linkStyle}
          >
            Store
          </Link>

          <Link
            href="/admin"
            style={linkStyle}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section
        className="admin-products-content"
        style={contentStyle}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={eyebrowStyle}>
            PRODUCT MANAGEMENT
          </div>

          <h1 style={titleStyle}>
            Products
          </h1>

          <p style={subtitleStyle}>
            Manage products, images, pricing,
            inventory and homepage placement.
          </p>
        </div>

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

        {/* ================= FORM ================= */}

        <form
          onSubmit={submitForm}
          style={formCardStyle}
        >
          <div style={formHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                {editingId !== null
                  ? "Edit Product"
                  : "Add Product"}
              </h2>

              <p style={mutedTextStyle}>
                All product information is
                stored in the database.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={clearForm}
                style={secondaryButtonStyle}
              >
                CANCEL EDIT
              </button>
            )}
          </div>

          {/* BASIC INFORMATION */}

          <FormSection title="Basic Information">
            <div
              className="admin-products-grid"
              style={grid4Style}
            >
              <Field label="SKU *">
                <input
                  required
                  value={form.sku}
                  onChange={(e) =>
                    updateField(
                      "sku",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="KB-SILK-001"
                />
              </Field>

              <Field label="PRODUCT NAME *">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    handleNameChange(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Banarasi Pure Silk Saree"
                />
              </Field>

              <Field label="SLUG *">
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    updateField(
                      "slug",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="banarasi-pure-silk-saree"
                />
              </Field>

              <Field label="CATEGORY *">
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) =>
                    updateField(
                      "categoryId",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="COLLECTION">
                <select
                  value={form.collectionId}
                  onChange={(e) =>
                    updateField(
                      "collectionId",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    No collection
                  </option>

                  {collections.map(
                    (collection) => (
                      <option
                        key={collection.id}
                        value={collection.id}
                      >
                        {collection.name}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>

            <Field label="DESCRIPTION">
              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  minHeight: 120,
                  resize: "vertical",
                }}
                placeholder="Describe the saree, craftsmanship, weave, occasion and important details..."
              />
            </Field>
          </FormSection>

          {/* PRICE */}

          <FormSection title="Pricing & Inventory">
            <div
              className="admin-products-grid"
              style={grid4Style}
            >
              <Field label="REGULAR PRICE *">
                <input
                  required
                  min="0"
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      "price",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="25000"
                />
              </Field>

              <Field label="DISCOUNT PRICE">
                <input
                  min="0"
                  type="number"
                  value={form.discountPrice}
                  onChange={(e) =>
                    updateField(
                      "discountPrice",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="22000"
                />
              </Field>

              <Field label="STOCK QUANTITY">
                <input
                  min="0"
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    updateField(
                      "stock",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="LOW STOCK THRESHOLD">
                <input
                  min="0"
                  type="number"
                  value={
                    form.lowStockThreshold
                  }
                  onChange={(e) =>
                    updateField(
                      "lowStockThreshold",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
          </FormSection>

          {/* SAREE DETAILS */}

          <FormSection title="Saree Details">
            <div
              className="admin-products-grid"
              style={grid4Style}
            >
              <Field label="FABRIC">
                <input
                  value={form.fabric}
                  onChange={(e) =>
                    updateField(
                      "fabric",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Pure Katan Silk"
                />
              </Field>

              <Field label="WEAVE">
                <input
                  value={form.weave}
                  onChange={(e) =>
                    updateField(
                      "weave",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Handwoven Banarasi"
                />
              </Field>

              <Field label="ZARI TYPE">
                <input
                  value={form.zariType}
                  onChange={(e) =>
                    updateField(
                      "zariType",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Pure Zari"
                />
              </Field>

              <Field label="OCCASION">
                <input
                  value={form.occasion}
                  onChange={(e) =>
                    updateField(
                      "occasion",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Wedding"
                />
              </Field>
            </div>
          </FormSection>

          {/* HOME PAGE */}

          <FormSection title="Home Page Placement">
            <div
              style={{
                border: "1px solid #ded8ce",
                background: "#fbf9f5",
                padding: 20,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.showOnHome}
                  onChange={(e) =>
                    updateField(
                      "showOnHome",
                      e.target.checked
                    )
                  }
                  style={{
                    width: 18,
                    height: 18,
                  }}
                />

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  SHOW THIS PRODUCT ON HOME PAGE
                </span>
              </label>

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 10,
                }}
              >
                Enable this if this product
                should appear in the Home page
                featured/bestseller section.
              </p>

              {form.showOnHome && (
                <div
                  style={{
                    marginTop: 18,
                    maxWidth: 250,
                  }}
                >
                  <Field label="HOME POSITION">
                    <input
                      type="number"
                      min="0"
                      value={
                        form.homePosition
                      }
                      onChange={(e) =>
                        updateField(
                          "homePosition",
                          e.target.value
                        )
                      }
                      style={inputStyle}
                      placeholder="1"
                    />
                  </Field>

                  <p
                    style={{
                      ...mutedTextStyle,
                      marginTop: 7,
                    }}
                  >
                    Lower position numbers
                    appear first.
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          {/* IMAGES */}

          <FormSection title="Product Images">
            <div style={uploadBoxStyle}>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                style={{
                  display: "none",
                }}
              />

              <label
                htmlFor="product-images"
                style={uploadButtonStyle}
              >
                + SELECT IMAGES
              </label>

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 14,
                }}
              >
                Select images from your laptop
                or phone.
              </p>

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 5,
                }}
              >
                You can select images multiple
                times. New images will be added,
                not replace previous selections.
              </p>

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 5,
                }}
              >
                Maximum 10MB per image.
              </p>
            </div>

            {(existingImages.length > 0 ||
              previewUrls.length > 0) && (
              <div style={imageGridStyle}>
                {/* EXISTING */}

                {existingImages.map(
                  (image) => (
                    <div
                      key={`existing-${image.id}`}
                      style={imageCardStyle}
                    >
                      <img
                        src={image.url}
                        alt="Product"
                        style={imageStyle}
                      />

                      <span
                        style={imageBadgeStyle}
                      >
                        {image.type ===
                        "MAIN"
                          ? "MAIN"
                          : "EXISTING"}
                      </span>
                    </div>
                  )
                )}

                {/* NEW */}

                {previewUrls.map(
                  (url, index) => (
                    <div
                      key={`new-${url}`}
                      style={imageCardStyle}
                    >
                      <img
                        src={url}
                        alt={`Selected ${
                          index + 1
                        }`}
                        style={imageStyle}
                      />

                      <span
                        style={imageBadgeStyle}
                      >
                        NEW
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedFile(
                            index
                          )
                        }
                        style={
                          removeImageButtonStyle
                        }
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 14,
                }}
              >
                {selectedFiles.length} new
                image
                {selectedFiles.length ===
                1
                  ? ""
                  : "s"}{" "}
                selected for upload.
              </p>
            )}
          </FormSection>

          {/* SEO */}

          <FormSection title="SEO">
            <Field label="SEO TITLE">
              <input
                value={form.seoTitle}
                onChange={(e) =>
                  updateField(
                    "seoTitle",
                    e.target.value
                  )
                }
                style={inputStyle}
                placeholder="Pure Banarasi Silk Saree | Kashi Banaras"
              />
            </Field>

            <Field label="SEO DESCRIPTION">
              <textarea
                value={form.seoDescription}
                onChange={(e) =>
                  updateField(
                    "seoDescription",
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize: "vertical",
                }}
                placeholder="SEO description..."
              />
            </Field>

            <Field label="SEO KEYWORDS">
              <input
                value={form.seoKeywords}
                onChange={(e) =>
                  updateField(
                    "seoKeywords",
                    e.target.value
                  )
                }
                style={inputStyle}
                placeholder="banarasi saree, silk saree, banaras..."
              />
            </Field>
          </FormSection>

          {/* FORM BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              disabled={saving}
              type="submit"
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "SAVING..."
                : editingId !== null
                ? "UPDATE PRODUCT"
                : "CREATE PRODUCT"}
            </button>

            <button
              disabled={saving}
              type="button"
              onClick={clearForm}
              style={secondaryButtonStyle}
            >
              CLEAR
            </button>
          </div>
        </form>

        {/* ================= ALL PRODUCTS ================= */}

        <section
          style={{
            marginTop: 55,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "end",
              marginBottom: 20,
              gap: 20,
            }}
          >
            <div>
              <h2
                style={
                  allProductsTitleStyle
                }
              >
                All Products
              </h2>

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 5,
                }}
              >
                Manage products already stored
                in your database.
              </p>
            </div>

            <span style={mutedTextStyle}>
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}
            </span>
          </div>

          {products.length === 0 ? (
            <div style={emptyStyle}>
              No products found in database.
            </div>
          ) : (
            <div
              style={tableWrapStyle}
            >
              <table
                style={tableStyle}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      IMAGE
                    </th>

                    <th style={thStyle}>
                      PRODUCT
                    </th>

                    <th style={thStyle}>
                      CATEGORY
                    </th>

                    <th style={thStyle}>
                      LOCATION
                    </th>

                    <th style={thStyle}>
                      PRICE
                    </th>

                    <th style={thStyle}>
                      STOCK
                    </th>

                    <th style={thStyle}>
                      STATUS
                    </th>

                    <th style={thStyle}>
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (product) => {
                      const mainImage =
                        product.images?.[0]
                          ?.url || null;

                      return (
                        <tr
                          key={product.id}
                        >
                          {/* IMAGE */}

                          <td style={tdStyle}>
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={
                                  product.name
                                }
                                style={
                                  tableImageStyle
                                }
                              />
                            ) : (
                              <div
                                style={
                                  noImageStyle
                                }
                              >
                                NO IMAGE
                              </div>
                            )}
                          </td>

                          {/* PRODUCT */}

                          <td style={tdStyle}>
                            <strong
                              style={{
                                display:
                                  "block",
                              }}
                            >
                              {
                                product.name
                              }
                            </strong>

                            <span
                              style={{
                                color:
                                  "#81786d",
                                fontSize: 11,
                              }}
                            >
                              {
                                product.sku
                              }
                            </span>
                          </td>

                          {/* CATEGORY */}

                          <td style={tdStyle}>
                            {product.category
                              ?.name || "—"}
                          </td>

                          {/* LOCATION */}

                          <td style={tdStyle}>
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap: 5,
                              }}
                            >
                              <span
                                style={
                                  locationBadgeStyle
                                }
                              >
                                SAREES
                              </span>

                              <span
                                style={
                                  locationBadgeStyle
                                }
                              >
                                COLLECTION:{" "}
                                {product
                                  .category
                                  ?.name ||
                                  "—"}
                              </span>

                              {product.showOnHome && (
                                <span
                                  style={{
                                    ...locationBadgeStyle,
                                    fontWeight: 700,
                                  }}
                                >
                                  HOME #
                                  {product
                                    .homePosition ??
                                    0}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PRICE */}

                          <td style={tdStyle}>
                            ₹
                            {Number(
                              product.discountPrice ??
                                product.price
                            ).toLocaleString(
                              "en-IN"
                            )}

                            {product.discountPrice !=
                              null &&
                              Number(
                                product.discountPrice
                              ) !==
                                Number(
                                  product.price
                                ) && (
                                <span
                                  style={{
                                    display:
                                      "block",
                                    color:
                                      "#81786d",
                                    textDecoration:
                                      "line-through",
                                    fontSize: 10,
                                  }}
                                >
                                  ₹
                                  {Number(
                                    product.price
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>
                              )}
                          </td>

                          {/* STOCK */}

                          <td style={tdStyle}>
                            {product.inventory
                              ?.stockQuantity ??
                              0}
                          </td>

                          {/* STATUS */}

                          <td style={tdStyle}>
                            <span
                              style={{
                                ...statusBadgeStyle,
                                ...(product.active
                                  ? activeBadgeStyle
                                  : inactiveBadgeStyle),
                              }}
                            >
                              {product.active
                                ? "LIVE"
                                : "INACTIVE"}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td style={tdStyle}>
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  editProduct(
                                    product
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
                                  changeStatus(
                                    product
                                  )
                                }
                                style={
                                  smallButtonStyle
                                }
                              >
                                {product.active
                                  ? "DEACTIVATE"
                                  : "ACTIVATE"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  product.id
                                }
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                                style={
                                  deleteButtonStyle
                                }
                              >
                                {deletingId ===
                                product.id
                                  ? "DELETING..."
                                  : "DELETE"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <style jsx global>{`
        @media (max-width: 1100px) {
          .admin-products-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 700px) {
          .admin-products-content {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .admin-products-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          table {
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   FORM COMPONENTS
========================================================= */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={formSectionStyle}
    >
      <h3 style={subTitleStyle}>
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        minWidth: 0,
      }}
    >
      <span style={labelStyle}>
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f7f4ee",
  color: "#2c2925",
};

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "#ffffff",
  borderBottom: "1px solid #ded8ce",
  padding: "18px 30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
};

const brandStyle: React.CSSProperties = {
  color: "#2c2925",
  textDecoration: "none",
  fontFamily: "Georgia, serif",
  fontSize: 22,
  letterSpacing: 2,
};

const headerLinksStyle: React.CSSProperties = {
  display: "flex",
  gap: 22,
};

const linkStyle: React.CSSProperties = {
  color: "#2c2925",
  textDecoration: "none",
  fontSize: 13,
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "48px 25px 80px",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 3,
  color: "#81786d",
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontFamily: "Georgia, serif",
  fontWeight: 500,
  fontSize: 44,
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#81786d",
  fontSize: 13,
};

const formCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #ded8ce",
  padding: 32,
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  paddingBottom: 28,
  borderBottom: "1px solid #e3ddd4",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, serif",
  fontWeight: 500,
  fontSize: 27,
};

const subTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontFamily: "Georgia, serif",
  fontWeight: 500,
  fontSize: 22,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#81786d",
  fontSize: 12,
  lineHeight: 1.6,
};

const formSectionStyle: React.CSSProperties = {
  padding: "30px 0",
  borderBottom: "1px solid #e3ddd4",
};

const grid4Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 18,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1.3,
  color: "#756c61",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d5cec4",
  background: "#ffffff",
  color: "#2c2925",
  padding: "13px 12px",
  fontSize: 13,
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #2c2925",
  background: "#2c2925",
  color: "#ffffff",
  padding: "13px 22px",
  cursor: "pointer",
  fontSize: 11,
  letterSpacing: 1.2,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #b9afa2",
  background: "transparent",
  color: "#2c2925",
  padding: "13px 18px",
  cursor: "pointer",
  fontSize: 11,
  letterSpacing: 1.2,
};

const uploadBoxStyle: React.CSSProperties = {
  border: "1px dashed #b9afa2",
  padding: 22,
  background: "#fbf9f5",
};

const uploadButtonStyle: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid #b9afa2",
  padding: "12px 18px",
  cursor: "pointer",
  fontSize: 11,
  letterSpacing: 1.2,
  background: "#ffffff",
};

const imageGridStyle: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 14,
};

const imageCardStyle: React.CSSProperties = {
  position: "relative",
  height: 190,
  border: "1px solid #ded8ce",
  background: "#f3efe8",
  overflow: "hidden",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const imageBadgeStyle: React.CSSProperties = {
  position: "absolute",
  left: 8,
  bottom: 8,
  background: "rgba(44,41,37,.88)",
  color: "#ffffff",
  padding: "5px 7px",
  fontSize: 9,
  letterSpacing: 1,
};

const removeImageButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 7,
  right: 7,
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid #ffffff",
  background: "rgba(44,41,37,.88)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: "20px",
};

const allProductsTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, serif",
  fontSize: 30,
  fontWeight: 500,
};

const tableWrapStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #ded8ce",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1250,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #ded8ce",
  fontSize: 9,
  letterSpacing: 1.4,
  color: "#756c61",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #eee8df",
  fontSize: 12,
  verticalAlign: "middle",
};

const tableImageStyle: React.CSSProperties = {
  width: 58,
  height: 72,
  objectFit: "cover",
  display: "block",
  border: "1px solid #ded8ce",
};

const noImageStyle: React.CSSProperties = {
  width: 58,
  height: 72,
  display: "grid",
  placeItems: "center",
  background: "#f0ece5",
  color: "#81786d",
  fontSize: 8,
  textAlign: "center",
};

const locationBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  width: "fit-content",
  padding: "4px 6px",
  background: "#f3efe8",
  border: "1px solid #ded8ce",
  fontSize: 8,
  letterSpacing: 0.5,
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 7px",
  fontSize: 9,
  letterSpacing: 1,
};

const activeBadgeStyle: React.CSSProperties = {
  background: "#edf5e9",
  color: "#536846",
  border: "1px solid #b9ceb0",
};

const inactiveBadgeStyle: React.CSSProperties = {
  background: "#f7eeee",
  color: "#9a5555",
  border: "1px solid #d9b5b5",
};

const smallButtonStyle: React.CSSProperties = {
  border: "1px solid #b9afa2",
  background: "transparent",
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: 9,
  letterSpacing: 1,
};

const deleteButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  border: "1px solid #c99b9b",
  color: "#9a4545",
};

const errorStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: "13px 15px",
  border: "1px solid #c94b4b",
  background: "#fff7f7",
  color: "#a83232",
  fontSize: 13,
};

const successStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: "13px 15px",
  border: "1px solid #80966f",
  background: "#f6faf3",
  color: "#536846",
  fontSize: 13,
};

const emptyStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #ded8ce",
  padding: 30,
  color: "#81786d",
  fontSize: 13,
};

const centerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  color: "#81786d",
};