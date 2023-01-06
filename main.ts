// workaround for https://github.com/denoland/deno/issues/8655
import { importModule } from "https://deno.land/x/import@v0.1.7/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

const loadFile = (filePath: string) =>
  importModule(import.meta.resolve("./" + filePath));

const runBinary = async (binaryPath: string, args: string[]) => {
  const p = Deno.run({ cmd: ["./" + binaryPath, ...args], cwd: Deno.cwd() });
  await p.status();
  return;
};

type BinarySubmodule = {
  type: "binary";
  path: string;
};

type DenoScriptSubmodule = {
  type: "deno-script";
  path: string;
};

type NpmPackageSubmodule = {
  type: "npm-package";
  path: string;
  command: string;
};

type UnknownSubmodule = {
  type: "unknown";
};

type SubmoduleType =
  | BinarySubmodule
  | DenoScriptSubmodule
  | NpmPackageSubmodule
  | UnknownSubmodule;

const typeOfSubmodule = async (dir: Deno.DirEntry): Promise<SubmoduleType> => {
  const pluginFiles = [...Deno.readDirSync("./submodules/" + dir.name)];
  if (pluginFiles.length === 1 && !pluginFiles[0].name.endsWith(".ts")) {
    return {
      type: "binary",
      path: "./submodules/" + dir.name + "/" + pluginFiles[0].name,
    };
  }

  const main = pluginFiles.find(
    (file) => file.name === "main.ts" || file.name === "main"
  );

  if (main) {
    return {
      type: "deno-script",
      path: "./submodules/" + dir.name + "/" + main.name,
    };
  }

  const packageEntry = pluginFiles.find((file) => file.name === "package.json");
  if (packageEntry) {
    const packageConfig: { bin: { [t: string]: string } } = JSON.parse(
      await Deno.readTextFile(
        "./submodules/" + dir.name + "/" + packageEntry.name
      )
    );

    const name = Object.keys(packageConfig.bin)?.[0];
    const command = packageConfig.bin[name];

    return {
      type: "npm-package",
      path: "./submodules/" + dir.name + "/",
      command: command,
    };
  }
  return { type: "unknown" };
};

const main = async () => {
  const commands = new Map<string, Command>();
  const submodules = Deno.readDir("./submodules");

  for await (const dir of submodules) {
    const submoduleType = await typeOfSubmodule(dir);

    switch (submoduleType.type) {
      case "binary":
        commands.set(
          dir.name,
          new Command()
            .name(dir.name)
            .description(`Run ${submoduleType.type} ${dir.name}`)
            .useRawArgs()
            .action(async (_options, ...args) => {
              await runBinary(submoduleType.path, args);
            }) as Command
        );
        break;
      case "deno-script": {
        const m = await loadFile(submoduleType.path);
        commands.set(
          dir.name,
          new Command()
            .name(dir.name)
            .description(
              m.Command?.description ||
                `Run ${submoduleType.type} inside ${dir.name}`
            )
            .option("-f, --force", "Force run", { required: true })
            .arguments(m.Command?.arguments[0])
            .useRawArgs()
            .action((_options, ...args) => {
              return m.default(args);
            }) as unknown as Command
        );
        break;
      }
      case "npm-package":
        commands.set(
          dir.name,
          new Command()
            .name(dir.name)
            .description(`Run ${submoduleType.type} ${dir.name}`)
            .useRawArgs()
            .action(async (_options, ...args) => {
              await runBinary(submoduleType.path + submoduleType.command, args);
            }) as Command
        );
        break;
      default:
        break;
    }
  }

  const c = new Command();

  for (const [name, command] of commands.entries()) {
    c.command(name, command);
  }

  await c.parse(Deno.args);
};

await main();
