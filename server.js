const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store active sessions
const activeSessions = {};

console.log('🚀 Vanguard Sync Server Starting...');

io.on('connection', (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);
    
    // PC join session
    socket.on('join_session', (data) => {
        const { sessionToken, pcName, userKey } = data;
        console.log(`📥 Join request: ${pcName} with token ${sessionToken}`);
        
        // Simple validation
        if (sessionToken && pcName && userKey) {
            if (!activeSessions[sessionToken]) {
                activeSessions[sessionToken] = {};
            }
            
            activeSessions[sessionToken][pcName.toLowerCase()] = socket;
            socket.sessionToken = sessionToken;
            socket.pcName = pcName;
            
            console.log(`✅ ${pcName} joined session ${sessionToken}`);
            
            socket.emit('joined', { 
                success: true, 
                message: `${pcName} connected`,
                sessionInfo: {
                    token: sessionToken,
                    connectedPCs: Object.keys(activeSessions[sessionToken])
                }
            });
            
            // Notify other PC
            const otherPC = pcName.toLowerCase() === 'pc1' ? 'pc2' : 'pc1';
            if (activeSessions[sessionToken][otherPC]) {
                activeSessions[sessionToken][otherPC].emit('peer_connected', { 
                    pc: pcName
                });
            }
        } else {
            socket.emit('join_error', { message: 'Invalid data' });
        }
    });
    
    // Send signal
    socket.on('send_signal', (data) => {
        const { toPC, signalType, signalData } = data;
        const sessionToken = socket.sessionToken;
        const fromPC = socket.pcName;
        
        console.log(`📤 Signal: ${fromPC} → ${toPC} (${signalType})`);
        
        if (sessionToken && activeSessions[sessionToken]) {
            const targetSocket = activeSessions[sessionToken][toPC.toLowerCase()];
            
            if (targetSocket) {
                targetSocket.emit('receive_signal', {
                    fromPC: fromPC,
                    signalType: signalType,
                    signalData: signalData,
                    timestamp: Date.now()
                });
                
                console.log(`✅ Signal delivered: ${signalType}`);
                socket.emit('signal_sent', { success: true });
            } else {
                socket.emit('signal_sent', { 
                    success: false, 
                    message: `${toPC} not connected` 
                });
            }
        }
    });
    
    // Heartbeat
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        if (socket.sessionToken && socket.pcName) {
            console.log(`❌ ${socket.pcName} disconnected from ${socket.sessionToken}`);
            
            const session = activeSessions[socket.sessionToken];
            if (session) {
                const otherPC = socket.pcName.toLowerCase() === 'pc1' ? 'pc2' : 'pc1';
                if (session[otherPC]) {
                    session[otherPC].emit('peer_disconnected', { pc: socket.pcName });
                }
                
                delete session[socket.pcName.toLowerCase()];
                
                if (Object.keys(session).length === 0) {
                    delete activeSessions[socket.sessionToken];
                }
            }
        }
    });
});

// Status page
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        activeSessions: Object.keys(activeSessions).length,
        connectedClients: io.engine.clientsCount,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send(`
        <h1>Vanguard Sync Server</h1>
        <p>Status: Online</p>
        <p>Active Sessions: ${Object.keys(activeSessions).length}</p>
        <p>Connected Clients: ${io.engine.clientsCount}</p>
        <p>Uptime: ${Math.floor(process.uptime())} seconds</p>
        <a href="/status">JSON Status</a>
    `);
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 WebSocket server running on port ${PORT}`);
    console.log(`📡 Server URL: ws://209.38.153.189:${PORT}`);
    console.log(`📊 Status: http://209.38.153.189:${PORT}/status`);
    console.log(`🏠 Home: http://209.38.153.189:${PORT}`);
});