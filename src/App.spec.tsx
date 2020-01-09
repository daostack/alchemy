import * as React from "react";
import {render} from "react-dom";
import { App } from "./App";

it.skip("renders without crashing", async () => {
  const div = document.createElement("div");
  render(<App />, div);
});
