package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.CafeTable;
import com.furiousfive.PleasantCorner.model.MenuItem;
import com.furiousfive.PleasantCorner.model.Order;
import com.furiousfive.PleasantCorner.model.Discount;
import com.furiousfive.PleasantCorner.model.Payment;
import com.furiousfive.PleasantCorner.repository.CafeTableRepository;
import com.furiousfive.PleasantCorner.repository.MenuItemRepository;
import com.furiousfive.PleasantCorner.repository.ToppingRepository;
import com.furiousfive.PleasantCorner.repository.DrinkStateRepository;
import com.furiousfive.PleasantCorner.repository.DiscountRepository;
import com.furiousfive.PleasantCorner.repository.PaymentRepository;
import com.furiousfive.PleasantCorner.repository.OrderRepository;
import com.furiousfive.PleasantCorner.service.CustomerOrderService;
import com.furiousfive.PleasantCorner.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class CustomerController {

    private final CafeTableRepository  cafeTableRepository;
    private final MenuItemRepository   menuItemRepository;
    private final ToppingRepository    toppingRepository;
    private final DrinkStateRepository drinkStateRepository;
    private final DiscountRepository   discountRepository;
    private final PaymentRepository    paymentRepository;
    private final OrderRepository      orderRepository;
    private final CustomerOrderService customerOrderService;
    private final OrderService         orderService;

    // ── Customer SPA — served when a table QR code is scanned ────────────────
    @GetMapping("/customer/table/{tableNumber}")
    public String customerView(@PathVariable int tableNumber, Model model) {

        CafeTable table = cafeTableRepository.findByTableNumber(tableNumber)
            .orElse(null);

        if (table == null || "inactive".equals(table != null ? table.getStatus() : null)) {
            model.addAttribute("error", "Table " + tableNumber + " not found or inactive.");
            return "customer/error";
        }

        // Available menu items only
        List<MenuItem> menuItems = menuItemRepository.findAll().stream()
            .filter(MenuItem::isAvailable)
            .collect(Collectors.toList());

        model.addAttribute("table",      table);
        model.addAttribute("menuItems",  menuItems);
        model.addAttribute("toppings",   toppingRepository.findAll().stream()
            .filter(t -> "available".equals(t.getStatus()))
            .collect(Collectors.toList()));
        model.addAttribute("drinkStates", drinkStateRepository.findAll());

        // Payment QR — from this table (or any table if shared)
        String paymentQr = table.getPaymentQrDataUrl();
        model.addAttribute("paymentQrDataUrl", paymentQr != null ? paymentQr : "");

        return "customer/index";
    }

    // ── Customer API ──────────────────────────────────────────────────────────

    /** POST /customer/api/orders — place an order from customer app */
    @PostMapping("/customer/api/orders")
    @ResponseBody
    public ResponseEntity<?> placeOrder(@RequestBody CustomerOrderRequest req) {
        try {
            Order order = customerOrderService.placeOrder(
                req.getTableNumber(),
                req.getPaymentMethod(),
                req.getDiscountCode(),
                req.getItems()
            );
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("orderId",     order.getId());
            resp.put("queueNumber", order.getQueueNumber());
            resp.put("status",      order.getStatus());
            resp.put("total",       order.getTotal());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /customer/api/orders/{id}/status — poll order status */
    @GetMapping("/customer/api/orders/{id}/status")
    @ResponseBody
    public ResponseEntity<?> getOrderStatus(@PathVariable Long id) {
        return orderService.findById(id)
            .map(o -> ResponseEntity.ok(Map.of(
                "orderId",     o.getId(),
                "queueNumber", o.getQueueNumber(),
                "status",      o.getStatus(),
                "total",       o.getTotal()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /customer/api/orders/table/{tableNumber} — all orders for this table, newest first */
    @GetMapping("/customer/api/orders/table/{tableNumber}")
    @ResponseBody
    public ResponseEntity<?> getTableOrders(@PathVariable int tableNumber) {
        var orders = orderRepository.findByTableNumberOrderByCreatedAtDesc(tableNumber);
        var result = orders.stream().map(o -> {
            var map = new java.util.LinkedHashMap<String, Object>();
            map.put("orderId",        o.getId());
            map.put("queueNumber",    o.getQueueNumber());
            map.put("status",         o.getStatus());
            map.put("total",          o.getTotal());
            map.put("paymentMethod",  o.getPaymentMethod());
            map.put("discountCode",   o.getDiscountCode());
            map.put("discountAmount", o.getDiscountAmount());
            map.put("createdAt",      o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
            var items = o.getItems().stream().map(i -> {
                var im = new java.util.LinkedHashMap<String, Object>();
                im.put("name",        i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item");
                im.put("qty",         i.getQuantity());
                im.put("lineTotal",   i.getLineTotal());
                im.put("drinkState",  i.getDrinkState());
                im.put("toppings",    i.getToppingsNote());
                return im;
            }).collect(java.util.stream.Collectors.toList());
            map.put("items", items);
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** PATCH /customer/api/tables/{tableNumber}/occupy — mark table as occupied */
    @PatchMapping("/customer/api/tables/{tableNumber}/occupy")
    @ResponseBody
    public ResponseEntity<?> occupyTable(@PathVariable int tableNumber) {
        return cafeTableRepository.findByTableNumber(tableNumber)
            .map(t -> { t.setOccupied(true); cafeTableRepository.save(t);
                return ResponseEntity.ok(Map.of("occupied", true, "tableNumber", tableNumber)); })
            .orElse(ResponseEntity.notFound().build());
    }

    /** PATCH /customer/api/tables/{tableNumber}/release — release table (checkout done) */
    @PatchMapping("/customer/api/tables/{tableNumber}/release")
    @ResponseBody
    public ResponseEntity<?> releaseTable(@PathVariable int tableNumber) {
        return cafeTableRepository.findByTableNumber(tableNumber)
            .map(t -> {
                t.setOccupied(false);
                cafeTableRepository.save(t);
                // Archive all orders for this table so next customer sees clean history
                orderRepository.archiveAllByTableNumber(tableNumber);
                return ResponseEntity.ok(Map.of("occupied", false, "tableNumber", tableNumber, "historyCleared", true));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /customer/api/tables/{tableNumber}/status — check if table is occupied */
    @GetMapping("/customer/api/tables/{tableNumber}/status")
    @ResponseBody
    public ResponseEntity<?> tableStatus(@PathVariable int tableNumber) {
        return cafeTableRepository.findByTableNumber(tableNumber)
            .map(t -> ResponseEntity.ok(Map.of(
                "tableNumber", tableNumber,
                "occupied",    t.isOccupied(),
                "status",      t.getStatus())))
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /customer/api/discounts/active — returns all active discounts (for auto-apply + display) */
    @GetMapping("/customer/api/discounts/active")
    @ResponseBody
    public ResponseEntity<?> getActiveDiscounts() {
        var discounts = discountRepository.findByStatus("active").stream().map(d -> {
            var map = new java.util.LinkedHashMap<String, Object>();
            map.put("code",         d.getCode());
            map.put("name",         d.getName() != null ? d.getName() : d.getCode());
            map.put("discountType", d.getDiscountType());
            map.put("value",        d.getValue());
            map.put("autoApply",    d.isAutoApply());
            map.put("description",  d.getDescription());
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(discounts);
    }
    /** GET /customer/api/discount?code=SUMMER10 — validates a discount code */
    @GetMapping("/customer/api/discount")
    @ResponseBody
    public ResponseEntity<?> validateDiscount(@RequestParam String code) {
        return discountRepository.findByCodeIgnoreCase(code)
            .filter(d -> "active".equals(d.getStatus()))
            .map(d -> ResponseEntity.ok(Map.of(
                "code",         d.getCode(),
                "name",         d.getName() != null ? d.getName() : d.getCode(),
                "discountType", d.getDiscountType(),
                "value",        d.getValue()
            )))
            .orElse(ResponseEntity.badRequest().body(
                Map.of("error", "Code not found or expired")));
    }

    // ── Payment Confirmation (customer taps "Done" on QR screen) ─────────────
    /**
     * PATCH /customer/api/payments/{orderId}/confirm
     * Customer optionally supplies a reference_no (bank transfer ref).
     * Sets payment status → "completed" so admin can see it.
     */
    @PatchMapping("/customer/api/payments/{orderId}/confirm")
    @ResponseBody
    public ResponseEntity<?> confirmPayment(@PathVariable Long orderId,
                                             @RequestBody(required = false) Map<String, String> body) {
        return paymentRepository.findByOrderId(orderId)
            .map(payment -> {
                payment.setStatus("completed");
                payment.setCompletedAt(java.time.LocalDateTime.now());
                if (body != null && body.get("referenceNo") != null) {
                    payment.setReferenceNo(body.get("referenceNo"));
                }
                paymentRepository.save(payment);
                return ResponseEntity.ok(Map.of("confirmed", true, "orderId", orderId));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Request DTO ───────────────────────────────────────────────────────────
    @lombok.Data
    public static class CustomerOrderRequest {
        private Integer tableNumber;
        private String  paymentMethod;
        private String  discountCode;
        private List<CustomerOrderService.OrderItemRequest> items;
    }
}
