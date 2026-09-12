package com.kashibanaras.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Standard envelope for every API response — see docs/api.md section "Response format".
 * Success:  { "success": true,  "message": "...", "data": {...} }
 * Error:    { "success": false, "message": "...", "errors": [...] }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, String message, T data, List<String> errors) {

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "OK", data, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        return new ApiResponse<>(false, message, null, errors);
    }
}
