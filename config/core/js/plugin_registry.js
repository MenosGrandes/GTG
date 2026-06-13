import { JavaScriptPlugin } from "../../plugins/javascript/index.js";
import { PythonPlugin } from "../../plugins/python/index.js";
import { JSXPlugin } from "../../plugins/jsx/index.js";
import { ReactNativePlugin } from "../../plugins/reactnative/index.js";

const plugins = {
  javascript: new JavaScriptPlugin(),
  python: new PythonPlugin(),
  jsx: new JSXPlugin(),
  reactnative: new ReactNativePlugin(),
};

export function getPlugin(language) {
  const plugin = plugins[language];
  if (!plugin) {
    const available = Object.keys(plugins).join(", ");
    throw new Error(`Unknown language '${language}'. Available: ${available}`);
  }
  return plugin;
}

export function registerPlugin(name, plugin) {
  plugins[name] = plugin;
}
