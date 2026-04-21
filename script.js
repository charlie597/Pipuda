// WebSocket connection
const socket = new WebSocket('ws://localhost:8080'); // Change to your server URL
let playerId = null;
let players = {};

// DOM elements
const player = document.getElementById('player');
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('sizeSlider');
const shapeSelect = document.getElementById('shapeSelect');
const statusElement = document.getElementById('status');

// Player state
let playerState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  color: '#3498db',
  size: 40,
  shape: 'circle'
};

// Initialize player
function initPlayer() {
  updatePlayer();
  
  // Setup event listeners
  colorPicker.addEventListener('input', (e) => {
    playerState.color = e.target.value;
    socket.send(JSON.stringify({
      type: 'playerUpdate',
      data: { color: playerState.color }
    }));
  });

  sizeSlider.addEventListener('input', (e) => {
    playerState.size = parseInt(e.target.value);
    socket.send(JSON.stringify({
      type: 'playerUpdate',
      data: { size: playerState.size }
    }));
  });

  shapeSelect.addEventListener('change', (e) => {
    playerState.shape = e.target.value;
    socket.send(JSON.stringify({
      type: 'playerUpdate',
      data: { shape: playerState.shape }
    }));
  });

  // Movement
  document.addEventListener('keydown', (e) => {
    if (['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
      e.preventDefault();
      movePlayer(e.key);
    }
  });
}

// Move player
function movePlayer(key) {
  const speed = 5;
  switch(key) {
    case 'w': case 'W': playerState.y -= speed; break;
    case 's': case 'S': playerState.y += speed; break;
    case 'a': case 'A': playerState.x -= speed; break;
    case 'd': case 'D': playerState.x += speed; break;
  }

  // Keep player in bounds
  playerState.x = Math.max(0, Math.min(playerState.x, window.innerWidth - playerState.size));
  playerState.y = Math.max(0, Math.min(playerState.y, window.innerHeight - playerState.size));

  // Send position update
  socket.send(JSON.stringify({
    type: 'playerMove',
    data: { x: playerState.x, y: playerState.y }
  }));
  
  updatePlayer();
}

// Update player appearance
function updatePlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
  player.style.backgroundColor = playerState.color;
  player.style.width = `${playerState.size}px`;
  player.style.height = `${playerState.size}px`;
  
  if (playerState.shape === 'circle') {
    player.style.borderRadius = '50%';
    player.style.clipPath = 'none';
  } else if (playerState.shape === 'square') {
    player.style.borderRadius = '0';
    player.style.clipPath = 'none';
  } else if (playerState.shape === 'triangle') {
    player.style.borderRadius = '0';
    player.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
  }
}

// Handle WebSocket messages
socket.onopen = function(event) {
  statusElement.textContent = 'Connected to server';
  console.log('Connected to server');
  // Request player ID
  socket.send(JSON.stringify({ type: 'join' }));
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'playerId':
      playerId = data.id;
      console.log('Assigned player ID:', playerId);
      break;
      
    case 'playerJoined':
      // Create new player element
      const newPlayer = document.createElement('div');
      newPlayer.id = `player-${data.id}`;
      newPlayer.className = 'player';
      newPlayer.style.position = 'absolute';
      newPlayer.style.backgroundColor = data.color || '#3498db';
      newPlayer.style.width = `${data.size || 40}px`;
      newPlayer.style.height = `${data.size || 40}px`;
      newPlayer.style.borderRadius = data.shape === 'circle' ? '50%' : '0';
      document.getElementById('game').appendChild(newPlayer);
      players[data.id] = { element: newPlayer, x: data.x, y: data.y };
      break;
      
    case 'playerLeft':
      // Remove player element
      const playerElement = document.getElementById(`player-${data.id}`);
      if (playerElement) {
        playerElement.remove();
        delete players[data.id];
      }
      break;
      
    case 'playerMove':
      // Update other players' positions
      if (data.id !== playerId && players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
        players[data.id].element.style.left = `${data.x}px`;
        players[data.id].element.style.top = `${data.y}px`;
      }
      break;
      
    case 'playerUpdate':
      // Update other players' appearance
      if (data.id !== playerId && players[data.id]) {
        if (data.color) {
          players[data.id].element.style.backgroundColor = data.color;
        }
        if (data.size) {
          players[data.id].element.style.width = `${data.size}px`;
          players[data.id].element.style.height = `${data.size}px`;
        }
        if (data.shape) {
          if (data.shape === 'circle') {
            players[data.id].element.style.borderRadius = '50%';
            players[data.id].element.style.clipPath = 'none';
          } else if (data.shape === 'square') {
            players[data.id].element.style.borderRadius = '0';
            players[data.id].element.style.clipPath = 'none';
          } else if (data.shape === 'triangle') {
            players[data.id].element.style.borderRadius = '0';
            players[data.id].element.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
          }
        }
      }
      break;
  }
};

socket.onclose = function(event) {
  statusElement.textContent = 'Disconnected from server';
  console.log('Disconnected from server');
};

socket.onerror = function(error) {
  statusElement.textContent = 'Connection error';
  console.error('WebSocket error:', error);
};

// Handle window resize
window.addEventListener('resize', () => {
  // Keep player in bounds
  playerState.x = Math.max(0, Math.min(playerState.x, window.innerWidth - playerState.size));
  playerState.y = Math.max(0, Math.min(playerState.y, window.innerHeight - playerState.size));
  updatePlayer();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPlayer);
// Get the shape element
const shape = document.getElementById("shape1");

// Define the walk animation
const walkAnimation = {
  duration: 2,
  ease: "power1.inOut",
  repeat: -1,
  y: 0,
};

// Animate the shape
gsap.to(shape, {
  ...walkAnimation,
  y: 20,
});

gsap.to(shape, {
  ...walkAnimation,
  delay: walkAnimation.duration / 2,
  y: 0,
});

