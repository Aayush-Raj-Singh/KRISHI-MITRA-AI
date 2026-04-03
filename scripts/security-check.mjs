import { spawnSync } from "node:child_process";
import process from "node:process";

const rootDir = process.cwd();

const runJson = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf-8",
    shell: process.platform === "win32",
  });

  const stdout = result.stdout?.trim() || "{}";
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${command} ${args.join(" ")}: ${stdout}`);
  }

  return {
    status: result.status ?? 1,
    payload: parsed,
  };
};

const summarize = (report) => {
  const counts = report?.metadata?.vulnerabilities || {};
  return {
    info: counts.info || 0,
    low: counts.low || 0,
    moderate: counts.moderate || 0,
    high: counts.high || 0,
    critical: counts.critical || 0,
    total: counts.total || 0,
  };
};

const runtimeAudit = summarize(runJson("npm", ["audit", "--omit=dev", "--json"]).payload);
const fullAudit = summarize(runJson("npm", ["audit", "--json"]).payload);

const summary = {
  runtime: runtimeAudit,
  full: fullAudit,
  policy: {
    fail_on_runtime_high_or_critical: true,
    runtime_blocking_count: runtimeAudit.high + runtimeAudit.critical,
  },
};

console.log(JSON.stringify(summary, null, 2));

if (summary.policy.runtime_blocking_count > 0) {
  process.exit(1);
}
