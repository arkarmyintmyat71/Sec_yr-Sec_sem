package com.furiousfive.PleasantCorner.service;

import com.furiousfive.PleasantCorner.model.StaffMember;
import com.furiousfive.PleasantCorner.repository.StaffMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffMemberService {

    private final StaffMemberRepository staffMemberRepository;

    public List<StaffMember> findAll() {
        return staffMemberRepository.findAll();
    }

    public List<StaffMember> findByStatus(String status) {
        return staffMemberRepository.findByStatus(status);
    }

    public StaffMember findById(Long id) {
        return staffMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + id));
    }

    @Transactional
    public StaffMember save(StaffMember member) {
        member.setStatus("pending");
        return staffMemberRepository.save(member);
    }

    @Transactional
    public void updateStaff(StaffMember formStaff) {

        StaffMember staff = staffMemberRepository.findById(formStaff.getId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // Update only allowed fields
        staff.setFullName(formStaff.getFullName());
        staff.setEmail(formStaff.getEmail());
        staff.setPhone(formStaff.getPhone());
        staff.setRole(formStaff.getRole());
        staff.setAvailability(formStaff.getAvailability());
        staff.setMonthlySalary(formStaff.getMonthlySalary());
        staff.setRegisteredDate(formStaff.getRegisteredDate());
        staff.setExperience(formStaff.getExperience());
        staff.setNotes(formStaff.getNotes());

        staffMemberRepository.save(staff);
    }
    @Transactional
    public void updateStatus(Long id, String status, String notes) {
        StaffMember staff = staffMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        staff.setStatus(status);

        if ("rejected".equals(status)) {
            staff.setNotes(notes);
        } else {
            staff.setNotes(null);
        }

        staffMemberRepository.save(staff);
    }

    @Transactional
    public void deleteById(Long id) {
        staffMemberRepository.deleteById(id);
    }
}
