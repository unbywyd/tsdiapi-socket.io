import { AuthAppSocket } from "@tsdiapi/socket.io";

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

export type AppSocketType = AuthAppSocket<
  { userId: string },
  SocketEvent,
  SocketEvent,
  SocketPayloads,
  SocketResponses
>;
