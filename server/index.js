import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

// Serve static files from the React frontend app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for simplicity in dev/production hybrid
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e7 // Increase payload limit to 10MB for base64 images
});

const uniqueIps = new Set();

function getIp(socket) {
  const xfwd = socket.handshake?.headers?.['x-forwarded-for'];
  if (xfwd && typeof xfwd === 'string') return xfwd.split(',')[0].trim();
  if (Array.isArray(xfwd) && xfwd.length) return xfwd[0];
  return socket.handshake?.address || 'unknown';
}

// Game State
const players = {};
// Structure: 
// { 
//   [socketId]: { 
//      id: string,
//      position: { x, y, z }, 
//      rotation: { x, y, z, w }, 
//      velocity: { x, y, z },
//      color: string, 
//      wrapTexture: string | null 
//   } 
// }

io.on('connection', (socket) => {
  const ip = getIp(socket);
  if (!uniqueIps.has(ip)) uniqueIps.add(ip);
  console.log(`Player connected: ${socket.id} from ${ip} (unique IPs: ${uniqueIps.size})`);

  // Initialize new player
  // We wait for them to send 'join' with their initial customization

  socket.on('join', (initialState) => {
    players[socket.id] = {
      id: socket.id,
      position: { x: 0, y: 2, z: 0 }, // Spawn point
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      velocity: { x: 0, y: 0, z: 0 },
      ...initialState
    };

    // Broadcast new player to others
    socket.broadcast.emit('player-joined', players[socket.id]);

    // Send existing players to new player
    socket.emit('current-players', players);

    console.log(`Player joined game: ${socket.id} from ${ip} (unique IPs: ${uniqueIps.size})`);
  });

  socket.on('update-state', (physicsState) => {
    if (players[socket.id]) {
      // Update server state (trusted client for now)
      players[socket.id].position = physicsState.position;
      players[socket.id].rotation = physicsState.rotation;
      players[socket.id].velocity = physicsState.velocity;

      // Broadcast to others (exclude sender? or include?)
      // Usually exclude sender for client-side prediction, but let's just broadcast to others
      socket.broadcast.emit('player-update', {
        id: socket.id,
        ...physicsState
      });
    }
  });

  socket.on('update-appearance', (appearance) => {
    if (players[socket.id]) {
      players[socket.id].color = appearance.color;
      players[socket.id].wrapTexture = appearance.wrapTexture;

      io.emit('player-appearance-update', {
        id: socket.id,
        ...appearance
      });
    }
  });

  socket.on('chat-message', ({ to, text }) => {
    // Direct message between sender and target only
    if (!to || typeof text !== 'string' || text.trim() === '') return;

    const payload = {
      id: socket.id,
      to,
      text,
      timestamp: Date.now()
    };

    // Echo back to sender so their UI updates instantly
    socket.emit('chat-message', payload);

    // Deliver to target player if they are connected
    if (players[to]) {
      socket.to(to).emit('chat-message', payload);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected (car preserved): ${socket.id}`);
    // Do not delete player entry; keep last known state so others can still view/copy wrap
    // No "player-left" broadcast so the car remains visible to others
  });
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
