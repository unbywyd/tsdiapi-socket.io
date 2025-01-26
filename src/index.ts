import type { Application, Request, Response } from 'express';
import { Server as httpServer } from "http";
import { Server as SocketIOServer, ServerOptions, Socket } from "socket.io";
import { glob } from 'glob';
import { SocketControllers } from "socket-controllers";
import type { AppPlugin, AppContext } from 'tsdiapi-server';
export type SocketSuccessResponse<T> = {
    status: "ok";
    data?: T;
};

export type SocketErrorResponse = {
    status: "error";
    errors?: string[];
};

export type SocketResponse<T> = SocketSuccessResponse<T> | SocketErrorResponse;

export type AppSocket<
    IncomingEvent extends string,
    OutgoingEvent extends string,
    Payloads extends Record<IncomingEvent, any>,
    Responses extends Record<OutgoingEvent, any>
> = Socket & {
    emitSuccess<E extends OutgoingEvent>(
        event: E,
        data?: Responses[E]
    ): void;
    emitError<E extends OutgoingEvent>(
        event: E,
        errors?: Array<string> | string
    ): void;
};

export type AuthAppSocket<
    SessionType,
    IncomingEvent extends string,
    OutgoingEvent extends string,
    Payloads extends Record<IncomingEvent, any>,
    Responses extends Record<OutgoingEvent, any>
> = AppSocket<IncomingEvent, OutgoingEvent, Payloads, Responses> & {
    session: SessionType;
};

export function addAppSocketEmitter<
    IncomingEvent extends string,
    OutgoingEvent extends string,
    Payloads extends Record<IncomingEvent, any>,
    Responses extends Record<OutgoingEvent, any>
>(
    socket: Socket
): AppSocket<IncomingEvent, OutgoingEvent, Payloads, Responses> {
    const extendedSocket = socket as AppSocket<
        IncomingEvent,
        OutgoingEvent,
        Payloads,
        Responses
    >;

    extendedSocket.emitSuccess = function <E extends OutgoingEvent>(
        event: E,
        data?: Responses[E]
    ): void {
        const message: SocketSuccessResponse<Responses[E]> = {
            status: "ok",
            data: data ?? ({} as Responses[E]),
        };
        extendedSocket.emit(event, message);
    };

    extendedSocket.emitError = function <E extends OutgoingEvent>(
        event: E,
        errors?: Array<string> | string
    ): void {
        const message: SocketErrorResponse = {
            status: "error",
            errors: typeof errors === "string" ? [errors] : errors || ["Unknown error"],
        };
        extendedSocket.emit(event, message);
    };

    return extendedSocket;
}

export type PluginOptions = {
    globFilesPath?: string;
    verify?<T>(token: string): Promise<T>;
    socketOptions?: Partial<ServerOptions>;
    socketControllers: typeof SocketControllers;
}

const defaultConfig: Partial<PluginOptions> = {
    globFilesPath: "*.socket{.ts,.js}",
    socketOptions: {
        cors: {
            origin: "*",
        }
    }
}

export type SocketEvents = {
    [key: string]: {
        payload: any;
        response: any;
    }
}

class App implements AppPlugin {
    name = 'tsdiapi-io';
    config: PluginOptions;
    globFilesPath: string;
    context: AppContext;

    constructor(config?: PluginOptions) {
        this.config = { ...config };
        this.globFilesPath = this.config.globFilesPath || defaultConfig.globFilesPath;
    }
    async registerSocketControllers(app: Application, server: httpServer) {
        const apiDir = this.context.apiDir;
        let corsOptions = this.context.config?.corsOptions || defaultConfig.socketOptions?.cors;
        if (this.config.socketOptions?.cors && corsOptions) {
            corsOptions = { ...corsOptions, ...this.config.socketOptions.cors }
        }
        const io = new SocketIOServer(server, {
            cors: corsOptions
        });

        // Socket.io Started 
        this.context.logger.info(`Socket.io Started`);

        app.use(function (req: Request, res: Response, next) {
            (req as any).io = io;
            next();
        });
        io.use(async (socket: Socket, next: any) => {
            addAppSocketEmitter(socket);
            const token = socket.handshake.query.authToken as string;

            const originOn = socket.on;
            (socket as any).on = function (event: string, fn: Function) {
                originOn.call(socket, event, async function (data: any) {
                    try {
                        const json = JSON.parse(data);
                        return await fn(json);
                    } catch (err) {
                        return await fn(data);
                    }
                });
            };
            const verify = this.config?.verify;
            if (verify && typeof verify === "function") {
                if (!token) {
                    next(new Error("Authentication error"));
                } else {
                    const session = await verify(token);
                    if (!session) {
                        next(new Error("Authentication error"));
                    } else {
                        (socket as any).session = session;
                        next();
                    }
                }
            } else {
                next();
            }
        });
        const container = this.context.container;
        const globPath = apiDir + "/**/" + this.globFilesPath;

        const appDir = this.context.appDir;
        const controllers: Array<Function> = [];
        const files = glob.sync(globPath, { cwd: appDir });
        for (const file of files) {
            const module = await import(appDir + "/" + file);
            if (module.default) {
                controllers.push(module.default);
            }
        }
        const socketControllers = this.config.socketControllers;
        if (!socketControllers || typeof socketControllers !== "function") {
            console.error("SocketControllers not found");
            new SocketControllers({
                io,
                container: container,
                controllers: controllers,
            });
        } else {
            try {
                new socketControllers({
                    io,
                    container: container,
                    controllers: controllers,
                });
            } catch (err) {
                console.error(err);
            }
        }

    }
    async onInit(ctx: AppContext) {
        this.context = ctx;
    }
    async beforeStart(ctx: AppContext) {
        this.registerSocketControllers(ctx.app, ctx.server);
    }
}

export default function (config?: PluginOptions) {
    return new App(config);
}