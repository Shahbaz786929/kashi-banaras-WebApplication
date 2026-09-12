"use client";

import Link from "next/link";
import {
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
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  image: File | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image: null,
};

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(
    null
  );

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] =
    useState<CategoryFormState>(emptyForm);

  useEffect(() => {
    void loadCategories();
  }, []);

  function getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("accessToken");
  }

  function handleUnauthorized() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRoles");
    }

    router.replace(
      "/login?redirect=/admin/categories"
    );
  }

  async function parseApiResponse<T>(
    response: Response
  ): Promise<ApiResponse<T>> {
    const text = await response.text();

    if (!text) {
      return {
        success: false,
        message: `Request failed with status ${response.status}.`,
      };
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return {
        success: false,
        message: text,
      };
    }
  }

  async function loadCategories() {
    const token = getToken();

    if (!token) {
      setCategories([]);
      setLoading(false);
      handleUnauthorized();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/categories`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to manage categories."
        );
      }

      const result =
        await parseApiResponse<Category[]>(response);

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.data)
      ) {
        throw new Error(
          result.message ||
            "Unable to load categories."
        );
      }

      setCategories(result.data);
    } catch (err) {
      console.error(
        "Admin categories load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitCategory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const name = form.name.trim();
    const slug = form.slug.trim().toLowerCase();
    const description = form.description.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    if (!slug) {
      setError("Category slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(
        "Slug can contain only lowercase letters, numbers and hyphens."
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const data = new FormData();

      data.append("name", name);
      data.append("slug", slug);
      data.append("description", description);
      data.append("active", "true");

      if (form.image) {
        data.append("image", form.image);
      }

      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API}/admin/categories/${editingId}`
        : `${API}/admin/categories`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to manage categories."
        );
      }

      const result =
        await parseApiResponse<Category>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (isEditing
              ? "Unable to update category."
              : "Unable to create category.")
        );
      }

      setNotice(
        isEditing
          ? "Category updated successfully."
          : "Category created successfully."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadCategories();
    } catch (err) {
      console.error(
        "Category save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(
    id: number,
    active: boolean
  ) {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setStatusUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/admin/categories/${id}/status?active=${active}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to update category status."
        );
      }

      const result =
        await parseApiResponse<Category>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update category status."
        );
      }

      setNotice(
        active
          ? "Category activated successfully."
          : "Category deactivated successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error(
        "Category status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function deleteCategory(id: number) {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    const category = categories.find(
      (item) => item.id === id
    );

    if (!category) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${category.name}"?\n\nIf products are assigned to this category, the category cannot be permanently deleted. In that case, deactivate it instead.`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/admin/categories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to delete categories."
        );
      }

      const result =
        await parseApiResponse<null>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to delete category."
        );
      }

      setNotice(
        "Category deleted successfully."
      );

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await loadCategories();
    } catch (err) {
      console.error(
        "Category delete error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description:
        category.description || "",
      image: null,
    });

    setError("");
    setNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function generateSlugFromName(
    value: string
  ) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  return (
    <div className="admin">
      <div className="admin-nav">
        <Link href="/admin">
          ← Dashboard
        </Link>

        <b>CATEGORIES</b>

        <span />
      </div>

      <main className="admin-main">
        <h1>
          {editingId !== null
            ? "Edit Category"
            : "Categories"}
        </h1>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              border: "1px solid #d98b80",
              background: "#fff7f5",
              color: "#9b4037",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              border: "1px solid #9ac7aa",
              background: "#f4fbf6",
              color: "#2a6c45",
              lineHeight: 1.6,
            }}
          >
            {notice}
          </div>
        )}

        <form
          onSubmit={submitCategory}
          style={{
            display: "grid",
            gap: 16,
            maxWidth: 860,
            marginBottom: 40,
            padding: 20,
            border: "1px solid #d9d0c2",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <label htmlFor="name">
              Category name
            </label>

            <input
              id="name"
              value={form.name}
              onChange={(event) => {
                const value =
                  event.target.value;

                setForm((current) => ({
                  ...current,
                  name: value,
                  slug:
                    editingId === null &&
                    !current.slug
                      ? generateSlugFromName(
                          value
                        )
                      : current.slug,
                }));
              }}
              placeholder="Wedding sarees"
              required
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <label htmlFor="slug">
              Slug
            </label>

            <input
              id="slug"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slug:
                    event.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-"),
                }))
              }
              placeholder="wedding"
              required
            />

            <small
              style={{
                color: "#81786d",
              }}
            >
              Example: wedding, silk-sarees,
              banarasi-silk
            </small>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description:
                    event.target.value,
                }))
              }
              placeholder="Short category description"
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <label htmlFor="image">
              Category image
            </label>

            <input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  image:
                    event.target.files?.[0] ||
                    null,
                }))
              }
            />

            {form.image && (
              <small
                style={{
                  color: "#81786d",
                }}
              >
                Selected: {form.image.name}
              </small>
            )}

            {editingId !== null && (
              <small
                style={{
                  color: "#81786d",
                }}
              >
                Leave image empty to keep the
                existing category image.
              </small>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              className="gold-btn"
              disabled={saving}
            >
              {saving
                ? editingId !== null
                  ? "Updating..."
                  : "Saving..."
                : editingId !== null
                ? "Update Category"
                : "Create Category"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="outline-btn"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                All Categories
              </h2>

              <p
                style={{
                  marginTop: 6,
                  color: "#81786d",
                }}
              >
                Manage categories already stored
                in your database.
              </p>
            </div>

            <strong
              style={{
                color: "#81786d",
              }}
            >
              {categories.length}{" "}
              {categories.length === 1
                ? "category"
                : "categories"}
            </strong>
          </div>

          {loading ? (
            <div
              style={{
                padding: 24,
                border: "1px solid #d9d0c2",
                background: "#fff",
              }}
            >
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div
              style={{
                padding: 24,
                border: "1px solid #d9d0c2",
                background: "#fff",
                color: "#81786d",
              }}
            >
              No categories available yet.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #d9d0c2",
                background: "#fff",
              }}
            >
              <table
                className="admin-table"
                style={{
                  width: "100%",
                  minWidth: 760,
                }}
              >
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map(
                    (category) => (
                      <tr key={category.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                            }}
                          >
                            {category.imageUrl ? (
                              <img
                                src={
                                  category.imageUrl
                                }
                                alt={
                                  category.name
                                }
                                style={{
                                  width: 72,
                                  height: 72,
                                  objectFit:
                                    "cover",
                                  border:
                                    "1px solid #d9d0c2",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 72,
                                  height: 72,
                                  display: "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  border:
                                    "1px solid #d9d0c2",
                                  color:
                                    "#81786d",
                                  fontSize: 12,
                                  textAlign:
                                    "center",
                                }}
                              >
                                No image
                              </div>
                            )}

                            <div
                              style={{
                                display: "grid",
                                gap: 4,
                              }}
                            >
                              <strong>
                                {
                                  category.name
                                }
                              </strong>

                              {category.description && (
                                <span
                                  style={{
                                    color:
                                      "#81786d",
                                    fontSize: 13,
                                  }}
                                >
                                  {
                                    category.description
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <code>
                            {
                              category.slug
                            }
                          </code>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              category.active
                                ? "gold-btn"
                                : "outline-btn"
                            }
                            disabled={
                              statusUpdatingId ===
                              category.id
                            }
                            onClick={() =>
                              void toggleCategory(
                                category.id,
                                !category.active
                              )
                            }
                          >
                            {statusUpdatingId ===
                            category.id
                              ? "Updating..."
                              : category.active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </button>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="outline-btn"
                              onClick={() =>
                                startEdit(
                                  category
                                )
                              }
                              disabled={
                                deletingId ===
                                  category.id ||
                                statusUpdatingId ===
                                  category.id
                              }
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}