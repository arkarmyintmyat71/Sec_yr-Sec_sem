package com.furiousFive.Cafe.Order.System.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "menu_item")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long menuId;

    @Column(nullable = false)
    private String itemName;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String imageUrl;

    private String category; // Coffee, Equipment, Gifts

    private String availabilityStatus; // AVAILABLE / OUT_OF_STOCK

    @Column(length = 500)
    private String description;

    // ⭐ Rating summary
    @Column(nullable = false)
    private double averageRating = 0.0;

    @Column(nullable = false)
    private int ratingCount = 0;

    private BigDecimal discountValue; // 10 (%) or 5.00

    @Column(nullable = false)
    private boolean discountActive = false;

    // =====================
    // RELATIONSHIPS
    // =====================
    @OneToMany(
            mappedBy = "menuItem",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<MenuRating> ratings = new ArrayList<>();

    @Transient
    public BigDecimal getFinalPrice() {

        if (discountValue == null || discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            return price;
        }

        // Percentage discount (1–100)
        if (discountValue.compareTo(BigDecimal.valueOf(100)) <= 0) {
            BigDecimal discountAmount =
                    price.multiply(discountValue)
                            .divide(BigDecimal.valueOf(100));
            return price.subtract(discountAmount);
        }

        // Fixed amount discount (>100)
        return price.subtract(discountValue);
    }
}
