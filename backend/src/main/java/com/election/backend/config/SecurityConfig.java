package com.election.backend.config;

import com.election.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService(UserRepository repo) {
        return username -> repo.findByUsernameIgnoreCase(username)
            .map(user -> User.withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().replace("ROLE_", ""))
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Crucial: Never store plain text!
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Disable CSRF for easier testing (optional, but often needed for API dev)
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                // 2. Allow Swagger UI and API Docs publicly
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // 3. Keep your other endpoints secured
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginProcessingUrl("/api/login") // 1. The URL we will POST to from React
                .successHandler((request, response, authentication) -> {
                    // 2. On success, return 200 OK (instead of redirecting to /home)
                    response.setStatus(HttpServletResponse.SC_OK);
                })
                .failureHandler((request, response, exception) -> {
                    // 3. On failure, return 401 Unauthorized (instead of redirecting to /login?error)
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                })
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/api/logout") // 4. The URL to logout
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                })
            )
            .exceptionHandling(e -> e
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );

        return http.build();
    }
}