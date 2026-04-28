package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.enums.Category;
import com.furiousfive.PleasantCorner.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategory(Category category);
    //List<MenuItem> findByStatus(String status);
    List<MenuItem> findByItemNameContainingIgnoreCase(String keyword);
}
