package com.furiousfive.PleasantCorner.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrCodeService {

    @Value("${app.ngrok-base-url:}")
    private String ngrokBaseUrl;

    /**
     * Returns the customer URL for a given table number.
     * Uses ngrok URL when configured, otherwise falls back to localhost.
     */
    public String buildCustomerUrl(int tableNumber) {
        String base = (ngrokBaseUrl != null && !ngrokBaseUrl.isBlank())
            ? ngrokBaseUrl.stripTrailing()
            : "http://localhost:8001";
        return base + "/customer/table/" + tableNumber;
    }

    /**
     * Generates a QR code PNG for the given URL and returns it as a
     * base64 data URL: "data:image/png;base64,<data>"
     */
    public String generateQrDataUrl(String url) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 2);

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 300, 300, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            String base64 = Base64.getEncoder().encodeToString(out.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (WriterException | IOException e) {
            throw new RuntimeException("QR code generation failed: " + e.getMessage(), e);
        }
    }

    public String getNgrokBaseUrl() {
        return (ngrokBaseUrl != null && !ngrokBaseUrl.isBlank())
            ? ngrokBaseUrl : "http://localhost:8001";
    }
}
