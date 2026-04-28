package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.MenuItem;
import com.furiousfive.PleasantCorner.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemApiController {

    private final MenuItemService service;

    @GetMapping
    public List<MenuItem> getAll() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<MenuItem> create(@RequestBody MenuItem item) {
        return ResponseEntity.ok(service.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> update(@PathVariable Long id, @RequestBody MenuItem item) {
        item.setId(id);
        return ResponseEntity.ok(service.save(item));
    }

    @PatchMapping("/{id}/available")
    public ResponseEntity<?> toggleAvailable(@PathVariable Long id,
                                              @RequestBody Map<String, Boolean> body) {
        MenuItem item = service.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("MenuItem not found: " + id));
        item.setAvailable(body.getOrDefault("available", item.isAvailable()));
        return ResponseEntity.ok(service.save(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
