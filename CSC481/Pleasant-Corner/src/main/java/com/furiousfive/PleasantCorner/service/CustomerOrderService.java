package com.furiousfive.PleasantCorner.service;

import com.furiousfive.PleasantCorner.model.*;
import com.furiousfive.PleasantCorner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final OrderRepository      orderRepository;
    private final MenuItemRepository   menuItemRepository;
    private final CafeTableRepository  cafeTableRepository;
    private final DiscountRepository   discountRepository;
    private final PaymentRepository    paymentRepository;

    /**
     * Places a new order and creates a matching Payment record.
     * Applies discount code if provided and valid.
     */
    @Transactional
    public Order placeOrder(Integer tableNumber, String paymentMethod,
                            String discountCode, List<OrderItemRequest> items) {

        CafeTable table = cafeTableRepository.findByTableNumber(tableNumber)
            .orElseThrow(() -> new IllegalArgumentException("Table not found: " + tableNumber));

        Integer maxQueue = orderRepository.findMaxQueueNumber();
        int nextQueue = (maxQueue != null ? maxQueue : 0) + 1;

        Order order = Order.builder()
            .queueNumber(nextQueue)
            .table(table)
            .status("pending")
            .paymentMethod(paymentMethod)
            .build();

        // Build order items and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest req : items) {
            MenuItem menuItem = menuItemRepository.findById(req.getMenuItemId())
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + req.getMenuItemId()));

            BigDecimal lineTotal = menuItem.getPrice()
                .multiply(BigDecimal.valueOf(req.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem item = OrderItem.builder()
                .order(order)
                .menuItem(menuItem)
                .quantity(req.getQuantity())
                .drinkState(req.getDrinkState())
                .toppingsNote(req.getToppingsNote())
                .lineTotal(lineTotal)
                .build();
            order.getItems().add(item);
        }

        // Apply discount — check manual code first, then auto-apply
        BigDecimal discount     = BigDecimal.ZERO;
        String     appliedCode  = null;
        if (discountCode != null && !discountCode.isBlank()) {
            // Manual code
            var discOpt = discountRepository.findByCodeIgnoreCase(discountCode)
                .filter(d -> "active".equals(d.getStatus()));
            if (discOpt.isPresent()) {
                discount    = calculateDiscount(discOpt.get(), subtotal, order.getItems());
                appliedCode = discOpt.get().getCode();
            }
        } else {
            // Auto-apply: use the first active auto-apply discount
            var autoDiscounts = discountRepository.findByStatusAndAutoApplyTrue("active");
            if (!autoDiscounts.isEmpty()) {
                var autoDisc = autoDiscounts.get(0);
                discount    = calculateDiscount(autoDisc, subtotal, order.getItems());
                appliedCode = autoDisc.getCode();
            }
        }

        BigDecimal finalTotal = subtotal.subtract(discount).max(BigDecimal.ZERO);
        order.setTotal(finalTotal);
        order.setDiscountCode(appliedCode);
        order.setDiscountAmount(discount);
        Order saved = orderRepository.save(order);

        // ── Create the Payment record ────────────────────────────────────────
        // Cash: pending until staff confirms collection.
        // QR:   pending until QR transfer is confirmed.
        Payment payment = Payment.builder()
            .order(saved)
            .amount(finalTotal)
            .method(paymentMethod)
            .status("pending")
            .note(appliedCode != null ? "Discount applied: " + appliedCode : null)
            .build();
        paymentRepository.save(payment);

        return saved;
    }

    private BigDecimal calculateDiscount(Discount d, BigDecimal subtotal, List<OrderItem> items) {
        if ("percent".equals(d.getDiscountType())) {
            return subtotal.multiply(d.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if ("fixed".equals(d.getDiscountType())) {
            return d.getValue().min(subtotal);
        } else if ("bogo".equals(d.getDiscountType())) {
            return items.stream()
                .map(i -> i.getMenuItem().getPrice())
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        }
        return BigDecimal.ZERO;
    }

    /** DTO for each item in the order request */
    @lombok.Data
    public static class OrderItemRequest {
        private Long   menuItemId;
        private int    quantity;
        private String drinkState;
        private String toppingsNote;
    }
}

