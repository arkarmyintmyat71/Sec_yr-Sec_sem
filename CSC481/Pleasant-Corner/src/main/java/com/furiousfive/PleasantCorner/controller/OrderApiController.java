package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.Order;
import com.furiousfive.PleasantCorner.model.OrderItem;
import com.furiousfive.PleasantCorner.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderApiController {

    private final OrderService orderService;

    /** GET /api/orders/active — JSON list for current orders page */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveOrders() {
        return ResponseEntity.ok(
            orderService.findActiveOrders().stream()
                .map(this::toSummary)
                .collect(Collectors.toList())
        );
    }

    /** GET /api/orders/history — JSON list for order history page */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(
            orderService.findOrderHistory().stream()
                .map(this::toSummary)
                .collect(Collectors.toList())
        );
    }

    /** GET /api/orders/{id} — full detail with items for modal */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        return orderService.findById(id)
            .map(this::toDetail)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** PATCH /api/orders/{id}/status  body: { "status": "ready" } */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body("Missing 'status' field");
        }
        Order updated = orderService.updateStatus(id, newStatus);
        return ResponseEntity.ok(toSummary(updated));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toSummary(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            o.getId());
        m.put("queueNumber",   o.getQueueNumber());
        m.put("tableNumber",   o.getTable() != null ? o.getTable().getTableNumber() : null);
        m.put("status",        o.getStatus());
        m.put("total",         o.getTotal());
        m.put("paymentMethod", o.getPaymentMethod());
        m.put("createdAt",     o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        m.put("completedAt",   o.getCompletedAt() != null ? o.getCompletedAt().toString() : null);
        // brief items label
        String label = o.getItems().stream()
            .map(i -> {
                String name = i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item";
                return i.getQuantity() != null && i.getQuantity() > 1 ? name + " ×" + i.getQuantity() : name;
            })
            .collect(Collectors.joining(", "));
        m.put("itemsLabel", label.isEmpty() ? "—" : label);
        return m;
    }

    private Map<String, Object> toDetail(Order o) {
        Map<String, Object> m = toSummary(o);
        List<Map<String, Object>> items = o.getItems().stream().map(i -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name",        i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item");
            item.put("qty",         i.getQuantity() != null ? i.getQuantity() : 1);
            item.put("price",       i.getLineTotal() != null ? i.getLineTotal() : 0);
            item.put("drinkState",  i.getDrinkState() != null ? i.getDrinkState() : "");
            item.put("toppings",    i.getToppingsNote() != null ? i.getToppingsNote() : "");
            return item;
        }).collect(Collectors.toList());
        m.put("items", items);
        return m;
    }
}
