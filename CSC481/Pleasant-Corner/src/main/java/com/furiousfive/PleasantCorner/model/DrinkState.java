package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "drink_states")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrinkState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;           // Hot, Iced, Warm, etc.

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(name = "is_default")
    private boolean defaultState = false;

    @Column(length = 10)
    private String emoji;

    @Column(columnDefinition = "TEXT")
    private String description;
}
