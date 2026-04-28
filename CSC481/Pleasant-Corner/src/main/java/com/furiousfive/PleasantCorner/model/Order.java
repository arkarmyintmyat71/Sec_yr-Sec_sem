package com.furiousfive.PleasantCorner.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer queueNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "table_id")
    private CafeTable table;

    /** pending, preparing, ready, completed, cancelled */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    /** Cash, QR */
    @Column(length = 20)
    private String paymentMethod;

    /** Discount code used for this order (null if none) */
    @Column(length = 40)
    private String discountCode;

    /** Amount discounted from this order (0 if no discount) */
    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal discountAmount;

    /**
     * When true, this order is hidden from the customer's order history view.
     * Set when the customer clicks "Checkout & Done" so the next customer
     * at the same table sees a clean history. Admin views are unaffected.
     */
    @Column(nullable = false)
    private boolean customerArchived = false;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "pending";
    }
}
