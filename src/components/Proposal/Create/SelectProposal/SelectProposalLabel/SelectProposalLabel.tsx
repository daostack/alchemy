import * as React from "react";

import { ISchemeState } from "@daostack/arc.js";
import { schemeName } from "lib/schemeUtils";

interface IProps {
  value: string;
  label: ISchemeState;
}

export const SelectProposalLabel: React.FC<IProps> = ({ label, value }) => {
  return (
    <div key={value}>
      <span>{schemeName(label)}</span>
      <span>{label.id}</span>
    </div>
  );
};
