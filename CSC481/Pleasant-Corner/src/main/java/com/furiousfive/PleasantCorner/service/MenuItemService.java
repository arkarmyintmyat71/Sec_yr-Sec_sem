package com.furiousfive.PleasantCorner.service;

import com.furiousfive.PleasantCorner.enums.Category;
import com.furiousfive.PleasantCorner.model.MenuItem;
import com.furiousfive.PleasantCorner.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;

    public List<MenuItem> findAll() {
        return menuItemRepository.findAll();
    }

    public List<MenuItem> findByCategory(Category category) {
        return menuItemRepository.findByCategory(category);
    }

    public List<MenuItem> search(String keyword) {
        return menuItemRepository.findByItemNameContainingIgnoreCase(keyword);
    }

    public Optional<MenuItem> findById(Long id) {
        return menuItemRepository.findById(id);
    }

    @Transactional
    public MenuItem save(MenuItem item) {
        return menuItemRepository.save(item);
    }

    @Transactional
    public void deleteById(Long id) {
        menuItemRepository.deleteById(id);
    }
}
