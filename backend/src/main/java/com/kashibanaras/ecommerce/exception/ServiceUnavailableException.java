package com.kashibanaras.ecommerce.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a downstream integration (Razorpay, Cloudinary, Gemini) is not
 * configured or unreachable. Deliberately distinct from a generic 500 — the
 * message always names the missing/failing dependency so it's obvious in logs
 * and in the API response that this isn't an application bug.
 */
public class ServiceUnavailableException extends ApiException {
    public ServiceUnavailableException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
