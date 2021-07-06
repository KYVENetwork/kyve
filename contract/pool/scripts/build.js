const { build } = require("esbuild");
const fs = require("fs");

(async () => {
  await build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    format: "esm",
    bundle: true,
  });

  let src = fs.readFileSync("dist/index.js").toString();
  src = src.replace("async function handle", "export async function handle");
  src = src.replace("export {\n  handle\n};\n", "");
  fs.writeFileSync("dist/index.js", src);
})();
