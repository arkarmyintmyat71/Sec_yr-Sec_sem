package com.furiousFive.Cafe.Order.System.service.serviceImp;

import com.furiousFive.Cafe.Order.System.constant.Role;
import com.furiousFive.Cafe.Order.System.dto.request.LoginReqDto;
import com.furiousFive.Cafe.Order.System.dto.request.RegisterReqDto;
import com.furiousFive.Cafe.Order.System.model.User;
import com.furiousFive.Cafe.Order.System.repository.UserRepo;
import com.furiousFive.Cafe.Order.System.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class UserServiceImp implements UserService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User userRegistration(RegisterReqDto dto) {

        if (dto.getProve() == null) {
            dto.setProve(false);
        }

        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();

        user.setName(dto.getName());
        user.setDob(dto.getDob());
        user.setGender(dto.getGender());
        user.setExperience(dto.getExperience());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setAddress(dto.getAddress());

        // ✅ Business logic
        user.setRole(Role.WAITER); // default role
        user.setAge(calculateAge(dto.getDob()));
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setProve(dto.getProve());

        return userRepo.save(user);
    }

    @Override
    public User login(LoginReqDto dto) {
        User user = userRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getProve())) {
            throw new RuntimeException("Account not approved");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return user;
    }


    private int calculateAge(LocalDate dob) {
        if (dob == null) return 0;
        return Period.between(dob, LocalDate.now()).getYears();
    }
}
