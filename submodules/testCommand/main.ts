export default function (args: string[]) {
  console.log({ args });
}

export const Command = {
  description: "Optional description",
  arguments: ["<requiredInput> [optionalInput]"],
  options: [],
};
