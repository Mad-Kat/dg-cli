import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export default async function (args: string[]) {
  const {
    options: { foo },
  } = await new Command()
    .name("new test")
    .description("asdf test new")
    .option("-x, --foo <foo:string>", "asdf")
    .parse(args);

  console.log({ foo });

  return foo;
}
