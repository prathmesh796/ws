# WebSocket Chat App

A full-stack real-time messaging demo built with a Node.js WebSocket server and a React frontend.

---

## What Are WebSockets?

WebSocket is a communication protocol that provides a **persistent, full-duplex channel** over a single TCP connection. Unlike the traditional HTTP request-response cycle — where the client always initiates a request and the server always responds — WebSockets allow **both sides to send data at any time**, independently of each other.

### How the handshake works

1. The client sends a regular HTTP request with an `Upgrade: websocket` header.
2. The server agrees and responds with HTTP 101 Switching Protocols.
3. From that point on the TCP connection stays open and both parties communicate using the lightweight WebSocket framing protocol instead of HTTP.

### Key characteristics

| Feature | HTTP (REST) | WebSocket |
|---|---|---|
| Connection | New per request | Persistent |
| Direction | Client → Server | Bidirectional |
| Overhead | Headers on every message | Minimal framing |
| Latency | High (new TCP + HTTP round-trip) | Low (reuse open connection) |

---

## Common Use Cases

| Use Case | Why WebSockets? |
|---|---|
| **Real-time chat** | Messages must arrive instantly for all participants |
| **Live notifications** | Push alerts to users without polling |
| **Collaborative editing** | Cursor positions and edits need sub-100 ms round-trips |
| **Live dashboards / monitoring** | Metrics, logs, and stock prices stream continuously |
| **Online multiplayer games** | Game-state updates need the lowest possible latency |
| **Live sports / betting** | Scores and odds change rapidly and must reach all users simultaneously |

---

## Repository Structure

```
ws/
├── ws-server/          # Node.js WebSocket server (TypeScript)
│   ├── src/
│   │   └── index.ts    # Server entry point
│   ├── package.json
│   └── tsconfig.json
└── frontend/           # React + Vite client (TypeScript + Tailwind CSS)
    ├── src/
    │   ├── App.tsx     # Main component – WebSocket logic lives here
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## WebSocket Implementation in This Repo

### Server (`ws-server/src/index.ts`)

The server is built with the [`ws`](https://github.com/websockets/ws) npm package on top of Node's built-in `http` module.

```
http.createServer()  →  WebSocketServer({ server })
```

**Step-by-step flow:**

1. **Create an HTTP server** – `createServer()` provides the underlying TCP listener. The `ws` library attaches itself to this server so both can share port `8080`.
2. **Attach the WebSocket server** – `new WebSocketServer({ server })` upgrades incoming connections from HTTP to the WebSocket protocol automatically.
3. **Handle new connections** – Every time a client connects, the `"connection"` event fires and exposes a `ws` socket object for that specific client.
4. **Receive messages** – The `"message"` event fires whenever the server receives data from any client.
5. **Broadcast to everyone** – On each incoming message the server iterates over `wss.clients` (the set of all currently-connected sockets) and calls `element.send()` on every socket whose `readyState` is `OPEN`. This implements a simple **broadcast / fan-out** pattern: one sender, every connected client receives the message.
6. **Error handling** – The `"error"` event on each socket logs problems without crashing the process.

```
Client A  ──sends "hello"──►  Server
                               │
                               ├── sends "hello" ──► Client A
                               ├── sends "hello" ──► Client B
                               └── sends "hello" ──► Client C
```

The outgoing message is serialised as JSON: `{ message: "<original text>" }`.

---

### Client (`frontend/src/App.tsx`)

The frontend uses the browser's native `WebSocket` API — no extra library required.

**Step-by-step flow:**

1. **Open a connection** – Inside a `useEffect` (runs once on mount), `new WebSocket('ws://localhost:8080')` initiates the handshake with the server.
2. **Store the socket in state** – The `onopen` callback sets the socket into React state (`setSocket(ws)`), which gates the rest of the UI: while `socket` is `null` the app renders a "Connecting…" placeholder.
3. **Receive messages** – `onmessage` appends every incoming message string to the `messages` array in state, causing React to re-render the message list in real time.
4. **Send a message** – `sendMessage` reads the input field value, calls `socket.send(message)`, and clears the field. It guards against sending on a non-open socket by checking `socket.readyState === WebSocket.OPEN`.
5. **Clean up** – The `useEffect` return function calls `ws.close()`, which gracefully closes the connection when the component unmounts (e.g. page navigation or hot-module replacement during development).
6. **Error / close handling** – `onerror` logs problems to the console; `onclose` resets `socket` to `null`, which brings back the "Connecting…" placeholder.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### 1. Start the WebSocket server

```bash
cd ws-server
npm install
npm run dev        # compiles TypeScript then runs node dist/index.js
```

The server will be listening at `ws://localhost:8080`.

### 2. Start the React frontend

```bash
cd frontend
npm install
npm run dev        # starts the Vite dev server
```

Open the URL printed by Vite (usually `http://localhost:5173`) in one or more browser tabs. Every message you send from any tab will appear in all other open tabs in real time.

---

## How Messages Flow End-to-End

```
Browser Tab 1                Server (port 8080)            Browser Tab 2
─────────────                ──────────────────            ─────────────
[type "hi"]
  │
  └─── ws.send("hi") ──────► onmessage fires
                               │
                               ├──── element.send({message:"hi"}) ──► onmessage fires
                               │                                          │
                               └──── element.send({message:"hi"}) ──►   setMessages(...)
                                                                         [renders "hi"]
```

1. The user types a message and clicks **Send**.
2. The browser sends the raw string over the open WebSocket connection.
3. The server receives it in the `"message"` handler, wraps it in a JSON envelope `{ message: "..." }`, and broadcasts it to **every connected client** including the sender.
4. Each client's `onmessage` callback fires, parses the JSON envelope, and React appends the text to the on-screen message list.
