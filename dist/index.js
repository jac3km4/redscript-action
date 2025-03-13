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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
async function run() {
    try {
        const source = core.getInput("source", { required: true });
        const lint = core.getInput("lint") == "true";
        const checkFormat = core.getInput("check-format") == "true";
        const exePath = await downloadCli();
        if (checkFormat) {
            try {
                (0, child_process_1.execFileSync)(`${exePath}`, ["format", "-c", "-s", `${source}`], {
                    stdio: ["pipe", "ignore", "pipe"],
                    encoding: "utf-8",
                });
                core.info("Formatting check completed successfully");
            }
            catch (error) {
                if (error.stderr) {
                    handleDiagnostics("Formatter", error.stderr);
                }
                core.setFailed(error.message);
            }
        }
        if (lint) {
            const bundlePath = path_1.default.join(__dirname, "..", "assets", "api.redscripts");
            try {
                (0, child_process_1.execFileSync)(`${exePath}`, ["lint", "-s", `${source}`, "-b", `${bundlePath}`], {
                    stdio: "pipe",
                    encoding: "utf-8",
                });
                core.info("Linting completed successfully");
            }
            catch (error) {
                if (error.stdout) {
                    handleDiagnostics("Linter", error.stdout);
                }
                core.setFailed(error.message);
            }
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
function handleDiagnostics(title, input) {
    const text = (0, strip_ansi_1.default)(input);
    const matches = text.matchAll(/(\[ERROR\]|\[WARN\])( \[\w+\])? At (([A-Z]:)?([^:\n]+))(:([0-9]+):([0-9]+))?(.*?)(?=\[ERROR\]|\[WARN\]|\[INFO\]|$)/gs);
    for (const match of matches || []) {
        const [, level, , file, , , , line, column, message] = match;
        let logFn;
        if (level === "[ERROR]") {
            logFn = core.error;
        }
        else {
            logFn = core.warning;
        }
        logFn(message.trim(), {
            title,
            file,
            startLine: line ? parseInt(line) : undefined,
            startColumn: column ? parseInt(column) : undefined,
        });
    }
}
async function downloadCli() {
    const version = core.getInput("version");
    const url = `https://github.com/jac3km4/redscript/releases/download/v${version}/redscript-cli.exe`;
    core.info(`Downloading ${url}...`);
    const response = await (0, node_fetch_1.default)(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    const exePath = path_1.default.join(process.cwd(), path_1.default.basename(url));
    const buffer = await response.arrayBuffer();
    await fs_1.default.promises.writeFile(exePath, Buffer.from(buffer));
    core.info(`Downloaded ${exePath}`);
    return exePath;
}
run();
