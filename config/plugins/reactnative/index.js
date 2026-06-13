import { ComponentPlugin } from "../component/base.js";

export class ReactNativePlugin extends ComponentPlugin {
  getTestsDir() {
    return "exercises/tests/reactnative";
  }
}
