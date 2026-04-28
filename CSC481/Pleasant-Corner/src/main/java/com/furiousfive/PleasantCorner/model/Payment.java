package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stores one payment record per order.
 * Columns match the pcdb5 payments table:
 *   id, amount, completed_at, created_at, method, note, reference_no, status, order_id
 */
@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Amount paid (same as order total after discount). */
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    /** Timestamp when the payment was completed (null until admin marks it done). */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** Timestamp when the payment record was created. */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Payment method: Cash | QR */
    @Column(length = 30)
    private String method;

    /** Optional customer note (e.g. "paid exact change"). */
    @Column(columnDefinition = "TEXT")
    private String note;

    /**
     * Reference number for QR / PromptPay transactions.
     * Null for cash payments.
     */
    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    /**
     * Payment status: pending | completed | failed | refunded
     * - Cash: starts as "pending", admin marks "completed" when collected.
     * - QR:   starts as "pending", admin marks "completed" when bank slip confirmed.
     */
    @Column(length = 20, nullable = false)
    private String status;

    /** The order this payment belongs to. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status    == null) status    = "pending";
    }
}
