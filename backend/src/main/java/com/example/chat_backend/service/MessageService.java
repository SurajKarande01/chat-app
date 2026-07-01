package com.example.chat_backend.service;

import com.example.chat_backend.model.ChatRoom;
import com.example.chat_backend.model.Message;
import com.example.chat_backend.model.User;
import com.example.chat_backend.repository.ChatRoomRepository;
import com.example.chat_backend.repository.MessageRepository;
import com.example.chat_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    /**
     * Saves a new text message.
     * It maps the message sender and room, sets the timestamp to now,
     * and persists the record. This runs transactionally.
     */
    @Transactional
    public Message saveMessage(String username, Long roomId, String content) {
        // Resolve sender user
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Sender user not found: " + username));
                
        // Resolve destination chat room
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + roomId));

        // Create the message model with builder pattern
        Message message = Message.builder()
                .content(content)
                .sender(sender)
                .room(room)
                .timestamp(Instant.now())
                .build();

        // Persist the message in database
        return messageRepository.save(message);
    }

    /**
     * Fetches all messages mapped to a specific chat room ID.
     * Results are ordered chronologically (oldest to newest) to display context logically.
     */
    public List<Message> getMessagesByRoom(Long roomId) {
        return messageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }

    /**
     * Fetches a paginated slice of messages mapped to a specific room.
     * Results are sorted newest to oldest for paging convenience.
     */
    public Page<Message> getMessagesByRoom(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByRoomIdOrderByTimestampDesc(roomId, pageable);
    }
}
