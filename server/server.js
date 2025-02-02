const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Handle user connections
io.on('connection', (socket) => {
    console.log('New user connected');

    // Handle user joining
    socket.on('join', (data) => {
        console.log(`${data.username} joined the meeting`);
        socket.username = data.username;
        socket.broadcast.emit('user-joined', { id: socket.id, username: data.username });
    });

    // Handle signaling data (offer, answer, candidate)
    socket.on('signal', (data) => {
        socket.to(data.to).emit('signal', { from: socket.id, ...data });
    });

    // Handle chat messages
    socket.on('send-message', (message) => {
        io.emit('receive-message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        socket.broadcast.emit('user-left', socket.id);
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
