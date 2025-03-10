import { Server as SocketIOServer } from "socket.io";
import { glob } from 'glob';
import { SocketControllers } from "socket-controllers";
import { posix } from "path";
import { pathToFileURL } from "url";
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
    autoloadGlobPath: "*.socket{.ts,.js}",
    socketOptions: {
        cors: {
            origin: "*",
        }
    }
};
class App {
    name = 'tsdiapi-socket.io';
    config;
    globFilesPath;
    context;
    constructor(config) {
        this.config = { ...config };
        this.globFilesPath = this.config.autoloadGlobPath || defaultConfig.autoloadGlobPath;
    }
    async registerSocketControllers(app, server) {
        try {
            const apiDir = this.context.apiDir;
            let corsOptions = this.context.config?.corsOptions || defaultConfig.socketOptions?.cors;
            if (this.config.socketOptions?.cors && corsOptions) {
                corsOptions = { ...corsOptions, ...this.config.socketOptions.cors };
            }
            const io = new SocketIOServer(server, {
                cors: corsOptions
            });
            // Socket.io Started 
            this.context.logger.info(`Socket.io Started`);
            app.use(function (req, res, next) {
                req.io = io;
                next();
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
                                return await fn(json);
                            }
                            catch (err) {
                                return await fn(data);
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
            const container = this.context.container;
            const globPath = apiDir + "/**/" + this.globFilesPath;
            const controllers = [];
            const fixedPattern = posix.join(globPath.replace(/\\/g, "/"));
            const files = glob.sync(fixedPattern, { absolute: true });
            for (const file of files) {
                const fileUrl = pathToFileURL(file).href;
                const importedModule = await import(fileUrl);
                if (importedModule.default) {
                    controllers.push(importedModule.default);
                }
            }
            const socketControllers = this.config.socketControllers;
            if (!socketControllers || typeof socketControllers !== "function") {
                new SocketControllers({
                    io,
                    container: container,
                    controllers: controllers,
                });
            }
            else {
                try {
                    new socketControllers({
                        io,
                        container: container,
                        controllers: controllers,
                    });
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    async onInit(ctx) {
        this.context = ctx;
    }
    async beforeStart(ctx) {
        this.registerSocketControllers(ctx.app, ctx.server);
    }
}
export default function (config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map