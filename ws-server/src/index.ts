import WebSocket, { WebSocketServer } from "ws";
import { createServer } from "http";

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    console.log("Client connected");

    ws.on("message", (message) => {
        wss.clients.forEach(element => {
            if (element.readyState === WebSocket.OPEN) {
                element.send(JSON.stringify({ message: message.toString() }));
                console.log("Broadcasted message:", message);
            }
        });
    });
});

server.listen(8080, () => {
    console.log("WebSocket server is listening on ws://localhost:8080");
});