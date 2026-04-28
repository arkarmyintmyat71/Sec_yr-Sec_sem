package com.furiousfive.PleasantCorner.dto;

import com.furiousfive.PleasantCorner.model.Order;
import lombok.Data;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Data
public class OrderSummaryDto {
    private Long id;
    private Integer queueNumber;
    private Integer tableNumber;
    private String status;
    private BigDecimal total;
    private String paymentMethod;
    private String itemsLabel;
    private String createdAt;

    public static OrderSummaryDto from(Order o) {
        OrderSummaryDto dto = new OrderSummaryDto();
        dto.setId(o.getId());
        dto.setQueueNumber(o.getQueueNumber());
        dto.setTableNumber(o.getTable() != null ? o.getTable().getTableNumber() : null);
        dto.setStatus(o.getStatus());
        dto.setTotal(o.getTotal());
        dto.setPaymentMethod(o.getPaymentMethod());
        dto.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        String label = o.getItems().stream()
            .map(i -> {
                String name = i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item";
                return (i.getQuantity() != null && i.getQuantity() > 1)
                    ? name + " \u00d7" + i.getQuantity()
                    : name;
            })
            .collect(Collectors.joining(", "));
        dto.setItemsLabel(label.isEmpty() ? "\u2014" : label);
        return dto;
    }
}
