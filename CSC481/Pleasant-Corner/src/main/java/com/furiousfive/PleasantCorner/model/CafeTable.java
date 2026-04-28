package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cafe_tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CafeTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer tableNumber;

    private Integer seats;

    @Column(length = 255)
    private String locationNote;

    @Column(length = 20)
    private String status; // active, inactive

    /**
     * Whether a customer session is currently active at this table.
     * Set to true when customer clicks "Browse Menu", false when they check out.
     */
    @Column(nullable = false)
    private boolean occupied = false;

    /**
     * The customer-facing URL this table's QR code points to.
     * Set automatically from ngrok base URL + table number.
     * e.g. https://abc123.ngrok-free.app/customer/table/7
     */
    @Column(length = 500)
    private String customerUrl;

    /**
     * Base64-encoded PNG of the table QR code (data:image/png;base64,...).
     * Generated server-side via ZXing whenever ngrok URL is configured.
     * Displayed in admin Tables & QR page and downloadable.
     */
    @Column(columnDefinition = "TEXT")
    private String tableQrDataUrl;

    /**
     * Base64-encoded payment QR image uploaded by admin in the Payments page.
     * Shown to customers on the checkout screen when they choose QR payment.
     */
    @Column(columnDefinition = "TEXT")
    private String paymentQrDataUrl;
}
