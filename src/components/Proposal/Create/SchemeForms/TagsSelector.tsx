import * as React from "react";
import { WithContext as ReactTags, Tag } from "react-tag-input";
import classNames from "classnames";
import * as css from "./TagsSelector.scss";

interface IProps {
  /**
   * for pages with a dark background (like proposal details)
   */
  darkTheme?: boolean;
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

interface ITagEx extends Tag {
  count: number;
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
    const { readOnly, darkTheme } = this.props;
    const suggestions = [
      {id: "fun", text: "fun", count: 20},
      {id: "delete", text: "delete", count: 19},
      {id: "deleterious", text: "Deleterious", count: 18},
      {id: "deletion", text: "deletion", count: 16},
      {id: "indelable", text: "Indelable", count: 15},
      {id: "indelicate", text: "indelicate", count: 14},
      {id: "indisrete", text: "Indisrete", count: 13},
      {id: "indisrete1", text: "Indisrete1", count: 12},
      {id: "indisrete2", text: "Indisrete2", count: 11},
      {id: "indisrete3", text: "Indisrete3", count: 10},
      {id: "indisrete4", text: "Indisrete4", count: 9},
      {id: "indisrete6", text: "Indisrete6", count: 8},
      {id: "indisrete7", text: "Indisrete7", count: 8},
      {id: "indisrete8", text: "Indisrete8", count: 7},
      {id: "indisrete9", text: "Indisrete9", count: 6},
      {id: "indisrete10", text: "Indisretei10", count: 6},
      {id: "indisrete11", text: "Indisrete11", count: 5},
      {id: "governance", text: "governance", count: 5},
    ] as Array<ITagEx>;

    return <div className={classNames({
      [css.reactTagsContainer]: true,
      ["darkTheme"]: darkTheme,
    })}>
      <ReactTags
        tags={workingTags}
        suggestions={suggestions}
        handleDelete={this.handleDelete()}
        handleAddition={this.handleAddition()}
        handleDrag={this.handleDrag()}
        delimiters={delimiters}
        autocomplete={1}
        readOnly={!!readOnly}
        // eslint-disable-next-line react/jsx-no-bind
        renderSuggestion = {( tag: ITagEx ) => <div>{tag.text} <span style={{ color: "red" }}>({tag.count})</span></div>}
      />
    </div>;
  }
}
