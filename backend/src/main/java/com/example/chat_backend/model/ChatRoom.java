package com.example.chat_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "chat_rooms", uniqueConstraints = {
        @UniqueConstraint(columnNames = "name")
})
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 30)
    private String name;

    @Size(max = 100)
    private String description;

    private Instant createdAt = Instant.now();

    public ChatRoom() {}

    public ChatRoom(Long id, String name, String description, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static ChatRoomBuilder builder() {
        return new ChatRoomBuilder();
    }

    public static class ChatRoomBuilder {
        private Long id;
        private String name;
        private String description;
        private Instant createdAt = Instant.now();

        ChatRoomBuilder() {}

        public ChatRoomBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ChatRoomBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ChatRoomBuilder description(String description) {
            this.description = description;
            return this;
        }

        public ChatRoomBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ChatRoom build() {
            return new ChatRoom(id, name, description, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
