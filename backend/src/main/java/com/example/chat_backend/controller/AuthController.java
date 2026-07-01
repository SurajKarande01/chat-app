package com.example.chat_backend.controller;

import com.example.chat_backend.model.User;
import com.example.chat_backend.repository.UserRepository;
import com.example.chat_backend.security.JwtUtils;
import com.example.chat_backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    // A list of pre-defined avatar theme color classes used on the frontend.
    private static final String[] AVATAR_COLORS = {
            "indigo-500", "pink-500", "emerald-500", "amber-500", 
            "cyan-500", "violet-500", "rose-500", "teal-500"
    };

    /**
     * Authenticates a user trying to log into the application.
     * It runs their credentials through Spring Security's auth provider,
     * stores the context, and returns a freshly signed JWT token alongside basic profile info.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // Authenticate the user using the submitted username and password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // Set the authentication inside Spring's security context
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Generate the token to be sent back to the client
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        // Extract details of the authenticated principal
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Respond with the auth payload including display metadata
        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getDisplayName(), 
                                                 userDetails.getAvatarColor()));
    }

    /**
     * Registers a new user account.
     * It verifies username availability, assigns a random avatar color if none was selected,
     * hashes their password for security, and commits the record to the database.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // Check if the username is already taken by another account
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error: Username is already taken!");
            return ResponseEntity.badRequest().body(response);
        }

        // Assign a random avatar style color if the user didn't specify one
        String avatarColor = signUpRequest.getAvatarColor();
        if (avatarColor == null || avatarColor.isEmpty()) {
            int idx = new Random().nextInt(AVATAR_COLORS.length);
            avatarColor = AVATAR_COLORS[idx];
        }

        // Build the new User record and hash their password using BCrypt
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .password(encoder.encode(signUpRequest.getPassword()))
                .displayName(signUpRequest.getDisplayName())
                .avatarColor(avatarColor)
                .isOnline(false)
                .build();

        // Save the new user record to the repository
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully!");
        return ResponseEntity.ok(response);
    }

    /**
     * Fetches details of the currently logged-in user session.
     * This is useful on frontend app mounts to restore active login states.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Return 401 if there is no active security context principal
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        // Retrieve the current user record from the DB
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // Return a safe map containing profile details without sensitive passwords
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("avatarColor", user.getAvatarColor());
        response.put("isOnline", user.getIsOnline());
        
        return ResponseEntity.ok(response);
    }
}
