package com.example.chat_backend.config;

import com.example.chat_backend.model.ChatRoom;
import com.example.chat_backend.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Override
    public void run(String... args) throws Exception {
        if (chatRoomRepository.count() == 0) {
            List<ChatRoom> defaultRooms = Arrays.asList(
                    ChatRoom.builder()
                            .name("General Lounge")
                            .description("General chat for everyone! Introduce yourself.")
                            .createdAt(Instant.now())
                            .build(),
                    ChatRoom.builder()
                            .name("Tech & Devs")
                            .description("Chat about Java, Spring Boot, React, and general software development.")
                            .createdAt(Instant.now())
                            .build(),
                    ChatRoom.builder()
                            .name("Random Chat")
                            .description("Memes, off-topic discussions, and fun stuff.")
                            .createdAt(Instant.now())
                            .build()
            );
            chatRoomRepository.saveAll(defaultRooms);
            System.out.println("Default chat rooms successfully initialized.");
        }
    }
}
