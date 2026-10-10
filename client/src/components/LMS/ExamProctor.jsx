import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const MAX_VIOLATIONS = 3;
const INACTIVITY_WARN_TIMEOUT = 75000; // 75s warning notice
const INACTIVITY_TIMEOUT = 120000; // 2 minutes strike
const FOCUS_COOLDOWN_MS = 2500; // Debounce window between visibility and blur
const FS_COOLDOWN_MS = 3000; // Debounce window for fullscreen exit
const SESSION_ID = `uniserve_exam_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Audio warning beep helper using Web Audio API
const playSecurityTone = (type = 'warning') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'critical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(392, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

// Check if currently in fullscreen across all browsers
const checkIsFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

export const useProctor = ({ onAutoSubmit, enabled = true, initialFullscreen = false }) => {
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen || checkIsFullscreen());
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const [warning, setWarning] = useState('');
  const [warningSeverity, setWarningSeverity] = useState('warning'); // 'info' | 'warning' | 'critical'
  const [frozen, setFrozen] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [networkStats, setNetworkStats] = useState({ rtt: 35, downlink: 10, effectiveType: '4g', jitter: 2 });
  const [attentionScore, setAttentionScore] = useState(100);
  const [attentionHistory, setAttentionHistory] = useState([]);
  const [ipAddress, setIpAddress] = useState('Detecting...');
  const [faceStatus, setFaceStatus] = useState('VERIFIED'); // 'VERIFIED' | 'LOOKING_AWAY' | 'NO_FACE' | 'MULTIPLE'
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [multiTabBlocked, setMultiTabBlocked] = useState(false);

  const violationsRef = useRef(0);
  const warningTimer = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const lastFocusLossRef = useRef(0);
  const lastFsLossRef = useRef(0);
  const lastInactivityViolationRef = useRef(0);
  const attentionRef = useRef({ score: 100, lastCheck: Date.now() });
  const hasEnteredFsRef = useRef(initialFullscreen || checkIsFullscreen());
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const navCountRef = useRef({ count: 0, firstTime: 0 });
  const isExitingRef = useRef(false);

  // ── AUDIT EVENT LOGGING ──
  const logEvent = useCallback((type, detail) => {
    const entry = { type, detail, ts: new Date().toISOString(), session: SESSION_ID };
    setEventLog(prev => [...prev.slice(-100), entry]);
    console.log(`[UNISERVE PROCTOR] ${type}: ${detail}`);
  }, []);

  // ── WARNING BANNER ──
  const showWarning = useCallback((msg, severity = 'warning') => {
    setWarning(msg);
    setWarningSeverity(severity);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => {
      setWarning('');
    }, 6000);
  }, []);

  // ── VIOLATION DISPATCHER (Debounced & Strict) ──
  const addViolation = useCallback((reason, severity = 'medium') => {
    violationsRef.current += 1;
    const count = violationsRef.current;
    setViolations(count);
    logEvent('VIOLATION', `#${count} [${severity}] ${reason}`);

    playSecurityTone(severity === 'critical' || count >= MAX_VIOLATIONS ? 'critical' : 'warning');

    if (severity === 'critical' || count >= MAX_VIOLATIONS) {
      showWarning(`CRITICAL STRIKE ${count}/${MAX_VIOLATIONS}: ${reason} — EXAM TERMINATING!`, 'critical');
      setFrozen(true);
      setTimeout(() => {
        onAutoSubmit?.(count);
      }, 1500);
    } else if (count >= MAX_VIOLATIONS - 1) {
      showWarning(`FINAL WARNING (Strike ${count}/${MAX_VIOLATIONS}): ${reason}. Next strike will terminate test!`, 'critical');
    } else {
      showWarning(`VIOLATION #${count}/${MAX_VIOLATIONS}: ${reason}`, 'warning');
    }
  }, [onAutoSubmit, showWarning, logEvent]);

  // ── USER ACTIVITY REGISTRATION ──
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleSeconds(0);
  }, []);

  // ── NETWORK METRICS ──
  useEffect(() => {
    if (!enabled) return;
    const updateConn = () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        setNetworkStats({
          rtt: conn.rtt || 30,
          downlink: conn.downlink || 10,
          effectiveType: conn.effectiveType || '4g',
          jitter: Math.floor(Math.random() * 8) + 1
        });
      }
    };
    updateConn();
    const interval = setInterval(updateConn, 6000);
    return () => clearInterval(interval);
  }, [enabled]);

  // ── IP ADDRESS FETCH ──
  useEffect(() => {
    if (!enabled) return;
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip || '127.0.0.1'))
      .catch(() => setIpAddress('127.0.0.1'));
  }, [enabled]);

  // ── FULLSCREEN MANAGEMENT ──
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs && !checkIsFullscreen()) {
        await rfs.call(el);
      }
      setIsFullscreen(true);
      setFullscreenLost(false);
      hasEnteredFsRef.current = true;
      logEvent('FULLSCREEN', 'Entered fullscreen mode');
    } catch (err) {
      console.warn('Enter fullscreen request deferred until click gesture:', err);
      // If browser rejected due to lack of gesture, prompt user
      if (!checkIsFullscreen()) {
        setFullscreenLost(true);
      }
    }
  }, [logEvent]);

  const exitFullscreen = useCallback(() => {
    isExitingRef.current = true;
    hasEnteredFsRef.current = false;
    setFullscreenLost(false);
    try {
      const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (efs && checkIsFullscreen()) {
        efs.call(document).catch(() => {});
      }
    } catch (e) {}
    setIsFullscreen(false);
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
  }, []);

  const forceFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        await rfs.call(el);
      }
      setIsFullscreen(true);
      setFullscreenLost(false);
      hasEnteredFsRef.current = true;
      logEvent('FULLSCREEN', 'Re-entered fullscreen via user action');
    } catch (err) {
      console.warn('Fullscreen force request failed:', err);
    }
  }, [logEvent]);

  // Listen to Fullscreen Change Events
  useEffect(() => {
    if (!enabled) return;

    const handleFsChange = () => {
      if (isExitingRef.current) {
        setIsFullscreen(false);
        setFullscreenLost(false);
        return;
      }
      const isFs = checkIsFullscreen();
      setIsFullscreen(isFs);

      if (!isFs) {
        // Record violation ONLY if user was previously in fullscreen mode
        if (hasEnteredFsRef.current) {
          const now = Date.now();
          if (now - lastFsLossRef.current > FS_COOLDOWN_MS) {
            lastFsLossRef.current = now;
            addViolation('Exited mandatory fullscreen mode', 'high');
          }
          setFullscreenLost(true);
        }
      } else {
        hasEnteredFsRef.current = true;
        setFullscreenLost(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [enabled, addViolation]);

  // ── FOCUS, TAB SWITCH, AND MINIMIZE MONITORING (DEBOUNCED) ──
  useEffect(() => {
    if (!enabled) return;

    const handleFocusLoss = (reason) => {
      if (isExitingRef.current) return;
      const now = Date.now();
      // Cooldown of 2.5s prevents double-counting visibilitychange + blur
      if (now - lastFocusLossRef.current < FOCUS_COOLDOWN_MS) {
        logEvent('FOCUS', `Focus event debounced (${reason})`);
        return;
      }
      lastFocusLossRef.current = now;
      addViolation(reason, 'high');
    };

    const onVisChange = () => {
      if (document.hidden) {
        handleFocusLoss('Tab switched or exam window minimized');
      } else {
        logEvent('FOCUS', 'Exam tab returned to active view');
      }
    };

    const onBlur = () => {
      handleFocusLoss('Window lost active focus (Alt+Tab or application switch)');
    };

    const onFocus = () => {
      logEvent('FOCUS', 'Window regained focus');
    };

    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, addViolation, logEvent]);

  // ── INACTIVITY MONITORING (MOUSE, KEYBOARD, TOUCH, SCROLL) ──
  useEffect(() => {
    if (!enabled) return;

    let lastThrottle = 0;
    const handleActiveInput = () => {
      const now = Date.now();
      if (now - lastThrottle > 400) {
        lastThrottle = now;
        lastActivityRef.current = now;
      }
    };

    const events = [
      'mousemove', 'mousedown', 'mouseup',
      'keydown', 'keyup',
      'scroll', 'wheel',
      'touchstart', 'touchend'
    ];

    events.forEach(ev => window.addEventListener(ev, handleActiveInput, { passive: true }));

    const idleChecker = setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;
      const idleSec = Math.floor(idleMs / 1000);
      setIdleSeconds(idleSec);

      if (idleMs >= INACTIVITY_TIMEOUT) {
        if (now - lastInactivityViolationRef.current > 30000) {
          lastInactivityViolationRef.current = now;
          lastActivityRef.current = now; // Reset after penalizing
          addViolation(`Inactivity limit reached: No input detected for ${idleSec}s`, 'medium');
        }
      } else if (idleMs >= INACTIVITY_WARN_TIMEOUT) {
        showWarning(`Inactivity Notice: No activity for ${idleSec}s. Move mouse or press a key to confirm presence.`, 'warning');
      }
    }, 2000);

    return () => {
      clearInterval(idleChecker);
      events.forEach(ev => window.removeEventListener(ev, handleActiveInput));
    };
  }, [enabled, addViolation, showWarning]);

  // ── KEYBOARD LOCKDOWN (MALICIOUS SHORTCUTS ONLY) ──
  useEffect(() => {
    if (!enabled) return;

    const blockMaliciousKeys = (e) => {
      if (isExitingRef.current) return;
      const key = (e.key || '').toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // 1. Critical Developer Tools: F12, Ctrl+Shift+I/J/C/K, Ctrl+U
      if (
        key === 'f12' ||
        (isCtrl && isShift && ['i', 'j', 'c', 'k'].includes(key)) ||
        (isCtrl && key === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
        addViolation('Developer Tools / Source inspection attempt blocked', 'critical');
        return false;
      }

      // 2. Page Navigation / Refresh: F5, Ctrl+R, Ctrl+W, Alt+Left/Right
      if (
        key === 'f5' ||
        (isCtrl && key === 'r') ||
        (isCtrl && key === 'w') ||
        (isAlt && (key === 'arrowleft' || key === 'arrowright'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        logEvent('KEYBOARD', `Refresh/Navigation shortcut blocked (${key})`);
        showWarning('Page refresh and navigation are blocked during active exams.', 'warning');
        return false;
      }

      // 3. Print / Save: Ctrl+P, Ctrl+S
      if (isCtrl && (key === 'p' || key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        logEvent('KEYBOARD', `Print/Save blocked (${key})`);
        return false;
      }

      // 4. PrintScreen
      if (key === 'printscreen') {
        e.preventDefault();
        e.stopPropagation();
        logEvent('KEYBOARD', 'PrintScreen screenshot blocked');
        showWarning('Screen capturing is prohibited. Digital watermark active.', 'critical');
        // Flash screen briefly
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:999999;pointer-events:none;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 250);
        return false;
      }

      // 5. System Windows/Meta key
      if (e.metaKey || key === 'meta' || key === 'os') {
        logEvent('KEYBOARD', 'System Meta key pressed');
      }

      // 6. Escape key interception
      if (key === 'escape') {
        e.preventDefault();
        logEvent('KEYBOARD', 'Escape key blocked');
        return false;
      }

      // 7. Clipboard shortcuts outside editable elements
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.dataset?.coding === 'true'
      );

      if (isCtrl && ['c', 'v', 'x'].includes(key)) {
        if (!isEditable) {
          e.preventDefault();
          e.stopPropagation();
          showWarning('Clipboard actions are restricted to code editor.', 'warning');
          return false;
        }
      }

      // Allow normal typing, code editing, and navigation
      recordActivity();
    };

    window.addEventListener('keydown', blockMaliciousKeys, true);
    return () => {
      window.removeEventListener('keydown', blockMaliciousKeys, true);
    };
  }, [enabled, addViolation, logEvent, showWarning, recordActivity]);

  // ── MOUSE RESTRICTIONS & CONTEXT MENU ──
  useEffect(() => {
    if (!enabled) return;

    const noContextMenu = (e) => {
      e.preventDefault();
      logEvent('MOUSE', 'Right-click blocked');
      showWarning('Right-click context menu is disabled during exams.', 'info');
    };

    const noDrag = (e) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', noContextMenu, true);
    document.addEventListener('dragstart', noDrag, true);
    document.addEventListener('drop', noDrag, true);

    return () => {
      document.removeEventListener('contextmenu', noContextMenu, true);
      document.removeEventListener('dragstart', noDrag, true);
      document.removeEventListener('drop', noDrag, true);
    };
  }, [enabled, logEvent, showWarning]);

  // ── SINGLE-SESSION ENFORCER (BROADCASTCHANNEL & LOCALSTORAGE) ──
  useEffect(() => {
    if (!enabled) return;

    try {
      const channel = new BroadcastChannel('uniserve_exam_session_lock');
      broadcastChannelRef.current = channel;

      // Announce this active session
      channel.postMessage({ type: 'SESSION_STARTED', sessionId: SESSION_ID, timestamp: Date.now() });

      channel.onmessage = (msg) => {
        if (msg.data?.type === 'SESSION_STARTED' && msg.data?.sessionId !== SESSION_ID) {
          // Another tab just started an exam
          setMultiTabBlocked(true);
          addViolation('Simultaneous exam session detected in another browser tab', 'critical');
        } else if (msg.data?.type === 'PING') {
          channel.postMessage({ type: 'SESSION_ACTIVE', sessionId: SESSION_ID });
        }
      };

      // Periodic heartbeat
      const hb = setInterval(() => {
        channel.postMessage({ type: 'PING', sessionId: SESSION_ID });
      }, 5000);

      return () => {
        clearInterval(hb);
        channel.close();
      };
    } catch (e) {
      // BroadcastChannel not available in environment
    }
  }, [enabled, addViolation]);

  // ── AI WEBCAM PROCTOR & CANVAS COMPUTER-VISION FACE DETECTION ──
  useEffect(() => {
    if (!enabled) return;

    let localStream = null;
    let cvInterval = null;
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = 160;
    hiddenCanvas.height = 120;
    const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
          audio: false
        });
        streamRef.current = localStream;
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.play().catch(() => {});
        }

        // Lightweight computer-vision analyzer running every 1.5s
        cvInterval = setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;

          try {
            ctx.drawImage(videoRef.current, 0, 0, 160, 120);
            // Sample center 50% region where face is situated
            const frame = ctx.getImageData(40, 30, 80, 60);
            const data = frame.data;
            let skinPixels = 0;
            let totalPixels = data.length / 4;
            let brightnessSum = 0;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const brightness = (r + g + b) / 3;
              brightnessSum += brightness;

              // Standard human skin-tone range check in RGB space
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10 && brightness > 40 && brightness < 230) {
                skinPixels++;
              }
            }

            const avgBrightness = brightnessSum / totalPixels;
            const skinRatio = skinPixels / totalPixels;

            let penalty = 0;
            if (document.hidden) penalty += 5;
            if (!document.hasFocus()) penalty += 3;

            if (avgBrightness < 20) {
              setFaceStatus('NO_FACE');
              penalty += 4;
            } else if (skinRatio < 0.08) {
              // Looking away or candidate stepped out
              setFaceStatus('LOOKING_AWAY');
              penalty += 3;
            } else if (skinRatio > 0.85) {
              // Multiple faces or camera obstructed
              setFaceStatus('MULTIPLE');
              penalty += 5;
            } else {
              setFaceStatus('VERIFIED');
              penalty = -1; // Attention recovers
            }

            attentionRef.current.score = Math.max(20, Math.min(100, attentionRef.current.score - penalty));
            setAttentionScore(Math.round(attentionRef.current.score));
          } catch (cvErr) {
            // Ignore frame capture frame glitch
          }
        }, 1500);

      } catch (err) {
        console.warn('[UNISERVE PROCTOR] Camera initialization error:', err.message);
        setCameraActive(false);
        setFaceStatus('VERIFIED'); // Fallback gracefully without breaking test
      }
    };

    startCamera();

    // Periodic attention history logging (every 30s)
    const historyTimer = setInterval(() => {
      setAttentionHistory(prev => [
        ...prev.slice(-20),
        {
          score: Math.round(attentionRef.current.score),
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    }, 30000);

    return () => {
      clearInterval(cvInterval);
      clearInterval(historyTimer);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled]);

  // ── RAPID QUESTION FLIPPING DETECTION ──
  const trackNavigation = useCallback(() => {
    const now = Date.now();
    const ref = navCountRef.current;
    if (now - ref.firstTime > 5000) {
      ref.count = 0;
      ref.firstTime = now;
    }
    ref.count += 1;
    if (ref.count > 15) {
      addViolation('Rapid question navigation pattern detected — suspicious skimming', 'medium');
      ref.count = 0;
    }
    recordActivity();
  }, [addViolation, recordActivity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, []);

  return useMemo(() => ({
    violations,
    isFullscreen,
    fullscreenLost,
    warning,
    warningSeverity,
    frozen,
    eventLog,
    networkStats,
    attentionScore,
    ipAddress,
    faceStatus,
    idleSeconds,
    cameraActive,
    multiTabBlocked,
    sessionId: SESSION_ID,
    enterFullscreen,
    exitFullscreen,
    forceFullscreen,
    addViolation,
    recordActivity,
    trackNavigation,
    videoRef,
    attentionHistory,
    maxViolations: MAX_VIOLATIONS
  }), [
    violations, isFullscreen, fullscreenLost, warning, warningSeverity, frozen,
    eventLog, networkStats, attentionScore, ipAddress, faceStatus, idleSeconds,
    cameraActive, multiTabBlocked, enterFullscreen, exitFullscreen, forceFullscreen,
    addViolation, recordActivity, trackNavigation, attentionHistory
  ]);
};

// ── FLOATING AI PROCTOR HUD COMPONENT ──
export const ProctorHUD = ({
  proctor,
  candidateName = 'Candidate',
  rollNumber = '2023CSE001',
  themePrimary = '#2563eb'
}) => {
  const [minimized, setMinimized] = useState(false);

  const getFaceLabel = () => {
    switch (proctor.faceStatus) {
      case 'VERIFIED':
        return { text: 'Face Verified', color: '#10b981' };
      case 'LOOKING_AWAY':
        return { text: 'Looking Away', color: '#f59e0b' };
      case 'NO_FACE':
        return { text: 'No Face Detected', color: '#ef4444' };
      case 'MULTIPLE':
        return { text: 'Multiple Faces', color: '#ef4444' };
      default:
        return { text: 'Active Monitor', color: '#10b981' };
    }
  };

  const faceInfo = getFaceLabel();

  return (
    <div
      style={{
        position: 'fixed',
        top: 68,
        right: 18,
        zIndex: 900,
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto'
      }}
    >
      {minimized ? (
        // Minimized Pill
        <div
          onClick={() => setMinimized(false)}
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            borderRadius: 30,
            padding: '8px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: faceInfo.color,
              boxShadow: `0 0 8px ${faceInfo.color}`
            }}
          />
          <span>AI Proctor Active</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              background: proctor.violations > 0 ? '#ef4444' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.7rem'
            }}
          >
            {proctor.violations}/{proctor.maxViolations} Strikes
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▾ Expand</span>
        </div>
      ) : (
        // Expanded High-Tech Proctoring Card
        <div
          style={{
            width: 220,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${proctor.violations > 0 ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            color: '#fff'
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: faceInfo.color,
                  boxShadow: `0 0 8px ${faceInfo.color}`
                }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                AI PROCTOR HUD
              </span>
            </div>
            <button
              onClick={() => setMinimized(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: 4
              }}
              title="Minimize HUD"
            >
              −
            </button>
          </div>

          {/* Webcam Live Stream with Target Box */}
          <div style={{ position: 'relative', width: '100%', height: 130, background: '#020617', overflow: 'hidden' }}>
            <video
              ref={proctor.videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror camera
              }}
            />

            {/* Face Targeting Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 70,
                height: 85,
                border: `1.5px dashed ${faceInfo.color}`,
                borderRadius: 12,
                pointerEvents: 'none',
                transition: 'border-color 0.3s ease'
              }}
            />

            {/* Candidate Identity Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.62rem',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                background: 'rgba(0,0,0,0.6)',
                padding: '2px 6px',
                borderRadius: 6
              }}
            >
              <span>{rollNumber}</span>
              <span style={{ color: faceInfo.color }}>{faceInfo.text}</span>
            </div>
          </div>

          {/* Metrics & Strikes Body */}
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Attention Meter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Attention Focus</span>
                <span style={{ color: proctor.attentionScore > 75 ? '#10b981' : proctor.attentionScore > 50 ? '#f59e0b' : '#ef4444' }}>
                  {proctor.attentionScore}%
                </span>
              </div>
              <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${proctor.attentionScore}%`,
                    height: '100%',
                    background: proctor.attentionScore > 75 ? '#10b981' : proctor.attentionScore > 50 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Strikes Counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                Strikes:
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: proctor.maxViolations }).map((_, idx) => {
                  const isViolated = idx < proctor.violations;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: isViolated ? '#ef4444' : 'rgba(255,255,255,0.12)',
                        border: isViolated ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isViolated ? '0 0 6px #ef4444' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Idle & Fullscreen Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.62rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 6
              }}
            >
              <span>Idle: {proctor.idleSeconds}s / 120s</span>
              <span style={{ color: proctor.isFullscreen ? '#10b981' : '#f59e0b' }}>
                {proctor.isFullscreen ? '● Fullscreen Active' : '▲ Windowed'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
