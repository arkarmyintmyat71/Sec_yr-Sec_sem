package com.furiousFive.Cafe.Order.System.controller;

import com.furiousFive.Cafe.Order.System.dto.request.LoginReqDto;
import com.furiousFive.Cafe.Order.System.dto.request.RegisterReqDto;
import com.furiousFive.Cafe.Order.System.model.User;
import com.furiousFive.Cafe.Order.System.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/")
public class AuthController {

    private final UserService userService;

    @GetMapping
    public String authPage(Model model) {
        model.addAttribute("loginRequest", new LoginReqDto());
        model.addAttribute("registerRequest", new RegisterReqDto());
        return "auth";
    }

    @PostMapping("/register")
    public String userRegistration(
            @ModelAttribute("registerRequest") RegisterReqDto dto,
            Model model) {

        try {
            userService.userRegistration(dto);
            return "redirect:/";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());

            // IMPORTANT: re-add login dto
            model.addAttribute("loginRequest", new LoginReqDto());

            return "auth";
        }
    }
}

