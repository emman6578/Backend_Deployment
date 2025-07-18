"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMySQLPool = getMySQLPool;
exports.closeMySQLPool = closeMySQLPool;
exports.withConnection = withConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
let pool = null;
function getMySQLPool() {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "3306"),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
            queueLimit: 0,
        });
    }
    return pool;
}
function closeMySQLPool() {
    return __awaiter(this, void 0, void 0, function* () {
        if (pool) {
            yield pool.end();
            pool = null;
        }
    });
}
// For individual connection management
function withConnection(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = getMySQLPool();
        const connection = yield pool.getConnection();
        try {
            return yield fn(connection);
        }
        finally {
            connection.release();
        }
    });
}
