# **TSDIAPI-Socket.IO: WebSocket Plugin for TSDIAPI-Server**  

The **TSDIAPI-Socket.IO** plugin integrates **WebSocket functionality** into [TSDIAPI-Server](https://github.com/unbywyd/tsdiapi-server), utilizing `Socket.IO` for **real-time communication**.  
This plugin provides a **flexible and functional approach**, replacing the previous declarative model. It supports **authenticated and unauthenticated connections**, with enhanced **event handling and session management**.

---

## **🚀 Features**  

✅ **Functional WebSocket Integration** – No decorators, just clear and structured functions.  
✅ **Authentication Support** – Validate and manage authenticated socket connections.  
✅ **Customizable Event Handling** – Define custom handlers for incoming messages.  
✅ **Type-Safe Socket Communication** – Strongly typed payloads and responses.  
✅ **Automatic WebSocket Lifecycle Management** – Manages connections, authentication, and disconnections.  

---

## **📦 Installation**  

Install the plugin via npm:  

```bash
npm install @tsdiapi/socket.io
```

Or use the **TSDIAPI CLI** to install and configure it automatically:  

```bash
tsdiapi plugins add socket.io
```

---

## **📂 Code Generation**  

| Command                  | Description                                   |
|--------------------------|-----------------------------------------------|
| `tsdiapi generate socket.io` | Creates a new WebSocket event handler template. |

The `tsdiapi generate socket.io` command generates a **basic WebSocket handler**, allowing for quick implementation of custom socket logic.

---

## **🛠 Getting Started**  

### **1️⃣ Register the Plugin in Your Application**  

To enable WebSocket functionality, register the plugin in your **TSDIAPI-Server** application:

```typescript
import { createApp } from "@tsdiapi/server";
import createSocketIOPlugin from "@tsdiapi/socket.io";

createApp({
  plugins: [createSocketIOPlugin()],
});
```

---

### **2️⃣ Handling WebSocket Connections**  

Define WebSocket events and implement **custom handlers** within your server:

```typescript
import { FastifyInstance } from "fastify";

export function setupWebSocketHandlers(io: FastifyInstance["io"]) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("message", (data) => {
      console.log("Received message:", data);
      socket.emit("response", { status: "ok", message: "Message received!" });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}
```

This **functional approach** makes it easier to **customize and extend** WebSocket logic without relying on decorators.

---

### **3️⃣ Supporting Authentication**  

TSDIAPI-Socket.IO **supports authentication** through the `verify` function:

```typescript
import createSocketIOPlugin from "@tsdiapi/socket.io";

createSocketIOPlugin({
  verify: async (token: string) => {
    // Simulate token validation
    if (token === "valid-token") {
      return { userId: "12345", role: "admin" }; // Example session object
    }
    throw new Error("Authentication failed");
  },
});
```

- If `verify` is provided, the server **rejects unauthenticated connections**.  
- The session object is **attached to the socket** for later use.

Example handling authenticated sockets:

```typescript
io.on("connection", (socket) => {
  if ("session" in socket) {
    console.log(`User ${socket.session.userId} connected.`);
  }
});
```

---

## **📖 API Reference**  

### **1️⃣ `emitSuccess(event, data?)`**  

Sends a success response to the client.

```typescript
socket.emitSuccess("someEvent", { message: "Hello, world!" });
```

### **2️⃣ `emitError(event, errors)`**  

Sends an error response to the client.

```typescript
socket.emitError("someEvent", "Something went wrong.");
```

### **3️⃣ `on(event, listener)`**  

Registers an event listener.

```typescript
socket.on("message", (data) => {
  console.log("Received:", data);
});
```

---

## **🔌 Lifecycle Hooks**  

TSDIAPI-Socket.IO integrates into the **TSDIAPI lifecycle**:

| Hook          | Description                                      |
|--------------|--------------------------------------------------|
| `onInit`     | Initializes the WebSocket server.               |
| `beforeStart`| Sets up authentication and event handling.      |

---

## **📜 Logging & Debugging**  

TSDIAPI-Socket.IO **logs key events** for easier debugging:

```plaintext
[INFO] WebSocket server started on port 3000
[INFO] Client connected: abc123
[INFO] Received message: { text: "Hello" }
[INFO] Client disconnected: abc123
[ERROR] Authentication failed
```

---

## **📌 Example Full Implementation**  

```typescript
import { createApp } from "@tsdiapi/server";
import createSocketIOPlugin from "@tsdiapi/socket.io";
import { setupWebSocketHandlers } from "./websocket-handlers";

const socketIOPlugin = createSocketIOPlugin({
  verify: async (token) => {
    if (token === "valid-token") return { userId: "123" };
    throw new Error("Invalid token");
  },
});

createApp({
  plugins: [socketIOPlugin],
});
```

---

## **🙌 Contributing**  

**Contributions are welcome!** 🎉  
- Report issues  
- Submit pull requests  
- Improve documentation  

---

## **📜 License**  

Licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.  

---

🚀 **TSDIAPI-Socket.IO** provides a **fast, flexible, and fully customizable** WebSocket integration.  
Start building **real-time applications** today!