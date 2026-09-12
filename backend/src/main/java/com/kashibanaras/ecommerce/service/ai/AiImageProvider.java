package com.kashibanaras.ecommerce.service.ai;

public interface AiImageProvider {

    byte[] generateColorPreview(
            byte[] originalImage,
            String mimeType,
            String colorName,
            String hexColor
    );
}