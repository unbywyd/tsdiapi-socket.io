# TSDIAPI-IO: WebSocket Plugin for TSDIAPI-Server

TSDIAPI-IO is a plugin for the [TSDIAPI-Server](https://github.com/unbywyd/tsdiapi-server) framework, designed to integrate WebSocket capabilities using `Socket.IO` and `socket-controllers`.

---

## Installation

```bash
npm install tsdiapi-io socket-controllers
```

---

## Quick Start

### Add the Plugin

Add the plugin to your TSDIAPI-Server application:

```typescript
import { createApp } from "./app";
import cronPlugin from "tsdiapi-cron";
import ioPlugin from "tsdiapi-io";

createApp({
  plugins: [cronPlugin(), ioPlugin()],
});
```

---

### Define a WebSocket Controller

Create a controller to handle WebSocket events:

```typescript
import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketController,
} from "socket-controllers";
import { AppSocket, AuthAppSocket } from "tsdiapi-io";
import { Service } from "typedi";

export enum SocketIncomingEvent {
  helloWorld = "helloWorld",
}

export interface SocketPayloads {
  [SocketIncomingEvent.helloWorld]: {};
}

export enum SocketOutgoingEvent {
  helloWorld = "helloWorld",
}

export interface SocketResponses {
  [SocketOutgoingEvent.helloWorld]: {
    message: string;
  };
}

type AppSocketAuthType = AuthAppSocket<
  { userId: string },
  SocketIncomingEvent,
  SocketOutgoingEvent,
  SocketPayloads,
  SocketResponses
>;
type AppSocketType = AppSocket<
  SocketIncomingEvent,
  SocketOutgoingEvent,
  SocketPayloads,
  SocketResponses
>;

@SocketController()
@Service()
export default class MessageController {
  @OnConnect()
  connection(@ConnectedSocket() socket: AppSocketAuthType) {
    console.log("connect");
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: AppSocketType) {
    console.log("disconnect");
  }

  @OnMessage(SocketIncomingEvent.helloWorld)
  async save(
    @ConnectedSocket() socket: AppSocketType,
    @MessageBody()
    message: SocketPayloads[SocketIncomingEvent.helloWorld]
  ) {
    console.log("message", message);
    socket.emitSuccess(SocketOutgoingEvent.helloWorld, {
      message: "Hello World =)",
    });
  }
}
```

---

## Key Features

- **Declarative Controllers**: Use decorators like `@OnConnect`, `@OnDisconnect`, and `@OnMessage` to handle socket events.
- **Authentication Support**: Use `AuthAppSocket` to manage sessions for authenticated sockets.
- **Type-Safe Communication**: Strongly typed payloads and responses for incoming and outgoing events.

---

This plugin simplifies WebSocket integration and ensures type safety with minimal setup.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the plugin.

---

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

This documentation provides an overview of the library, how to set it up, and detailed examples for integration and usage. Let me know if you'd like to refine it further!
