import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const terraformDir = path.join(rootDir, "infra", "terraform");
const devEnvironmentDir = path.join(terraformDir, "environments", "dev");
const prodEnvironmentDir = path.join(terraformDir, "environments", "prod");
const validationVarFile = path.join(devEnvironmentDir, "local.validation.tfvars");
const checkFmt = process.argv.includes("--check-fmt");

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      TF_IN_AUTOMATION: "1",
      TF_INPUT: "0",
      AWS_EC2_METADATA_DISABLED: process.env.AWS_EC2_METADATA_DISABLED || "true",
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
};

if (!existsSync(validationVarFile)) {
  throw new Error(`Missing Terraform validation var-file: ${validationVarFile}`);
}

run("terraform", ["version"], terraformDir);
run("terraform", ["fmt", ...(checkFmt ? ["-check"] : []), "-recursive"], terraformDir);
run("terraform", ["init", "-backend=false"], terraformDir);
run("terraform", ["validate"], terraformDir);
run("terraform", ["init", "-backend=false"], devEnvironmentDir);
run("terraform", ["validate"], devEnvironmentDir);
run("terraform", ["init", "-backend=false"], prodEnvironmentDir);
run("terraform", ["validate"], prodEnvironmentDir);
run(
  "terraform",
  [
    "plan",
    "-input=false",
    "-lock=false",
    "-refresh=false",
    `-var-file=${path.basename(validationVarFile)}`,
  ],
  devEnvironmentDir,
);
