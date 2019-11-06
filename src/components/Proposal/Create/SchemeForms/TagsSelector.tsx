import * as React from "react";
import { WithContext as ReactTags, Tag } from "react-tag-input";
import classNames from "classnames";
import { Tag as TagEntity } from "@daostack/client";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { RefObject } from "react";
import { map } from "rxjs/operators";
import { ITagState } from "@daostack/client/dist/types/tag";
import * as css from "./TagsSelector.scss";

interface IExternalProps {
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

interface IStateProps {
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

type IProps = IExternalProps & ISubscriptionProps<Array<ITagState>>
  
class TagsSelector extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);

    this.tagsComponent = React.createRef();

    this.state = {
      workingTags: props.tags ? props.tags.map((tag: string) => {return { id: tag, text: tag }; }) : new Array<Tag>(),
    };
  }

  private tagsComponent: RefObject<HTMLDivElement>;

  private emitOnChange(tags: Array<Tag>): void {
    if (this.props.onChange) {
      this.props.onChange(tags.map((tag: Tag) => tag.text));    
    }
  }

  private handleDelete = () => (i: number): void => {
    const tags = this.state.workingTags.filter((_tag: Tag, index: number) => index !== i);
    this.setState({ workingTags: tags });
    this.emitOnChange(tags);
  }
 
  private handleAddition = () => (tag: Tag): void => {
    const tags = [...this.state.workingTags, tag];
    this.setState({ workingTags:  tags });
    this.emitOnChange(tags);
  }

  private handleBlur = () => (): void => {
    const inputText = (this.tagsComponent.current.getElementsByClassName("ReactTags__tagInputField")[0] as HTMLInputElement).value;
    if (inputText) {
      let alreadyHas = false;
      const lowerInputText = inputText.toLocaleLowerCase();
      for (const tag of this.state.workingTags) {
        if (tag.text.toLocaleLowerCase() === lowerInputText) {
          alreadyHas = true;
          break;
        }
      }
      if (!alreadyHas) {
        this.handleAddition()({ id: inputText, text: inputText });
      }
    }
  }

  /**
   * return Map where key is tag, value is count of tags
   * @param allTags 
   */
  private groupTags(allTags: Array<ITagState>): Map<string,number> {
    const map = new Map<string,number>();
    allTags.forEach(tagState => {
      const tag = tagState.id.toLocaleLowerCase();
      if (!map.has(tag)) {
        map.set(tag,0);
      }
      map.set(tag, tagState.numberOfProposals + (map.get(tag) || 0));
    });
    return map;
  }

  public render(): RenderOutput {
    const { workingTags } = this.state;
    const { readOnly, darkTheme } = this.props;
    const allTags: Array<ITagState> = this.props.data;
    let suggestions: Array<ITagEx>;
    
    if (allTags && allTags.length) {
      suggestions = new Array<ITagEx>();
      /**
       * create a handy map of tag=>count that merges counts by case insensitivity
       */
      const tagCounts = this.groupTags(allTags);
      /**
       * sort by descending tag count
       */
      const sortedTags = Array.from(tagCounts.keys()).sort((a: string, b: string): number => tagCounts.get(b) - tagCounts.get(a));

      for (const tag of sortedTags) {
        suggestions.push({ id: tag, text: tag, count: tagCounts.get(tag)});
      }
    }

    return <div className={classNames({
      [css.reactTagsContainer]: true,
      ["darkTheme"]: darkTheme,
    })} ref={this.tagsComponent}>
      {
        // from here: https://github.com/prakhar1989/react-tags
      }
      <ReactTags
        tags={workingTags}
        suggestions={suggestions}
        handleDelete={this.handleDelete()}
        handleAddition={this.handleAddition()}
        handleInputBlur={this.handleBlur()}
        delimiters={delimiters}
        autocomplete={1}
        readOnly={!!readOnly}
        autofocus={false}
        allowDragDrop={false} // because we have no way to persist the tab order
        // eslint-disable-next-line react/jsx-no-bind
        renderSuggestion = {( tag: ITagEx ) => <div>{tag.text} <span className="count">({tag.count})</span></div>}
      />
    </div>;
  }
}

export default withSubscription({
  wrappedComponent: TagsSelector,
  checkForUpdate: () => { return false; },
  createObservable: (_props: IExternalProps) => {

    const arc = getArc();
    /**
     * Returns an array of ITagState.
     * Ask for `first: 1000` to raise the minimum from the default of 100 to the max of 1000
     */
    return arc.tags({ first: 1000 }, { subscribe: false })
      .pipe(
        map((tags: Array<TagEntity>) => tags.map(tag => tag.staticState))
      );
  },
});
