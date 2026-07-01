package com.example.chat_backend.controller;

import com.example.chat_backend.model.Message;
import com.example.chat_backend.model.User;
import com.example.chat_backend.repository.UserRepository;
import com.example.chat_backend.service.MessageService;
import com.example.chat_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Receives incoming messages sent to a specific chat room via WebSockets STOMP client.
     * It parses the sender from the authenticated principal, persists the message in the DB,
     * and broadcasts it to all subscribers listening to that room.
     */
    @MessageMapping("/chat/{roomId}")
    public void handleMessage(@DestinationVariable Long roomId, ChatMessagePayload payload, Principal principal) {
        // Discard message if the WebSocket connection is unauthenticated
        if (principal == null) {
            return;
        }
        
        // Extract the sender's username from the principal
        String username = principal.getName();
        
        // Save the incoming message through our transactional database service
        Message message = messageService.saveMessage(username, roomId, payload.getContent());
        
        // Broadcast the saved message with its database ID and sender details to the room topic
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    /**
     * Listens for WebSocket session connection events.
     * When a user successfully connects, it sets their online status to true
     * and broadcasts a global presence alert so other users' sidebars update instantly.
     */
    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        // Wrap the raw connection message to read STOMP header parameters
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        
        if (principal != null) {
            String username = principal.getName();
            
            // Set the user's presence state to online
            User user = userService.setUserOnlineStatus(username, true);
            if (user != null) {
                // Construct a message payload notifying clients about the presence update
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("username", username);
                presenceUpdate.put("displayName", user.getDisplayName());
                presenceUpdate.put("isOnline", true);
                presenceUpdate.put("avatarColor", user.getAvatarColor());
                
                // Broadcast presence update globally
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
            }
        }
    }

    /**
     * Listens for WebSocket session disconnection events.
     * When a connection drops or closes, it sets the user's status to offline
     * and broadcasts a global presence update to let others know they left.
     */
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        // Wrap the raw disconnection message to read STOMP headers
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        
        if (principal != null) {
            String username = principal.getName();
            
            // Update the database online flag to false
            User user = userService.setUserOnlineStatus(username, false);
            if (user != null) {
                // Construct a message payload notifying clients about the offline state
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("username", username);
                presenceUpdate.put("displayName", user.getDisplayName());
                presenceUpdate.put("isOnline", false);
                presenceUpdate.put("avatarColor", user.getAvatarColor());
                
                // Send presence state to all connected STOMP clients
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
            }
        }
    }

    // A simple payload structure to map the incoming JSON message body.
    public static class ChatMessagePayload {
        private String content;

        public ChatMessagePayload() {}

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
