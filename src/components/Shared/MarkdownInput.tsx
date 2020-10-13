import * as React from "react";
import ReactMde from "react-mde";

const ReactMarkdown = require("react-markdown");

interface IProps {
  onChange: (markdown: string) => void;
  defaultValue?: string;
}

interface IState {
  selectedTab: "write"|"preview";
  value: string;
}

export default class MarkdownInput extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      selectedTab: "write",
      value: props.defaultValue,
    };
  }

  private generateMarkdownPreview = (markdown: any) => Promise.resolve(<ReactMarkdown source={markdown} />);
  private onTabChange = (tab: any) => { this.setState({ selectedTab: tab}); };

  private handleChange = (markdown: string): void => {
    this.setState({ value: markdown});
    this.props.onChange?.(markdown);
  }

  public render(): RenderOutput {
    return (
      <ReactMde
        generateMarkdownPreview={this.generateMarkdownPreview}
        maxEditorHeight={2000}
        minEditorHeight={84}
        minPreviewHeight={84}
        onChange={this.handleChange}
        onTabChange={this.onTabChange}
        selectedTab={this.state.selectedTab}
        value={this.state.value}
        childProps={{
          writeButton: {
            tabIndex: -1,
          },
          previewButton: {
            tabIndex: -1,
          },
        }}
      />
    );
  }
}
