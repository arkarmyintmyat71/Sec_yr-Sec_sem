package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.Topping;
import com.furiousfive.PleasantCorner.repository.ToppingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/toppings")
@RequiredArgsConstructor
public class ToppingApiController {

    private final ToppingRepository repo;

    @GetMapping
    public List<Topping> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<Topping> create(@RequestBody Topping item) {
        item.setId(null);
        return ResponseEntity.ok(repo.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Topping> update(@PathVariable Long id, @RequestBody Topping item) {
        item.setId(id);
        return ResponseEntity.ok(repo.save(item));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Topping> toggleStatus(@PathVariable Long id,
                                                 @RequestBody Map<String, String> body) {
        Topping t = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Topping not found: " + id));
        t.setStatus(body.getOrDefault("status", t.getStatus()));
        return ResponseEntity.ok(repo.save(t));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
