import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan, baseTokenName, truncateWithEllipses, buf2hex, getContractName } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import BN = require("bn.js");
import CopyToClipboard from "components/Shared/CopyToClipboard";
import { getABIByContract, decodeABI, IDecodedData } from "../Create/SchemeForms/ABIService";

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
}

const parseParamValue = (type: string, value: any) => {
  switch (true){
    case type.includes("address"):
      return `0x${value}`;
    case type.includes("uint"):
      return value.toString(10);
    case type.includes("byte"):
      return `0x${buf2hex(value)}`;
    default:
      return "unsupported type";
  }
};


const DecodedData = (props: IDecodedDataProps) => {
  const [lodaing, setLoading] = React.useState(false);
  const [decodedData, setDecodedData] = React.useState<IDecodedData>({method: "", inputs: [], names: [], types: []});

  React.useEffect(() => {
    const getAbi = async () => {
      setLoading(true);
      const abiData = await getABIByContract(props.contract);
      setDecodedData(decodeABI(abiData, props.callData));
      setLoading(false);
    };
    getAbi();
  }, []);

  const methodParams = decodedData.names.map((param: string, index: number) => {
    return <div key={index} className={css.paramWrapper}>{param}: <span className={css.valueText}>{parseParamValue(decodedData.types[index], decodedData.inputs[index])}</span></div>;
  });

  return (
    <div>
      {lodaing && "loading..."}
      <div>Method: <span className={css.valueText}>{decodedData.method}({decodedData.types.join(",")})</span></div>
      {methodParams}
    </div>
  );
};

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {
    const { proposal, detailView, transactionModal } = this.props;
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
          Generic multicall
          {tokenAmountToSend && <div className={css.warning}>&gt; Sending {tokenAmountToSend.toString()} {baseTokenName()} &lt;</div>}
        </span>
        {detailView &&
          <div className={css.summaryDetails}>
            {
              proposal.genericSchemeMultiCall.contractsToCall.map((contract, index) => (
                <div key={index} className={css.multiCallContractDetails}>
                  <p>{`Contract #${index}:`} {<a className={css.valueText} href={linkToEtherScan(contract)} target="_blank" rel="noopener noreferrer">{contract} {`(${getContractName(contract)})`}</a>}</p>
                  <p>{baseTokenName()} value: <span className={css.valueText}>{proposal.genericSchemeMultiCall.values[index]}</span></p>
                  <DecodedData contract={contract} callData={proposal.genericSchemeMultiCall.callsData[index]} />
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
