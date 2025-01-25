"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAppSocketEmitter = addAppSocketEmitter;
const socket_io_1 = require("socket.io");
const glob_1 = require("glob");
function addAppSocketEmitter(socket) {
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
    globFilesPath: "*.socket{.ts,.js}",
    socketOptions: {
        cors: {
            origin: "*",
        }
    }
};
class App {
    name = 'tsdiapi-io';
    config;
    globFilesPath;
    context;
    constructor(config) {
        this.config = { ...config };
        this.globFilesPath = this.config.globFilesPath || defaultConfig.globFilesPath;
    }
    async registerSocketControllers(app, server) {
        const apiDir = this.context.apiDir;
        let corsOptions = this.context.config?.corsOptions || defaultConfig.socketOptions?.cors;
        if (this.config.socketOptions?.cors && corsOptions) {
            corsOptions = { ...corsOptions, ...this.config.socketOptions.cors };
        }
        const io = new socket_io_1.Server(server, {
            cors: corsOptions
        });
        // Socket.io Started 
        this.context.logger.info(`Socket.io Started`);
        app.use(function (req, res, next) {
            req.io = io;
            next();
        });
        io.use(async (socket, next) => {
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
        });
        const container = this.context.container;
        const globPath = apiDir + "/**/" + this.globFilesPath;
        const appDir = this.context.appDir;
        const controllers = [];
        const files = glob_1.glob.sync(globPath, { cwd: appDir });
        for (const file of files) {
            const module = await Promise.resolve(`${appDir + "/" + file}`).then(s => __importStar(require(s)));
            if (module.default) {
                controllers.push(module.default);
            }
        }
        const socketControllers = this.config.socketControllers;
        if (!socketControllers || typeof socketControllers !== "function") {
            console.error("SocketControllers not found");
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
    async onInit(ctx) {
        this.context = ctx;
    }
    async beforeStart(ctx) {
        this.registerSocketControllers(ctx.app, ctx.server);
    }
}
exports.default = App;
//# sourceMappingURL=index.js.map