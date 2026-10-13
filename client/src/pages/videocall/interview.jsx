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
  AlertTriangle,
  Search,
  Trash2,
  ExternalLink,
  ThumbsUp,
  SlidersHorizontal,
  User
} from 'lucide-react';

// Default Fallback STUN Servers
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

export function InterviewRoomPage() {
  const navigate = useNavigate();
  const { roomCode: paramRoomCode } = useParams();
  const { user } = useAuth();

  // Role Permissions
  const userRole = user?.roleName || user?.role_name || 'STUDENT';
  const isPlacement = ['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isTeacher = ['FACULTY_COORDINATOR', 'STAFF', 'RECRUITER'].includes(userRole);
  const canCreate = isPlacement || isTeacher;
  const isStudent = userRole === 'STUDENT';

  // State: Mode & Room
  const [activeRoomCode, setActiveRoomCode] = useState(paramRoomCode || '');
  const [inCall, setInCall] = useState(Boolean(paramRoomCode));
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Media & WebRTC Configuration
  const [iceServers, setIceServers] = useState(DEFAULT_ICE_SERVERS);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const screenTrackRef = useRef(null);

  // In-Call Media States
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [captionOn, setCaptionOn] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Peer & Admission State
  const [hasRemotePeer, setHasRemotePeer] = useState(false);
  const [remotePeerInfo, setRemotePeerInfo] = useState(null);
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({ mic: true, video: true });
  const [waitingCandidates, setWaitingCandidates] = useState([]);
  const [isWaitingInLobby, setIsWaitingInLobby] = useState(false);
  const [wasAdmitted, setWasAdmitted] = useState(false);

  // In-Call Panels
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'people' | 'info' | 'evaluate'
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      senderName: 'Uniserve Meet System',
      senderRole: 'SYSTEM',
      text: 'Encrypted technical interview session initialized via WebRTC peer connection.',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Inline Creation Form (Admin / Placement / Faculty)
  const [creating, setCreating] = useState(false);
  const [studentOptions, setStudentOptions] = useState([]);
  const [customStudentMode, setCustomStudentMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    student_name: '',
    student_roll: '',
    student_id: '',
    topic: 'Data Structures and Algorithms',
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

  // Show Toast Notification (replaces browser alerts)
  const showToast = (message, type = 'info') => {
    setFeedbackToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

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

  // 2. Fetch WebRTC STUN Server Configuration from Backend
  useEffect(() => {
    apiClient
      .get('/videocall/ice-servers')
      .then((res) => {
        if (res.data?.data?.iceServers && Array.isArray(res.data.data.iceServers)) {
          setIceServers(res.data.data.iceServers);
        }
      })
      .catch((err) => {
        console.warn('Using standard fallback STUN configuration:', err.message);
      });
  }, []);

  // 3. Fetch Scheduled Meetings List
  const fetchScheduled = async () => {
    setLoadingSchedule(true);
    try {
      const res = await apiClient.get('/mock-interviews');
      setScheduledInterviews(res.data.data || []);
    } catch (err) {
      console.warn('Could not load scheduled interviews:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  // 4. Fetch Candidate Student Roster for Creation Selection
  useEffect(() => {
    if (canCreate) {
      apiClient
        .get('/students')
        .then((res) => {
          const list = res.data.data || [];
          setStudentOptions(list);
          if (list.length > 0 && !formData.student_name) {
            setFormData((prev) => ({
              ...prev,
              student_id: list[0].id || '',
              student_name: `${list[0].first_name} ${list[0].last_name}`.trim(),
              student_roll: list[0].roll_number || '2023CSE001'
            }));
          }
        })
        .catch((err) => {
          console.warn('Could not fetch student roster:', err);
        });
    }
  }, [canCreate]);

  // Set default scheduled time (+1 hour from current time)
  useEffect(() => {
    if (!formData.scheduled_at) {
      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
      const isoLocal = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFormData((prev) => ({ ...prev, scheduled_at: isoLocal }));
    }
  }, []);

  // 5. Fetch Specific Meeting Details When activeRoomCode Changes
  useEffect(() => {
    if (!activeRoomCode) return;
    apiClient
      .get(`/mock-interviews/${activeRoomCode}`)
      .then((res) => {
        if (res.data?.data) {
          setInterviewDetails(res.data.data);
        }
      })
      .catch(() => {
        setInterviewDetails({
          title: `Technical Interview Meet - ${activeRoomCode}`,
          room_code: activeRoomCode,
          topic: 'Live Technical Assessment and System Architecture'
        });
      });
  }, [activeRoomCode]);

  // 6. Initialize Media Stream (Webcam and Microphone)
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.warn('Webcam/mic access notice:', err);
        if (isMounted) {
          setCameraError(err.message || 'Media permission denied or hardware unavailable');
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Re-attach local stream whenever inCall toggles
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inCall]);

  // 7. WebRTC & Socket.io Signaling Engine
  useEffect(() => {
    if (!inCall || !activeRoomCode) return;

    const currentRoom = activeRoomCode;
    const userName = user
      ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.username
      : 'Participant';
    const userPayload = {
      id: user?.id || Date.now(),
      name: userName,
      role: userRole,
      student_roll: user?.rollNumber || user?.roll_number || ''
    };

    // Multi-tab fallback channel
    const bc = new BroadcastChannel(`uniserve_meet_${currentRoom}`);
    broadcastChannelRef.current = bc;

    // Connect Socket.io client
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = socket;

    // Helper: Initialize RTCPeerConnection with STUN server configuration
    const createPeerConnection = (targetSocketId = null) => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServers,
        iceCandidatePoolSize: 10
      });
      peerConnectionRef.current = pc;

      // Add local audio and video tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Remote stream arrival
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setHasRemotePeer(true);
        }
      };

      // ICE Candidate generation
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

      // Connection status observer
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setHasRemotePeer(true);
        } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setHasRemotePeer(false);
        }
      };

      return pc;
    };

    // Helper: Send WebRTC SDP Offer
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

    // Helper: Handle incoming WebRTC SDP and ICE signals
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
        console.warn('WebRTC signal processing error:', err);
      }
    };

    // Socket Connection Event Handlers
    socket.on('connect', () => {
      // If student is entering a panel meet, wait in lobby until host admits
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
        // Hosts and admitted participants enter room directly
        socket.emit('join-room', {
          roomId: currentRoom,
          user: userPayload
        });
      }
    });

    // Remote peer joined
    socket.on('user-joined', ({ socketId, user: joinedUser }) => {
      setRemotePeerInfo(joinedUser);
      sendOffer(socketId);
    });

    // Initial peer roster
    socket.on('room-users', ({ peers }) => {
      if (peers && peers.length > 0) {
        setRemotePeerInfo(peers[0]);
        sendOffer(peers[0].socketId);
      }
    });

    // Incoming WebRTC signal from socket
    socket.on('webrtc-signal', ({ senderSocketId, signalData, senderInfo }) => {
      handleSignal(signalData, senderInfo, senderSocketId);
    });

    // Host receives candidate in lobby
    socket.on('candidate-waiting', ({ socketId, candidate }) => {
      setWaitingCandidates((prev) => {
        if (prev.some((c) => c.socketId === socketId)) return prev;
        return [...prev, { socketId, ...candidate }];
      });
    });

    // Student receives host admission confirmation
    socket.on('candidate-admitted', () => {
      setIsWaitingInLobby(false);
      setWasAdmitted(true);
      socket.emit('join-room', {
        roomId: currentRoom,
        user: userPayload
      });
      sendOffer();
    });

    // Student receives denial notice
    socket.on('candidate-denied', () => {
      showToast('Admission was declined by the session host.', 'error');
      setInCall(false);
      setActiveRoomCode('');
    });

    // Real-time chat messages
    socket.on('new-chat', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Hand raised broadcast
    socket.on('user-hand-raised', ({ userName: handUser, raised }) => {
      if (raised) {
        showToast(`${handUser} raised their hand`, 'info');
      }
    });

    // Peer media toggle state
    socket.on('peer-media-toggle', ({ type, enabled }) => {
      setRemoteMediaStatus((prev) => ({
        ...prev,
        [type]: enabled
      }));
    });

    // Peer left
    socket.on('user-left', () => {
      setHasRemotePeer(false);
      setRemotePeerInfo(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // BroadcastChannel cross-tab listener
    bc.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'SIGNAL') {
        handleSignal(data.payload, data.senderInfo, data.payload.senderSocketId);
      } else if (data.type === 'CANDIDATE_WAITING') {
        if (canCreate) {
          setWaitingCandidates((prev) => {
            if (prev.some((c) => c.name === data.candidate.name)) return prev;
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
        setChatMessages((prev) => [...prev, data.message]);
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
  }, [inCall, activeRoomCode, isStudent, wasAdmitted, canCreate, user, userRole, iceServers]);

  // 8. Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const nextState = !cameraOn;
      videoTracks.forEach((t) => {
        t.enabled = nextState;
      });
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

  // 9. Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextState = !micOn;
      audioTracks.forEach((t) => {
        t.enabled = nextState;
      });
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

  // 10. Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
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
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
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

  // 11. Toggle Hand Raise
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

  // 12. Send In-Call Chat Message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderName: user
        ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.username
        : 'You',
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
      setChatMessages((prev) => [...prev, newMsg]);
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
    setWaitingCandidates((prev) => prev.filter((c) => c.socketId !== candidate.socketId));
    setHasRemotePeer(true);
    setRemotePeerInfo(candidate);
    showToast(`Admitted ${candidate.name} to the session.`, 'success');
  };

  // 14. Host Denies Candidate
  const handleDenyCandidate = (candidate) => {
    if (socketRef.current) {
      socketRef.current.emit('deny-candidate', {
        roomId: activeRoomCode,
        candidateSocketId: candidate.socketId
      });
    }
    setWaitingCandidates((prev) => prev.filter((c) => c.socketId !== candidate.socketId));
    showToast(`Declined admission for ${candidate.name}.`, 'info');
  };

  // 15. Auto-Generate Custom Room Code
  const handleGenerateRoomCode = () => {
    const topicSlug = (formData.topic || 'tech')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 4);
    const rand = Math.random().toString(36).substring(2, 6);
    setFormData((prev) => ({ ...prev, custom_code: `meet-${topicSlug}-${rand}` }));
  };

  // 16. Create Interview Meeting (Admin / Staff Workflow)
  const handleCreateMeeting = async (e, launchImmediately = false) => {
    if (e) e.preventDefault();
    if (!canCreate) {
      showToast('Only authorized placement officers or faculty can schedule interview meetings.', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showToast('Please enter an interview title.', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await apiClient.post('/mock-interviews', formData);
      const created = res.data.data;
      showToast(`Interview meeting scheduled: ${created.room_code}`, 'success');

      // Reset form title and code
      setFormData((prev) => ({
        ...prev,
        title: '',
        custom_code: ''
      }));

      fetchScheduled();

      if (launchImmediately) {
        setActiveRoomCode(created.room_code);
        setInCall(true);
        navigate(`/interview/room/${created.room_code}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create mock interview meeting.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // 17. Delete / Cancel Scheduled Meeting
  const handleDeleteMeeting = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel and remove "${title}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/mock-interviews/${id}`);
      showToast('Interview meeting record removed.', 'info');
      fetchScheduled();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove meeting.', 'error');
    }
  };

  // 18. Submit Candidate Evaluation Scorecard
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setSubmittingEval(true);
    try {
      const idToEvaluate = interviewDetails?.id || activeRoomCode;
      await apiClient.put(`/mock-interviews/${idToEvaluate}/evaluate`, evalForm);
      setEvalSuccess(true);
      showToast('Evaluation scorecard recorded successfully.', 'success');
      setTimeout(() => {
        setEvalSuccess(false);
        setActivePanel(null);
      }, 2000);
      fetchScheduled();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record candidate score.', 'error');
    } finally {
      setSubmittingEval(false);
    }
  };

  // 19. Copy Meeting Link
  const handleCopyCode = (code = activeRoomCode) => {
    const fullUrl = `${window.location.origin}/interview/room/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(true);
    showToast(`Meeting link copied: ${code}`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // 20. End / Leave Call
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

  // 21. Join by Custom Code
  const handleJoinByCode = (code) => {
    const cleanCode = (code || inputCode).trim();
    if (!cleanCode) return;
    setActiveRoomCode(cleanCode);
    setInCall(true);
    navigate(`/interview/room/${cleanCode}`);
  };

  // Simulated Live Technical Transcription
  useEffect(() => {
    let captionInterval;
    if (captionOn) {
      const phrases = [
        "Interviewer: 'Could you explain how you would design a scalable URL shortener with distributed hashing?'",
        "Candidate: 'I would employ MurmurHash with a base62 encoding and Redis cluster for LRU caching.'",
        "Interviewer: 'What is the time complexity of lookup in your proposed solution?'",
        "Candidate: 'Constant O(1) time complexity with negligible collision probability.'",
        "Interviewer: 'Proceed to implementing the data model and connection pooling.'"
      ];
      let idx = 0;
      setCurrentCaption(phrases[0]);
      captionInterval = setInterval(() => {
        idx = (idx + 1) % phrases.length;
        setCurrentCaption(phrases[idx]);
      }, 4000);
    } else {
      setCurrentCaption('');
    }
    return () => clearInterval(captionInterval);
  }, [captionOn]);

  // Filtered Scheduled Interviews
  const filteredInterviews = useMemo(() => {
    return scheduledInterviews.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.room_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [scheduledInterviews, searchQuery, statusFilter]);

  // Status Metrics
  const metrics = useMemo(() => {
    const total = scheduledInterviews.length;
    const scheduled = scheduledInterviews.filter((i) => i.status === 'SCHEDULED').length;
    const completed = scheduledInterviews.filter((i) => i.status === 'COMPLETED').length;
    return { total, scheduled, completed };
  }, [scheduledInterviews]);

  // =========================================================================
  // VIEW A: LOBBY & MANAGEMENT WORKSPACE (When not inside a call)
  // For Admin: CREATION FIRST, then already created meetings
  // =========================================================================
  if (!inCall) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
        {/* Toast Notification Banner */}
        {feedbackToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              feedbackToast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
                : feedbackToast.type === 'error'
                ? 'bg-slate-900 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-blue-400 border-blue-500/40'
            }`}
          >
            {feedbackToast.type === 'success' && <Check size={14} />}
            {feedbackToast.type === 'error' && <AlertTriangle size={14} />}
            {feedbackToast.type === 'info' && <Info size={14} />}
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              to="/interviews"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Back to Interview Roster"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Video size={16} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                  Virtual Technical Interview Console
                </h1>
                <span className="text-[10px] text-slate-400 font-medium">
                  WebRTC P2P Signaling Architecture
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Authenticated:</span>
              <span className="font-semibold text-white">{user?.firstName || user?.username}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-blue-300">
                {userRole}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <Shield size={12} className="text-emerald-400" />
              <span className="font-mono text-[11px]">STUN Active</span>
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-8">
          {/* ================================================================= */}
          {/* 1. FOR ADMIN / PLACEMENT / FACULTY: SHOW CREATION FIRST!          */}
          {/* ================================================================= */}
          {canCreate && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                    <Sparkles size={12} />
                    <span>Executive Interview Management</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Schedule New Interview Session
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure technical interview specifications, select candidates, and generate encrypted WebRTC room links.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateRoomCode}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Generate Room Code
                  </button>
                </div>
              </div>

              {/* Inline Creation Form */}
              <form onSubmit={(e) => handleCreateMeeting(e, false)} className="pt-6 space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="lg:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Interview Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amazon SDE-1 Technical Round - System Design"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Technical Topic */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Domain / Assessment Track <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Data Structures and Algorithms">Data Structures and Algorithms</option>
                      <option value="System Design and Scalability">System Design and Scalability</option>
                      <option value="Cloud Architecture and DSA">Cloud Architecture and DSA</option>
                      <option value="Full Stack and React/Node">Full Stack and React/Node</option>
                      <option value="Core CS and Operating Systems">Core CS and Operating Systems</option>
                      <option value="HR and Leadership Competencies">HR and Leadership Competencies</option>
                    </select>
                  </div>

                  {/* Candidate Selection */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-300">
                        Candidate Student <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomStudentMode(!customStudentMode)}
                        className="text-[11px] text-blue-400 hover:underline"
                      >
                        {customStudentMode ? 'Select from Roster' : 'Manual Entry'}
                      </button>
                    </div>

                    {!customStudentMode && studentOptions.length > 0 ? (
                      <select
                        value={formData.student_name}
                        onChange={(e) => {
                          const selected = studentOptions.find(
                            (s) => `${s.first_name} ${s.last_name}`.trim() === e.target.value
                          );
                          setFormData({
                            ...formData,
                            student_id: selected?.id || '',
                            student_name: e.target.value,
                            student_roll: selected?.roll_number || '2023CSE001'
                          });
                        }}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        {studentOptions.map((s) => (
                          <option
                            key={s.id}
                            value={`${s.first_name} ${s.last_name}`.trim()}
                          >
                            {s.first_name} {s.last_name} ({s.roll_number || s.department_code || 'Candidate'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Candidate Name e.g. Varun Murugesh"
                          value={formData.student_name}
                          onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Roll Number e.g. 2023CSE045"
                          value={formData.student_roll}
                          onChange={(e) => setFormData({ ...formData, student_roll: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Room Code */}
                  <div className="lg:col-span-3">
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Room Code (Custom or Auto-Generated)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Leave blank for automatic format (e.g. meet-dsa-4x9a)"
                        value={formData.custom_code}
                        onChange={(e) => setFormData({ ...formData, custom_code: e.target.value })}
                        className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateRoomCode}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold text-slate-300 transition-colors"
                      >
                        Auto-Format
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
                    <span>Schedule for Later</span>
                  </button>

                  <button
                    type="button"
                    disabled={creating}
                    onClick={(e) => handleCreateMeeting(e, true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <Video size={14} />}
                    <span>Schedule & Launch Room Now</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ================================================================= */}
          {/* 2. FOR STUDENTS (OR NON-ADMIN): QUICK JOIN + HARDWARE MIRROR      */}
          {/* ================================================================= */}
          {!canCreate && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left: Quick Join by Code */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <UserCheck size={13} />
                    <span>Student Interview Portal</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Join Scheduled Technical Interview
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Enter your assigned meeting code or select an upcoming interview round below. Please verify audio and camera readiness before joining.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-800/60 border border-slate-750 p-4 rounded-xl">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Have an interview code or meeting link?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Enter room code (e.g. meet-dsa-x94)"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
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
                </div>
              </div>

              {/* Right: Camera & Mic Self-Check Mirror */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Hardware Readiness Check</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Test audio and video feed before joining panel</p>
                </div>

                <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
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
                      <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-2 border border-slate-700">
                        <VideoOff size={22} />
                      </div>
                      <p className="text-xs font-semibold text-slate-300">Camera is off</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Toggle camera button below to preview</p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 ${
                        micOn ? 'bg-black/70 text-emerald-400' : 'bg-rose-500/80 text-white'
                      }`}
                    >
                      {micOn ? <Mic size={11} /> : <MicOff size={11} />}
                      <span>{micOn ? 'Microphone Active' : 'Microphone Muted'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                      micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                    }`}
                    title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                      cameraOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                    }`}
                    title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. ALREADY CREATED MEETINGS ROSTER (For Admin & Candidates)       */}
          {/* ================================================================= */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  <span>
                    {canCreate ? 'Already Created & Scheduled Meetings' : 'My Scheduled Interview Sessions'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {canCreate
                    ? 'Manage ongoing rounds, copy room access links, or launch evaluations.'
                    : 'Upcoming virtual rounds assigned to your student profile.'}
                </p>
              </div>

              {/* Status Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, room or candidate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                  {['ALL', 'SCHEDULED', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={fetchScheduled}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                  title="Refresh Roster"
                >
                  <RefreshCw size={14} className={loadingSchedule ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Total Recorded:</span>
                <span className="font-bold text-white font-mono text-sm">{metrics.total}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Scheduled:</span>
                <span className="font-bold text-blue-400 font-mono text-sm">{metrics.scheduled}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Completed:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{metrics.completed}</span>
              </div>
            </div>

            {/* Meeting Cards Grid */}
            {loadingSchedule ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80 animate-pulse">
                Synchronizing interview sessions...
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
                <Video size={28} className="mx-auto text-slate-600" />
                <p className="text-xs font-medium">No matching interview sessions found.</p>
                {canCreate && (
                  <p className="text-[11px] text-slate-500">
                    Use the creation form above to schedule your first mock interview.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInterviews.map((item) => (
                  <div
                    key={item.id || item.room_code}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {item.topic || 'Technical Interview'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.status || 'SCHEDULED'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>

                      <div className="text-xs text-slate-300 space-y-0.5">
                        <p>
                          Candidate: <strong className="text-white">{item.student_name}</strong>{' '}
                          {item.student_roll ? `(${item.student_roll})` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Interviewer: {item.interviewer_name}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl space-y-1.5 text-[11px] border border-slate-800">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} className="text-blue-400" /> Slot:
                        </span>
                        <span className="font-mono text-slate-200">
                          {item.scheduled_at
                            ? new Date(item.scheduled_at).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : 'Flexible Slot'}
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

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJoinByCode(item.room_code)}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-transform active:scale-95"
                      >
                        <Video size={13} />
                        <span>Join Room</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(item.room_code)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700/60"
                        title="Copy Meeting Link"
                      >
                        <Copy size={14} />
                      </button>

                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(item.id, item.title)}
                          className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700/60"
                          title="Remove Meeting Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: ACTIVE GOOGLE MEET / ENTERPRISE VIDEO CALL ROOM
  // Full-Screen WebRTC UI (No emojis, sleek modern dark design)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#1c1d1f] text-white flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Toast Notification Banner in call */}
      {feedbackToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white shadow-2xl animate-in fade-in">
          {feedbackToast.message}
        </div>
      )}

      {/* 1. Header Bar */}
      <header className="h-16 px-6 flex items-center justify-between z-10 shrink-0 border-b border-white/5 bg-[#1c1d1f]/90 backdrop-blur-sm">
        {/* Left: Clock, Meeting Title */}
        <div className="flex items-center gap-3 text-sm text-[#e8eaed] truncate max-w-xl">
          <span className="font-mono text-xs text-slate-400">{currentTime}</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold tracking-tight truncate text-xs sm:text-sm">
            {interviewDetails?.title || `Technical Interview - ${activeRoomCode}`}
          </span>
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'info' ? null : 'info')}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Meeting Information"
          >
            <Info size={15} />
          </button>
        </div>

        {/* Center / Right: Evaluation Button, Admission Controls, Participant Icons */}
        <div className="flex items-center gap-2.5">
          {canCreate && (
            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'evaluate' ? null : 'evaluate')}
              className="h-8 px-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full flex items-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Award size={14} />
              <span>Evaluate Candidate</span>
            </button>
          )}

          {/* Connection Status Pill */}
          {hasRemotePeer || wasAdmitted ? (
            <div className="h-8 px-3 bg-emerald-950/80 text-emerald-300 rounded-full flex items-center gap-1.5 text-xs font-medium border border-emerald-500/30">
              <Check size={13} strokeWidth={2.5} />
              <span>{canCreate ? 'Candidate Connected' : 'Interviewer Connected'}</span>
            </div>
          ) : isWaitingInLobby ? (
            <div className="h-8 px-3 bg-amber-500/20 text-amber-300 rounded-full flex items-center gap-1.5 text-xs font-medium border border-amber-500/30">
              <Clock size={13} />
              <span>Waiting for Host Admission...</span>
            </div>
          ) : waitingCandidates.length > 0 ? (
            <button
              type="button"
              onClick={() => handleAdmitCandidate(waitingCandidates[0])}
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow"
            >
              <Users size={13} />
              <span>Admit {waitingCandidates[0]?.name || 'Candidate'}</span>
            </button>
          ) : (
            <div className="h-8 px-3 bg-slate-800 text-slate-300 rounded-full flex items-center gap-1.5 text-xs font-medium border border-slate-700">
              <Users size={13} />
              <span>1 Participant (You)</span>
            </div>
          )}

          {/* Participant Avatars */}
          <div className="flex items-center gap-1.5 pl-1">
            <div
              className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-inner"
              title={`${user?.firstName || 'You'} (${userRole})`}
            >
              {(user?.firstName || 'U')[0].toUpperCase()}
            </div>
            {hasRemotePeer && (
              <div
                className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs shadow-inner"
                title={remotePeerInfo?.name || 'Remote Peer'}
              >
                {(remotePeerInfo?.name || 'P')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Video Viewport */}
      <main className="flex-1 relative mx-4 my-2 min-h-0 flex items-center justify-center">
        <div className="relative w-full h-full max-h-[84vh] max-w-[1360px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5">
          {/* Waiting in Lobby View for Student */}
          {isStudent && isWaitingInLobby && !hasRemotePeer ? (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Clock size={28} className="animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Interview Session Waiting Room</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You are standing by in the interview room lobby. The panel interviewer has been notified and will admit you shortly.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                Room: {activeRoomCode}
              </div>
            </div>
          ) : hasRemotePeer ? (
            /* Connected Mode: Primary Remote Stream + Picture-in-Picture Local */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />

              {/* Remote Peer Overlay Tag */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-lg text-xs font-semibold text-white border border-white/10 shadow-sm">
                {!remoteMediaStatus.mic && <MicOff size={13} className="text-rose-400" />}
                <span>{remotePeerInfo?.name || 'Candidate / Panel'}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">
                  {remotePeerInfo?.role || 'CONNECTED'}
                </span>
              </div>

              {/* Floating Self-View (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 z-20 w-48 sm:w-64 aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                {cameraOn && !cameraError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      {(user?.firstName || 'Y')[0]}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Camera off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 rounded text-[10px] font-medium text-white">
                  {!micOn && <MicOff size={10} className="text-rose-400" />}
                  <span>You</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Participant Mode */
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
                  <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg border-4 border-blue-400/20">
                    {(user?.firstName || 'U')[0]}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {user?.firstName || 'You'} ({userRole})
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cameraError ? 'Virtual avatar active (Camera access unavailable)' : 'Camera is currently off'}
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white border border-white/10 shadow-sm">
                {!micOn && <MicOff size={13} className="text-rose-400" />}
                <span>{user?.firstName || 'You'} (You)</span>
              </div>
            </div>
          )}

          {/* Screen Share Active Banner */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-semibold shadow-md">
              <ScreenShare size={14} />
              <span>Presenting screen to interview session</span>
            </div>
          )}

          {/* Hand Raised Banner */}
          {handRaised && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md">
              <Hand size={14} />
              <span>Hand raised</span>
            </div>
          )}

          {/* Live Captions */}
          {captionOn && currentCaption && (
            <div className="absolute bottom-16 inset-x-8 z-20 flex justify-center">
              <div className="max-w-2xl bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 text-center shadow-2xl">
                <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
                  {currentCaption}
                </span>
              </div>
            </div>
          )}

          {/* Host Candidate Admission Card */}
          {canCreate && waitingCandidates.length > 0 && (
            <div className="absolute top-5 right-5 z-30 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Waiting in Lobby</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
                      Host Action
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Candidate requested admission</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaitingCandidates([])}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {waitingCandidates.map((cand) => (
                <div key={cand.socketId} className="pt-3 space-y-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {(cand.name || 'C')[0]}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{cand.name || 'Candidate'}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {cand.student_roll ? `Roll: ${cand.student_roll}` : 'Student Candidate'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdmitCandidate(cand)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Admit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDenyCandidate(cand)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide-Over Right Panel (Chat / People / Info / Evaluation) */}
        {activePanel && (
          <aside className="w-80 sm:w-96 h-full max-h-[84vh] bg-slate-900 border border-slate-800 rounded-2xl ml-3 shadow-2xl flex flex-col justify-between overflow-hidden z-20">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                {activePanel === 'chat' && <MessageSquare size={15} className="text-blue-400" />}
                {activePanel === 'people' && <Users size={15} className="text-emerald-400" />}
                {activePanel === 'info' && <Info size={15} className="text-amber-400" />}
                {activePanel === 'evaluate' && <Award size={15} className="text-orange-400" />}
                <span>
                  {activePanel === 'chat' && 'In-Call Messages'}
                  {activePanel === 'people' && 'Meeting Participants'}
                  {activePanel === 'info' && 'Session Specifications'}
                  {activePanel === 'evaluate' && 'Candidate Evaluation Scorecard'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {/* CHAT */}
              {activePanel === 'chat' && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                    Real-time messages sent to this interview room.
                  </div>
                  <div className="space-y-3">
                    {chatMessages.map((m) => (
                      <div key={m.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{m.senderName}</span>
                          <span className="text-slate-500 text-[10px]">{m.time}</span>
                        </div>
                        <div className="p-2.5 bg-slate-800 rounded-xl text-slate-200 text-xs">
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PEOPLE */}
              {activePanel === 'people' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        {(user?.firstName || 'U')[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user?.firstName || 'You'} (You)</p>
                        <p className="text-[10px] text-slate-400">{userRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {micOn ? <Mic size={13} className="text-emerald-400" /> : <MicOff size={13} className="text-rose-400" />}
                      {cameraOn ? <Video size={13} className="text-emerald-400" /> : <VideoOff size={13} className="text-rose-400" />}
                    </div>
                  </div>

                  {hasRemotePeer && (
                    <div className="p-2.5 bg-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                          {(remotePeerInfo?.name || 'P')[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{remotePeerInfo?.name || 'Remote Peer'}</p>
                          <p className="text-[10px] text-slate-400">{remotePeerInfo?.role || 'CONNECTED'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        {remoteMediaStatus.mic ? <Mic size={13} className="text-emerald-400" /> : <MicOff size={13} className="text-rose-400" />}
                        {remoteMediaStatus.video ? <Video size={13} className="text-emerald-400" /> : <VideoOff size={13} className="text-rose-400" />}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INFO */}
              {activePanel === 'info' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-800 rounded-xl space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Assessment Track:</span>
                      <span className="font-semibold text-white">{interviewDetails?.topic || 'Technical Coding'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Room Code:</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeRoomCode}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Encrypted WebRTC Connection:</span>
                      <span className="text-slate-300 font-mono text-[11px]">DTLS-SRTP P2P</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <CheckCheck size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Meeting Link Copied' : 'Copy Meeting Link'}</span>
                  </button>
                </div>
              )}

              {/* EVALUATION */}
              {activePanel === 'evaluate' && (
                <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                  {evalSuccess && (
                    <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 text-center font-bold">
                      Evaluation score saved to database.
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Technical Score (1.0 to 5.0)
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
                      Decision Recommendation
                    </label>
                    <select
                      value={evalForm.decision}
                      onChange={(e) => setEvalForm({ ...evalForm, decision: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                    >
                      <option value="RECOMMENDED">RECOMMENDED (Advance to Offer)</option>
                      <option value="ON_HOLD">ON HOLD (Requires Second Round)</option>
                      <option value="NOT_RECOMMENDED">NOT RECOMMENDED (Reject)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Interviewer Observations & Feedback
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Candidate demonstrated strong grasp of DSA and clean system architecture conventions..."
                      value={evalForm.feedback}
                      onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEval}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {submittingEval ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
                    <span>Submit Evaluation Scorecard</span>
                  </button>
                </form>
              )}
            </div>

            {/* Chat Input */}
            {activePanel === 'chat' && (
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-900">
                <input
                  type="text"
                  placeholder="Send a message to meeting..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
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

      {/* 3. Bottom Action Controls Bar */}
      <footer className="h-20 px-6 flex items-center justify-between shrink-0 z-10 border-t border-white/5 bg-[#1c1d1f]">
        {/* Left: Room Code & Link Copy */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 min-w-[200px]">
          <span>Room Code:</span>
          <span className="font-mono text-white font-semibold">{activeRoomCode}</span>
          <button
            type="button"
            onClick={() => handleCopyCode()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 ml-1 transition-colors"
            title="Copy Meeting Link"
          >
            {copiedCode ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Center: In-Call Action Pill Buttons */}
        <div className="flex items-center gap-2.5 mx-auto">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              cameraOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <StopCircle size={18} /> : <ScreenShare size={18} />}
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={toggleHandRaise}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              handRaised ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand size={18} />
          </button>

          {/* Live Captions (CC) */}
          <button
            type="button"
            onClick={() => setCaptionOn(!captionOn)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer font-bold text-xs shadow-md ${
              captionOn ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Toggle Live Technical Subtitles"
          >
            CC
          </button>

          {/* Leave Call */}
          <button
            type="button"
            onClick={handleLeaveCall}
            className="h-11 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors cursor-pointer ml-1 shadow-lg font-bold gap-2"
            title="Leave Session"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline text-xs">Leave</span>
          </button>
        </div>

        {/* Right: Drawer Toggles */}
        <div className="hidden sm:flex items-center gap-1.5 justify-end min-w-[200px]">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'info' ? null : 'info')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activePanel === 'info' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title="Meeting Specifications"
          >
            <Info size={18} />
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'people' ? null : 'people')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activePanel === 'people' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title="Participant Roster"
          >
            <Users size={18} />
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
              activePanel === 'chat' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title="In-Call Messages"
          >
            <MessageSquare size={18} />
          </button>

          <button
            type="button"
            onClick={() => showToast('End-to-end WebRTC DTLS/SRTP encryption is active.', 'info')}
            className="w-10 h-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Security Architecture"
          >
            <Shield size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
export default InterviewRoomPage;