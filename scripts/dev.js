const { spawn } = require("node:child_process");

function start(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      LOCAL_VITE: "true",
    },
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
}

const server = start("npm", ["run", "dev", "--workspace", "server"], "server");

process.on("SIGINT", () => {
  server.kill();
  process.exit();
});
