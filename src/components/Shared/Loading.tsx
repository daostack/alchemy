import * as React from "react";
import Lottie from "react-lottie";

const animationData = require("../../assets/animations/Loader.json");

export default class Loading extends React.Component {

  public render(): RenderOutput {

    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

    return <div>
      <Lottie options={defaultOptions}
        height={200}
        width={200}/>
    </div>;
  }
}
