package com.furiousFive.Cafe.Order.System.model;

import com.furiousFive.Cafe.Order.System.constant.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(length = 30, nullable = false)
    private String name;

    private LocalDate dob;

    private int age;

    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;   // ADMIN, KITCHEN, WAITER

    private int experience;

    @Column(length = 50, unique = true, nullable = false)
    private String email;

    @Column(length = 30)
    private String phone;

    private String address;

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "BIT(1)")
    private Boolean prove;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Salaries> salaries = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<LeaveRequest> leaveRequests = new ArrayList<>();
}

