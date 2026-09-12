package com.kashibanaras.ecommerce.service.ai;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Queue;

@Service
public class LocalColorPreviewService {

    /*
     * This service performs a deterministic local colour replacement.
     *
     * Important:
     * - No Gemini
     * - No external AI image generation
     * - Original image dimensions are preserved
     * - Background is protected
     * - Zari / jewellery / face / body are protected as much as possible
     */

    private static final int HUE_BINS = 36;

    public byte[] recolor(
            byte[] originalImage,
            String hexColor
    ) {

        if (originalImage == null || originalImage.length == 0) {
            throw new IllegalArgumentException(
                    "Original image is empty"
            );
        }

        Color targetColor = parseHex(hexColor);

        try {

            BufferedImage source =
                    ImageIO.read(
                            new ByteArrayInputStream(originalImage)
                    );

            if (source == null) {
                throw new IllegalArgumentException(
                        "Unable to read the product image"
                );
            }

            int width = source.getWidth();
            int height = source.getHeight();

            /*
             * Keep the same dimensions and preserve alpha.
             */
            BufferedImage result =
                    new BufferedImage(
                            width,
                            height,
                            BufferedImage.TYPE_INT_ARGB
                    );

            /*
             * First detect the approximate background colour
             * from the image borders.
             */
            Color backgroundColor =
                    detectBackgroundColor(source);

            /*
             * Find the dominant fabric hue by looking for
             * a large connected colour region which does NOT
             * belong to the image border/background.
             */
            float fabricHue =
                    detectFabricHue(
                            source,
                            backgroundColor
                    );

            float[] targetHsb =
                    Color.RGBtoHSB(
                            targetColor.getRed(),
                            targetColor.getGreen(),
                            targetColor.getBlue(),
                            null
                    );

            float targetHue = targetHsb[0];
            float targetSaturation = targetHsb[1];

            for (int y = 0; y < height; y++) {

                for (int x = 0; x < width; x++) {

                    Color original =
                            new Color(
                                    source.getRGB(x, y),
                                    true
                            );

                    int alpha = original.getAlpha();

                    /*
                     * Fully transparent pixels remain untouched.
                     */
                    if (alpha == 0) {
                        result.setRGB(
                                x,
                                y,
                                original.getRGB()
                        );
                        continue;
                    }

                    float[] hsb =
                            Color.RGBtoHSB(
                                    original.getRed(),
                                    original.getGreen(),
                                    original.getBlue(),
                                    null
                            );

                    float hue = hsb[0];
                    float saturation = hsb[1];
                    float brightness = hsb[2];

                    /*
                     * Protect obvious background.
                     */
                    if (isBackgroundPixel(
                            original,
                            backgroundColor
                    )) {

                        result.setRGB(
                                x,
                                y,
                                original.getRGB()
                        );

                        continue;
                    }

                    /*
                     * Protect almost-black pixels.
                     *
                     * This helps preserve:
                     * - hair
                     * - blouse
                     * - deep shadows
                     * - black jewellery details
                     */
                    if (brightness < 0.08f) {

                        result.setRGB(
                                x,
                                y,
                                original.getRGB()
                        );

                        continue;
                    }

                    /*
                     * Only colour pixels which are close to
                     * the detected saree/fabric hue.
                     */
                    float hueDistance =
                            circularHueDistance(
                                    hue,
                                    fabricHue
                            );

                    boolean fabricPixel =
                            saturation >= 0.16f
                                    && hueDistance <= 0.095f;

                    if (!fabricPixel) {

                        result.setRGB(
                                x,
                                y,
                                original.getRGB()
                        );

                        continue;
                    }

                    /*
                     * Preserve the original brightness.
                     *
                     * This is very important because it keeps:
                     * - folds
                     * - shadows
                     * - highlights
                     * - weave texture
                     * - photographic lighting
                     *
                     * instead of painting the saree with one flat colour.
                     */
                    float newSaturation =
                            clamp(
                                    targetSaturation * 0.94f
                                            + saturation * 0.06f,
                                    0f,
                                    1f
                            );

                    float newBrightness =
                            clamp(
                                    brightness,
                                    0.08f,
                                    1f
                            );

                    int rgb =
                            Color.HSBtoRGB(
                                    targetHue,
                                    newSaturation,
                                    newBrightness
                            );

                    Color recolored =
                            new Color(
                                    (rgb >> 16) & 0xFF,
                                    (rgb >> 8) & 0xFF,
                                    rgb & 0xFF,
                                    alpha
                            );

                    result.setRGB(
                            x,
                            y,
                            recolored.getRGB()
                    );
                }
            }

            /*
             * PNG is lossless.
             *
             * This avoids introducing JPEG compression artifacts.
             */
            ByteArrayOutputStream output =
                    new ByteArrayOutputStream();

            ImageIO.write(
                    result,
                    "png",
                    output
            );

            return output.toByteArray();

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Unable to process product image",
                    e
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * BACKGROUND DETECTION
     * ---------------------------------------------------------
     */

    private Color detectBackgroundColor(
            BufferedImage image
    ) {

        int width = image.getWidth();
        int height = image.getHeight();

        long red = 0;
        long green = 0;
        long blue = 0;
        long count = 0;

        int border = Math.max(
                2,
                Math.min(width, height) / 30
        );

        /*
         * Top + bottom
         */
        for (int y = 0; y < border; y++) {

            for (int x = 0; x < width; x++) {

                Color c =
                        new Color(
                                image.getRGB(x, y),
                                true
                        );

                if (c.getAlpha() < 20) {
                    continue;
                }

                red += c.getRed();
                green += c.getGreen();
                blue += c.getBlue();
                count++;
            }
        }

        for (int y = height - border; y < height; y++) {

            for (int x = 0; x < width; x++) {

                Color c =
                        new Color(
                                image.getRGB(x, y),
                                true
                        );

                if (c.getAlpha() < 20) {
                    continue;
                }

                red += c.getRed();
                green += c.getGreen();
                blue += c.getBlue();
                count++;
            }
        }

        /*
         * Left + right
         */
        for (int y = border; y < height - border; y++) {

            for (int x = 0; x < border; x++) {

                Color c =
                        new Color(
                                image.getRGB(x, y),
                                true
                        );

                if (c.getAlpha() < 20) {
                    continue;
                }

                red += c.getRed();
                green += c.getGreen();
                blue += c.getBlue();
                count++;
            }

            for (int x = width - border; x < width; x++) {

                Color c =
                        new Color(
                                image.getRGB(x, y),
                                true
                        );

                if (c.getAlpha() < 20) {
                    continue;
                }

                red += c.getRed();
                green += c.getGreen();
                blue += c.getBlue();
                count++;
            }
        }

        if (count == 0) {
            return Color.WHITE;
        }

        return new Color(
                (int) (red / count),
                (int) (green / count),
                (int) (blue / count)
        );
    }

    private boolean isBackgroundPixel(
            Color pixel,
            Color background
    ) {

        /*
         * RGB distance from the detected border colour.
         */
        double distance =
                colorDistance(
                        pixel,
                        background
                );

        /*
         * A reasonably generous threshold handles
         * shadows/lighting variations in a plain backdrop.
         */
        return distance < 52;
    }

    private double colorDistance(
            Color a,
            Color b
    ) {

        int dr =
                a.getRed() - b.getRed();

        int dg =
                a.getGreen() - b.getGreen();

        int db =
                a.getBlue() - b.getBlue();

        return Math.sqrt(
                dr * dr
                        + dg * dg
                        + db * db
        );
    }

    /*
     * ---------------------------------------------------------
     * FABRIC DETECTION
     * ---------------------------------------------------------
     */

    private float detectFabricHue(
            BufferedImage image,
            Color backgroundColor
    ) {

        int width = image.getWidth();
        int height = image.getHeight();

        /*
         * Work on a smaller sampling grid for speed.
         */
        int step =
                Math.max(
                        4,
                        Math.min(width, height) / 180
                );

        int smallWidth =
                (width + step - 1) / step;

        int smallHeight =
                (height + step - 1) / step;

        /*
         * We calculate the largest connected region
         * for each hue bin.
         */
        int bestBin = -1;
        int bestArea = 0;
        double bestScore = -1;

        for (int bin = 0; bin < HUE_BINS; bin++) {

            boolean[][] mask =
                    new boolean[
                            smallHeight
                            ][
                            smallWidth
                            ];

            for (int sy = 0; sy < smallHeight; sy++) {

                int y =
                        Math.min(
                                sy * step,
                                height - 1
                        );

                for (int sx = 0; sx < smallWidth; sx++) {

                    int x =
                            Math.min(
                                    sx * step,
                                    width - 1
                            );

                    /*
                     * Keep most of the image, but slightly
                     * reduce extreme outer edges.
                     */
                    if (x < width * 0.04
                            || x > width * 0.96
                            || y < height * 0.04
                            || y > height * 0.98) {

                        continue;
                    }

                    Color color =
                            new Color(
                                    image.getRGB(x, y),
                                    true
                            );

                    if (color.getAlpha() < 20) {
                        continue;
                    }

                    /*
                     * Remove background colour.
                     */
                    if (colorDistance(
                            color,
                            backgroundColor
                    ) < 52) {
                        continue;
                    }

                    float[] hsb =
                            Color.RGBtoHSB(
                                    color.getRed(),
                                    color.getGreen(),
                                    color.getBlue(),
                                    null
                            );

                    float saturation = hsb[1];
                    float brightness = hsb[2];

                    if (saturation < 0.16f) {
                        continue;
                    }

                    if (brightness < 0.08f
                            || brightness > 0.97f) {
                        continue;
                    }

                    float binHue =
                            (bin + 0.5f)
                                    / HUE_BINS;

                    if (circularHueDistance(
                            hsb[0],
                            binHue
                    ) <= 0.055f) {

                        mask[sy][sx] = true;
                    }
                }
            }

            ComponentInfo component =
                    findLargestComponent(
                            mask
                    );

            if (component.area <= 0) {
                continue;
            }

            /*
             * Prefer large connected fabric regions,
             * especially around the central/lower area.
             */
            double centerX =
                    component.centerX
                            / (double) smallWidth;

            double centerY =
                    component.centerY
                            / (double) smallHeight;

            double centerDistance =
                    Math.sqrt(
                            Math.pow(
                                    centerX - 0.5,
                                    2
                            )
                                    +
                                    Math.pow(
                                            centerY - 0.60,
                                            2
                                    )
                    );

            double centerWeight =
                    1.0
                            / (
                            1.0
                                    + centerDistance * 3.0
                    );

            double lowerWeight =
                    component.centerY
                            / (double) smallHeight;

            double score =
                    component.area
                            * (
                            0.65
                                    + centerWeight * 0.35
                    )
                            * (
                            0.70
                                    + lowerWeight * 0.30
                    );

            if (score > bestScore) {

                bestScore = score;
                bestBin = bin;
                bestArea = component.area;
            }
        }

        /*
         * Fallback if no suitable hue was detected.
         */
        if (bestBin < 0 || bestArea < 8) {

            return 0f;
        }

        return (bestBin + 0.5f)
                / HUE_BINS;
    }

    private ComponentInfo findLargestComponent(
            boolean[][] mask
    ) {

        int height = mask.length;

        if (height == 0) {
            return new ComponentInfo(
                    0,
                    0,
                    0
            );
        }

        int width = mask[0].length;

        boolean[][] visited =
                new boolean[
                        height
                        ][
                        width
                        ];

        int largestArea = 0;
        double largestCenterX = 0;
        double largestCenterY = 0;

        for (int y = 0; y < height; y++) {

            for (int x = 0; x < width; x++) {

                if (!mask[y][x]
                        || visited[y][x]) {

                    continue;
                }

                Queue<Point> queue =
                        new ArrayDeque<>();

                queue.add(
                        new Point(x, y)
                );

                visited[y][x] = true;

                int area = 0;
                long sumX = 0;
                long sumY = 0;

                boolean touchesBorder = false;

                while (!queue.isEmpty()) {

                    Point point =
                            queue.poll();

                    int px = point.x;
                    int py = point.y;

                    area++;

                    sumX += px;
                    sumY += py;

                    if (px == 0
                            || py == 0
                            || px == width - 1
                            || py == height - 1) {

                        touchesBorder = true;
                    }

                    int[][] directions = {
                            {1, 0},
                            {-1, 0},
                            {0, 1},
                            {0, -1}
                    };

                    for (int[] direction : directions) {

                        int nx =
                                px + direction[0];

                        int ny =
                                py + direction[1];

                        if (nx < 0
                                || ny < 0
                                || nx >= width
                                || ny >= height) {

                            continue;
                        }

                        if (!mask[ny][nx]
                                || visited[ny][nx]) {

                            continue;
                        }

                        visited[ny][nx] = true;

                        queue.add(
                                new Point(
                                        nx,
                                        ny
                                )
                        );
                    }
                }

                /*
                 * A component connected directly to the
                 * image border is very likely background.
                 */
                if (touchesBorder) {
                    continue;
                }

                if (area > largestArea) {

                    largestArea = area;

                    largestCenterX =
                            sumX
                                    / (double) area;

                    largestCenterY =
                            sumY
                                    / (double) area;
                }
            }
        }

        return new ComponentInfo(
                largestArea,
                largestCenterX,
                largestCenterY
        );
    }

    private record ComponentInfo(
            int area,
            double centerX,
            double centerY
    ) {
    }

    private record Point(
            int x,
            int y
    ) {
    }

    /*
     * ---------------------------------------------------------
     * COLOR HELPERS
     * ---------------------------------------------------------
     */

    private float circularHueDistance(
            float a,
            float b
    ) {

        float difference =
                Math.abs(a - b);

        return Math.min(
                difference,
                1f - difference
        );
    }

    private float clamp(
            float value,
            float min,
            float max
    ) {

        return Math.max(
                min,
                Math.min(
                        max,
                        value
                )
        );
    }

    private Color parseHex(
            String hex
    ) {

        if (hex == null
                || !hex.matches(
                "#[0-9a-fA-F]{6}"
        )) {

            throw new IllegalArgumentException(
                    "A valid HEX color is required"
            );
        }

        return new Color(
                Integer.parseInt(
                        hex.substring(1),
                        16
                )
        );
    }
}