import * as React from "react";
import { connect } from "react-redux";
import { Prompt } from "react-router-dom";
import { showNotification } from "reducers/notifications";
import { enableWalletProvider, getWeb3Provider } from "arc";
import { getNetworkName } from "lib/util";

const DAOcreator = React.lazy(() => import("@dorgtech/daocreator-ui"));

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
        <DAOcreator
          setWeb3Provider={async (): Promise<any> => {
            if (!await enableWalletProvider({ showNotification: this.props.showNotification }, await getNetworkName())) {
              return undefined;
            }

            return await getWeb3Provider();
          }}
          noDAOstackLogo
          redirectURL={process.env.BASE_URL}
          networks={process.env.NETWORKS}
        />
      </React.Suspense>
    );
  }
}

export default connect(null, mapDispatchToProps)(DaoCreator);
