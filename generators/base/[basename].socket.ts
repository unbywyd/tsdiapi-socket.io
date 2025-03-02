import {
   ConnectedSocket,
   MessageBody,
   OnConnect,
   OnDisconnect,
   OnMessage,
   SocketController,
 } from "socket-controllers";
 import { Service } from "typedi";
 
 import { AppSocketAuthType, AppSocketType, SocketIncomingEvent, SocketPayloads, SocketOutgoingEvent } from "@base/sockets.types";
 
 @SocketController()
 @Service()
 export default class {{className}}Controller {
   @OnConnect()
   connection(@ConnectedSocket() socket: AppSocketAuthType) {
     console.log("{{className}} connected");
   }
 
   @OnDisconnect()
   disconnect(@ConnectedSocket() socket: AppSocketType) {
     console.log("{{className}} disconnected");
   }
 
   @OnMessage(SocketIncomingEvent.{{eventName}})
   async {{eventName}}(
     @ConnectedSocket() socket: AppSocketType,
     @MessageBody()
     message: SocketPayloads[SocketIncomingEvent.{{eventName}}]
   ) {
     console.log("Received {{eventName}} message:", message);
     socket.emitSuccess(SocketOutgoingEvent.{{eventName}}, {
       message: "{{className}} processed event {{eventName}}.",
     });
   }
 }
 