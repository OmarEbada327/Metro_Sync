const { Server } = require("socket.io");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
    });

    const socketToStation = new Map();

    const getViewerCount = (stationId) => io.sockets.adapter.rooms.get(stationId)?.size || 0;

    const broadcastPresence = (stationId) => {
        io.to(stationId).emit("presenceUpdate", {
            stationId,
            viewers: getViewerCount(stationId)
        });
    };

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("joinStation", ({ stationId }) => {
            if (!stationId) return;

            const previousStationId = socketToStation.get(socket.id);

            if (previousStationId && previousStationId !== stationId) {
                socket.leave(previousStationId);
                broadcastPresence(previousStationId);
            }

            socket.join(stationId);
            socketToStation.set(socket.id, stationId);

            socket.emit("joinedStation", { stationId });
            broadcastPresence(stationId);
        });

        socket.on("leaveStation", () => {
            const stationId = socketToStation.get(socket.id);
            
            if (stationId) {
                socket.leave(stationId);
                socketToStation.delete(socket.id);
                broadcastPresence(stationId);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);

            const stationId = socketToStation.get(socket.id);

            if (stationId) {
                socketToStation.delete(socket.id);
                broadcastPresence(stationId)
            }
        });
    });
    
    return io;
};

module.exports = initializeSocket;