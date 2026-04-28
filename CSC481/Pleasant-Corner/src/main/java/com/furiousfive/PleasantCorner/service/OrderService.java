package com.furiousfive.PleasantCorner.service;

import com.furiousfive.PleasantCorner.model.Order;
import com.furiousfive.PleasantCorner.model.Payment;
import com.furiousfive.PleasantCorner.repository.OrderRepository;
import com.furiousfive.PleasantCorner.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository   orderRepository;
    private final PaymentRepository paymentRepository;

    /** Active orders: pending, preparing, ready */
    public List<Order> findActiveOrders() {
        return orderRepository.findByStatusIn(List.of("pending", "preparing", "ready"));
    }

    /** History: completed and cancelled */
    public List<Order> findOrderHistory() {
        return orderRepository.findByStatusNotInOrderByCreatedAtDesc(
                List.of("pending", "preparing", "ready"));
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional
    public Order updateStatus(Long id, String newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
        order.setStatus(newStatus);

        LocalDateTime now = LocalDateTime.now();

        if ("completed".equals(newStatus) || "cancelled".equals(newStatus)) {
            order.setCompletedAt(now);

            // Mark the linked payment as completed or failed
            paymentRepository.findByOrderId(id).ifPresent(payment -> {
                if ("completed".equals(newStatus)) {
                    payment.setStatus("completed");
                    payment.setCompletedAt(now);
                } else {
                    payment.setStatus("failed");
                    payment.setCompletedAt(now);
                }
                paymentRepository.save(payment);
            });
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order save(Order order) {
        return orderRepository.save(order);
    }
}

