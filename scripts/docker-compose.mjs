import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  process.stderr.write("Usage: node scripts/docker-compose.mjs <compose args...>\n");
  process.exit(1);
}

const dockerComposePlugin = spawnSync("docker", ["compose", "version"], {
  stdio: "ignore",
  shell: false,
});

if (!dockerComposePlugin.error && dockerComposePlugin.status === 0) {
  const result = spawnSync("docker", ["compose", ...args], {
    stdio: "inherit",
    shell: false,
  });
  process.exit(result.status ?? 1);
}

const standaloneCompose = spawnSync("docker-compose", ["version"], {
  stdio: "ignore",
  shell: false,
});

if (!standaloneCompose.error && standaloneCompose.status === 0) {
  const result = spawnSync("docker-compose", args, {
    stdio: "inherit",
    shell: false,
  });
  process.exit(result.status ?? 1);
}

process.stderr.write("Docker Compose was not found. Install the Docker Compose plugin or docker-compose.\n");
process.exit(1);
