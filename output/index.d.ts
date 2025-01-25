import type { Application } from 'express';
import { Server as httpServer } from "http";
import type { Container } from 'typedi';
import { ServerOptions, Socket } from "socket.io";
import type { SocketControllers } from "socket-controllers";
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
    globFilesPath?: string;
    verify?<T>(token: string): Promise<T>;
    socketOptions?: Partial<ServerOptions>;
    socketControllers: typeof SocketControllers;
};
export interface AppOptions {
    appConfig: any;
    environment: string;
    corsOptions: any;
    swaggerOptions: any;
    [key: string]: any;
}
export interface PluginContext {
    appDir: string;
    apiDir: string;
    app: Application;
    server?: httpServer;
    plugins: Record<string, AppPlugin>;
    container: typeof Container;
    config: AppOptions;
    logger: any;
}
export interface AppPlugin {
    name: string;
    bootstrapFilesGlobPath?: string;
    appConfig?: Record<string, any>;
    onInit?(ctx: PluginContext): Promise<void> | void;
    beforeStart?(ctx: PluginContext): Promise<void> | void;
    afterStart?(ctx: PluginContext): Promise<void> | void;
}
export type SocketEvents = {
    [key: string]: {
        payload: any;
        response: any;
    };
};
export default class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    globFilesPath: string;
    context: PluginContext;
    constructor(config?: PluginOptions);
    registerSocketControllers(app: Application, server: httpServer): Promise<void>;
    onInit(ctx: PluginContext): Promise<void>;
    beforeStart(ctx: PluginContext): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map