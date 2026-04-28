package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.Topping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToppingRepository extends JpaRepository<Topping, Long> {
    List<Topping> findByStatus(String status);
}
