package com.example.chat_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 120)
    @JsonIgnore
    private String password;

    @NotBlank
    @Size(max = 50)
    private String displayName;

    private String avatarColor;

    private Boolean isOnline = false;

    private Instant lastSeen = Instant.now();

    public User() {}

    public User(String username, String password, String displayName, String avatarColor) {
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.avatarColor = avatarColor;
        this.isOnline = false;
        this.lastSeen = Instant.now();
    }

    public User(Long id, String username, String password, String displayName, String avatarColor, Boolean isOnline, Instant lastSeen) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.avatarColor = avatarColor;
        this.isOnline = isOnline;
        this.lastSeen = lastSeen;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String username;
        private String password;
        private String displayName;
        private String avatarColor;
        private Boolean isOnline = false;
        private Instant lastSeen = Instant.now();

        UserBuilder() {}

        public UserBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }

        public UserBuilder avatarColor(String avatarColor) {
            this.avatarColor = avatarColor;
            return this;
        }

        public UserBuilder isOnline(Boolean isOnline) {
            this.isOnline = isOnline;
            return this;
        }

        public UserBuilder lastSeen(Instant lastSeen) {
            this.lastSeen = lastSeen;
            return this;
        }

        public User build() {
            return new User(id, username, password, displayName, avatarColor, isOnline, lastSeen);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarColor() { return avatarColor; }
    public void setAvatarColor(String avatarColor) { this.avatarColor = avatarColor; }

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
}
