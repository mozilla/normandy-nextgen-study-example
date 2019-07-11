const { promisify } = require("util");
const fs = require("fs");
const pathModule = require("path");

const rimraf = promisify(require("rimraf"));
const fsWalker = require("klaw");
const { template } = require("safe-es6-template");
const webExt = require("web-ext").default;

const packageJson = require("./package.json");

// A promisified version of the entire `fs` module.
const fsp = new Proxy(fs, {
  get(obj, prop) {
    return promisify(obj[prop]);
  }
});

// Read extension files from here
const SOURCE_DIR = "./src";
// Write processed extension files to here.
const DEST_BASE_DIR = "./dist";

/**
 * Copy the extension source from src into `dist/extension-${variant}`. Any
 * files whose name ends with `.tmpl` will be processed as templates and the
 * output will be saved to a file without the `.tmpl` extension.
 *
 * Templates use ES6 template string syntax. Available variables are `package`,
 * which contains the contents of `package.json` and `variant`, the parameter
 * passed to this function.
 *
 * @param {String} variant The variant of the extension to build. Used in file
 *        paths and provided to templates.
 */
async function copyAddonSrc(variant) {
  const targetDir = pathModule.join(DEST_BASE_DIR, `extension-${variant}`);
  const templateData = {
    package: packageJson,
    variant
  };

  await new Promise((resolve, reject) => {
    // Accrue promises of `data` callbacks, so we can await them before
    // resolving the parent promise.
    const promises = [];

    fsWalker(SOURCE_DIR)
      .on("data", ({ path, stats }) => {
        promises.push(
          (async () => {
            const relativePath = pathModule.relative(SOURCE_DIR, path);
            const targetPath = pathModule.join(targetDir, relativePath);

            if (stats.isDirectory()) {
              await fsp.mkdir(targetPath);
            } else if (stats.isFile()) {
              if (path.endsWith(".tmpl")) {
                const newPath = targetPath.replace(/\.tmpl$/, "");
                const content = await fsp.readFile(path, { encoding: "utf8" });
                const rendered = template(content, templateData);
                await fsp.writeFile(newPath, rendered);
              } else {
                await fsp.copyFile(path, targetPath);
              }
            } else {
              throw new Error(
                `Can't handle path at ${path} - neither file nor directory`
              );
            }
          })()
        );
      })
      .on("end", async () => {
        // Wait until all data callbacks are finished.
        await Promise.all(promises);
        resolve();
      })
      .on("error", (err, item) => {
        reject({ err, item });
      });
  });
}

/**
 * Calls web-ext to build the webextension from a built variant directory (see
 * copyAddonSrc). Then renames the file to a path that follows standard study
 * naming of `${id}@mozilla.org-${version}.xpi`, which includes the variant
 * name since `id` includes the variant name.
 *
 * @param {String} variant The variant of the extension to build. Used to find
 *        the source and name the final XPI file.
 */
async function buildAddon(variant) {
  const addonDir = pathModule.join(DEST_BASE_DIR, `extension-${variant}`);
  await webExt.cmd.build(
    {
      sourceDir: addonDir,
      overwriteDest: true,
      artifactsDir: "web-ext-artifacts"
    },
    { shouldExitProgram: false }
  );
  let oldFilePath = pathModule.join(
    "web-ext-artifacts",
    `normandy_nextgen_study_example-${packageJson.version}.zip`
  );
  let newFilePath = pathModule.join(
    "web-ext-artifacts",
    `${packageJson.name}-${variant}@mozilla.org-${packageJson.version}.xpi`
  );
  wait fsp.rename(oldFilePath, newFilePath);
  console.log(`Renamed ${oldFilePath} to ${newFilePath}`);
}

async function buildVariant(variant) {
  await copyAddonSrc(variant);
  await buildAddon(variant);
}

async function main() {
  await rimraf(DEST_BASE_DIR);
  await fsp.mkdir(DEST_BASE_DIR);

  for (const variant of ["a", "b", "c"]) {
    await buildVariant(variant);
  }
}

main().catch(err => console.error("Something has gone wrong", err));
