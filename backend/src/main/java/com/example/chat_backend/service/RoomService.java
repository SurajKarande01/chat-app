package com.example.chat_backend.service;

import com.example.chat_backend.model.ChatRoom;
import com.example.chat_backend.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class RoomService {
    @Autowired
    private ChatRoomRepository chatRoomRepository;

    public List<ChatRoom> getAllRooms() {
        return chatRoomRepository.findAll();
    }

    public Optional<ChatRoom> getRoomById(Long id) {
        return chatRoomRepository.findById(id);
    }

    public Optional<ChatRoom> getRoomByName(String name) {
        return chatRoomRepository.findByName(name);
    }

    public ChatRoom createRoom(String name, String description) {
        if (chatRoomRepository.existsByName(name)) {
            throw new RuntimeException("Room name already exists");
        }
        ChatRoom chatRoom = ChatRoom.builder()
                .name(name)
                .description(description)
                .createdAt(Instant.now())
                .build();
        return chatRoomRepository.save(chatRoom);
    }
}
