import s from "./submain.ts";

export default async function run(args: string[]) {
  console.log("Hello world (Sub)");
  console.log(args);
  await s();
  console.log("asdf");
}
