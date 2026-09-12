package com.kashibanaras.ecommerce.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiImageProvider implements AiImageProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiImageProvider(
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini-api-key:}") String apiKey,
            @Value("${app.ai.gemini-model:gemini-2.5-flash-image}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    @Override
    public byte[] generateColorPreview(
            byte[] originalImage,
            String mimeType,
            String colorName,
            String hexColor
    ) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GEMINI_API_KEY is not configured"
            );
        }

        if (originalImage == null || originalImage.length == 0) {
            throw new IllegalArgumentException(
                    "Original product image is empty"
            );
        }

        String imageBase64 =
                Base64.getEncoder()
                        .encodeToString(originalImage);

        String prompt =
                buildPrompt(colorName, hexColor);

        Map<String, Object> textPart =
                Map.of(
                        "text",
                        prompt
                );

        Map<String, Object> imagePart =
                Map.of(
                        "inline_data",
                        Map.of(
                                "mime_type",
                                mimeType,
                                "data",
                                imageBase64
                        )
                );

        Map<String, Object> content =
                Map.of(
                        "role",
                        "user",
                        "parts",
                        List.of(
                                textPart,
                                imagePart
                        )
                );

        Map<String, Object> generationConfig =
                Map.of(
                        "responseModalities",
                        List.of("IMAGE")
                );

        Map<String, Object> request =
                Map.of(
                        "contents",
                        List.of(content),
                        "generationConfig",
                        generationConfig
                );

        try {

            String response =
                    restClient
                            .post()
                            .uri(
                                    "/v1/models/{model}:generateContent",
                                    model
                            )
                            .header(
                                    "x-goog-api-key",
                                    apiKey
                            )
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .body(request)
                            .retrieve()
                            .body(String.class);

            return extractGeneratedImage(response);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Gemini image generation failed: "
                            + safeMessage(e),
                    e
            );
        }
    }

    private String buildPrompt(
            String colorName,
            String hexColor
    ) {

        String requestedColor =
                colorName == null || colorName.isBlank()
                        ? hexColor
                        : colorName
                        + " ("
                        + hexColor
                        + ")";

        return """
                Edit the provided Banarasi saree product image.

                The goal is to create a realistic color variant
                of the SAME saree.

                STRICT PRODUCT PRESERVATION RULES:

                1. Keep exactly the same saree.
                2. Keep the same weave.
                3. Keep the same motifs.
                4. Keep the same embroidery.
                5. Keep the same zari work.
                6. Keep the same border.
                7. Keep the same pallu.
                8. Keep the same folds and draping.
                9. Keep the same model/person if present.
                10. Keep the same pose.
                11. Keep the same background.
                12. Keep the same lighting and composition.
                13. Do not add a new saree design.
                14. Do not remove existing design elements.
                15. Do not modify jewellery.
                16. Do not modify the person's face or body.
                17. Do not change the zari from gold/silver.
                18. Only change the main saree fabric color.

                Requested new fabric color:
                %s

                The generated image must look like the
                original product photographed in the requested
                fabric color.

                Return only the edited image.
                """.formatted(requestedColor);
    }

    private byte[] extractGeneratedImage(
            String response
    ) {

        try {

            JsonNode root =
                    objectMapper.readTree(response);

            JsonNode candidates =
                    root.path("candidates");

            if (!candidates.isArray()
                    || candidates.isEmpty()) {

                throw new IllegalStateException(
                        "Gemini returned no candidates"
                );
            }

            for (JsonNode candidate : candidates) {

                JsonNode parts =
                        candidate
                                .path("content")
                                .path("parts");

                if (!parts.isArray()) {
                    continue;
                }

                for (JsonNode part : parts) {

                    JsonNode inlineData =
                            part.path("inlineData");

                    if (inlineData.isMissingNode()) {
                        inlineData =
                                part.path("inline_data");
                    }

                    JsonNode data =
                            inlineData.path("data");

                    if (data.isTextual()
                            && !data.asText().isBlank()) {

                        return Base64.getDecoder()
                                .decode(data.asText());
                    }
                }
            }

            throw new IllegalStateException(
                    "Gemini response did not contain an image"
            );

        } catch (IllegalStateException e) {

            throw e;

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to read Gemini image response",
                    e
            );
        }
    }

    private String safeMessage(Exception e) {

        String message = e.getMessage();

        if (message == null || message.isBlank()) {
            return "Unknown Gemini API error";
        }

        return message.length() > 500
                ? message.substring(0, 500)
                : message;
    }
}