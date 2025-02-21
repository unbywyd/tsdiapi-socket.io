# TSDIAPI Socket.IO Plugin for TSDIAPI-Server

The **@tsdiapi/socket.io** plugin integrates WebSocket functionality into the [TSDIAPI-Server](https://github.com/unbywyd/tsdiapi-server), utilizing `Socket.IO` and `socket-controllers`. This plugin offers type-safe event handling with TypeScript decorators and supports both authenticated and unauthenticated connections.

---

## Installation

Install the plugin via NPM:

```bash
npm install @tsdiapi/socket.io socket-controllers
```

Or use the CLI to install it in your project:

```bash
tsdiapi plugins add socket.io
```

---

## Quick Start

### Add the Plugin

Register the plugin in your TSDIAPI-Server application:

```typescript
import { createApp } from "@tsdiapi/server";
import ioPlugin from "@tsdiapi/socket.io";

createApp({
  plugins: [ioPlugin()],
});
```

---

## Code Generation

| Name   | Description                              |
| ------ | ---------------------------------------- |
| `base` | Generates a new Socket.IO event handler. |

The **TSDIAPI-Socket.IO** plugin includes a generator to create socket event handlers easily. Use the `tsdiapi` CLI to generate a new event controller:

```bash
tsdiapi generate socket.io
```

You will be prompted to enter an **event name** from the `@base/sockets.types` file, which is generated when the plugin is added.

### Define a WebSocket Controller

Create a controller to handle socket events:

```typescript
import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketController,
} from "socket-controllers";
import { AuthAppSocket } from "@tsdiapi/socket.io";
import { Service } from "typedi";

export enum SocketEvent {
  helloWorld = "helloWorld",
}

export interface SocketPayloads {
  [SocketEvent.helloWorld]: {};
}

export interface SocketResponses {
  [SocketEvent.helloWorld]: {
    message: string;
  };
}

type AppSocketType = AuthAppSocket<
  { userId: string },
  SocketEvent,
  SocketEvent,
  SocketPayloads,
  SocketResponses
>;

@SocketController()
@Service()
export class MessageController {
  @OnConnect()
  connection(@ConnectedSocket() socket: AppSocketType) {
    console.log("Client connected");
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: AppSocketType) {
    console.log("Client disconnected");
  }

  @OnMessage(SocketEvent.helloWorld)
  async onHelloWorld(
    @ConnectedSocket() socket: AppSocketType,
    @MessageBody() message: SocketPayloads[SocketEvent.helloWorld]
  ) {
    console.log("Received message:", message);
    socket.emitSuccess(SocketEvent.helloWorld, {
      message: "Hello World!",
    });
  }
}
```

---

## Key Features

- **Declarative Controllers**: Handle events like `connect`, `disconnect`, and messages with decorators such as `@OnConnect` and `@OnMessage`.
- **Authentication Support**: Use `AuthAppSocket` to secure and manage authenticated socket connections.
- **Type Safety**: Define strongly typed payloads and responses for each event.
- **Seamless Integration**: Automatically register and manage WebSocket controllers within the TSDIAPI-Server lifecycle.

---

## Plugin Lifecycle Integration

The plugin hooks into the TSDIAPI lifecycle:

- **`onInit`**: Initializes the WebSocket server.
- **`afterStart`**: Starts listening for WebSocket connections and events.
- **`beforeStart`**: Allows custom pre-start setup if needed.

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the plugin.

---

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
