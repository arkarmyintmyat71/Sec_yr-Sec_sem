package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatusIn(List<String> statuses);

    List<Order> findByStatusNotInOrderByCreatedAtDesc(List<String> statuses);

    long countByStatus(String status);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByPaymentMethodAndCreatedAtBetween(String method, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status = 'completed'")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.paymentMethod = :method AND o.createdAt BETWEEN :from AND :to AND o.status = 'completed'")
    BigDecimal sumTotalByMethodBetween(@Param("method") String method, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Max queue number across all orders (for auto-increment) */
    @Query("SELECT COALESCE(MAX(o.queueNumber), 0) FROM Order o")
    Integer findMaxQueueNumber();

    /** All completed orders for today, newest first */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status = 'completed' ORDER BY o.createdAt DESC")
    List<Order> findCompletedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** All orders for a specific table that are not archived, newest first */
    @Query("SELECT o FROM Order o WHERE o.table.tableNumber = :tableNumber AND o.customerArchived = false ORDER BY o.createdAt DESC")
    List<Order> findByTableNumberOrderByCreatedAtDesc(@Param("tableNumber") int tableNumber);

    /** Archive all orders for a table (hide from customer view on next session) */
    @Query("UPDATE Order o SET o.customerArchived = true WHERE o.table.tableNumber = :tableNumber")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void archiveAllByTableNumber(@Param("tableNumber") int tableNumber);
}
