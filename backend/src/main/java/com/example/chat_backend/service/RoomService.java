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

    /**
     * Retrieves all chat channels configured in the database.
     */
    public List<ChatRoom> getAllRooms() {
        return chatRoomRepository.findAll();
    }

    /**
     * Fetches a specific room record using its database ID.
     */
    public Optional<ChatRoom> getRoomById(Long id) {
        return chatRoomRepository.findById(id);
    }

    /**
     * Fetches a specific room record using its unique channel name.
     */
    public Optional<ChatRoom> getRoomByName(String name) {
        return chatRoomRepository.findByName(name);
    }

    /**
     * Creates a new chat room channel in the system.
     * Throws a RuntimeException if a room with the exact name already exists.
     */
    public ChatRoom createRoom(String name, String description) {
        // Enforce name uniqueness across rooms
        if (chatRoomRepository.existsByName(name)) {
            throw new RuntimeException("Room name already exists");
        }
        
        // Build the new Room record using builder pattern
        ChatRoom chatRoom = ChatRoom.builder()
                .name(name)
                .description(description)
                .createdAt(Instant.now())
                .build();
                
        // Save and return the persisted entity
        return chatRoomRepository.save(chatRoom);
    }
}
