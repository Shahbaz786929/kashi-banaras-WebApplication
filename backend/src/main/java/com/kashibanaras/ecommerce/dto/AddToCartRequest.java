package com.kashibanaras.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddToCartRequest(

        @NotNull
        Long productId,

        Long productColorId,

        @NotNull
        @Min(1)
        Integer quantity

) {
}