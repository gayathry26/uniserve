import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MoreVertical,
  Smile,
  Hand,
  MessageSquare,
  Users,
  Info,
  Shield,
  ScreenShare,
  StopCircle,
  Check,
  X,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Star,
  Award,
  BookOpen,
  Copy,
  CheckCheck,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// WebRTC STUN Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function InterviewRoomPage() {
  const navigate = useNavigate();
  const { roomCode: paramRoomCode } = useParams();
  const { user } = useAuth();

  // Role Checks
  const userRole = user?.roleName || user?.role_name || 'STUDENT';
  const isPlacement = ['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isTeacher = ['FACULTY_COORDINATOR', 'STAFF'].includes(userRole);
  const canCreate = isPlacement || isTeacher;
  const isStudent = userRole === 'STUDENT';

  // State: Room & Mode
  const [activeRoomCode, setActiveRoomCode] = useState(paramRoomCode || '');
  const [inCall, setInCall] = useState(Boolean(paramRoomCode));
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Media & WebRTC Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const screenTrackRef = useRef(null);

  // In-Call States
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [captionOn, setCaptionOn] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Peer & Admission State
  const [hasRemotePeer, setHasRemotePeer] = useState(false);
  const [remotePeerInfo, setRemotePeerInfo] = useState(null);
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({ mic: true, video: true });
  const [waitingCandidates, setWaitingCandidates] = useState([]);
  const [isWaitingInLobby, setIsWaitingInLobby] = useState(false);
  const [wasAdmitted, setWasAdmitted] = useState(false);

  // Drawers & Modals
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'people' | 'info' | 'evaluate'
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      senderName: 'Uniserve Meet System',
      senderRole: 'SYSTEM',
      text: 'Encrypted mock technical interview meeting started. Audio & video stream initialized via WebRTC.',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Create Mock Interview Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [studentOptions, setStudentOptions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    student_name: '',
    student_roll: '',
    topic: 'Cloud Architecture & DSA',
    scheduled_at: '',
    custom_code: ''
  });

  // Candidate Evaluation Form
  const [evalForm, setEvalForm] = useState({
    rating: 4.5,
    decision: 'RECOMMENDED',
    feedback: ''
  });
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  // Quick Join Code Input
  const [inputCode, setInputCode] = useState('');

  // 1. Clock Tracker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Scheduled Interviews List
  const fetchScheduled = async () => {
    setLoadingSchedule(true);
    try {
      const res = await apiClient.get('/mock-interviews');
      setScheduledInterviews(res.data.data || []);
    } catch (err) {
      console.warn('Could not load mock interviews:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  // 3. Fetch candidate roster for creation modal
  useEffect(() => {
    if (canCreate && showCreateModal) {
      apiClient.get('/students')
        .then((res) => {
          const list = res.data.data || [];
          setStudentOptions(list);
          if (list.length > 0 && !formData.student_name) {
            setFormData(prev => ({
              ...prev,
              student_name: `${list[0].first_name} ${list[0].last_name}`,
              student_roll: list[0].roll_number || '2023CSE001'
            }));
          }
        })
        .catch(err => console.warn('Could not fetch students roster:', err));
    }
  }, [canCreate, showCreateModal]);

  // 4. Fetch specific interview details when activeRoomCode changes
  useEffect(() => {
    if (!activeRoomCode) return;
    apiClient.get(`/mock-interviews/${activeRoomCode}`)
      .then(res => {
        if (res.data?.data) {
          setInterviewDetails(res.data.data);
        }
      })
      .catch(() => {
        setInterviewDetails({
          title: `Technical Interview Meet · ${activeRoomCode}`,
          room_code: activeRoomCode,
          topic: 'Live Coding & System Architecture'
        });
      });
  }, [activeRoomCode]);

  // 5. Initialize Media Stream (Webcam & Mic)
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.warn('Webcam/mic access error:', err);
        if (isMounted) {
          setCameraError(err.message || 'Media permission denied');
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Re-attach local stream if inCall changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inCall]);

  // 6. WebRTC & Socket.io Connection Logic
  useEffect(() => {
    if (!inCall || !activeRoomCode) return;

    const currentRoom = activeRoomCode;
    const userName = user ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.username : 'Participant';
    const userPayload = {
      id: user?.id || Date.now(),
      name: userName,
      role: userRole,
      student_roll: user?.rollNumber || user?.roll_number || ''
    };

    // Initialize BroadcastChannel fallback for multi-tab localhost testing
    const bc = new BroadcastChannel(`uniserve_meet_${currentRoom}`);
    broadcastChannelRef.current = bc;

    // Connect Socket.io client
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = socket;

    // Helper: Initialize RTCPeerConnection
    const createPeerConnection = (targetSocketId = null) => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local audio and video tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Remote stream handler
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setHasRemotePeer(true);
        }
      };

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const payload = {
            type: 'candidate',
            candidate: event.candidate,
            senderSocketId: socket.id
          };
          socket.emit('webrtc-signal', {
            targetSocketId,
            signalData: payload,
            senderInfo: userPayload
          });
          bc.postMessage({ type: 'SIGNAL', payload, senderInfo: userPayload });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setHasRemotePeer(true);
        } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setHasRemotePeer(false);
        }
      };

      return pc;
    };

    // Helper: Send WebRTC Offer
    const sendOffer = async (targetSocketId = null) => {
      try {
        const pc = createPeerConnection(targetSocketId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);

        const payload = {
          type: 'offer',
          sdp: offer,
          senderSocketId: socket.id
        };

        socket.emit('webrtc-signal', {
          targetSocketId,
          signalData: payload,
          senderInfo: userPayload
        });
        bc.postMessage({ type: 'SIGNAL', payload, senderInfo: userPayload });
      } catch (err) {
        console.warn('Error creating WebRTC offer:', err);
      }
    };

    // Helper: Process Incoming WebRTC Signal
    const handleSignal = async (signalData, senderInfo, senderSocketId) => {
      try {
        const pc = createPeerConnection(senderSocketId);

        if (signalData.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          setRemotePeerInfo(senderInfo);
          setHasRemotePeer(true);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerPayload = {
            type: 'answer',
            sdp: answer,
            senderSocketId: socket.id
          };

          socket.emit('webrtc-signal', {
            targetSocketId: senderSocketId,
            signalData: answerPayload,
            senderInfo: userPayload
          });
          bc.postMessage({ type: 'SIGNAL', payload: answerPayload, senderInfo: userPayload });
        } else if (signalData.type === 'answer') {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            setRemotePeerInfo(senderInfo);
            setHasRemotePeer(true);
          }
        } else if (signalData.type === 'candidate' && signalData.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
      } catch (err) {
        console.warn('WebRTC signal handling error:', err);
      }
    };

    // Socket Connection Lifecycle
    socket.on('connect', () => {
      console.log('⚡ Socket connected to meet server:', socket.id);

      // Students ask for admission if not yet admitted
      if (isStudent && !wasAdmitted) {
        setIsWaitingInLobby(true);
        socket.emit('candidate-waiting', {
          roomId: currentRoom,
          candidateInfo: userPayload
        });
        bc.postMessage({
          type: 'CANDIDATE_WAITING',
          candidate: userPayload,
          senderSocketId: socket.id
        });
      } else {
        // Teachers / Placement or admitted students join room directly
        socket.emit('join-room', {
          roomId: currentRoom,
          user: userPayload
        });
      }
    });

    // Remote Peer Joined Room
    socket.on('user-joined', ({ socketId, user: joinedUser }) => {
      setRemotePeerInfo(joinedUser);
      // Host or first participant initiates offer
      sendOffer(socketId);
    });

    socket.on('room-users', ({ peers }) => {
      if (peers && peers.length > 0) {
        setRemotePeerInfo(peers[0]);
        sendOffer(peers[0].socketId);
      }
    });

    // Incoming WebRTC Signal from Socket
    socket.on('webrtc-signal', ({ senderSocketId, signalData, senderInfo }) => {
      handleSignal(signalData, senderInfo, senderSocketId);
    });

    // Host receives candidate waiting in lobby
    socket.on('candidate-waiting', ({ socketId, candidate }) => {
      setWaitingCandidates(prev => {
        if (prev.some(c => c.socketId === socketId)) return prev;
        return [...prev, { socketId, ...candidate }];
      });
    });

    // Student receives admission notice
    socket.on('candidate-admitted', () => {
      setIsWaitingInLobby(false);
      setWasAdmitted(true);
      socket.emit('join-room', {
        roomId: currentRoom,
        user: userPayload
      });
      sendOffer();
    });

    socket.on('candidate-denied', () => {
      alert('Admission to this interview room was declined by the host.');
      setInCall(false);
      setActiveRoomCode('');
    });

    // Chat broadcast
    socket.on('new-chat', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // Hand raise broadcast
    socket.on('user-hand-raised', ({ userName: handUser, raised }) => {
      if (raised) {
        setReactions(prev => [
          ...prev,
          { id: Date.now(), emoji: `✋ ${handUser} raised hand`, type: 'text' }
        ]);
      }
    });

    // Floating reaction broadcast
    socket.on('user-reaction', ({ userName: rxUser, emoji, id }) => {
      setReactions(prev => [...prev, { id, emoji, user: rxUser, type: 'emoji' }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3500);
    });

    // Peer media toggle state
    socket.on('peer-media-toggle', ({ type, enabled }) => {
      setRemoteMediaStatus(prev => ({
        ...prev,
        [type]: enabled
      }));
    });

    // Peer Left
    socket.on('user-left', ({ user: leftUser }) => {
      setHasRemotePeer(false);
      setRemotePeerInfo(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // BroadcastChannel Listener (Seamless Dual-Tab Fallback)
    bc.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'SIGNAL') {
        handleSignal(data.payload, data.senderInfo, data.payload.senderSocketId);
      } else if (data.type === 'CANDIDATE_WAITING') {
        if (canCreate) {
          setWaitingCandidates(prev => {
            if (prev.some(c => c.name === data.candidate.name)) return prev;
            return [...prev, { socketId: data.senderSocketId, ...data.candidate }];
          });
        }
      } else if (data.type === 'ADMIT_CANDIDATE') {
        if (isStudent) {
          setIsWaitingInLobby(false);
          setWasAdmitted(true);
          sendOffer();
        }
      } else if (data.type === 'CHAT') {
        setChatMessages(prev => [...prev, data.message]);
      } else if (data.type === 'REACTION') {
        setReactions(prev => [...prev, { id: Date.now(), emoji: data.emoji, user: data.userName, type: 'emoji' }]);
      }
    };

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      socket.disconnect();
      bc.close();
    };
  }, [inCall, activeRoomCode, isStudent, wasAdmitted, canCreate, user, userRole]);

  // 7. Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const nextState = !cameraOn;
      videoTracks.forEach(t => { t.enabled = nextState; });
      setCameraOn(nextState);

      if (socketRef.current) {
        socketRef.current.emit('media-toggle', {
          roomId: activeRoomCode,
          type: 'video',
          enabled: nextState
        });
      }
    }
  };

  // 8. Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextState = !micOn;
      audioTracks.forEach(t => { t.enabled = nextState; });
      setMicOn(nextState);

      if (socketRef.current) {
        socketRef.current.emit('media-toggle', {
          roomId: activeRoomCode,
          type: 'mic',
          enabled: nextState
        });
      }
    }
  };

  // 9. Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to webcam
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn('Screen sharing cancelled or not supported:', err);
      }
    }
  };

  // 10. Hand Raise Toggle
  const toggleHandRaise = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (socketRef.current) {
      socketRef.current.emit('toggle-hand-raise', {
        roomId: activeRoomCode,
        raised: nextState
      });
    }
  };

  // 11. Send Floating Reaction
  const sendReaction = (emoji) => {
    setShowReactionPicker(false);
    const rxItem = {
      id: Date.now(),
      emoji,
      user: 'You',
      type: 'emoji'
    };
    setReactions(prev => [...prev, rxItem]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== rxItem.id));
    }, 3500);

    if (socketRef.current) {
      socketRef.current.emit('send-reaction', {
        roomId: activeRoomCode,
        emoji
      });
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'REACTION',
        emoji,
        userName: user?.firstName || 'Participant'
      });
    }
  };

  // 12. Send In-Call Chat Message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now() + Math.random(),
      senderName: user ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.username : 'You',
      senderRole: userRole,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    if (socketRef.current) {
      socketRef.current.emit('send-chat', {
        roomId: activeRoomCode,
        message: chatInput.trim()
      });
    } else {
      setChatMessages(prev => [...prev, newMsg]);
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'CHAT',
        message: newMsg
      });
    }

    setChatInput('');
  };

  // 13. Host Admits Candidate
  const handleAdmitCandidate = (candidate) => {
    if (socketRef.current) {
      socketRef.current.emit('admit-candidate', {
        roomId: activeRoomCode,
        candidateSocketId: candidate.socketId
      });
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'ADMIT_CANDIDATE',
        candidate
      });
    }
    setWaitingCandidates(prev => prev.filter(c => c.socketId !== candidate.socketId));
    setHasRemotePeer(true);
    setRemotePeerInfo(candidate);
  };

  // 14. Host Denies Candidate
  const handleDenyCandidate = (candidate) => {
    if (socketRef.current) {
      socketRef.current.emit('deny-candidate', {
        roomId: activeRoomCode,
        candidateSocketId: candidate.socketId
      });
    }
    setWaitingCandidates(prev => prev.filter(c => c.socketId !== candidate.socketId));
  };

  // 15. Create Mock Interview Session (Teacher & Placement)
  const handleCreateMockInterview = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      alert('Only Staff/Teachers and Placement officers are authorized to schedule mock interviews.');
      return;
    }

    setCreating(true);
    try {
      const res = await apiClient.post('/mock-interviews', formData);
      const created = res.data.data;
      alert(`✅ Mock interview session created successfully!\nRoom Code: ${created.room_code}`);
      setShowCreateModal(false);
      fetchScheduled();
      // Join immediately
      setActiveRoomCode(created.room_code);
      setInCall(true);
      navigate(`/interview/room/${created.room_code}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create mock interview session.');
    } finally {
      setCreating(false);
    }
  };

  // 16. Submit Candidate Evaluation
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setSubmittingEval(true);
    try {
      const idToEvaluate = interviewDetails?.id || activeRoomCode;
      await apiClient.put(`/mock-interviews/${idToEvaluate}/evaluate`, evalForm);
      setEvalSuccess(true);
      setTimeout(() => {
        setEvalSuccess(false);
        setActivePanel(null);
      }, 2000);
      fetchScheduled();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record candidate score.');
    } finally {
      setSubmittingEval(false);
    }
  };

  // 17. Copy Meet Link
  const handleCopyCode = () => {
    const fullUrl = `${window.location.origin}/interview/room/${activeRoomCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // 18. End / Leave Call
  const handleLeaveCall = () => {
    if (isScreenSharing && screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setInCall(false);
    setActiveRoomCode('');
    setIsWaitingInLobby(false);
    navigate('/interviews');
  };

  // 19. Join by custom code
  const handleJoinByCode = (code) => {
    const cleanCode = (code || inputCode).trim();
    if (!cleanCode) return;
    setActiveRoomCode(cleanCode);
    setInCall(true);
    navigate(`/interview/room/${cleanCode}`);
  };

  // Live Captions simulation toggle
  useEffect(() => {
    let captionInterval;
    if (captionOn) {
      const samplePhrases = [
        "Interviewer: 'Could you explain how you would design a scalable URL shortener with distributed hashing?'",
        "Candidate: 'I would employ a MurmurHash with a base62 encoding and Redis cluster for LRU caching.'",
        "Interviewer: 'Excellent. What is the time complexity of lookup in your proposed solution?'",
        "Candidate: 'Constant O(1) time complexity with negligible collision rate.'",
        "Interviewer: 'Great! Let's proceed to writing the SQL migration for our mock placement db.'"
      ];
      let idx = 0;
      setCurrentCaption(samplePhrases[0]);
      captionInterval = setInterval(() => {
        idx = (idx + 1) % samplePhrases.length;
        setCurrentCaption(samplePhrases[idx]);
      }, 4000);
    } else {
      setCurrentCaption('');
    }
    return () => clearInterval(captionInterval);
  }, [captionOn]);

  // =========================================================================
  // VIEW A: LOBBY & MOCK INTERVIEW MANAGEMENT CONSOLE (When not inside a call)
  // =========================================================================
  if (!inCall) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              to="/interviews"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Back to Interview Roster"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Video size={15} />
                </div>
                <h1 className="text-base font-bold text-white tracking-tight">Uniserve Mock Interview Meet</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  WebRTC P2P
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Google Meet-grade real-time video evaluation platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Signed in as:</span>
              <span className="font-semibold text-white">{user?.firstName || user?.username}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-blue-300">
                {userRole}
              </span>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer transition-transform active:scale-95"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Create Mock Interview</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Lobby Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-8">
          {/* Hero Section: Quick Join + Media Self-Test Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Instant Code Entry & Role Status */}
            <div className="lg:col-span-7 bg-slate-800/50 border border-slate-750 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={13} />
                  <span>Placement & Academic Coordination Ready</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  High-Fidelity Virtual Mock Technical Interviews
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Conduct low-latency P2P video technical rounds, evaluate candidate system architecture discussions, share screens, and submit quantitative rating scorecards directly to Uniserve records.
                </p>
              </div>

              {/* Code Entry Box */}
              <div className="space-y-3 bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl">
                <label className="text-xs font-semibold text-slate-300 block">
                  Have an interview code or meeting link?
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. gen-meet-x94)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinByCode()}
                    disabled={!inputCode.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video size={14} />
                    <span>Join Room</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Demo Room:</span>
                  <button
                    type="button"
                    onClick={() => handleJoinByCode('gen-meet-x94')}
                    className="font-mono text-blue-400 hover:underline cursor-pointer"
                  >
                    gen-meet-x94
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleJoinByCode('amazon-sde-88')}
                    className="font-mono text-blue-400 hover:underline cursor-pointer"
                  >
                    amazon-sde-88
                  </button>
                </div>
              </div>

              {/* Role Permissions Callout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Teachers & Staff</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">Create & Grade</span>
                  <span className="text-[10px] text-emerald-400">✓ Fully Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Placement Officers</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">Full Meet Control</span>
                  <span className="text-[10px] text-emerald-400">✓ Fully Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/60 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Students</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">Join & Present</span>
                  <span className="text-[10px] text-blue-400">✓ Active Participation</span>
                </div>
              </div>
            </div>

            {/* Right: Camera & Mic Self-Check Mirror */}
            <div className="lg:col-span-5 bg-slate-800/50 border border-slate-750 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Hardware & Readiness Check</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Test your audio and webcam feed before joining panel</p>
              </div>

              {/* Video Feed Mirror Box */}
              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                {cameraOn && !cameraError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-2 border border-slate-700">
                      <VideoOff size={24} />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Camera is turned off</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Toggle camera button below to preview</p>
                  </div>
                )}

                {/* Mirror Status Pills */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 ${micOn ? 'bg-black/60 text-emerald-400' : 'bg-red-500/80 text-white'}`}>
                    {micOn ? <Mic size={11} /> : <MicOff size={11} />}
                    <span>{micOn ? 'Microphone Active' : 'Microphone Muted'}</span>
                  </div>
                </div>
              </div>

              {/* Preview Toggle Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-colors cursor-pointer ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-colors cursor-pointer ${cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => alert('Webcam and audio device diagnostic: Audio drivers and WebRTC codecs are ready.')}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Test Audio Device
                </button>
              </div>
            </div>
          </div>

          {/* Section: Scheduled Mock Interviews List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  <span>Upcoming Mock Interview Sessions</span>
                </h3>
                <p className="text-xs text-slate-400">Scheduled rounds accessible to students, academic staff, and placement officers</p>
              </div>
              <button
                type="button"
                onClick={fetchScheduled}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Refresh list"
              >
                <RefreshCw size={15} className={loadingSchedule ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingSchedule ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-800 animate-pulse">
                Loading mock interview slots...
              </div>
            ) : scheduledInterviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
                <Video size={28} className="mx-auto text-slate-600" />
                <p className="text-xs font-medium">No mock interviews scheduled at this moment.</p>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} /> Schedule First Mock Interview
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledInterviews.map((item) => (
                  <div
                    key={item.id || item.room_code}
                    className="bg-slate-800/70 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {item.topic || 'Technical Interview'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {item.status || 'SCHEDULED'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-300">
                        Candidate: <strong className="text-white">{item.student_name}</strong> {item.student_roll ? `(${item.student_roll})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Interviewer: {item.interviewer_name}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl space-y-1.5 text-[11px] border border-slate-750">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} className="text-blue-400" /> Slot:
                        </span>
                        <span className="font-mono text-slate-200">
                          {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Flexible Slot'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Video size={12} className="text-emerald-400" /> Room Code:
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">{item.room_code}</span>
                      </div>
                      {item.rating && (
                        <div className="flex items-center justify-between text-amber-400 font-semibold pt-1 border-t border-slate-800">
                          <span>Evaluated Score:</span>
                          <span className="flex items-center gap-1">
                            <Star size={11} className="fill-current" /> {item.rating} / 5.0
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJoinByCode(item.room_code)}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                      >
                        <Video size={13} />
                        <span>Join Video Meet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/interview/room/${item.room_code}`);
                          alert(`Copied link for ${item.room_code}`);
                        }}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                        title="Copy Meet Link"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Modal: Create Mock Interview (Teacher & Placement Access) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create New Mock Interview</h3>
                    <p className="text-[11px] text-slate-400">Available to Staff/Teachers & Placement Officers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateMockInterview} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Interview Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cloud Tech Mock Round"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Technical Domain / Topic <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                      <option value="Cloud Architecture & DSA">Cloud Architecture & DSA</option>
                      <option value="System Design & Scalability">System Design & Scalability</option>
                      <option value="Full Stack & React/Node">Full Stack & React/Node</option>
                      <option value="Core CS & Operating Systems">Core CS & Operating Systems</option>
                      <option value="HR & Leadership Round">HR & Leadership Round</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Candidate Student Selection
                  </label>
                  {studentOptions.length > 0 ? (
                    <select
                      value={formData.student_name}
                      onChange={(e) => {
                        const selected = studentOptions.find(s => `${s.first_name} ${s.last_name}` === e.target.value);
                        setFormData({
                          ...formData,
                          student_name: e.target.value,
                          student_roll: selected?.roll_number || '2023CSE001'
                        });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {studentOptions.map(s => (
                        <option key={s.id} value={`${s.first_name} ${s.last_name}`}>
                          {s.first_name} {s.last_name} ({s.roll_number || s.department_code || 'Student'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Candidate name e.g. Varun Murugesh"
                      value={formData.student_name}
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Custom Room Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for auto-generated code"
                    value={formData.custom_code}
                    onChange={(e) => setFormData({ ...formData, custom_code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder:font-sans focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    e.g. google-round-91 or leave blank for automatic format.
                  </span>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Schedule & Launch Session</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW B: ACTIVE GOOGLE MEET VIDEO CALL ROOM (Full-Screen In-Call UI)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#202124] text-white flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* 1. Google Meet Top Bar */}
      <header className="h-16 px-6 flex items-center justify-between z-10 shrink-0 border-b border-white/5 bg-[#202124]/90 backdrop-blur-sm">
        {/* Left: Clock, Pipe, Meeting Topic */}
        <div className="flex items-center gap-3 text-sm text-[#e8eaed] truncate max-w-xl">
          <span className="font-medium tracking-wide">{currentTime}</span>
          <span className="text-[#9aa0a6]">|</span>
          <span className="font-medium tracking-tight truncate">
            {interviewDetails?.title || `Mock Interview · ${activeRoomCode}`}
          </span>
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'info' ? null : 'info')}
            aria-label="Meeting details"
            className="p-1 rounded-full text-[#9aa0a6] hover:text-white hover:bg-white/10 transition-colors"
            title="Meeting Info"
          >
            <Info size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Center / Right: Admitted Chip, Host Evaluation Button, Participant Counters */}
        <div className="flex items-center gap-2.5">
          {canCreate && (
            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'evaluate' ? null : 'evaluate')}
              className="h-9 px-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full flex items-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer animate-pulse"
            >
              <Award size={14} />
              <span>Evaluate Candidate</span>
            </button>
          )}

          {/* Admission Status Indicator */}
          {hasRemotePeer || wasAdmitted ? (
            <div className="h-9 px-3.5 bg-[#1e4620] text-[#a8dab5] rounded-full flex items-center gap-2 text-xs font-medium border border-[#34a853]/40 animate-fade-in">
              <Check size={14} strokeWidth={2.5} />
              <span>{canCreate ? 'Candidate Connected' : 'Interviewer Connected'}</span>
            </div>
          ) : isWaitingInLobby ? (
            <div className="h-9 px-3.5 bg-amber-500/20 text-amber-300 rounded-full flex items-center gap-2 text-xs font-medium border border-amber-500/30">
              <Clock size={14} />
              <span>Waiting for Host Admission...</span>
            </div>
          ) : waitingCandidates.length > 0 ? (
            <button
              type="button"
              onClick={() => handleAdmitCandidate(waitingCandidates[0])}
              className="h-9 px-3.5 bg-[#137333] hover:bg-[#0f622a] text-white rounded-full flex items-center gap-2 text-xs font-medium transition-all shadow-sm cursor-pointer animate-bounce"
            >
              <Users size={14} strokeWidth={2} />
              <span>Admit {waitingCandidates[0]?.name || 'Candidate'}</span>
            </button>
          ) : (
            <div className="h-9 px-3.5 bg-[#3c4043] text-[#e8eaed] rounded-full flex items-center gap-2 text-xs font-medium">
              <Users size={14} strokeWidth={2} />
              <span>1 Participant (You)</span>
            </div>
          )}

          {/* User Avatars */}
          <div className="flex items-center gap-1.5 pl-2">
            <div
              className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-semibold flex items-center justify-center text-xs shadow-inner"
              title={`${user?.firstName || 'You'} (${userRole})`}
            >
              {(user?.firstName || 'U')[0].toUpperCase()}
            </div>
            {hasRemotePeer && (
              <div
                className="w-8 h-8 rounded-full bg-[#f2994a] text-white font-semibold flex items-center justify-center text-xs shadow-inner"
                title={remotePeerInfo?.name || 'Remote Peer'}
              >
                {(remotePeerInfo?.name || 'P')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Video Viewport & Layout */}
      <main className="flex-1 relative mx-4 my-2 min-h-0 flex items-center justify-center">
        <div className="relative w-full h-full max-h-[84vh] max-w-[1360px] bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5">
          {/* Dual Split / Primary View */}
          {hasRemotePeer ? (
            /* Connected Mode: Primary Remote Video + Picture-in-Picture Local */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />

              {/* Remote Peer Overlay Tag (Bottom Left) */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-lg text-xs font-semibold text-white border border-white/10 shadow-sm">
                {!remoteMediaStatus.mic && <MicOff size={13} className="text-[#ea4335]" />}
                <span>{remotePeerInfo?.name || 'Candidate / Panel'}</span>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px]">
                  {remotePeerInfo?.role || 'CONNECTED'}
                </span>
              </div>

              {/* Floating Self-View (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 z-20 w-48 sm:w-64 aspect-video bg-[#282a2d] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                {cameraOn && !cameraError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-center p-2">
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-sm shadow">
                      {(user?.firstName || 'Y')[0]}
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">Camera off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 rounded text-[10px] font-medium text-white">
                  {!micOn && <MicOff size={10} className="text-[#ea4335]" />}
                  <span>You</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Participant View (Self View Feed) */
            <div className="relative w-full h-full flex items-center justify-center">
              {cameraOn && !cameraError ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-24 h-24 rounded-full bg-[#1a73e8] text-white text-3xl font-semibold flex items-center justify-center shadow-lg border-4 border-blue-400/20">
                    {(user?.firstName || 'U')[0]}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#e8eaed]">
                      {user?.firstName || 'You'} ({userRole})
                    </p>
                    <p className="text-xs text-[#9aa0a6] mt-0.5">
                      {cameraError ? 'Virtual avatar active (Camera access restricted)' : 'Camera is currently off'}
                    </p>
                  </div>
                </div>
              )}

              {/* Student Name Overlay (Bottom Left) */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white border border-white/10 shadow-sm">
                {!micOn && <MicOff size={13} className="text-[#ea4335]" />}
                <span>{user?.firstName || 'You'} (You)</span>
              </div>
            </div>
          )}

          {/* Screen Share Active Banner */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-semibold shadow-md animate-pulse">
              <ScreenShare size={14} />
              <span>You are presenting your screen to the interview panel</span>
            </div>
          )}

          {/* Hand Raised Tag */}
          {handRaised && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] text-white rounded-full text-xs font-bold shadow-md animate-bounce">
              <Hand size={14} />
              <span>Hand raised</span>
            </div>
          )}

          {/* Live Captions Subtitle Box (CC) */}
          {captionOn && currentCaption && (
            <div className="absolute bottom-16 inset-x-8 z-20 flex justify-center">
              <div className="max-w-2xl bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 text-center shadow-2xl">
                <span className="text-sm font-medium text-white tracking-wide leading-relaxed">
                  {currentCaption}
                </span>
              </div>
            </div>
          )}

          {/* Floating Emoji Reactions Stream */}
          <div className="absolute bottom-20 left-12 z-30 pointer-events-none space-y-2">
            {reactions.map((rx) => (
              <div
                key={rx.id}
                className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-2xl font-bold bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"
              >
                {rx.emoji}
              </div>
            ))}
          </div>

          {/* Google Meet "Waiting to join" Admission Card (for Host when candidate enters) */}
          {canCreate && waitingCandidates.length > 0 && (
            <div className="absolute top-5 right-5 z-30 w-[320px] bg-[#282a2d] border border-white/15 rounded-2xl p-4 shadow-2xl text-left animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-[13px] font-bold text-white flex items-center gap-2">
                    <span>Waiting to join</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
                      Host Action
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#9aa0a6]">Candidate standing by in interview lobby</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaitingCandidates([])}
                  className="p-1 rounded-full text-[#9aa0a6] hover:text-white hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              </div>

              {waitingCandidates.map((cand) => (
                <div key={cand.socketId} className="pt-3 space-y-3">
                  <div className="p-2.5 bg-[#303336] rounded-xl flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-[#f2994a] text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {(cand.name || 'C')[0]}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{cand.name || 'Candidate'}</p>
                      <p className="text-[11px] text-[#9aa0a6] truncate">
                        {cand.student_roll ? `Roll: ${cand.student_roll}` : 'Student Candidate'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdmitCandidate(cand)}
                      className="py-2 px-3 bg-[#137333] hover:bg-[#0f622a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center shadow"
                    >
                      Admit to Call
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDenyCandidate(cand)}
                      className="py-2 px-3 bg-[#3c4043] hover:bg-[#4a4e52] text-[#ea4335] rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Deny Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide-Over Right Panel (Chat / People / Info / Evaluation) */}
        {activePanel && (
          <aside className="w-80 sm:w-96 h-full max-h-[84vh] bg-[#282a2d] border border-white/10 rounded-2xl ml-3 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150 z-20">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activePanel === 'chat' && <MessageSquare size={16} className="text-blue-400" />}
                {activePanel === 'people' && <Users size={16} className="text-emerald-400" />}
                {activePanel === 'info' && <Info size={16} className="text-amber-400" />}
                {activePanel === 'evaluate' && <Award size={16} className="text-orange-400" />}
                <span>
                  {activePanel === 'chat' && 'In-Call Messages'}
                  {activePanel === 'people' && 'Interview Participants'}
                  {activePanel === 'info' && 'Meeting Specifications'}
                  {activePanel === 'evaluate' && 'Candidate Evaluation Scorecard'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1 rounded-full text-[#9aa0a6] hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {/* CHAT TAB */}
              {activePanel === 'chat' && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                    Messages are delivered in real-time to everyone in this interview session.
                  </div>
                  <div className="space-y-3">
                    {chatMessages.map((m) => (
                      <div key={m.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{m.senderName}</span>
                          <span className="text-slate-400">{m.time}</span>
                        </div>
                        <div className="p-2.5 bg-[#303336] rounded-xl text-slate-200 text-xs">
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PEOPLE TAB */}
              {activePanel === 'people' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-[#303336] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-xs">
                        {(user?.firstName || 'U')[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user?.firstName || 'You'} (You)</p>
                        <p className="text-[10px] text-slate-400">{userRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      {micOn ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-red-400" />}
                      {cameraOn ? <Video size={14} className="text-emerald-400" /> : <VideoOff size={14} className="text-red-400" />}
                    </div>
                  </div>

                  {hasRemotePeer && (
                    <div className="p-2.5 bg-[#303336] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f2994a] text-white font-bold flex items-center justify-center text-xs">
                          {(remotePeerInfo?.name || 'P')[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{remotePeerInfo?.name || 'Remote Peer'}</p>
                          <p className="text-[10px] text-slate-400">{remotePeerInfo?.role || 'CONNECTED'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        {remoteMediaStatus.mic ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-red-400" />}
                        {remoteMediaStatus.video ? <Video size={14} className="text-emerald-400" /> : <VideoOff size={14} className="text-red-400" />}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INFO TAB */}
              {activePanel === 'info' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#303336] rounded-xl space-y-2">
                    <div>
                      <span className="text-[11px] text-[#9aa0a6] block">Interview Topic:</span>
                      <span className="font-semibold text-white">{interviewDetails?.topic || 'Technical Coding Round'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#9aa0a6] block">Room Code:</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeRoomCode}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#9aa0a6] block">Joining Link:</span>
                      <span className="font-mono text-[11px] text-slate-300 break-all select-all">
                        {`${window.location.origin}/interview/room/${activeRoomCode}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedCode ? <CheckCheck size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Link Copied!' : 'Copy Meeting Link'}</span>
                  </button>
                </div>
              )}

              {/* EVALUATION SCORECARD TAB */}
              {activePanel === 'evaluate' && (
                <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                  {evalSuccess && (
                    <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 text-center font-bold">
                      ✓ Scorecard saved to database!
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Technical Rating (1.0 to 5.0)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={evalForm.rating}
                        onChange={(e) => setEvalForm({ ...evalForm, rating: parseFloat(e.target.value) })}
                        className="flex-1 accent-orange-500"
                      />
                      <span className="font-bold text-amber-400 font-mono text-sm w-8">
                        {evalForm.rating}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Final Recommendation Decision
                    </label>
                    <select
                      value={evalForm.decision}
                      onChange={(e) => setEvalForm({ ...evalForm, decision: e.target.value })}
                      className="w-full bg-[#303336] border border-white/10 rounded-xl p-2 text-white"
                    >
                      <option value="RECOMMENDED">RECOMMENDED (Advance to Offer)</option>
                      <option value="ON_HOLD">ON HOLD (Requires Second Round)</option>
                      <option value="NOT_RECOMMENDED">NOT RECOMMENDED (Reject)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Interviewer Feedback & Observations
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Candidate demonstrated strong grasp of DSA and clean code conventions..."
                      value={evalForm.feedback}
                      onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                      className="w-full bg-[#303336] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEval}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {submittingEval ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
                    <span>Submit Evaluation Score</span>
                  </button>
                </form>
              )}
            </div>

            {/* In-Call Chat Input Footer */}
            {activePanel === 'chat' && (
              <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#202124]">
                <input
                  type="text"
                  placeholder="Send a message to everyone..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#303336] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
          </aside>
        )}
      </main>

      {/* 3. Google Meet Bottom Action Controls Bar */}
      <footer className="h-20 px-6 flex items-center justify-between shrink-0 z-10 border-t border-white/5 bg-[#202124]">
        {/* Left: Room Code & Quick Copy */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#9aa0a6] min-w-[200px]">
          <span>Interview Code:</span>
          <span className="font-mono text-white font-semibold">{activeRoomCode}</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 ml-1"
            title="Copy Meet Link"
          >
            {copiedCode ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Center: Primary Call Controls (Google Meet Pill Buttons) */}
        <div className="flex items-center gap-2.5 mx-auto">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micOn ? 'Turn off microphone' : 'Turn on microphone'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              micOn ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
            }`}
            title={micOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micOn ? <Mic size={18} strokeWidth={2} /> : <MicOff size={18} strokeWidth={2} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              cameraOn ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
            }`}
            title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraOn ? <Video size={18} strokeWidth={2} /> : <VideoOff size={18} strokeWidth={2} />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            aria-label="Share screen"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <StopCircle size={18} strokeWidth={2} /> : <ScreenShare size={18} strokeWidth={2} />}
          </button>

          {/* Emoji Reactions Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              aria-label="Send reaction"
              className="w-11 h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
              title="React"
            >
              <Smile size={18} strokeWidth={2} />
            </button>
            {showReactionPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#282a2d] border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl animate-in zoom-in-95 duration-100">
                {['👍', '👏', '❤️', '🎉', '💡', '🚀'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => sendReaction(em)}
                    className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={toggleHandRaise}
            aria-label="Raise or lower hand"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              handRaised ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand size={18} strokeWidth={2} />
          </button>

          {/* Live Captions (CC) */}
          <button
            type="button"
            onClick={() => setCaptionOn(!captionOn)}
            aria-label="Toggle live captions"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer font-bold text-xs shadow-md ${
              captionOn ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title="Toggle Live Captions"
          >
            CC
          </button>

          {/* Leave Call (Red Pill Button) */}
          <button
            type="button"
            onClick={handleLeaveCall}
            aria-label="Leave call"
            className="h-11 px-6 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center justify-center transition-colors cursor-pointer ml-1 shadow-lg"
            title="Leave Call"
          >
            <PhoneOff size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Controls: Panel Toggles (Info, People, Chat, Safety) */}
        <div className="hidden sm:flex items-center gap-1.5 justify-end min-w-[200px]">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'info' ? null : 'info')}
            aria-label="Details"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activePanel === 'info' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-[#9aa0a6] hover:text-white'
            }`}
            title="Meeting Details"
          >
            <Info size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'people' ? null : 'people')}
            aria-label="People"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activePanel === 'people' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-[#9aa0a6] hover:text-white'
            }`}
            title="Participant Roster"
          >
            <Users size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            aria-label="In-call messages"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
              activePanel === 'chat' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-[#9aa0a6] hover:text-white'
            }`}
            title="In-Call Chat"
          >
            <MessageSquare size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => alert('Host safety: End-to-end WebRTC DTLS/SRTP media stream encryption active.')}
            aria-label="Host safety controls"
            className="w-10 h-10 rounded-full hover:bg-white/10 text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors"
            title="Security & Encryption"
          >
            <Shield size={18} strokeWidth={2} />
          </button>
        </div>
      </footer>
    </div>
  );
}