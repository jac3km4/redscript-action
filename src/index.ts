import * as core from "@actions/core";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import stripAnsi from "strip-ansi";

async function run(): Promise<void> {
  try {
    const source = core.getInput("source", { required: true });
    const lint = core.getInput("lint") == "true";
    const checkFormat = core.getInput("check-format") == "true";

    const exePath = await downloadCli();

    if (checkFormat) {
      try {
        execFileSync(exePath, ["format", "-c", "-s", source], {
          stdio: ["pipe", "ignore", "pipe"],
          encoding: "utf-8",
        });
        core.info("Formatting check completed successfully");
      } catch (error: any) {
        if (error.stderr) {
          handleDiagnostics("Formatter", error.stderr);
        }
        core.setFailed(error.message);
      }
    }

    if (lint) {
      const bundlePath = path.join(__dirname, "..", "assets", "api.redscripts");
      try {
        execFileSync(exePath, ["lint", "-s", source, "-b", bundlePath], {
          stdio: "pipe",
          encoding: "utf-8",
        });
        core.info("Linting completed successfully");
      } catch (error: any) {
        if (error.stdout) {
          handleDiagnostics("Linter", error.stdout);
        }
        core.setFailed(error.message);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

function handleDiagnostics(title: string, input: string) {
  const text = stripAnsi(input);
  const matches = text.matchAll(
    /(\[ERROR\]|\[WARN\])( \[\w+\])? At (([A-Z]:)?([^:\n]+))(:([0-9]+):([0-9]+))?(.*?)(?=\[ERROR\]|\[WARN\]|\[INFO\]|$)/gs,
  );
  for (const match of matches || []) {
    const [, level, , file, , , , line, column, message] = match;
    const annotation = {
      title,
      file,
      startLine: line ? parseInt(line) : undefined,
      startColumn: column ? parseInt(column) : undefined,
    };
    if (level === "[ERROR]") {
      core.error(message, annotation);
    } else {
      core.warning(message, annotation);
    }
  }
}

async function downloadCli() {
  const version = core.getInput("version");
  const url = `https://github.com/jac3km4/redscript/releases/download/v${version}/redscript-cli.exe`;
  core.info(`Downloading ${url}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const exePath = path.join(process.cwd(), path.basename(url));

  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(exePath, Buffer.from(buffer));
  core.info(`Downloaded ${exePath}`);

  return exePath;
}

run();
