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

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getOnlineUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    @Transactional
    public User setUserOnlineStatus(String username, boolean isOnline) {
        return userRepository.findByUsername(username).map(user -> {
            user.setIsOnline(isOnline);
            user.setLastSeen(Instant.now());
            return userRepository.save(user);
        }).orElse(null);
    }
}
