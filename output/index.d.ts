import type { Application } from 'express';
import { Server as httpServer } from "http";
import { ServerOptions, Socket } from "socket.io";
import { SocketControllers } from "socket-controllers";
import type { AppPlugin, AppContext } from '@tsdiapi/server';
export type SocketSuccessResponse<T> = {
    status: "ok";
    data?: T;
};
export type SocketErrorResponse = {
    status: "error";
    errors?: string[];
};
export type SocketResponse<T> = SocketSuccessResponse<T> | SocketErrorResponse;
export type AppSocket<IncomingEvent extends string, OutgoingEvent extends string, Payloads extends Record<IncomingEvent, any>, Responses extends Record<OutgoingEvent, any>> = Socket & {
    emitSuccess<E extends OutgoingEvent>(event: E, data?: Responses[E]): void;
    emitError<E extends OutgoingEvent>(event: E, errors?: Array<string> | string): void;
};
export type AuthAppSocket<SessionType, IncomingEvent extends string, OutgoingEvent extends string, Payloads extends Record<IncomingEvent, any>, Responses extends Record<OutgoingEvent, any>> = AppSocket<IncomingEvent, OutgoingEvent, Payloads, Responses> & {
    session: SessionType;
};
export declare function addAppSocketEmitter<IncomingEvent extends string, OutgoingEvent extends string, Payloads extends Record<IncomingEvent, any>, Responses extends Record<OutgoingEvent, any>>(socket: Socket): AppSocket<IncomingEvent, OutgoingEvent, Payloads, Responses>;
export type PluginOptions = {
    autoloadGlobPath?: string;
    verify?<T>(token: string): Promise<T>;
    socketOptions?: Partial<ServerOptions>;
    socketControllers?: typeof SocketControllers;
};
export type SocketEvents = {
    [key: string]: {
        payload: any;
        response: any;
    };
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    globFilesPath: string;
    context: AppContext;
    constructor(config?: PluginOptions);
    registerSocketControllers(app: Application, server: httpServer): Promise<void>;
    onInit(ctx: AppContext): Promise<void>;
    beforeStart(ctx: AppContext): Promise<void>;
}
export default function (config?: PluginOptions): App;
export {};
//# sourceMappingURL=index.d.ts.map