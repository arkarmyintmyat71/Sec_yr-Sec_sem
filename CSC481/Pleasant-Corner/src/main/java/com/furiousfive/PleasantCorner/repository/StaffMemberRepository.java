package com.furiousfive.PleasantCorner.repository;

import com.furiousfive.PleasantCorner.model.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
    Optional<StaffMember> findByEmailIgnoreCase(String email);
    List<StaffMember> findByStatus(String status);
}
