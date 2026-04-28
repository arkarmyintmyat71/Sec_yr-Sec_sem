package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.Discount;
import com.furiousfive.PleasantCorner.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountApiController {

    private final DiscountRepository repo;

    @GetMapping
    public List<Discount> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<Discount> create(@RequestBody Discount item) {
        item.setId(null);
        return ResponseEntity.ok(repo.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Discount> update(@PathVariable Long id, @RequestBody Discount item) {
        item.setId(id);
        return ResponseEntity.ok(repo.save(item));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Discount> patchStatus(@PathVariable Long id,
                                                  @RequestBody Map<String, String> body) {
        Discount d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Discount not found: " + id));
        if (body.containsKey("status"))    d.setStatus(body.get("status"));
        if (body.containsKey("autoApply")) d.setAutoApply("true".equals(body.get("autoApply")));
        return ResponseEntity.ok(repo.save(d));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
