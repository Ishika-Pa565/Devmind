require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const issueRoutes = require('./routes/issues');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

app.set('io', io);

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use('/webhook', express.raw({ type: '*/*' }));  // raw for webhook signature (future)
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/issues', issueRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`❌ Client disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));