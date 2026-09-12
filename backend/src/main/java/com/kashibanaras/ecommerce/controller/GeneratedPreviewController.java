package com.kashibanaras.ecommerce.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/generated")
public class GeneratedPreviewController {

    private final Path previewDirectory;

    public GeneratedPreviewController() {
        this.previewDirectory = Paths.get(
                System.getProperty("user.dir"),
                "uploads",
                "ai-previews"
        ).toAbsolutePath().normalize();
    }

    @GetMapping(
            value = "/ai-previews/{filename:.+}",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    public ResponseEntity<Resource> getPreview(
            @PathVariable String filename
    ) {

        /*
         * Security:
         * Only allow PNG preview filenames.
         * This also prevents ../ path traversal.
         */
        if (!filename.matches(
                "ai-preview-[a-fA-F0-9-]+\\.png"
        )) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Path file =
                    previewDirectory
                            .resolve(filename)
                            .normalize();

            /*
             * Make sure the resolved file stays
             * inside uploads/ai-previews.
             */
            if (!file.startsWith(previewDirectory)) {
                return ResponseEntity.badRequest().build();
            }

            if (!Files.exists(file) ||
                    !Files.isRegularFile(file)) {

                return ResponseEntity.notFound().build();
            }

            Resource resource =
                    new UrlResource(
                            file.toUri()
                    );

            if (!resource.exists() ||
                    !resource.isReadable()) {

                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.IMAGE_PNG
                    )
                    .header(
                            HttpHeaders.CACHE_CONTROL,
                            "no-cache, no-store, must-revalidate"
                    )
                    .body(resource);

        } catch (MalformedURLException e) {

            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }
}