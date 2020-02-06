import * as React from "react";
import { connect } from "react-redux";
import { enableWalletProvider, getWeb3Provider } from "arc";
import { showNotification } from "reducers/notifications";
const DAOcreator = React.lazy(() => import("@dorgtech/daocreator-ui-v1"));

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

  render() {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <DAOcreator
          setWeb3Provider={async (): Promise<any> => {
            if (!await enableWalletProvider({ showNotification: this.props.showNotification })) {
              return undefined;
            }

            return await getWeb3Provider();
          }}
          theme={{
            palette: {
              primary: {
                main: "#122e5b",
                contrastText: "#fafafa",
              },
              secondary: {
                main: "#0076ff",
                contrastText: "#fafafa",
              },
            },
          }}
        />
      </React.Suspense>
    );
  }
}

export default connect(null, mapDispatchToProps)(DaoCreator);
