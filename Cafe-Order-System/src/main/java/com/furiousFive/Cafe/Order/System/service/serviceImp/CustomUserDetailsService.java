package com.furiousFive.Cafe.Order.System.service.serviceImp;

import com.furiousFive.Cafe.Order.System.model.User;
import com.furiousFive.Cafe.Order.System.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepo.findByEmailAndProveTrue(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Account not approved or email not found"
                        )
                );

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name()) // ADMIN, KITCHEN, WAITER
                .build();
    }
}


