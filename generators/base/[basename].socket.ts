import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketController,
} from "socket-controllers";
import { Service } from "typedi";
import { AuthAppSocket } from "@tsdiapi/socket.io";

export enum Socket{{className}}Event {
  {{eventName}} = "helloWorld",
}

export interface Socket{{className}}Payloads {
  [Socket{{className}}Event.{{eventName}}]: {};
}

export interface Socket{{className}}Responses {
  [Socket{{className}}Event.{{eventName}}]: {
    message: string;
  };
}

export type AppSocketType = AuthAppSocket<
  { userId: string },
  Socket{{className}}Event,
  Socket{{className}}Event,
  Socket{{className}}Payloads,
  Socket{{className}}Responses
>;
@SocketController()
@Service()
export default class {{className}}Controller {
  @OnConnect()
  connection(@ConnectedSocket() socket: AppSocketType) {
    console.log("{{className}} connected");
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: AppSocketType) {
    console.log("{{className}} disconnected");
  }

  @OnMessage(SocketEvent.{{eventName}})
  async on{{pascalCase eventName}} (
  @ConnectedSocket() socket: AppSocketType,
    @MessageBody() message: SocketPayloads[SocketEvent.{{eventName}}]
  ) {
  console.log("Received {{eventName}} message:", message);
  socket.emitSuccess(SocketEvent.{{eventName}}, {
  message: "{{className}} processed event {{eventName}}.",
    });
  }
}