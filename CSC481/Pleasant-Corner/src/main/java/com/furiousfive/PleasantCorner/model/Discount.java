package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "discounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(length = 100)
    private String name;

    /** percent, fixed, bogo */
    @Column(length = 20)
    private String discountType;

    @Column(precision = 10, scale = 2)
    private BigDecimal value;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** active, scheduled, expired */
    @Column(length = 20)
    private String status;

    /**
     * If true, discount is automatically applied to every order without requiring a code.
     * If false, customer must enter the code manually.
     */
    @Column(nullable = false)
    private boolean autoApply = false;
}
