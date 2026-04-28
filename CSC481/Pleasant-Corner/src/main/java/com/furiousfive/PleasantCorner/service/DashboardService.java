package com.furiousfive.PleasantCorner.service;

import com.furiousfive.PleasantCorner.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;

    public long countActiveOrders() {
        return orderRepository.findByStatusIn(List.of("pending", "preparing", "ready")).size();
    }

    public long countTodayOrders() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return orderRepository.countByCreatedAtBetween(start, start.plusDays(1));
    }

    public BigDecimal todayRevenue() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return orderRepository.sumTotalBetween(start, start.plusDays(1));
    }

    public BigDecimal todayCashRevenue() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return orderRepository.sumTotalByMethodBetween("Cash", start, start.plusDays(1));
    }

    public BigDecimal todayQrRevenue() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return orderRepository.sumTotalByMethodBetween("QR", start, start.plusDays(1));
    }

    public long countTodayByMethod(String method) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return orderRepository.countByPaymentMethodAndCreatedAtBetween(method, start, start.plusDays(1));
    }
}
