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

    @GetMapping
    public ResponseEntity<List<ChatRoom>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@Valid @RequestBody RoomRequest roomRequest) {
        try {
            ChatRoom room = roomService.createRoom(roomRequest.getName(), roomRequest.getDescription());
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getRoomMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(messageService.getMessagesByRoom(roomId));
    }

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
