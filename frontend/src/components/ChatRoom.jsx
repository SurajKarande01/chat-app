import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// This is the main workspace screen where users can select channels, view member presence, and send/receive messages in real time.
export default function ChatRoom() {
  const { user, logout } = useAuth();
  
  // Local state management for room records, active room, message stream, users presence, connection state, and modals.
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  
  // Add Room Form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [roomError, setRoomError] = useState('');

  // Refs for tracking active connection client, channel subscription, and scroll placement.
  const stompClientRef = useRef(null);
  const roomSubscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Method 1: Fetch initial lists of rooms and registered users from DB on component mount.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all rooms from the REST endpoint
        const roomsRes = await api.get('/rooms');
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0) {
          setSelectedRoom(roomsRes.data[0]); // Select first room by default
        }
        
        // Fetch all users to populate the presence listing
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Could not fetch starting room/user details", err);
      }
    };
    fetchData();
  }, []);

  // Method 2: Establish the SockJS WebSocket connection using the user's JWT.
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Create new Stomp client with JWT parameter for handshake authentication
    const client = new Client({
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Run callback when connection is successfully established
    client.onConnect = (frame) => {
      console.log('STOMP Connection succeeded');
      setIsConnected(true);

      // Subscribe to global presence updates to show who is online
      client.subscribe('/topic/presence', (message) => {
        const presenceUpdate = JSON.parse(message.body);
        setUsers((prevUsers) => {
          const userExists = prevUsers.some((u) => u.username === presenceUpdate.username);
          if (userExists) {
            // Update existing user status
            return prevUsers.map((u) => 
              u.username === presenceUpdate.username 
                ? { ...u, isOnline: presenceUpdate.isOnline } 
                : u
            );
          } else {
            // Append new user to the list
            return [...prevUsers, {
              username: presenceUpdate.username,
              displayName: presenceUpdate.displayName,
              avatarColor: presenceUpdate.avatarColor,
              isOnline: presenceUpdate.isOnline
            }];
          }
        });
      });
    };

    // Clean up presence state on disconnect
    client.onDisconnect = () => {
      console.log('STOMP Connection disconnected');
      setIsConnected(false);
    };

    // Handle connection level errors
    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
    };

    // Activate the STOMP connection
    client.activate();
    stompClientRef.current = client;

    // Disconnect connection when component unmounts
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  // Method 3: Handle switching subscriptions when the user selects a different channel.
  useEffect(() => {
    if (!stompClientRef.current || !isConnected || !selectedRoom) return;

    // Unsubscribe from previous room if any
    if (roomSubscriptionRef.current) {
      roomSubscriptionRef.current.unsubscribe();
      roomSubscriptionRef.current = null;
    }

    // Load message history from DB for the selected room
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/rooms/${selectedRoom.id}/messages`);
        setMessages(res.data);
        scrollToBottom();
      } catch (err) {
        console.error("Could not fetch messages for this channel", err);
      }
    };
    fetchHistory();

    // Subscribe to new room messages
    roomSubscriptionRef.current = stompClientRef.current.subscribe(
      `/topic/room/${selectedRoom.id}`,
      (message) => {
        const newMsg = JSON.parse(message.body);
        setMessages((prev) => {
          // Avoid rendering duplicate messages
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );
  }, [selectedRoom, isConnected]);

  // Method 4: Automatically scroll the chat container to the bottom on new messages.
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Run scroll placement update whenever message list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Method 5: Send a message over the WebSocket connection.
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !stompClientRef.current || !isConnected || !selectedRoom) return;

    // Publish payload to the selected room's channel destination
    stompClientRef.current.publish({
      destination: `/app/chat/${selectedRoom.id}`,
      body: JSON.stringify({ content: messageInput.trim() })
    });

    setMessageInput('');
  };

  // Method 6: Create a new room channel via REST API call.
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setRoomError("Room name is required.");
      return;
    }
    setRoomError("");
    try {
      const res = await api.post('/rooms', {
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
      });
      // Append the new room and select it
      setRooms((prev) => [...prev, res.data]);
      setSelectedRoom(res.data);
      setNewRoomName('');
      setNewRoomDesc('');
      setShowAddRoomModal(false);
    } catch (err) {
      setRoomError(err.response?.data || "Could not create this channel.");
    }
  };

  // Method 7: Extract first two characters of display name for simple fallback avatar.
  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  // Method 8: Map selected theme class to standard background color class.
  const getBgColorClass = (colorClass) => {
    switch (colorClass) {
      case 'pink-500': return 'bg-pink-400';
      case 'emerald-500': return 'bg-emerald-450';
      case 'amber-500': return 'bg-amber-400';
      case 'cyan-500': return 'bg-cyan-400';
      case 'violet-500': return 'bg-purple-400';
      case 'rose-500': return 'bg-rose-450';
      case 'teal-500': return 'bg-teal-400';
      case 'indigo-500':
      default:
        return 'bg-[#7D8F7C]';
    }
  };

  // Method 9: Format timestamp to simple time display.
  const formatTimestamp = (timeString) => {
    const d = new Date(timeString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Method 10: Clear the active channel selection. This triggers the WebSocket unsubscribe effect.
  const handleLeaveRoom = () => {
    setSelectedRoom(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#F3F0E9] text-[#3A3A3A] overflow-hidden font-sans">
      
      {/* Sidebar Panel */}
      <div className="w-64 bg-[#F3F0E9] border-r border-[#E5E1D8] flex flex-col">
        
        {/* User Block */}
        <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${getBgColorClass(user?.avatarColor)}`}>
              {getInitials(user?.displayName)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-[#3A3A3A] truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="px-2.5 py-1 border border-[#E5E1D8] hover:bg-[#FDF2F2] hover:text-[#9B1C1C] hover:border-[#FBD5D5] text-[#3A3A3A] text-xs rounded cursor-pointer transition-colors bg-[#FAF9F5]"
          >
            Logout
          </button>
        </div>

        {/* Channels Header */}
        <div className="p-3 bg-[#F3F0E9]/50 border-b border-[#E5E1D8] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-550 uppercase">Channels</span>
          <button 
            onClick={() => setShowAddRoomModal(true)}
            className="px-2.5 py-0.5 bg-[#7D8F7C] hover:bg-[#6D7F6C] text-white text-xs rounded cursor-pointer transition-colors"
          >
            + New
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedRoom?.id === room.id 
                  ? 'bg-[#EDF4EC] text-[#2E4E2C] border-l-2 border-[#7D8F7C] font-semibold' 
                  : 'text-slate-650 hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="font-bold"># {room.name}</div>
              <div className="text-xs text-slate-500 truncate">{room.description || 'No description'}</div>
            </button>
          ))}
        </div>

        {/* Online Users List */}
        <div className="border-t border-[#E5E1D8] bg-[#F3F0E9] p-2">
          <p className="text-xs font-bold text-slate-550 uppercase mb-2">
            Active Members ({users.filter(u => u.isOnline).length})
          </p>
          <div className="h-32 overflow-y-auto space-y-1">
            {users.map((member) => (
              <div key={member.username} className="flex items-center justify-between text-xs p-1">
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${getBgColorClass(member.avatarColor)}`}>
                    {getInitials(member.displayName)}
                  </span>
                  <span className="truncate text-[#3A3A3A]">{member.displayName}</span>
                </div>
                <span className={`text-[9px] px-1.5 rounded ${
                  member.isOnline ? 'bg-[#EDF4EC] text-[#2E4E2C]' : 'bg-[#FAF9F5] border border-[#E5E1D8] text-slate-605'
                }`}>
                  {member.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-[#FAF9F5]">
        {selectedRoom ? (
          <>
            {/* Chat Room Header */}
            <div className="h-14 border-b border-[#E5E1D8] px-4 flex items-center justify-between bg-[#FAF9F5]">
              <div>
                <h2 className="font-bold text-base text-[#3A3A3A]"># {selectedRoom.name}</h2>
                <p className="text-xs text-[#6A6A6A]">{selectedRoom.description || 'No description set.'}</p>
              </div>
              <div className="text-xs flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#7D8F7C]' : 'bg-amber-400'}`} />
                  <span className="text-[#3A3A3A]">{isConnected ? 'Connected' : 'Connecting...'}</span>
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="px-2.5 py-1 border border-[#E5E1D8] hover:bg-[#F3F0E9] text-[#3A3A3A] rounded cursor-pointer transition-colors bg-[#FAF9F5]"
                >
                  Leave Channel
                </button>
              </div>
            </div>

            {/* Message Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F5]">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#6A6A6A] text-sm">
                  No messages in this channel yet.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.sender?.username === user?.username;
                  return (
                    <div key={msg.id || `${msg.timestamp}-${msg.content}`} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start space-x-2 max-w-md">
                        {!isSelf && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-1 ${getBgColorClass(msg.sender?.avatarColor)}`}>
                            {getInitials(msg.sender?.displayName)}
                          </div>
                        )}
                        <div>
                          <div className={`text-[10px] text-slate-500 mb-0.5 ${isSelf ? 'text-right' : 'text-left'}`}>
                            <span className="font-semibold mr-1 text-slate-600">{msg.sender?.displayName}</span>
                            <span>{formatTimestamp(msg.timestamp)}</span>
                          </div>
                          <div className={`p-2.5 rounded text-sm border ${
                            isSelf 
                              ? 'bg-[#7D8F7C] border-[#6D7F6C] text-white' 
                              : 'bg-[#F3F0E9] border-[#E5E1D8] text-[#3A3A3A]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <div className="p-3 border-t border-[#E5E1D8] bg-[#FAF9F5]">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Send a message to #${selectedRoom.name}...`}
                  className="flex-1 px-3 py-2 border border-[#E5E1D8] rounded text-sm focus:outline-none focus:border-[#7D8F7C] bg-[#F3F0E9]/55"
                  required
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || !isConnected}
                  className="px-4 py-2 bg-[#7D8F7C] hover:bg-[#6D7F6C] disabled:bg-[#BAC7B9] text-white rounded text-sm font-bold cursor-pointer transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#6A6A6A]">
            Select a channel to begin messaging.
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded w-full max-w-sm p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-3">Create New Channel</h3>
            
            {roomError && (
              <div className="mb-3 p-2 bg-[#FDF2F2] border border-[#FBD5D5] text-[#9B1C1C] text-xs rounded">
                {roomError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-[#4A4A4A] text-xs font-semibold mb-1">Channel Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. tech-discussion"
                  className="w-full px-3 py-1.5 border border-[#E5E1D8] rounded text-sm focus:outline-none focus:border-[#7D8F7C] bg-[#F3F0E9]/55"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A4A4A] text-xs font-semibold mb-1">Description</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What will users talk about here?"
                  rows="2"
                  className="w-full px-3 py-1.5 border border-[#E5E1D8] rounded text-sm focus:outline-none focus:border-[#7D8F7C] bg-[#F3F0E9]/55 resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomError('');
                  }}
                  className="flex-1 py-1.5 border border-[#E5E1D8] hover:bg-[#F3F0E9] text-[#3A3A3A] text-xs rounded font-bold cursor-pointer bg-[#FAF9F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-[#7D8F7C] hover:bg-[#6D7F6C] text-white text-xs rounded font-bold cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
