package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.model.DrinkState;
import com.furiousfive.PleasantCorner.repository.DrinkStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drink-states")
@RequiredArgsConstructor
public class DrinkStateApiController {

    private final DrinkStateRepository repo;

    @GetMapping
    public List<DrinkState> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<DrinkState> create(@RequestBody DrinkState item) {
        item.setId(null);
        return ResponseEntity.ok(repo.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DrinkState> update(@PathVariable Long id, @RequestBody DrinkState item) {
        item.setId(id);
        return ResponseEntity.ok(repo.save(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
