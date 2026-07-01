package com.example.chat_backend.controller;

import com.example.chat_backend.model.ChatRoom;
import com.example.chat_backend.model.Message;
import com.example.chat_backend.service.MessageService;
import com.example.chat_backend.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    
    @Autowired
    private RoomService roomService;

    @Autowired
    private MessageService messageService;

    /**
     * Retrieves all chat rooms/channels configured in the application.
     * This is used by the frontend sidebar to populate the channels list.
     */
    @GetMapping
    public ResponseEntity<List<ChatRoom>> getAllRooms() {
        // Return the list of all available rooms with a 200 OK status
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    /**
     * Creates a new chat room channel.
     * It parses room details from the request payload and saves it to the database.
     * Returns the created room details or a 400 Bad Request error if creation fails.
     */
    @PostMapping
    public ResponseEntity<?> createRoom(@Valid @RequestBody RoomRequest roomRequest) {
        try {
            // Attempt to create a new room with a unique name
            ChatRoom room = roomService.createRoom(roomRequest.getName(), roomRequest.getDescription());
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            // Return validation or duplication errors to the client
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Retrieves the complete message history for a specified chat room.
     * Messages are returned in ascending chronological order so the frontend can draw the log correctly.
     */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getRoomMessages(@PathVariable Long roomId) {
        // Return the list of messages mapped to the specified room ID
        return ResponseEntity.ok(messageService.getMessagesByRoom(roomId));
    }

    // Input request wrapper payload mapping for creating a channel.
    public static class RoomRequest {
        @NotBlank
        private String name;
        private String description;

        public RoomRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
