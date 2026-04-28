package com.furiousfive.PleasantCorner.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object statusCode = request.getAttribute("jakarta.servlet.error.status_code");
        int status = (statusCode != null) ? (int) statusCode : 500;

        model.addAttribute("status", status);
        model.addAttribute("message", switch (status) {
            case 403 -> "You don't have permission to access this page.";
            case 404 -> "The page you're looking for doesn't exist.";
            default  -> "Something went wrong on our end.";
        });
        return "error";
    }
}
