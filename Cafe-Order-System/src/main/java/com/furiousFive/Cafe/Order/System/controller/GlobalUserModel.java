package com.furiousFive.Cafe.Order.System.controller;

import com.furiousFive.Cafe.Order.System.model.User;
import com.furiousFive.Cafe.Order.System.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@RequiredArgsConstructor
public class GlobalUserModel {

    private final UserRepo userRepo;

    @ModelAttribute("currentUser")
    public User currentUser(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return userRepo.findByEmail(authentication.getName()).orElse(null);
    }
}
