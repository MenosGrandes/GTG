import { ComponentPlugin } from "../component/base.js";

export class JSXPlugin extends ComponentPlugin {
  getTestsDir() {
    return "exercises/tests/jsx";
  }
}
