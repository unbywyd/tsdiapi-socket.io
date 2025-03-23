import { Server as SocketIOServer } from "socket.io";
export function addAppSocketEmitter(socket) {
    const extendedSocket = socket;
    extendedSocket.emitSuccess = function (event, data) {
        const message = {
            status: "ok",
            data: data ?? {},
        };
        extendedSocket.emit(event, message);
    };
    extendedSocket.emitError = function (event, errors) {
        const message = {
            status: "error",
            errors: typeof errors === "string" ? [errors] : errors || ["Unknown error"],
        };
        extendedSocket.emit(event, message);
    };
    return extendedSocket;
}
const defaultConfig = {
    socketOptions: {
        cors: {
            origin: "*",
        }
    }
};
class App {
    name = 'tsdiapi-socket.io';
    config;
    context;
    constructor(config) {
        this.config = { ...config };
    }
    async registerSocketControllers() {
        try {
            const cors = "object" === typeof this.context.options.corsOptions ? this.context.options.corsOptions : null;
            let corsOptions = (cors || defaultConfig.socketOptions?.cors) || defaultConfig.socketOptions?.cors;
            if (this.config.socketOptions?.cors) {
                corsOptions = { ...corsOptions, ...this.config.socketOptions.cors };
            }
            const fastify = this.context.fastify;
            const server = fastify.server;
            const socketOptions = {
                ...defaultConfig.socketOptions,
                ...this.config.socketOptions || {}
            };
            const io = new SocketIOServer(server, {
                ...socketOptions,
                cors: corsOptions
            });
            function defaultPreClose(done) {
                fastify.io.local.disconnectSockets(true);
                done();
            }
            fastify.decorate('io', io);
            fastify.addHook('preClose', (done) => {
                if (this.config.preClose) {
                    return this.config.preClose(done);
                }
                return defaultPreClose(done);
            });
            fastify.addHook('onClose', (fastify, done) => {
                fastify.io.close();
                done();
            });
            io.use(async (socket, next) => {
                try {
                    addAppSocketEmitter(socket);
                    const token = socket.handshake.query.authToken;
                    const originOn = socket.on;
                    socket.on = function (event, fn) {
                        originOn.call(socket, event, async function (data) {
                            try {
                                const json = JSON.parse(data);
                                return await fn.apply(socket, [json]);
                            }
                            catch (err) {
                                return await fn.apply(socket, [data]);
                            }
                        });
                    };
                    const verify = this.config?.verify;
                    if (verify && typeof verify === "function") {
                        if (!token) {
                            next(new Error("Authentication error"));
                        }
                        else {
                            const session = await verify(token);
                            if (!session) {
                                next(new Error("Authentication error"));
                            }
                            else {
                                socket.session = session;
                                next();
                            }
                        }
                    }
                    else {
                        next();
                    }
                }
                catch (err) {
                    console.error(err);
                    next(err);
                }
            });
        }
        catch (err) {
            console.error(err);
        }
    }
    async onInit(ctx) {
        this.context = ctx;
    }
    async beforeStart(ctx) {
        this.context = ctx;
        this.registerSocketControllers();
    }
}
export default function (config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map