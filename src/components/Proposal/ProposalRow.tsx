import { Proposal, IProposalState } from "@daostack/arc.js";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import { calculateProposalStatus, IProposalStatus } from "lib/proposalHelpers";
import { schemeName } from "lib/schemeUtils";
import * as React from "react";
import * as css from "./ProposalRow.scss";
import * as classNames from "classnames";

interface IProps {
  data: Proposal;
  history: any;
}

const ProposalRow = (props: IProps) => {
  const { id, dao, scheme, title, tags, boostedAt } = props.data.staticState as IProposalState;
  const tagsLables = tags.map((tag, index) => {
    return <div key={index} className={css.tag}>{(tag as any).id}</div>;
  });
  const status = calculateProposalStatus(props.data.staticState as IProposalState);

  const statusLabelClass = classNames({
    [css.statusLabel]: true,
    [css.passing]: status === IProposalStatus.Passing,
    [css.failing]: status === IProposalStatus.Failing,
  });

  return (
    <tr className={css.row} onClick={() => window.open(`/dao/${dao.id}/proposal/${id}`)}>
      <td className={css.titleWrapper}>
        <div className={css.title} title={title}>{title}</div>
        {tagsLables.length > 0 && <div className={css.tagsWrapper}>{tagsLables}</div>}
      </td>
      <td>{schemeName(scheme) ?? "Unknown"}</td>
      <td>{boostedAt && (status === IProposalStatus.Passing || status === IProposalStatus.Failing) && <div className={css.boostedWrapper}><img width="12px" src="/assets/images/Icon/boosted.svg" /> <span className={css.boostedLabel}>Boosted</span></div>}</td>
      <td className={css.statusWrapper}>
        <div className={statusLabelClass}>{status}</div>
        <div className={css.statusTime}><ProposalCountdown proposal={props.data.staticState as IProposalState} schemeView /></div>
      </td>
    </tr>
  );
};

export default ProposalRow;
