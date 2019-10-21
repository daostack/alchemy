import * as React from "react";
import { WithContext as ReactTags, Tag } from "react-tag-input";
import * as css from "./TagsSelector.scss";

interface IProps {
  onChange?: (tags: Array<string>) => void;
  readOnly?: boolean;
  /**
   * tags to start with
   */
  tags?: Array<string>;
}

interface IState {
  workingTags: Array<Tag>;
}

const KeyCodes = {
  comma: 188,
  enter: 13,
  tab: 9,
};
 
const delimiters = [KeyCodes.comma, KeyCodes.enter, KeyCodes.tab];
  
export default class TagsSelector extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = { 
      workingTags: props.tags ? props.tags.map((tag: string) => {return { id: tag, text: tag }; }) : new Array<Tag>() };
  }

  private emitOnChange(tags: Array<Tag>): void {
    if (this.props.onChange) {
      this.props.onChange(tags.map((tag: Tag) => tag.text));    
    }
  }

  private handleDelete = () => (i: number): void => {
    const tags = this.state.workingTags;
    this.setState({
      workingTags: tags.filter((_tag: Tag, index: number) => index !== i),
    });
        
    this.emitOnChange(this.state.workingTags);
  }
 
  private handleAddition = () => (tag: Tag): void => {
    this.setState({ workingTags: [...this.state.workingTags, tag] });
    this.emitOnChange(this.state.workingTags);
  }

  private handleDrag = () => (tag: Tag, currPos: number, newPos: number): void => {
    const tags = this.state.workingTags.slice();

    tags.splice(currPos, 1);
    tags.splice(newPos, 0, tag);

    this.setState({ workingTags: tags });
    this.emitOnChange(tags);
  }

  public render(): RenderOutput {
    const { workingTags } = this.state;
    const { readOnly } = this.props;
    const suggestions = [
      {id: "fun", text: "fun"},
      {id: "delete", text: "delete"},
      {id: "deleterious", text: "Deleterious"},
      {id: "deletion", text: "deletion"},
      {id: "indelable", text: "Indelable"},
      {id: "indelicate", text: "indelicate"},
      {id: "indisrete", text: "Indisrete"},
      {id: "indisrete1", text: "Indisrete1"},
      {id: "indisrete2", text: "Indisrete2"},
      {id: "indisrete3", text: "Indisrete3"},
      {id: "indisrete4", text: "Indisrete4"},
      {id: "indisrete5", text: "Indisrete5"},
      {id: "indisrete6", text: "Indisrete6"},
      {id: "indisrete7", text: "Indisrete7"},
      {id: "indisrete8", text: "Indisrete8"},
      {id: "indisrete9", text: "Indisrete9"},
      {id: "indisrete10", text: "Indisretei10"},
      {id: "indisrete11", text: "Indisrete11"},
      {id: "governance", text: "governance"},
      {id: "extra", text: "extra terrestrial"}] as Array<Tag>;

    return <div className={css.reactTagsContainer}>
      <ReactTags
        tags={workingTags}
        suggestions={suggestions}
        handleDelete={this.handleDelete()}
        handleAddition={this.handleAddition()}
        handleDrag={this.handleDrag()}
        delimiters={delimiters}
        autocomplete={1}
        readOnly={!!readOnly}
      />
    </div>;
  }
}
