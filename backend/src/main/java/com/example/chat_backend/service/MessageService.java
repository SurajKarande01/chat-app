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

    @Transactional
    public Message saveMessage(String username, Long roomId, String content) {
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Sender user not found: " + username));
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + roomId));

        Message message = Message.builder()
                .content(content)
                .sender(sender)
                .room(room)
                .timestamp(Instant.now())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getMessagesByRoom(Long roomId) {
        return messageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }

    public Page<Message> getMessagesByRoom(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByRoomIdOrderByTimestampDesc(roomId, pageable);
    }
}
