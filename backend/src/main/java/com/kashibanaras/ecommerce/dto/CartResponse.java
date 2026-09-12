package com.kashibanaras.ecommerce.dto;

import java.util.List;

public record CartResponse(

        List<CartItemResponse> items,

        Integer totalQuantity,

        Integer subtotal,

        Integer shipping,

        Integer total

) {
}