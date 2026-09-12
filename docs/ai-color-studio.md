# AI Color Studio

The customer UI supports color selection and a development visual preview. The backend exposes `POST /api/ai/color-preview` behind authentication.

For production, implement a provider adapter under `service/ai` that sends the original product image and an explicit color-preservation prompt to the selected image-editing provider. Persist the generated result in Cloudinary and update `ai_color_previews` from `PROCESSING` to `COMPLETED` or `FAILED`.

Never expose the provider API key to the browser. Add rate limiting and per-user quotas before enabling paid generation.
