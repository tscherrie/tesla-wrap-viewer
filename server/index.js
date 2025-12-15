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
  console.log(`Player connected: ${socket.id}`);

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

    console.log(`Player joined game: ${socket.id}`);
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

  socket.on('chat-message', (message) => {
    // Broadcast to all
    io.emit('chat-message', {
      id: socket.id,
      text: message,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('player-left', socket.id);
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
