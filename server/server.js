import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from "socket.io";

// Create Express app and Http server
const app = express();
const server = http.createServer(app);

// Initialize socket.io
const allowedOrigins = ['https://quickchat-bwru.vercel.app','http://localhost:5173'];
export const io = new Server(server, {
    cors: { origin: allowedOrigins }
})

// Store online users as an object: userId : socketId
export const userSocketMap = {};

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnect", userId)
        // Corrected deletion of user from map
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

// Middleware Setup
app.use(express.json({ limit: "4mb" }));
 app.use(cors({
     origin: allowedOrigins,
     credentials: true, // if you need cookies/auth
   }));


// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

if(process.env.NODE_ENV !== "production"){
   const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("server is running on port:" + PORT));

}

//Export server for versal

export default server;
