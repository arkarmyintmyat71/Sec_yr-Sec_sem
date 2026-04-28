package com.furiousfive.PleasantCorner.dto;

import com.furiousfive.PleasantCorner.model.Order;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Flat DTO passed to kitchen.js via th:inline="javascript".
 * Matches exactly the shape that kitchen.js expects for each ticket.
 */
@Data
public class KitchenTicketDto {

    private Long   id;
    private String table;
    private String queue;
    private String status;
    private boolean urgent;
    private long   elapsedSec;
    private List<KitchenItemDto> items;

    @Data
    public static class KitchenItemDto {
        private int    qty;
        private String name;
        private String mods;
    }

    public static KitchenTicketDto from(Order o) {
        KitchenTicketDto dto = new KitchenTicketDto();
        dto.setId(o.getId());
        dto.setTable(o.getTable() != null ? "Table " + o.getTable().getTableNumber() : "Takeaway");
        dto.setQueue("Q#" + String.format("%03d", o.getQueueNumber()));
        dto.setStatus(o.getStatus());

        // elapsed seconds since order was created
        long elapsed = o.getCreatedAt() != null
            ? Duration.between(o.getCreatedAt(), LocalDateTime.now()).getSeconds()
            : 0;
        dto.setElapsedSec(Math.max(0, elapsed));

        // urgent = preparing for more than 10 minutes
        dto.setUrgent("preparing".equals(o.getStatus()) && elapsed >= 600);

        // map order items → kitchen item lines
        List<KitchenItemDto> items = o.getItems().stream().map(i -> {
            KitchenItemDto item = new KitchenItemDto();
            item.setQty(i.getQuantity() != null ? i.getQuantity() : 1);
            item.setName(i.getMenuItem() != null ? i.getMenuItem().getItemName() : "Item");

            // build mods string from drinkState + toppingsNote
            StringBuilder mods = new StringBuilder();
            if (i.getDrinkState() != null && !i.getDrinkState().isBlank())
                mods.append(i.getDrinkState());
            if (i.getToppingsNote() != null && !i.getToppingsNote().isBlank()) {
                if (mods.length() > 0) mods.append(" · ");
                mods.append("+ ").append(i.getToppingsNote());
            }
            item.setMods(mods.toString());
            return item;
        }).collect(Collectors.toList());

        dto.setItems(items);
        return dto;
    }
}
