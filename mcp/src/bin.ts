#!/usr/bin/env node
import { runCli } from "./cli.js";
import { serve } from "./serve.js";

const argv = process.argv.slice(2);
if (argv[0] === "serve") {
  serve().catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  });
} else {
  runCli(argv).then((code) => process.exit(code));
}
