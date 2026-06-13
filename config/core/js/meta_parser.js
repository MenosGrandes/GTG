import { parse } from "smol-toml";

export function parseMeta(content) {
  return parse(content);
}
