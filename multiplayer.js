/* Multiplayer — lobby + Socket.io (ต้องรันผ่าน npm start) */
(() => {
  const params = new URLSearchParams(location.search);
  const isHostPage = params.get('host') === '1' || params.get('role') === 'host';

  const lobbyEl = document.getElementById('lobby-overlay');
  const roomCodeEl = document.getElementById('lobby-room-code');
  const roomStatusEl = document.getElementById('lobby-status');
  const joinInput = document.getElementById('lobby-join-code');
  const btnCreate = document.getElementById('lobby-create');
  const btnJoin = document.getElementById('lobby-join');
  const btnStartGame = document.getElementById('lobby-start-game');
  const btnNextRound = document.getElementById('lobby-next-round');
  const hostPanel = document.getElementById('lobby-host-panel');
  const playerPanel = document.getElementById('lobby-player-panel');
  const joinPanel = document.getElementById('lobby-join-panel');

  if (!lobbyEl || typeof io === 'undefined') {
    console.warn('Multiplayer: เปิดผ่าน npm start เท่านั้น (http://localhost:3000)');
    return;
  }

  const socket = io();
  let isHost = isHostPage;
  let roomCode = '';
  let inGame = false;

  function setStatus(text) {
    if (roomStatusEl) roomStatusEl.textContent = text;
  }

  function showLobby() {
    lobbyEl.classList.remove('is-hidden');
  }

  function hideLobby() {
    lobbyEl.classList.add('is-hidden');
  }

  function updateLobbyUI(state) {
    if (roomCodeEl) roomCodeEl.textContent = state.code || roomCode;
    if (hostPanel) hostPanel.hidden = !isHost;
    if (playerPanel) playerPanel.hidden = isHost;
    if (joinPanel) joinPanel.hidden = !!roomCode;
    if (btnStartGame) btnStartGame.hidden = state.phase !== 'lobby';
    if (btnNextRound) btnNextRound.hidden = state.phase !== 'round_end';
    setStatus(
      `รอบ ${state.round || '-'} · ชั้น ${state.currentFloor} · ผู้เล่น ${state.playerCount} · vote ${state.votedCount}`
    );
  }

  function enterSummitScene(onReady) {
    if (document.body.classList.contains('is-arrived')) {
      onReady();
      return;
    }

    const doorCloseContainer = document.getElementById('door-close-container');
    const floorIndicatorContainer = document.querySelector('.floor-indicator-container');
    const controlPanel = document.querySelector('.control-panel-container');

    if (!doorCloseContainer) {
      document.body.classList.add('is-arrived');
      onReady();
      return;
    }

    const onEnd = (e) => {
      if (e.animationName !== 'doorCloseLeft' && e.animationName !== 'doorCloseRight') return;
      if (!doorCloseContainer._doorClosed) {
        doorCloseContainer._doorClosed = true;
        return;
      }
      document.body.classList.add('is-arrived');
      if (controlPanel) controlPanel.classList.add('is-hidden');
      if (floorIndicatorContainer) floorIndicatorContainer.classList.add('is-visible');
      doorCloseContainer.classList.replace('is-closing', 'is-shrinking');
      doorCloseContainer._doorClosed = false;
      setTimeout(() => {
        doorCloseContainer.classList.replace('is-shrinking', 'is-opening');
        doorCloseContainer.removeEventListener('animationend', onEnd);
        onReady();
      }, 700);
    };

    doorCloseContainer.addEventListener('animationend', onEnd);
    doorCloseContainer.classList.add('is-closing');
  }

  socket.on('room:joined', (state) => {
    roomCode = state.code;
    isHost = state.isHost;
    updateLobbyUI(state);
    setStatus(isHost ? `Host · ห้อง ${roomCode}` : `เข้าห้อง ${roomCode} แล้ว — รอ Host เริ่มเกม`);
  });

  socket.on('room:update', updateLobbyUI);
  socket.on('room:closed', (msg) => {
    alert(msg.message || 'ห้องปิดแล้ว');
    location.reload();
  });

  socket.on('game:started', (state) => {
    inGame = true;
    hideLobby();
    updateLobbyUI(state);
    if (window.setConeStep) window.setConeStep(state.coneStep);
    const overlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    if (overlay && startBtn && !document.body.classList.contains('doors-open')) {
      startBtn.click();
    }
  });

  socket.on('round:ready', (state) => {
    updateLobbyUI(state);
    hideLobby();
    const summitBtn = document.getElementById('summit-btn');
    if (summitBtn) {
      summitBtn.disabled = isHost ? false : true;
      summitBtn.querySelector('.summit-top').textContent = isHost ? 'SUMMIT' : 'SUMMIT';
    }
    document.querySelectorAll('.floor-btn').forEach((b) => {
      b.disabled = false;
      b.classList.remove('is-selected', 'is-dimmed');
    });
    if (window.resetPlayerVote) window.resetPlayerVote();
  });

  socket.on('vote:locked', ({ vote }) => {
    const summitBtn = document.getElementById('summit-btn');
    if (summitBtn) {
      summitBtn.disabled = true;
      summitBtn.querySelector('.summit-top').textContent = `ส่ง ${vote} แล้ว`;
    }
    document.querySelectorAll('.floor-btn').forEach((b) => { b.disabled = true; });
  });

  socket.on('round:animate', (payload) => {
    hideLobby();
    enterSummitScene(() => {
      if (window.setConeStep) window.setConeStep(payload.coneStep);
      if (window.playLiftPath) {
        window.playLiftPath(payload.path, () => {
          if (isHost) {
            showLobby();
            updateLobbyUI({ ...payload, phase: 'round_end', playerCount: 0, votedCount: 0, code: roomCode, currentFloor: payload.endFloor, round: payload.round });
            if (roomStatusEl) {
              roomStatusEl.textContent = `หยุดชั้น ${payload.endFloor} · ยอดรวม ${payload.roundTotal} · กด "รอบถัดไป"`;
            }
          }
        });
      }
    });
  });

  socket.on('game:over', (state) => {
    showLobby();
    setStatus(`Game Over — ถึงรอบสุดท้าย (ชั้น ${state.currentFloor})`);
    alert('Game Over!');
  });

  socket.on('error', (err) => {
    alert(err.message || 'เกิดข้อผิดพลาด');
  });

  btnCreate?.addEventListener('click', () => {
    isHost = true;
    socket.emit('room:create');
  });

  btnJoin?.addEventListener('click', () => {
    const code = (joinInput?.value || '').trim();
    if (!code) return alert('ใส่รหัสห้อง');
    isHost = false;
    socket.emit('room:join', { code });
  });

  btnStartGame?.addEventListener('click', () => {
    socket.emit('game:start');
  });

  btnNextRound?.addEventListener('click', () => {
    socket.emit('round:next');
  });

  window.multiplayer = {
    isHost: () => isHost,
    inGame: () => inGame,
    submitVote: (vote) => socket.emit('vote:submit', { vote }),
    processRound: () => socket.emit('round:process'),
  };

  showLobby();
  if (isHostPage) {
    if (joinPanel) joinPanel.hidden = true;
    socket.emit('room:create');
  }
})();
