import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketController,
} from "socket-controllers";
import { Service } from "typedi";

import { AppSocketType, SocketPayloads, SocketEvent } from "@base/sockets.types.js";

@SocketController()
@Service()
export default class {{ className }}Controller {
  @OnConnect()
  connection(@ConnectedSocket() socket: AppSocketType) {
    console.log("{{className}} connected");
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: AppSocketType) {
    console.log("{{className}} disconnected");
  }

  @OnMessage(SocketEvent.{{ eventName }})
  async on{ {pascalCase eventName } } (
  @ConnectedSocket() socket: AppSocketType,
    @MessageBody() message: SocketPayloads[SocketEvent.{ { eventName } }]
  ) {
  console.log("Received {{eventName}} message:", message);
  socket.emitSuccess(SocketEvent.{{ eventName }}, {
  message: "{{className}} processed event {{eventName}}.",
    });
  }
}