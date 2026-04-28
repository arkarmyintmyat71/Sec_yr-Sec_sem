package com.furiousfive.PleasantCorner.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/", "/login").permitAll()
                        // Customer routes must be permitted BEFORE the /api/** admin rule
                        // because /customer/api/** would otherwise match /api/** first
                        .requestMatchers("/customer/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").hasRole("ADMIN")
                        .requestMatchers("/kitchen/**").hasAnyRole("KITCHEN", "ADMIN")
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .successHandler(roleBasedSuccessHandler())   // role-based redirect
                        .failureUrl("/login?error=true")
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/admin/**", "/api/**", "/kitchen/api/**", "/customer/api/**")
                )
                .build();
    }

    /**
     * After login, redirect ADMIN → /admin/dashboard, KITCHEN → /kitchen/kds.
     */
    @Bean
    AuthenticationSuccessHandler roleBasedSuccessHandler() {
        return (HttpServletRequest req, HttpServletResponse res, Authentication auth) -> {
            boolean isKitchen = auth.getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_KITCHEN"));
            boolean isAdmin = auth.getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

            if (isAdmin) {
                res.sendRedirect("/admin/dashboard");
            } else if (isKitchen) {
                res.sendRedirect("/kitchen/kds");
            } else {
                res.sendRedirect("/");
            }
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {

        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("admin123"))
            .roles("ADMIN")
            .build();

        UserDetails kitchen = User.builder()
            .username("kitchen")
            .password(passwordEncoder.encode("kitchen123"))
            .roles("KITCHEN")
            .build();

        return new InMemoryUserDetailsManager(admin, kitchen);
    }
}
