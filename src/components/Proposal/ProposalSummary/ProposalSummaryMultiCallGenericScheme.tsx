import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan, baseTokenName, truncateWithEllipses, buf2hex, getContractName, fromWei, getNetworkByDAOAddress, Networks } from "lib/util";
import * as React from "react";
import { IProfileState } from "@store/profiles/profilesReducer";
import * as css from "./ProposalSummary.scss";
import * as BN from "bn.js";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import { getABIByContract, decodeABI, IDecodedData } from "../Create/SchemeForms/ABIService";
import * as Validators from "../Create/SchemeForms/Validators";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

interface IDecodedDataProps {
  contract: string;
  callData: string;
  network: Networks;
}

const parseParamValue = (type: string, value: any) => {
  if (Validators.isAddressType(type)) {
    if (Validators.isArrayParameter(type)) {
      value = value.map((element: any) => {
        return `0x${element}\n`;
      });
      return value;
    }
    return `0x${value}`;
  }
  if (Validators.isBooleanType(type)) {
    return value.toString();
  }
  if (Validators.isUintType(type) || Validators.isIntType(type)) {
    return value.toString(10);
  }
  if (Validators.isByteType(type)) {
    if (Validators.isArrayParameter(type)) {
      value = value.map((element: any) => {
        return `0x${buf2hex(element)}\n`;
      });
      return value;
    }
    return `0x${buf2hex(value)}`;
  }

  return value;
};

const parseMethodSignature = (decodedData: IDecodedData): string => {
  const params = decodedData.names.map((name, index) => {
    return `${name}: ${decodedData.types[index]}`;
  });
  return `${decodedData.method} (${params})`;
};

const DecodedData = (props: IDecodedDataProps) => {
  const [lodaing, setLoading] = React.useState(false);
  const [decodedData, setDecodedData] = React.useState<IDecodedData>({method: "", inputs: [], names: [], types: []});

  React.useEffect(() => {
    const getAbi = async () => {
      setLoading(true);
      const abiData = await getABIByContract(props.contract, props.network);
      setDecodedData(decodeABI(abiData, props.callData));
      setLoading(false);
    };
    getAbi();
  }, []);

  const methodParams = decodedData.names.map((param: string, index: number) => {
    return <div key={index} className={css.paramWrapper}>{param}: <pre>{parseParamValue(decodedData.types[index], decodedData.inputs[index])}</pre></div>;
  });

  return (
    <div>
      {lodaing ? <div className={css.loadingMethodInfo}><div className={css.loader} /><i>Loading method info...</i></div> :
        <React.Fragment>
          <div>Method: <pre style={{ whiteSpace: "break-spaces" }}>{parseMethodSignature(decodedData)}</pre></div>
          {methodParams}
        </React.Fragment>}
    </div>
  );
};

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {
    const { proposal, detailView, transactionModal } = this.props;
    const network = getNetworkByDAOAddress(this.props.dao.address);
    const tokenAmountToSend = proposal.genericSchemeMultiCall.values.reduce((a: BN, b: BN) => new BN(a).add(new BN(b)));
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.summaryTitle}>
          Generic Multicall
          {fromWei(tokenAmountToSend) > 0 && <div className={css.warning}>&gt; Sending {fromWei(tokenAmountToSend)} {baseTokenName(network)} &lt;</div>}
        </span>
        {detailView &&
          <div className={css.summaryDetails}>
            {
              proposal.genericSchemeMultiCall.contractsToCall.map((contract, index) => (
                <div key={index} className={css.multiCallContractDetails}>
                  <p><b>{`#${index + 1}`}</b></p>
                  <p>Contract: <a className={css.valueText} href={linkToEtherScan(contract, network)} target="_blank" rel="noopener noreferrer">{getContractName(contract, this.props.dao.dao.id)} {`(${contract})`}</a></p>
                  <p>{baseTokenName(network)} value: <span className={css.valueText}>{fromWei(proposal.genericSchemeMultiCall.values[index])}</span></p>
                  <DecodedData contract={contract} callData={proposal.genericSchemeMultiCall.callsData[index]} network={network}/>
                  <p>Raw call data:</p>
                  <pre>{truncateWithEllipses(proposal.genericSchemeMultiCall.callsData[index], 66)}<CopyToClipboard value={proposal.genericSchemeMultiCall.callsData[index]} /></pre>
                </div>
              ))
            }
          </div>
        }
      </div>
    );
  }
}
