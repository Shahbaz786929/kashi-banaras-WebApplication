package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.entity.Collection;
import com.kashibanaras.ecommerce.entity.HomeBanner;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.repository.CollectionRepository;
import com.kashibanaras.ecommerce.repository.HomeBannerRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeBannerRepository bannerRepository;
    private final CollectionRepository collectionRepository;
    private final ProductRepository productRepository;

    @GetMapping("/banners")
    public List<HomeBanner> banners() {

        return bannerRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @GetMapping("/collections")
    public List<Collection> collections() {

        return collectionRepository
                .findByActiveTrueOrderBySortOrderAsc();
    }

    @GetMapping("/products")
    public List<Product> products() {

        return productRepository
                .findByActiveTrueAndShowOnHomeTrueOrderByHomePositionAscIdAsc();
    }
}