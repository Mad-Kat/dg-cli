import { colors, tty } from "https://deno.land/x/cliffy@v0.25.7/ansi/mod.ts";
import { delay } from "https://deno.land/std@0.170.0/async/delay.ts";
import subsub from "./subsubmain.ts";

const error = colors.bold.red;
const warn = colors.bold.yellow;
const info = colors.bold.blue;

export default async function main() {
  console.log("Hello world (Sub imported)");
  console.log(info("This is an info message!"));
  console.log(warn("This is a warning!"));
  console.log(error("This is an error message!"));
  console.log(error.underline("This is a critical error message!"));

  await delay(3000);

  tty.cursorLeft.cursorUp(4).eraseDown();
  subsub();
}
