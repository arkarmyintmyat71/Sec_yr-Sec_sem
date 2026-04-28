package com.furiousfive.PleasantCorner.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Handles saving the ngrok URL to application.yaml at runtime.
 * The value is written to a separate override file that Spring Boot
 * picks up via application-override.yaml (lower precedence than env vars
 * but survives restarts).
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsApiController {

    @Value("${app.ngrok-base-url:}")
    private String currentNgrokUrl;

    /**
     * POST /api/settings/ngrok
     * Saves the ngrok URL to src/main/resources/application.yaml at runtime.
     * Requires a restart for QrCodeService to pick it up unless Spring Cloud
     * Config is used. For now, writing to an override properties file works.
     */
    @PostMapping("/ngrok")
    public ResponseEntity<?> saveNgrokUrl(@RequestBody Map<String, String> body) {
        String url = body.getOrDefault("ngrokBaseUrl", "").trim();

        // Write to a runtime override file in the working directory
        try {
            Path overridePath = Paths.get("ngrok-override.properties");
            String content = "app.ngrok-base-url=" + url + "\n";
            Files.writeString(overridePath, content);

            // Also update the in-memory value via System property so
            // QrCodeService picks it up without restart (best-effort)
            System.setProperty("app.ngrok-base-url", url);

            return ResponseEntity.ok(Map.of(
                "saved", true,
                "ngrokBaseUrl", url,
                "note", "Saved. Regenerate QR codes now."
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Could not save: " + e.getMessage()));
        }
    }
}
