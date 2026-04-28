package com.furiousfive.PleasantCorner.dto;

import com.furiousfive.PleasantCorner.model.Order;
import lombok.Data;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Data
public class PaymentTransactionDto {

    private Long id;
    private String queue;
    private String tableNo;
    private String itemsLabel;
    private BigDecimal total;
    private String paymentMethod;
    private String time;       // HH:mm
    private String status;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public static PaymentTransactionDto from(Order o) {
        PaymentTransactionDto dto = new PaymentTransactionDto();
        dto.setId(o.getId());
        dto.setQueue("#" + String.format("%03d", o.getQueueNumber()));
        dto.setTableNo(o.getTable() != null ? "Table " + o.getTable().getTableNumber() : "Takeaway");
        dto.setTotal(o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO);
        dto.setPaymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod() : "—");
        dto.setTime(o.getCompletedAt() != null
                ? o.getCompletedAt().format(TIME_FMT)
                : (o.getCreatedAt() != null ? o.getCreatedAt().format(TIME_FMT) : "—"));
        dto.setStatus(o.getStatus());

        String label = o.getItems().stream()
            .map(i -> {
                String name = i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item";
                return (i.getQuantity() != null && i.getQuantity() > 1)
                    ? name + " ×" + i.getQuantity() : name;
            })
            .collect(Collectors.joining(", "));
        dto.setItemsLabel(label.isEmpty() ? "—" : label);
        return dto;
    }
}
