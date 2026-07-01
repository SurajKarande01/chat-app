package com.example.chat_backend.repository;

import com.example.chat_backend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomIdOrderByTimestampAsc(Long roomId);
    Page<Message> findByRoomIdOrderByTimestampDesc(Long roomId, Pageable pageable);
}
