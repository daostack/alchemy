import * as React from "react";
import { WithContext as ReactTags, Tag } from "react-tag-input";
import classNames from "classnames";
import { Address, Proposal, IProposalState} from "@daostack/client";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { from, combineLatest, of  } from "rxjs";
import { mergeMap } from "rxjs/operators";
import * as css from "./TagsSelector.scss";

interface IExternalProps {
  /**
   * for pages with a dark background (like proposal details)
   */
  darkTheme?: boolean;
  onChange?: (tags: Array<string>) => void;
  /**
   * only required when not readonly and you want to provide tag suggestions
   */
  daoAvatarAddress?: Address;
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

type IProps = IExternalProps & ISubscriptionProps<Array<Array<string>>>
  
class TagsSelector extends React.Component<IProps, IStateProps> {

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
    const tags = this.state.workingTags.filter((_tag: Tag, index: number) => index !== i);
    this.setState({ workingTags: tags });
    this.emitOnChange(tags);
  }
 
  private handleAddition = () => (tag: Tag): void => {
    const tags = [...this.state.workingTags, tag];
    this.setState({ workingTags:  tags });
    this.emitOnChange(tags);
  }

  private handleDrag = () => (tag: Tag, currPos: number, newPos: number): void => {
    const tags = this.state.workingTags.slice();

    tags.splice(currPos, 1);
    tags.splice(newPos, 0, tag);

    this.setState({ workingTags: tags });
    this.emitOnChange(tags);
  }

  /**
   * return Map where key is tag, value is count of tags
   * @param allTags 
   */
  private groupTags(allTags: Array<string>): Map<string,number> {
    const map = new Map<string,number>();
    allTags.forEach(tag => {
      tag = tag.toLocaleLowerCase();
      if (!map.has(tag)) {
        map.set(tag,0);
      }
      map.set(tag,map.get(tag)+1);
    });
    return map;
  }

  public render(): RenderOutput {
    const { workingTags } = this.state;
    const { readOnly, darkTheme } = this.props;
    const allTags: Array<Array<string>> = this.props.data;
    let suggestions: Array<ITagEx>;
    
    if (allTags && allTags.length) {
      suggestions = new Array<ITagEx>();
      const tagCounts = this.groupTags(allTags.reduce((acc: Array<string>, tags: Array<string>): Array<string> => {
        if (tags && tags.length) {
          acc = acc.concat(tags);
        }
        return acc;
      }, new Array<string>())
      );
      for (const tag of tagCounts.keys()) {
        suggestions.push({ id: tag, text: tag, count: tagCounts.get(tag)});
      }
    }

    return <div className={classNames({
      [css.reactTagsContainer]: true,
      ["darkTheme"]: darkTheme,
    })}>
      {
        // from here: https://github.com/prakhar1989/react-tags
      }
      <ReactTags
        tags={workingTags}
        suggestions={suggestions}
        handleDelete={this.handleDelete()}
        handleAddition={this.handleAddition()}
        handleDrag={this.handleDrag()}
        delimiters={delimiters}
        autocomplete={1}
        readOnly={!!readOnly}
        autofocus={false}
        // eslint-disable-next-line react/jsx-no-bind
        renderSuggestion = {( tag: ITagEx ) => <div>{tag.text} <span className="count">({tag.count})</span></div>}
      />
    </div>;
  }
}

export default withSubscription({
  wrappedComponent: TagsSelector,
  checkForUpdate: () => { return false; },
  createObservable: (props: IExternalProps) => {
    if (!props.daoAvatarAddress) {
      return from([]);
    }
    const arc = getArc();
    const dao = arc.dao(props.daoAvatarAddress);

    // dao.proposals({}, { subscribe: false }).pipe(
    //   flatMap((proposals: Array<Proposal>) => proposals)
    //   , mergeMap((proposal: Proposal) => proposal.state())
    //   , mergeMap((proposal: IProposalState) => proposal.tags)
      
    //   // , groupBy(tag => tag.toLowerCase())
    //   // , mergeMap(og => og.pipe(reduce((acc, tag: any): any => { acc.push(tag); return acc; }, [])))
    //   // , concatMap(
    //   //   group$ => group$.pipe(
    //   //     map(obj => ({ key: group$.key, value: obj }))
    //   //   )
    //   // )
    //   // , mergeMap(og => og.pipe(toArray()))
    //   // , mergeMap((go) => go.pipe(reduce((acc, tag: any): any => { acc.push(tag); return acc; }, [])))
    //   // , map((tagArray: Array<string>) => {
    //   //   return of({id: tagArray[0], text: tagArray[0], count: tagArray.length});
    //   // })4
    // )
    //   .subscribe(p => console.dir(p));

    //emit each person
    // of({name: "Sue", age:25},{name: "Joe", age: 30},{name: "Frank", age: 25}, {name: "Sarah", age: 35}).pipe(
    //   groupBy(person => person.age),
    // //return as array of each group
    //   flatMap(group => group.reduce((acc, curr) => [...acc, ...curr], []))
    //   })
    //   .subscribe(val => console.log(val));

    // of(
    //   {id: 1, name: "JavaScript"},
    //   {id: 2, name: "Parcel"},
    //   {id: 2, name: "webpack"},
    //   {id: 1, name: "TypeScript"},
    //   {id: 3, name: "TSLint"}
    // ).pipe(
    //   groupBy(p => p.id)
    //   // mergeMap((group) => group.pipe(toArray()))
    // )
    //   .subscribe(p => console.log(p));

    const tags = dao.proposals({}, { subscribe: false }).pipe(
      mergeMap((proposals: Array<Proposal>) => combineLatest(Array.from(proposals, (proposal) => proposal.state())))
      , mergeMap((proposals: Array<IProposalState>) => 
        combineLatest(Array.from(proposals, (proposal) => of(proposal.tags))))
      // produces one iteration per tag from all the proposals:
      // , mergeMap((proposal: IProposalState) => proposal.tags)
      // reduces all the iterations (tags) down to a single array:
      // , mergeMap((tags) => combineLatest(Array.from(tags, (tag) => tag)))
      // , reduce((acc: Array<any>, val: any) => {
      //   if (val) acc.push(val);
      //   return acc;
      // }, new Array<any>())
    );
    return tags;
  },
});
