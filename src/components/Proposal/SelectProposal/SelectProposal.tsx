import * as React from "react";
import { useCallback, useMemo } from "react";
import { RouteComponentProps } from "react-router-dom";

import { Scheme } from "@daostack/arc.js";

import { KNOWN_SCHEME_NAMES } from "lib/schemeUtils";
import UnknownSchemeCard from "components/Dao/UnknownSchemeCard";

import SelectProposalLabel from "./SelectProposalLabel";
import * as css from "./SelectProposal.scss";

const Select = React.lazy(() => import("react-select"));

interface IProps extends RouteComponentProps<{daoAvatarAddress: string}> {
  daoAvatarAddress: string;
  data: Scheme[];
}

export const SelectProposal: React.FC<IProps> = ({ daoAvatarAddress, data: schemes, history, match }) => {
  const handleChange = useCallback((el) => {
    const schemeId = el.value;
    history.push(`/dao/${match.params.daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  }, [daoAvatarAddress, history, match]);

  const knownSchemes = useMemo(() => {
    return schemes.filter((scheme: Scheme) => KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) >= 0);
  }, [schemes]);

  const unknownSchemes = useMemo(() => {
    return schemes.filter((scheme: Scheme) => KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) === -1);
  }, [schemes]);

  const options = useMemo(() => {
    return knownSchemes.map(({ staticState }: Scheme) => ({
      label: staticState,
      value: staticState.id,
    }));
  }, [knownSchemes]);

  return (
    <div className={css.modalWindow}>
      <h2 className={css.header}>
        <span>+ New Proposal <b>| select proposal type</b></span>
      </h2>
      <div className={css.body}>
        <label htmlFor="selectProposalType">
          Proposal Type:
        </label>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Select
            is="selectProposalType"
            options={options}
            onChange={handleChange}
            placeholder="Select Proposal Type..."
            formatOptionLabel={SelectProposalLabel}
          />
        </React.Suspense>
        {Boolean(unknownSchemes?.length) && (
          <UnknownSchemeCard schemes={unknownSchemes} />
        )}
      </div>
    </div>
  );
};
