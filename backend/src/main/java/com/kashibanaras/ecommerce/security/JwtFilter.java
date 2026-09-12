package com.kashibanaras.ecommerce.security;

import com.kashibanaras.ecommerce.entity.Role;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

        private final JwtService jwt;
        private final UserRepository users;

        public JwtFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
                this.users = users;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Allow browser preflight request
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader =
                request.getHeader("Authorization");

        // No JWT token
        if (authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7).trim();

        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            // ==============================
            // VALIDATE JWT
            // ==============================

            if (!jwt.valid(token)) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType("application/json");

                response.getWriter().write(
                        "{\"message\":\"Invalid or expired JWT token\"}"
                );

                return;
            }

            // ==============================
            // GET CLAIMS
            // ==============================

            Claims claims = jwt.claims(token);

            // ==============================
            // GET USER ID
            // ==============================

            Object uidValue = claims.get("uid");

            if (uidValue == null) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType("application/json");

                response.getWriter().write(
                        "{\"message\":\"User ID missing from JWT\"}"
                );

                return;
            }

            Long userId;

            if (uidValue instanceof Number number) {

                userId = number.longValue();

            } else {

                userId = Long.parseLong(
                        uidValue.toString()
                );
            }

            User user = users.findById(userId)
                    .filter(User::isActive)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "User is inactive or does not exist"
                            )
                    );

            String email = user.getEmail();

            List<SimpleGrantedAuthority> authorities =
                    user.getRoles().stream()
                            .map(Role::getName)
                            .filter(role -> role != null && !role.isBlank())
                            .map(role -> role.startsWith("ROLE_")
                                    ? role
                                    : "ROLE_" + role)
                            .map(SimpleGrantedAuthority::new)
                            .toList();

            // ==============================
            // CREATE AUTHENTICATION
            // ==============================

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            userId,
                            authorities
                    );

            // ==============================
            // SET SECURITY CONTEXT
            // ==============================

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "JWT AUTHENTICATION SUCCESS"
            );

            System.out.println(
                    "User ID : " + userId
            );

            System.out.println(
                    "Email   : " + email
            );

            System.out.println(
                    "Roles   : " + authorities
            );

            System.out.println(
                    "========================================"
            );

        } catch (Exception exception) {

            SecurityContextHolder.clearContext();

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "JWT AUTHENTICATION FAILED"
            );

            System.out.println(
                    "Reason: " + exception.getMessage()
            );

            System.out.println(
                    "========================================"
            );

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType("application/json");

            response.getWriter().write(
                    "{\"message\":\"Invalid authentication token\"}"
            );

            return;
        }

        filterChain.doFilter(request, response);
    }
}