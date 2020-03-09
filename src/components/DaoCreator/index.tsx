import * as React from "react";
import { connect } from "react-redux";
import { Prompt } from "react-router";
import { showNotification } from "reducers/notifications";

const DAOcreator = require("@dorgtech/daocreator-ui").default;

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type IProps = IDispatchProps;

const mapDispatchToProps = {
  showNotification,
};

class DaoCreator extends React.Component<IProps> {

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    // Block page refesh & closing
    window.onbeforeunload = () => true;
  }

  componentWillUnmount() {
    // Unblock page refresh & closing
    window.onbeforeunload = undefined;
  }

  render() {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Prompt
          when
          message={"Are you sure you want to leave?"}
        />
        <DAOcreator />
      </React.Suspense>
    );
  }
}

export default connect(null, mapDispatchToProps)(DaoCreator);
