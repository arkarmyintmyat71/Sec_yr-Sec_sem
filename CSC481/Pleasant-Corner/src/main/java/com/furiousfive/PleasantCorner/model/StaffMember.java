package com.furiousfive.PleasantCorner.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "staff_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 60)
    private String role;           // Barista, Cashier, Manager, etc.

    /** pending, approved, rejected */
    @Column(length = 20)
    private String status;
    
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate registeredDate;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(length = 120)
    private String availability;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlySalary;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
