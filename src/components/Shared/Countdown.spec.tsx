import * as React from "react";
import {render} from "react-dom";
import Countdown from "./Countdown";

it("renders without crashing", async () => {
  const div = document.createElement("div");
  const date = new Date();
  render(<Countdown toDate={date} />, div);
});
