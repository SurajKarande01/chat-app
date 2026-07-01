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

    @MessageMapping("/chat/{roomId}")
    public void handleMessage(@DestinationVariable Long roomId, ChatMessagePayload payload, Principal principal) {
        if (principal == null) {
            return;
        }
        
        String username = principal.getName();
        Message message = messageService.saveMessage(username, roomId, payload.getContent());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        
        if (principal != null) {
            String username = principal.getName();
            User user = userService.setUserOnlineStatus(username, true);
            if (user != null) {
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("username", username);
                presenceUpdate.put("displayName", user.getDisplayName());
                presenceUpdate.put("isOnline", true);
                presenceUpdate.put("avatarColor", user.getAvatarColor());
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
            }
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        
        if (principal != null) {
            String username = principal.getName();
            User user = userService.setUserOnlineStatus(username, false);
            if (user != null) {
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("username", username);
                presenceUpdate.put("displayName", user.getDisplayName());
                presenceUpdate.put("isOnline", false);
                presenceUpdate.put("avatarColor", user.getAvatarColor());
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
            }
        }
    }

    public static class ChatMessagePayload {
        private String content;

        public ChatMessagePayload() {}

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
