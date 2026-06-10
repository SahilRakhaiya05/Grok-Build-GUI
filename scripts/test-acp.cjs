const { spawn } = require("child_process");
const readline = require("readline");

const cli = process.env.GROK_CLI || "C:\\Users\\Admin\\.grok\\bin\\grok.exe";
const cwd = process.env.USERPROFILE || "C:\\Users\\Admin";

const proc = spawn(cli, ["agent", "stdio"], { cwd, shell: false });
const rl = readline.createInterface({ input: proc.stdout });

let id = 1;
function send(method, params) {
  const msg = JSON.stringify({ jsonrpc: "2.0", id: id++, method, params });
  proc.stdin.write(msg + "\n");
  console.log(">>", method);
}

proc.stderr.on("data", (d) => process.stderr.write("[stderr] " + d));
proc.on("exit", (code) => console.log("exit", code));

rl.on("line", (line) => {
  console.log("<<", line.slice(0, 200));
  try {
    const data = JSON.parse(line);
    if (data.id === 1 && data.result) {
      send("session/new", { cwd, mcpServers: [] });
    } else if (data.id === 2 && data.result) {
      console.log("OK session", data.result.sessionId);
      proc.kill();
      process.exit(0);
    } else if (data.error) {
      console.error("ERR", data.error);
      process.exit(1);
    }
  } catch (e) {
    console.error("parse", e.message);
  }
});

send("initialize", {
  protocolVersion: 1,
  clientCapabilities: { fs: { readTextFile: true, writeTextFile: true }, terminal: true },
});

setTimeout(() => {
  console.error("TIMEOUT");
  proc.kill();
  process.exit(2);
}, 30000);