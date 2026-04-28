package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.DrinkState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DrinkStateRepository extends JpaRepository<DrinkState, Long> {
    Optional<DrinkState> findByDefaultStateTrue();
}
