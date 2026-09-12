package com.kashibanaras.ecommerce.dto;

public record CartItemResponse(

        Long id,

        Long productId,

        String sku,

        String name,

        String slug,

        String imageUrl,

        Integer unitPrice,

        Integer quantity,

        Long productColorId,

        Integer totalPrice

) {
}