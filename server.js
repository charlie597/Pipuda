const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/style.css') {
    fs.readFile(path.join(__dirname, 'style.css'), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  } else if (req.url === '/script.js') {
    fs.readFile(path.join(__dirname, 'script.js'), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

let players = {};
let nextId = 1;

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Assign player ID
  const playerId = nextId++;
  players[playerId] = { id: playerId, ws: ws };
  
  // Send player ID to client
  ws.send(JSON.stringify({
    type: 'playerId',
    id: playerId
  }));
  
  // Notify other players about new player
  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'playerJoined',
        id: playerId,
        x: Math.random() * 500,
        y: Math.random() * 500,
        color: '#3498db',
        size: 40,
        shape: 'circle'
      }));
    }
  });
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'join':
          // Player already joined
          break;
          
        case 'playerMove':
          // Broadcast position update to all other players
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'playerMove',
                id: playerId,
                x: data.data.x,
                y: data.data.y
              }));
            }
          });
          break;
          
        case 'playerUpdate':
          // Broadcast appearance update to all other players
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'playerUpdate',
                id: playerId,
                ...data.data
              }));
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    delete players[playerId];
    
    // Notify other players about left player
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'playerLeft',
          id: playerId
        }));
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
