import * as React from "react";
import { WithContext as ReactTags, Tag } from "react-tag-input";

interface IProps {
  onChange: (tags: Array<Tag>) => void;
}

interface IState {
  tags: Array<Tag>;
}

const KeyCodes = {
  comma: 188,
  enter: 13,
};
 
const delimiters = [KeyCodes.comma, KeyCodes.enter];
  
export default class TagsSelector extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = { tags: new Array<Tag>() };
  }

  private handleDelete = () => (i: number): void => {
    this.state.tags.splice(i, 1);
    if (this.props.onChange) {
      this.props.onChange(this.state.tags);
    }
    // this.setState({ tags: this.state.tags });
  }
 
  private handleAddition = () => (tag: Tag): void => {
    this.state.tags.push(tag);
    if (this.props.onChange) {
      this.props.onChange(this.state.tags);
    }
    // this.setState({ tags: this.state.tags });
  }

  private handleDrag = () => (tag: Tag, currPos: number, newPos: number): void => {
    // const tags = [...this.state.tags];
    const tags = this.state.tags;
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    this.setState({ tags: newTags });

    if (this.props.onChange) {
      this.props.onChange(this.state.tags);
    }
  }

  public render(): RenderOutput {
    const { tags } = this.state;
    const suggestions = [
      {id: "fun", text: "fun"},
      {id: "delete", text: "delete"},
      {id: "deleterious", text: "deleterious"},
      {id: "deletion", text: "deletion"},
      {id: "indelable", text: "indelable"},
      {id: "indelicate", text: "indelicate"},
      {id: "indisrete", text: "indisrete"},
      {id: "governance", text: "governance"},
      {id: "extra", text: "extra terrestrial"}] as Array<Tag>;

    return <ReactTags
      tags={tags}
      suggestions={suggestions}
      handleDelete={this.handleDelete()}
      handleAddition={this.handleAddition()}
      handleDrag={this.handleDrag()}
      delimiters={delimiters} 
    />;
    //               <ChipInput
    // fullWidth
    // defaultValue={tags}
    // placeholder='Type and press enter or tab to select or add tags'
    // onChange={onChange}
    // />;
  }
}
