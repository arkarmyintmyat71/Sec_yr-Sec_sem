package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.dto.KitchenTicketDto;
import com.furiousfive.PleasantCorner.model.Order;
import com.furiousfive.PleasantCorner.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class KitchenController {

    private final OrderService orderService;

    // ── KDS Page ──────────────────────────────────────────────────────────────
    @GetMapping("/kitchen/kds")
    public String kds(Model model) {
        List<KitchenTicketDto> tickets = orderService.findActiveOrders()
            .stream()
            .map(KitchenTicketDto::from)
            .collect(Collectors.toList());
        model.addAttribute("tickets", tickets);
        return "kitchen/kds";
    }

    // ── Kitchen API — status transitions ──────────────────────────────────────
    // These are separate from /api/orders so kitchen role can access them.

    /** GET /kitchen/api/tickets — poll for latest active orders */
    @GetMapping("/kitchen/api/tickets")
    @ResponseBody
    public List<KitchenTicketDto> pollTickets() {
        return orderService.findActiveOrders()
            .stream()
            .map(KitchenTicketDto::from)
            .collect(Collectors.toList());
    }

    /** PATCH /kitchen/api/tickets/{id}/status — advance order status */
    @PatchMapping("/kitchen/api/tickets/{id}/status")
    @ResponseBody
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank())
            return ResponseEntity.badRequest().body("Missing 'status' field");

        // Only allow kitchen-valid transitions
        if (!List.of("preparing", "ready", "completed").contains(newStatus))
            return ResponseEntity.badRequest().body("Invalid status: " + newStatus);

        Order updated = orderService.updateStatus(id, newStatus);
        return ResponseEntity.ok(KitchenTicketDto.from(updated));
    }
}
