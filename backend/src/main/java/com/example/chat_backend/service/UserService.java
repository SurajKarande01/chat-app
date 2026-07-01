package com.example.chat_backend.service;

import com.example.chat_backend.model.User;
import com.example.chat_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    /**
     * Finds a user record in the database using their unique username.
     * Returns an Optional wrapper to handle null values safely.
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Retrieves all user records whose presence status flag is set to true.
     */
    public List<User> getOnlineUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    /**
     * Updates a user's presence state (online vs offline) and updates their last-seen timestamp.
     * This method runs inside a transactional context to ensure database consistency.
     */
    @Transactional
    public User setUserOnlineStatus(String username, boolean isOnline) {
        return userRepository.findByUsername(username).map(user -> {
            // Update online status flag
            user.setIsOnline(isOnline);
            // Set last seen timestamp to current timestamp
            user.setLastSeen(Instant.now());
            // Save modified record
            return userRepository.save(user);
        }).orElse(null);
    }
}
