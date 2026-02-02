package com.furiousFive.Cafe.Order.System.dto.request;

import com.furiousFive.Cafe.Order.System.constant.Role;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterReqDto {
    private String name;
    private LocalDate dob;
    private String gender;
    private Role role;
    private int experience;
    private int age;
    private String email;
    private String phone;
    private String address;
    private String password;
    private Boolean prove;
}
