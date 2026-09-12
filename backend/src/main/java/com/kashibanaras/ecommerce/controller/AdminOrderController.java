package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Address;
import com.kashibanaras.ecommerce.entity.Order;
import com.kashibanaras.ecommerce.entity.OrderItem;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.ProductImage;
import com.kashibanaras.ecommerce.entity.enums.OrderStatus;
import com.kashibanaras.ecommerce.repository.OrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

	private final OrderRepository orders;

	public AdminOrderController(OrderRepository orders) {
		this.orders = orders;
	}

	@GetMapping
	@Transactional
	public ApiResponse<List<Map<String, Object>>> all() {

		List<Map<String, Object>> result =
				orders.findAll()
						.stream()
						.map(this::toSummary)
						.toList();

		return ApiResponse.success(
				"Orders",
				result
		);
	}

	@GetMapping("/{id}")
	@Transactional
	public ApiResponse<Map<String, Object>> one(
			@PathVariable Long id
	) {

		Order order =
				orders.findById(id)
						.orElseThrow(
								() -> new RuntimeException(
										"Order not found."
								)
						);

		return ApiResponse.success(
				"Order",
				toDetails(order)
		);
	}

	@PatchMapping("/{id}/status")
	@Transactional
	public ApiResponse<Map<String, Object>> status(
			@PathVariable Long id,
			@RequestParam OrderStatus status
	) {

		Order order =
				orders.findById(id)
						.orElseThrow(
								() -> new RuntimeException(
										"Order not found."
								)
						);

		order.setStatus(status);

		Order saved = orders.save(order);

		return ApiResponse.success(
				"Order status updated successfully.",
				toSummary(saved)
		);
	}

	private Map<String, Object> toSummary(
			Order order
	) {

		Map<String, Object> summary =
				new LinkedHashMap<>();

		summary.put(
				"id",
				order.getId()
		);

		summary.put(
				"orderNumber",
				order.getOrderNumber()
		);

		summary.put(
				"customerName",
				order.getUser() != null
						? order.getUser().getFullName()
						: "—"
		);

		summary.put(
				"customerEmail",
				order.getUser() != null
						? order.getUser().getEmail()
						: "—"
		);

		Address address =
				order.getShippingAddress();

		if (address != null) {

			summary.put(
					"fullName",
					address.getFullName()
			);

			summary.put(
					"phone",
					address.getPhone()
			);

			summary.put(
					"line1",
					address.getLine1()
			);

			summary.put(
					"line2",
					address.getLine2()
			);

			summary.put(
					"city",
					address.getCity()
			);

			summary.put(
					"state",
					address.getState()
			);

			summary.put(
					"postalCode",
					address.getPostalCode()
			);

			summary.put(
					"country",
					address.getCountry()
			);

			summary.put(
					"address",
					buildAddress(address)
			);

		} else {

			summary.put(
					"fullName",
					"—"
			);

			summary.put(
					"phone",
					"—"
			);

			summary.put(
					"line1",
					null
			);

			summary.put(
					"line2",
					null
			);

			summary.put(
					"city",
					null
			);

			summary.put(
					"state",
					null
			);

			summary.put(
					"postalCode",
					null
			);

			summary.put(
					"country",
					null
			);

			summary.put(
					"address",
					"Address not available"
			);
		}

		summary.put(
				"subtotal",
				order.getSubtotal()
		);

		summary.put(
				"discountAmount",
				order.getDiscountAmount()
		);

		summary.put(
				"shippingFee",
				order.getShippingFee()
		);

		summary.put(
				"taxAmount",
				order.getTaxAmount()
		);

		summary.put(
				"totalAmount",
				order.getTotalAmount()
		);

		summary.put(
				"status",
				order.getStatus()
		);

		summary.put(
				"createdAt",
				order.getCreatedAt()
		);

		/*
		 * Ordered products
		 */
		summary.put(
				"items",
				order.getItems()
						.stream()
						.map(this::toItem)
						.toList()
		);

		return summary;
	}

	private Map<String, Object> toDetails(
			Order order
	) {

		Map<String, Object> details =
				new LinkedHashMap<>(
						toSummary(order)
				);

		return details;
	}

	private Map<String, Object> toItem(
			OrderItem item
	) {

		Map<String, Object> result =
				new LinkedHashMap<>();

		result.put(
				"id",
				item.getId()
		);

		Product product =
				item.getProduct();

		result.put(
				"productId",
				product != null
						? product.getId()
						: null
		);

		result.put(
				"productName",
				item.getProductNameSnapshot()
		);

		result.put(
				"unitPrice",
				item.getUnitPrice()
		);

		result.put(
				"quantity",
				item.getQuantity()
		);

		BigDecimal total =
				BigDecimal.ZERO;

		if (
				item.getUnitPrice() != null &&
						item.getQuantity() != null
		) {

			total =
					item.getUnitPrice()
							.multiply(
									BigDecimal.valueOf(
											item.getQuantity()
									)
							);
		}

		result.put(
				"totalPrice",
				total
		);

		/*
		 * Product image
		 */
		String imageUrl = null;

		if (
				product != null &&
						product.getImages() != null &&
						!product.getImages().isEmpty()
		) {

			ProductImage mainImage =
					product.getImages()
							.stream()
							.filter(
									image ->
											image.getType() != null &&
													"MAIN".equals(
															image.getType()
																	.name()
													)
							)
							.findFirst()
							.orElse(null);

			if (mainImage != null) {

				imageUrl =
						mainImage.getUrl();

			} else {

				imageUrl =
						product.getImages()
								.stream()
								.findFirst()
								.map(ProductImage::getUrl)
								.orElse(null);
			}
		}

		result.put(
				"imageUrl",
				imageUrl
		);

		/*
		 * Extra product information
		 */
		if (product != null) {

			result.put(
					"sku",
					product.getSku()
			);

			result.put(
					"slug",
					product.getSlug()
			);

			result.put(
					"fabric",
					product.getFabric()
			);

			result.put(
					"weave",
					product.getWeave()
			);

			result.put(
					"zariType",
					product.getZariType()
			);

			result.put(
					"occasion",
					product.getOccasion()
			);
		}

		return result;
	}

	private String buildAddress(
			Address address
	) {

		StringBuilder result =
				new StringBuilder();

		appendPart(
				result,
				address.getLine1()
		);

		appendPart(
				result,
				address.getLine2()
		);

		appendPart(
				result,
				address.getCity()
		);

		appendPart(
				result,
				address.getState()
		);

		appendPart(
				result,
				address.getPostalCode()
		);

		appendPart(
				result,
				address.getCountry()
		);

		return result.toString();
	}

	private void appendPart(
			StringBuilder builder,
			String value
	) {

		if (
				value == null ||
						value.isBlank()
		) {
			return;
		}

		if (builder.length() > 0) {
			builder.append(", ");
		}

		builder.append(
				value.trim()
		);
	}
}