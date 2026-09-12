package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.repository.OrderRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

	private final UserRepository users;
	private final ProductRepository products;
	private final OrderRepository orders;

	public AdminDashboardController(
			UserRepository users,
			ProductRepository products,
			OrderRepository orders
	) {
		this.users = users;
		this.products = products;
		this.orders = orders;
	}

	@GetMapping
	public ApiResponse<Map<String, Object>> stats() {
		return ApiResponse.success(
				"Dashboard",
				Map.of(
						"customers",
						users.countCustomers(),
						"products",
						products.count(),
						"orders",
						orders.count()
				)
		);
	}
}
