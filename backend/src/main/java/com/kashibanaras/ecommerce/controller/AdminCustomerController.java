package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final UserRepository users;

    public AdminCustomerController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> all() {
        return ApiResponse.success(
                "Customers",
                users.findAll().stream()
                        .filter(user -> user.getRoles().stream()
                                .noneMatch(role -> "ROLE_ADMIN".equals(role.getName())))
                        .map(this::toSummary)
                        .toList()
        );
    }

    private Map<String, Object> toSummary(User user) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", user.getId());
        summary.put("fullName", user.getFullName());
        summary.put("email", user.getEmail());
        summary.put("phone", user.getPhone());
        summary.put("active", user.isActive());
        summary.put("createdAt", user.getCreatedAt());
        return summary;
    }
}