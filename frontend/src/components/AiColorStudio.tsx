"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "../lib";

type ProductColor = {
  id?: number;
  colorName?: string | null;
  hexCode?: string | null;
  swatchImageUrl?: string | null;
};

type AiColorStudioProps = {
  productId: number;
  productName: string;
  originalImage: string;
  colors?: ProductColor[];
};

type PreviewResponse = {
  id?: number;
  status?: string;
  productId?: number;
  requestedHex?: string;
  requestedColorName?: string;
  originalImageUrl?: string;
  generatedImageUrl?: string;
  previewUrl?: string;
  provider?: string;
};

type ApiResult = {
  success?: boolean;
  message?: string;
  data?: PreviewResponse;
};

type ColorOption = {
  name: string;
  hex: string;
  swatchImageUrl?: string | null;
};

const DEFAULT_COLORS: ColorOption[] = [
  {
    name: "Deep Wine",
    hex: "#7A1F2B",
  },
  {
    name: "Royal Blue",
    hex: "#183A72",
  },
  {
    name: "Emerald",
    hex: "#176B4D",
  },
  {
    name: "Maroon",
    hex: "#641B2A",
  },
  {
    name: "Black",
    hex: "#171717",
  },
  {
    name: "Ivory",
    hex: "#F2E7D0",
  },
];

function isValidHex(
  value: string
): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(
    value
  );
}

function resolveImageUrl(
  url: string
): string {

  const value =
    url.trim();

  if (!value) {
    return "";
  }

  /*
   * Cloudinary URL:
   *
   * Keep it exactly as returned.
   */
  if (
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value;
  }

  const backendOrigin =
    API.replace(
      /\/api\/?$/,
      ""
    );

  if (
    value.startsWith("/")
  ) {
    return (
      backendOrigin +
      value
    );
  }

  return (
    backendOrigin +
    "/" +
    value
  );
}

