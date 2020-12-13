import * as React from "react";

import { ISchemeState } from "@daostack/arc.js";
import { schemeName } from "lib/schemeUtils";

import css from "./SelectProposalLabel.scss";

interface IProps {
  value: string;
  label: ISchemeState;
}

export const SelectProposalLabel: React.FC<IProps> = ({ label, value }) => {
  return (
    <div key={value}>
      <span className={css.label}>{schemeName(label)}</span>
      <span>({label.id.slice(0, 6)}...{label.id.slice(-4)})</span>
    </div>
  );
};
