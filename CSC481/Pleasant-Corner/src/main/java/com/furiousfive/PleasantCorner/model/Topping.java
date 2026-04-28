package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "toppings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(length = 20)
    private String status; // available, unavailable

    @Column(length = 10)
    private String emoji;

    @Column(columnDefinition = "TEXT")
    private String description;
}
