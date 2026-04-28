package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    Optional<CafeTable> findByTableNumber(Integer tableNumber);
    List<CafeTable> findByStatus(String status);
}
