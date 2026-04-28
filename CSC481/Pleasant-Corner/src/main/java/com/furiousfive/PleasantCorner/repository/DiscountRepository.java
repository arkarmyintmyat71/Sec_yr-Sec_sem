package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    Optional<Discount> findByCodeIgnoreCase(String code);
    List<Discount> findByStatus(String status);

    /** Active discounts that are auto-applied without needing a code */
    List<Discount> findByStatusAndAutoApplyTrue(String status);
}
