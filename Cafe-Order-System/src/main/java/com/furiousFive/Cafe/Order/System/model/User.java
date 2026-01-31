package com.furiousFive.Cafe.Order.System.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class User {

    @Id
    @GeneratedValue
    private Long id;

    private String email;
    private String password;

    // Example: ROLE_ADMIN, ROLE_USER
    private String role;
}
