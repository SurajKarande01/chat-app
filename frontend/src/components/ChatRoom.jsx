import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Hash, 
  Send, 
  Users, 
  LogOut, 
  Plus, 
  MessageSquare, 
  Compass,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function ChatRoom() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  
  // New Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [roomError, setRoomError] = useState('');

  const stompClientRef = useRef(null);
  const roomSubscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Load rooms and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsRes = await api.get('/rooms');
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0) {
          setSelectedRoom(roomsRes.data[0]);
        }
        
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    fetchData();
  }, []);

  // 2. Establish WebSocket Connection on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const client = new Client({
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws?token=${encodeURIComponent(token)}`),
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('WebSocket Connected!');
      setIsConnected(true);

      // Subscribe to global presence updates
      client.subscribe('/topic/presence', (message) => {
        const presenceUpdate = JSON.parse(message.body);
        setUsers((prevUsers) => {
          const userExists = prevUsers.some((u) => u.username === presenceUpdate.username);
          if (userExists) {
            return prevUsers.map((u) => 
              u.username === presenceUpdate.username 
                ? { ...u, isOnline: presenceUpdate.isOnline } 
                : u
            );
          } else {
            // Add new user if not already in list
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

    client.onDisconnect = () => {
      console.log('WebSocket Disconnected.');
      setIsConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  // 3. Swap room subscription when selectedRoom changes
  useEffect(() => {
    if (!stompClientRef.current || !isConnected || !selectedRoom) return;

    // Unsubscribe from previous room
    if (roomSubscriptionRef.current) {
      roomSubscriptionRef.current.unsubscribe();
      roomSubscriptionRef.current = null;
    }

    // Load message history from DB
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/rooms/${selectedRoom.id}/messages`);
        setMessages(res.data);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load message history", err);
      }
    };
    fetchHistory();

    // Subscribe to new room messages
    roomSubscriptionRef.current = stompClientRef.current.subscribe(
      `/topic/room/${selectedRoom.id}`,
      (message) => {
        const newMsg = JSON.parse(message.body);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );
  }, [selectedRoom, isConnected]);

  // 4. Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 5. Send message through WebSocket
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !stompClientRef.current || !isConnected || !selectedRoom) return;

    stompClientRef.current.publish({
      destination: `/app/chat/${selectedRoom.id}`,
      body: JSON.stringify({ content: messageInput })
    });

    setMessageInput('');
  };

  // 6. Handle room creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setRoomError("Room name cannot be empty.");
      return;
    }
    setRoomError("");
    try {
      const res = await api.post('/rooms', {
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
      });
      setRooms((prev) => [...prev, res.data]);
      setSelectedRoom(res.data);
      setNewRoomName('');
      setNewRoomDesc('');
      setShowAddRoomModal(false);
    } catch (err) {
      setRoomError(err.response?.data || "Failed to create room.");
    }
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const getBgColorClass = (colorClass) => {
    switch (colorClass) {
      case 'pink-500': return 'bg-pink-500';
      case 'emerald-500': return 'bg-emerald-500';
      case 'amber-500': return 'bg-amber-500';
      case 'cyan-500': return 'bg-cyan-500';
      case 'violet-500': return 'bg-violet-500';
      case 'rose-500': return 'bg-rose-500';
      case 'teal-500': return 'bg-teal-500';
      case 'indigo-500':
      default:
        return 'bg-indigo-500';
    }
  };

  const formatTimestamp = (timeString) => {
    const d = new Date(timeString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Sidebar Panel */}
      <div className="w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col backdrop-blur-xl">
        {/* User Block */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow ${getBgColorClass(user?.avatarColor)}`}>
              {getInitials(user?.displayName)}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-slate-200 truncate">{user?.displayName}</h3>
              <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Channels</span>
          </span>
          <button 
            onClick={() => setShowAddRoomModal(true)}
            className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                selectedRoom?.id === room.id 
                  ? 'bg-gradient-to-r from-indigo-600/35 to-indigo-950/20 border-l-2 border-indigo-500 text-indigo-200 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Hash className={`w-4 h-4 ${selectedRoom?.id === room.id ? 'text-indigo-400' : 'text-slate-600'}`} />
              <div className="truncate">
                <p className="text-sm truncate">{room.name}</p>
                <p className="text-xs text-slate-500 truncate">{room.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Online Users Heading */}
        <div className="p-4 pb-2 border-t border-slate-850 flex items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Active Members ({users.filter(u => u.isOnline).length})</span>
          </span>
        </div>

        {/* Online Users List */}
        <div className="h-48 overflow-y-auto px-2 pb-4 space-y-1">
          {users.map((member) => (
            <div
              key={member.username}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-400"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative ${getBgColorClass(member.avatarColor)}`}>
                  {getInitials(member.displayName)}
                  {member.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-slate-900 bg-emerald-500" />
                  )}
                </div>
                <span className="text-sm truncate text-slate-300">{member.displayName}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                member.isOnline 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-slate-800/40 text-slate-600'
              }`}>
                {member.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-slate-950/40 relative">
        {selectedRoom ? (
          <>
            {/* Chat Room Header */}
            <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
              <div>
                <h2 className="font-bold text-lg text-slate-100 flex items-center space-x-2">
                  <Hash className="w-5 h-5 text-indigo-400" />
                  <span>{selectedRoom.name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRoom.description || 'No description set.'}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-amber-500'}`} />
                <span className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
            </div>

            {/* Message Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
                  <p className="text-sm">No messages yet. Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.sender?.username === user?.username;
                  return (
                    <div
                      key={msg.id || `${msg.timestamp}-${msg.content}`}
                      className={`flex items-start space-x-3 max-w-[80%] ${
                        isSelf ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow ${getBgColorClass(msg.sender?.avatarColor)}`}>
                        {getInitials(msg.sender?.displayName)}
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-baseline space-x-2 mb-1 justify-start">
                          <span className="text-xs font-semibold text-slate-300">{msg.sender?.displayName}</span>
                          <span className="text-[10px] text-slate-500 flex items-center space-x-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(msg.timestamp)}</span>
                          </span>
                        </div>
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                          isSelf 
                            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-indigo-500 text-white rounded-tr-none' 
                            : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <div className="p-4 border-t border-slate-850 bg-slate-900/30">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Send a message to #${selectedRoom.name}...`}
                  className="flex-1 px-4 py-3 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all text-sm"
                  required
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || !isConnected}
                  className="px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Compass className="w-16 h-16 text-slate-800 mb-3 animate-spin" />
            <h3 className="text-lg font-bold text-slate-400">Loading workspace</h3>
            <p className="text-sm mt-1">Checking for active rooms...</p>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <Hash className="w-5 h-5 text-indigo-400" />
              <span>Create New Channel</span>
            </h3>
            
            {roomError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{roomError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Channel Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. general-chatter"
                  className="w-full px-4.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What is this channel about?"
                  rows="3"
                  className="w-full px-4.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomError('');
                  }}
                  className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-md transition-all cursor-pointer text-sm"
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
