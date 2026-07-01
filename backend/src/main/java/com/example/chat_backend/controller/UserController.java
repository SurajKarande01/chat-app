package com.example.chat_backend.controller;

import com.example.chat_backend.model.User;
import com.example.chat_backend.repository.UserRepository;
import com.example.chat_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> usersDto = userRepository.findAll().stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usersDto);
    }

    @GetMapping("/online")
    public ResponseEntity<List<Map<String, Object>>> getOnlineUsers() {
        List<Map<String, Object>> usersDto = userService.getOnlineUsers().stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usersDto);
    }

    private Map<String, Object> toUserDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("username", user.getUsername());
        dto.put("displayName", user.getDisplayName());
        dto.put("avatarColor", user.getAvatarColor());
        dto.put("isOnline", user.getIsOnline());
        dto.put("lastSeen", user.getLastSeen());
        return dto;
    }
}
