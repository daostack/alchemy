import * as React from "react";
import ChipInput from "material-ui-chip-input";
//import { IProposalState } from "@daostack/client";

// interface ITagState {
//   name: string;
//   proposals: IProposalState[];
// }

interface IProps {
  onChange: (tags: string[]) => void;
}

// interface IState {
// }

export default class TagsSelector extends React.Component<IProps> {

  // constructor(props: IProps) {
  //   super(props);
  // }

  public render(): RenderOutput {
    const { onChange } = this.props;
    const tags = ["fun","governance","extra terrestrial"]; // proposal.tags;

    return <ChipInput
      fullWidth
      defaultValue={tags}
      placeholder='Type and press enter or tab to select or add tags'
      onChange={onChange}
    />;
  }
}
