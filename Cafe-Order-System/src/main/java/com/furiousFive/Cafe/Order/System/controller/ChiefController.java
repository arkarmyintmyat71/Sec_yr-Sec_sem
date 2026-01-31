package com.furiousFive.Cafe.Order.System.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/chief")
public class ChiefController {
    @GetMapping("/")
    public String chiefPage() {
        return "chief";
    }
}
