import { Server as httpServer } from "http";
import { Server as SocketIOServer, ServerOptions, Socket } from "socket.io";
import type { AppPlugin, AppContext } from '@tsdiapi/server';
import { FastifyInstance } from 'fastify';

export type SocketSuccessResponse<T> = {
    status: "ok";
    data?: T;
};

declare module "fastify" {
    interface FastifyInstance {
        io: SocketIOServer;
    }
}

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
    on<E extends IncomingEvent>(
        event: E,
        listener: (payload: Payloads[E]) => void
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
    verify?<T>(token: string): Promise<T>;
    socketOptions?: Partial<ServerOptions>;
    preClose?: (done: Function) => void;
}

const defaultConfig: Partial<PluginOptions> = {
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
    name = 'tsdiapi-socket.io';
    config: PluginOptions;
    context: AppContext;

    constructor(config?: PluginOptions) {
        this.config = { ...config };
    }
    async registerSocketControllers() {
        try {
            const cors = "object" === typeof this.context.options.corsOptions ? this.context.options.corsOptions : null as Record<string, any>;
            let corsOptions = ((cors || defaultConfig.socketOptions?.cors) as Record<string, any>) || defaultConfig.socketOptions?.cors;
            if (this.config.socketOptions?.cors) {
                corsOptions = { ...corsOptions, ...this.config.socketOptions.cors }
            }
            const fastify = this.context.fastify;
            const server = fastify.server as httpServer;
            const socketOptions = {
                ...defaultConfig.socketOptions,
                ...this.config.socketOptions || {}
            }
            const io = new SocketIOServer(server, {
                ...socketOptions,
                cors: corsOptions
            });
            function defaultPreClose(done: Function) {
                (fastify as any).io.local.disconnectSockets(true)
                done()
            }
            fastify.decorate('io', io);
            fastify.addHook('preClose', (done: Function) => {
                if (this.config.preClose) {
                    return this.config.preClose(done);
                }
                return defaultPreClose(done);
            });
            fastify.addHook('onClose', (fastify: FastifyInstance, done) => {
                (fastify as any).io.close()
                done()
            })
            io.use(async (socket: Socket, next: any) => {
                try {
                    addAppSocketEmitter(socket);
                    const token = socket.handshake.query.authToken as string;
                    const originOn = socket.on;
                    (socket as any).on = function (event: string, fn: Function) {
                        originOn.call(socket, event, async function (data: any) {
                            try {
                                const json = JSON.parse(data);
                                return await fn.apply(socket, [json]);
                            } catch (err) {
                                return await fn.apply(socket, [data]);
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
                } catch (err) {
                    console.error(err);
                    next(err);
                }
            });
        } catch (err) {
            console.error(err);
        }
    }
    async onInit(ctx: AppContext) {
        this.context = ctx;
    }
    async beforeStart(ctx: AppContext) {
        this.context = ctx;
        this.registerSocketControllers();
    }
}

export default function (config?: PluginOptions) {
    return new App(config);
}


