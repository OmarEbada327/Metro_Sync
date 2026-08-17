const http = require("http");
const dotenv = require("dotenv");
const connectDB = require("./db/db");
const app = require("./app");
const initializeSocket = require("./sockets/socket");
dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = initializeSocket(server);
app.set("io", io);

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

module.exports = server;