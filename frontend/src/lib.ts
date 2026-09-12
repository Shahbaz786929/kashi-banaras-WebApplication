export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api";

/* =========================================================
   PRODUCT TYPES
   ========================================================= */

export type ProductImage = {
  id: number;
  url: string;
  type: string;
  sortOrder: number;
};

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCollection = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  sortOrder?: number;
};

export type ProductColor = {
  id: number;
  colorName: string;
  hexCode: string;
  swatchImageUrl?: string | null;
};

export type ProductInventory = {
  id: number;
  stockQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  lowStockThreshold: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;

  category: ProductCategory | null;
  collection?: ProductCollection | null;

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

  images: ProductImage[];

  colors?: ProductColor[];
  inventory?: ProductInventory | null;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   API RESPONSE
   ========================================================= */

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

/* =========================================================
   RESPONSE PARSER
   ========================================================= */

async function parseResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {

  const text = await response.text();

  if (!text) {
    return {
      success: false,
      message: `Request failed with status ${response.status}`,
      data: undefined as T,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message:
        text ||
        `Request failed with status ${response.status}`,
      data: undefined as T,
    };
  }
}

/* =========================================================
   AUTH TOKEN
   ========================================================= */

function getAccessToken(): string | null {

  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

/* =========================================================
   COMMON API REQUEST
   ========================================================= */

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<{
  response: Response;
  result: ApiResponse<T>;
}> {

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Content-Type",
    "application/json"
  );

  const token = getAccessToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result =
    await parseResponse<T>(response);

  return {
    response,
    result,
  };
}

/* =========================================================
   SUCCESS HANDLER
   ========================================================= */

function requireSuccess<T>(
  response: Response,
  result: ApiResponse<T>,
  fallback: string
): T {

  if (response.status === 401) {
    throw new Error("LOGIN_REQUIRED");
  }

  if (
    !response.ok ||
    !result.success ||
    result.data === undefined ||
    result.data === null
  ) {
    throw new Error(
      result.message || fallback
    );
  }

  return result.data;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

export async function getProducts(): Promise<Product[]> {

  const {
    response,
    result,
  } = await apiRequest<Product[]>(
    `${API}/products`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (
    !response.ok ||
    !result.success ||
    !Array.isArray(result.data)
  ) {
    throw new Error(
      result.message ||
      `Products API failed with status ${response.status}`
    );
  }

  return result.data;
}

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {

  const {
    response,
    result,
  } = await apiRequest<Product>(
    `${API}/products/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (
    response.status === 404 ||
    !result.success
  ) {
    return null;
  }

  return requireSuccess(
    response,
    result,
    "Unable to load product"
  );
}

export function getProductImage(
  product: Product
): string {

  const image =
    [...(product.images || [])]
      .filter((item) => isUsableImageUrl(item.url))
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) -
          (b.sortOrder ?? 0)
      )[0]?.url;

  return image || "";
}

export function isUsableImageUrl(
  value?: string | null
): value is string {
  if (!value || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
}

export function getProductPrice(
  product: Product
): number {

  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price
  ) {
    return Number(
      product.discountPrice
    );
  }

  return Number(product.price);
}

/* =========================================================
   AUTH
   ========================================================= */

export type AuthData = {
  accessToken: string;
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
};

export async function registerUser(
  input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }
): Promise<AuthData> {

  const {
    response,
    result,
  } = await apiRequest<AuthData>(
    `${API}/auth/register`,
    {
      method: "POST",
      body: JSON.stringify({
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        password: input.password,
      }),
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to create account"
  );
}

export async function loginUser(
  input: {
    email: string;
    password: string;
  }
): Promise<AuthData> {

  const {
    response,
    result,
  } = await apiRequest<AuthData>(
    `${API}/auth/login`,
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    }
  );

  return requireSuccess(
    response,
    result,
    "Invalid email or password"
  );
}

export function saveAuth(
  data: AuthData
): void {

  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "accessToken",
    data.accessToken
  );

  localStorage.setItem(
    "userId",
    String(data.userId)
  );

  localStorage.setItem(
    "userEmail",
    data.email
  );

  localStorage.setItem(
    "userFullName",
    data.fullName
  );

  localStorage.setItem(
    "userRoles",
    JSON.stringify(data.roles)
  );
}

export function isAuthenticated(): boolean {

  return getAccessToken() !== null;
}

export function logout(): void {

  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "userId"
  );

  localStorage.removeItem(
    "userEmail"
  );

  localStorage.removeItem(
    "userFullName"
  );

  localStorage.removeItem(
    "userRoles"
  );
}

/* =========================================================
   CART
   Backend CartResponse ke EXACT fields
   ========================================================= */

export type CartItem = {

  id: number;

  productId: number;

  sku: string;

  name: string;

  slug: string;

  imageUrl: string | null;

  unitPrice: number;

  quantity: number;

  productColorId: number | null;

  totalPrice: number;
};

export type Cart = {

  items: CartItem[];

  totalQuantity: number;

  subtotal: number;

  shipping: number;

  total: number;
};

/* =========================================================
   GET CART
   ========================================================= */

export async function getCart(): Promise<Cart> {

  const {
    response,
    result,
  } = await apiRequest<Cart>(
    `${API}/cart`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to load cart"
  );
}

/* =========================================================
   ADD TO CART
   ========================================================= */

export async function addToCart(
  productId: number,
  quantity: number = 1,
  productColorId?: number
): Promise<Cart> {

  const {
    response,
    result,
  } = await apiRequest<Cart>(
    `${API}/cart/items`,
    {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity,
        productColorId:
          productColorId ?? null,
      }),
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to add product to cart"
  );
}

/* =========================================================
   UPDATE CART
   ========================================================= */

export async function updateCartQuantity(
  itemId: number,
  quantity: number
): Promise<Cart> {

  const {
    response,
    result,
  } = await apiRequest<Cart>(
    `${API}/cart/items/${itemId}?quantity=${encodeURIComponent(
      quantity
    )}`,
    {
      method: "PATCH",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to update cart quantity"
  );
}

/* =========================================================
   REMOVE CART ITEM
   ========================================================= */

export async function removeFromCart(
  itemId: number
): Promise<Cart> {

  const {
    response,
    result,
  } = await apiRequest<Cart>(
    `${API}/cart/items/${itemId}`,
    {
      method: "DELETE",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to remove cart item"
  );
}

/* =========================================================
   CART HELPERS
   ========================================================= */

export function getCartItemCount(
  cart: Cart | null
): number {

  return cart?.totalQuantity ?? 0;
}

export function getCartSubtotal(
  cart: Cart | null
): number {

  return cart?.subtotal ?? 0;
}

/* =========================================================
   WISHLIST
   ========================================================= */

export type WishlistItem = {
  id: number;
  productId: number;
  name: string;
};

export async function getWishlist(): Promise<
  WishlistItem[]
> {

  const {
    response,
    result,
  } = await apiRequest<WishlistItem[]>(
    `${API}/wishlist`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to load wishlist"
  );
}

export async function toggleWishlist(
  productId: number
): Promise<boolean> {

  const {
    response,
    result,
  } = await apiRequest<boolean>(
    `${API}/wishlist/${productId}`,
    {
      method: "POST",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to update wishlist"
  );
}

/* =========================================================
   ADMIN PRODUCTS
   ========================================================= */

export async function getAdminProducts(): Promise<
  Product[]
> {

  const {
    response,
    result,
  } = await apiRequest<Product[]>(
    `${API}/admin/products`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to load admin products"
  );
}

export async function setProductStatus(
  productId: number,
  active: boolean
): Promise<Product> {

  const {
    response,
    result,
  } = await apiRequest<Product>(
    `${API}/admin/products/${productId}/status?active=${active}`,
    {
      method: "PATCH",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to update product status"
  );
}

/* =========================================================
   ADDRESS
   ========================================================= */

export type Address = {
  id: number;

  label?: string | null;

  fullName: string;

  phone: string;

  line1: string;

  line2?: string | null;

  city: string;

  state: string;

  postalCode: string;

  country: string;

  isDefault: boolean;
};

export async function getAddresses(): Promise<
  Address[]
> {

  const {
    response,
    result,
  } = await apiRequest<Address[]>(
    `${API}/addresses`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to load addresses"
  );
}

export async function createAddress(
  input: Omit<Address, "id">
): Promise<Address> {

  const {
    response,
    result,
  } = await apiRequest<Address>(
    `${API}/addresses`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to save address"
  );
}

/* =========================================================
   ORDERS
   ========================================================= */

export type CreatedOrder = {
  id: number;
  orderNumber: string;
  amount: number;
  paymentMethod?: string;
};

export async function createOrder(
  shippingAddressId: number,
  billingAddressId: number,
  paymentMethod:
    | "COD"
    | "ONLINE"
): Promise<CreatedOrder> {

  const {
    response,
    result,
  } = await apiRequest<CreatedOrder>(
    `${API}/orders`,
    {
      method: "POST",
      body: JSON.stringify({
        shippingAddressId,
        billingAddressId,
        paymentMethod,
      }),
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to create order"
  );
}

/* =========================================================
   RAZORPAY
   ========================================================= */

export type RazorpayOrder = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

export async function createRazorpayOrder(
  orderId: number
): Promise<RazorpayOrder> {

  const {
    response,
    result,
  } = await apiRequest<RazorpayOrder>(
    `${API}/payment/create-order?orderId=${orderId}`,
    {
      method: "POST",
    }
  );

  return requireSuccess(
    response,
    result,
    "Unable to start payment"
  );
}

export async function verifyRazorpayPayment(
  input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<boolean> {

  const {
    response,
    result,
  } = await apiRequest<boolean>(
    `${API}/payment/verify`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return requireSuccess(
    response,
    result,
    "Payment verification failed"
  );
}