export default function AiColorStudio({
  productId,
  productName,
  originalImage,
  colors = [],
}: AiColorStudioProps) {

  const router =
    useRouter();

  const dynamicColors =
    useMemo(() => {

      return colors
        .filter(
          (color) =>
            !!color.hexCode &&
            isValidHex(
              color.hexCode
            )
        )
        .map(
          (color) => ({
            name:
              color.colorName?.trim() ||
              "Product Color",

            hex:
              color.hexCode as string,

            swatchImageUrl:
              color.swatchImageUrl ||
              null,
          })
        );

    }, [colors]);

  const availableColors =
    dynamicColors.length > 0
      ? dynamicColors
      : DEFAULT_COLORS;

  const [selectedHex, setSelectedHex] =
    useState(
      availableColors[0]?.hex ||
        "#7A1F2B"
    );

  const [colorName, setColorName] =
    useState(
      availableColors[0]?.name ||
        "Deep Wine"
    );

  const [customHex, setCustomHex] =
    useState(
      availableColors[0]?.hex ||
        "#7A1F2B"
    );

  const [generatedImage, setGeneratedImage] =
    useState<string | null>(
      null
    );

  const [status, setStatus] =
    useState<
      "idle" |
      "loading" |
      "completed" |
      "error"
    >("idle");

  const [error, setError] =
    useState<string | null>(
      null
    );

  const selectColor = (
    hex: string,
    name: string
  ) => {

    setSelectedHex(
      hex
    );

    setColorName(
      name
    );

    setCustomHex(
      hex
    );

    setGeneratedImage(
      null
    );

    setError(
      null
    );

    setStatus(
      "idle"
    );
  };

  const handleCustomHex = (
    value: string
  ) => {

    let normalized =
      value.trim();

    if (
      !normalized.startsWith("#")
    ) {
      normalized =
        "#" +
        normalized;
    }

    setCustomHex(
      normalized
    );

    if (
      isValidHex(
        normalized
      )
    ) {

      setSelectedHex(
        normalized
      );

      setColorName(
        "Custom Color"
      );

      setGeneratedImage(
        null
      );

      setError(
        null
      );

      setStatus(
        "idle"
      );
    }
  };

  const redirectToLogin = () => {

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    /*
     * Expired/invalid token remove.
     */
    localStorage.removeItem(
      "accessToken"
    );

    /*
     * Send user to login.
     *
     * After login user can return to
     * the same product page.
     */
    const currentPath =
      window.location.pathname +
      window.location.search;

    router.push(
      `/login?redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  };

  const handleGenerate = async () => {

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const token =
      localStorage.getItem(
        "accessToken"
      );

    /*
     * User is not logged in.
     */
    if (!token) {

      redirectToLogin();

      return;
    }

    if (
      !isValidHex(
        selectedHex
      )
    ) {

      setError(
        "Please select a valid colour."
      );

      setStatus(
        "error"
      );

      return;
    }

    setStatus(
      "loading"
    );

    setError(
      null
    );

    setGeneratedImage(
      null
    );

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(
        () => {
          controller.abort();
        },
        120000
      );

    try {

      const response =
        await fetch(
          `${API}/ai/color-preview`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                productId,

                hex:
                  selectedHex.toUpperCase(),

                colorName,
              }),

            signal:
              controller.signal,
          }
        );

      window.clearTimeout(
        timeoutId
      );

      /*
       * JWT expired.
       *
       * Backend should return 401.
       */
      if (
        response.status ===
        401
      ) {

        redirectToLogin();

        return;
      }

      let result: ApiResult;

      try {

        result =
          (await response.json()) as ApiResult;

      } catch {

        throw new Error(
          "Invalid response received from server."
        );
      }

      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result.message ||
            "Unable to generate color preview."
        );
      }

      const data =
        result.data || {};

      if (
        data.status &&
        data.status.toUpperCase() !==
          "COMPLETED"
      ) {

        throw new Error(
          "Color preview was not completed."
        );
      }

      const rawPreviewUrl =
        data.generatedImageUrl ||
        data.previewUrl ||
        "";

      if (!rawPreviewUrl) {

        throw new Error(
          "Generated image URL was not returned."
        );
      }

      const previewUrl =
        resolveImageUrl(
          rawPreviewUrl
        );

      /*
       * Verify that browser can actually
       * load the generated Cloudinary image.
       */
      await new Promise<void>(
        (
          resolve,
          reject
        ) => {

          const image =
            new Image();

          image.onload =
            () => {
              resolve();
            };

          image.onerror =
            () => {
              reject(
                new Error(
                  "Generated image could not be loaded."
                )
              );
            };

          image.src =
            previewUrl;
        }
      );

      setGeneratedImage(
        previewUrl
      );

      setStatus(
        "completed"
      );

      setError(
        null
      );

    } catch (err) {

      console.error(
        "AI Color Preview Error:",
        err
      );

      if (
        err instanceof DOMException &&
        err.name ===
          "AbortError"
      ) {

        setError(
          "Generation is taking too long. Please try again."
        );

      } else {

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while generating the preview."
        );
      }

      setStatus(
        "error"
      );

    } finally {

      window.clearTimeout(
        timeoutId
      );
    }
  };

  const resetPreview = () => {

    setGeneratedImage(
      null
    );

    setError(
      null
    );

    setStatus(
      "idle"
    );
  };

  return (
    <section className="ai-color-studio">

      <div className="ai-color-studio-header">

        <div>

          <span className="ai-eyebrow">
            ✦ AI COLOR STUDIO
          </span>

          <h2>
            See {productName} in a new colour
          </h2>

          <p>
            Change only the saree colour while
            keeping the original background,
            model, jewellery, weave, folds and
            product details unchanged.
          </p>

        </div>

      </div>

      <div className="ai-color-studio-grid">

        <div className="ai-color-preview-panel">

          <div className="ai-preview-label">
            <span>
              ORIGINAL
            </span>
          </div>

          <div className="ai-preview-image">

            {originalImage ? (

              <img
                src={originalImage}
                alt={productName}
                loading="lazy"
              />

            ) : (

              <div className="ai-no-image">
                Image unavailable
              </div>

            )}

          </div>

        </div>

        <div className="ai-color-controls">

          <div className="ai-control-heading">

            <span>
              SELECT YOUR COLOUR
            </span>

            <strong>
              {colorName}
            </strong>

          </div>

          <div className="ai-color-options">

            {availableColors.map(
              (
                color,
                index
              ) => (

                <button
                  type="button"
                  key={
                    `${color.hex}-${index}`
                  }
                  className={
                    `ai-color-option ${
                      selectedHex.toLowerCase() ===
                      color.hex.toLowerCase()
                        ? "selected"
                        : ""
                    }`
                  }
                  onClick={() =>
                    selectColor(
                      color.hex,
                      color.name
                    )
                  }
                  title={
                    color.name
                  }
                >

                  <span
                    className="ai-color-swatch"
                    style={{
                      backgroundColor:
                        color.hex,

                      backgroundImage:
                        color.swatchImageUrl
                          ? `url(${color.swatchImageUrl})`
                          : undefined,
                    }}
                  />

                  <span className="ai-color-name">
                    {color.name}
                  </span>

                </button>

              )
            )}

          </div>

          <div className="ai-custom-color">

            <label htmlFor="ai-custom-hex">
              CUSTOM HEX COLOUR
            </label>

            <div className="ai-custom-color-row">

              <input
                id="ai-custom-color-picker"
                type="color"
                value={
                  isValidHex(
                    customHex
                  )
                    ? customHex
                    : "#7A1F2B"
                }
                onChange={(event) =>
                  handleCustomHex(
                    event.target.value
                  )
                }
              />

              <input
                id="ai-custom-hex"
                type="text"
                value={
                  customHex
                }
                maxLength={7}
                onChange={(event) =>
                  handleCustomHex(
                    event.target.value
                  )
                }
                placeholder="#7A1F2B"
              />

            </div>

          </div>

          <div className="ai-selected-color">

            <span
              style={{
                backgroundColor:
                  selectedHex,
              }}
            />

            <div>

              <small>
                SELECTED COLOUR
              </small>

              <strong>
                {colorName}
              </strong>

              <em>
                {selectedHex.toUpperCase()}
              </em>

            </div>

          </div>

          <button
            type="button"
            className="ai-generate-button"
            onClick={
              handleGenerate
            }
            disabled={
              status ===
              "loading"
            }
          >

            {status ===
            "loading" ? (
              <>
                <span className="ai-spinner" />
                GENERATING PREVIEW...
              </>
            ) : (
              <>
                ✦ GENERATE AI PREVIEW
              </>
            )}

          </button>

          {error && (
            <div className="ai-error">
              {error}
            </div>
          )}

        </div>

      </div>

      {generatedImage && (

        <div className="ai-result-section">

          <div className="ai-result-header">

            <div>

              <span className="ai-eyebrow">
                ✦ GENERATED RESULT
              </span>

              <h3>
                {colorName} Preview
              </h3>

            </div>

            <span className="ai-result-badge">
              COLOR PREVIEW
            </span>

          </div>

          <div className="ai-result-grid">

            <div className="ai-result-image">

              <img
                key={
                  generatedImage
                }
                src={
                  generatedImage
                }
                alt={
                  `${productName} in ${colorName}`
                }
              />

            </div>

            <div className="ai-result-info">

              <div className="ai-result-color">

                <span
                  style={{
                    backgroundColor:
                      selectedHex,
                  }}
                />

                <div>

                  <small>
                    REQUESTED COLOUR
                  </small>

                  <strong>
                    {colorName}
                  </strong>

                  <em>
                    {selectedHex.toUpperCase()}
                  </em>

                </div>

              </div>

              <p>
                The original product photograph
                is preserved. Only the saree
                fabric colour is changed.
              </p>

              <button
                type="button"
                className="ai-generate-again"
                onClick={
                  resetPreview
                }
              >
                TRY ANOTHER COLOUR
              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}