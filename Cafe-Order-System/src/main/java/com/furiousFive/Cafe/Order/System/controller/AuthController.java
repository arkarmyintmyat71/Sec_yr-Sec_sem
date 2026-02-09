package com.furiousFive.Cafe.Order.System.controller;

import com.furiousFive.Cafe.Order.System.dto.request.LoginReqDto;
import com.furiousFive.Cafe.Order.System.dto.request.RegisterReqDto;
import com.furiousFive.Cafe.Order.System.model.User;
import com.furiousFive.Cafe.Order.System.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/")
public class AuthController {

    private final UserService userService;

    /* ================= LOGIN PAGE ================= */
    @GetMapping("/login")
    public String loginPage(Model model,
                            @RequestParam(value = "error", required = false) String error) {

        model.addAttribute("loginRequest", new LoginReqDto());

        if (error != null) {
            model.addAttribute("loginError", "Invalid credentials or account not approved.");
        }

        return "auth/login";
    }

    /* ================= REGISTER PAGE ================= */
    @GetMapping("/register")
    public String registerPage(Model model) {
        model.addAttribute("registerRequest", new RegisterReqDto());
        return "auth/register";
    }

    /* ================= REGISTER POST ================= */
    @PostMapping("/register")
    public String userRegistration(
            @ModelAttribute("registerRequest") RegisterReqDto dto,
            Model model) {

        try {
            userService.userRegistration(dto);
            return "redirect:/auth/login";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "auth/register";
        }
    }
}