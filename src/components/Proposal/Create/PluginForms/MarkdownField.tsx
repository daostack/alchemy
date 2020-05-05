import { FieldProps } from "formik";
import * as React from "react";
import ReactMde, { commands } from "react-mde";

const ReactMarkdown = require("react-markdown");

interface IProps {
  onChange: any;
}

interface IState {
  selectedTab: "write"|"preview";
}

type Props = FieldProps<any> & IProps;

export default class MarkdownField extends React.Component<Props, IState> {

  constructor(props: Props) {
    super(props);

    this.state = {
      selectedTab: "write",
    };
  }

  private generateMarkdownPreview = (markdown: any) => Promise.resolve(<ReactMarkdown source={markdown} />);
  private onTabChange = (tab: any) => { this.setState({ selectedTab: tab}); };

  public render(): RenderOutput {
    const { field, onChange } = this.props;

    // Hacky way to turn off tab selection of buttons in the toolbar
    const defaultCommands = commands.getDefaultCommands();
    const usedCommands = defaultCommands;
    defaultCommands.forEach((commandGroup, i) => {
      commandGroup.commands.forEach((command, j) => {
        const noTabCommand = defaultCommands[i].commands[j];
        noTabCommand.buttonProps["tabIndex"] = -1;
        usedCommands[i].commands[j] = noTabCommand;
      });
    });

    return (
      <div>
        <ReactMde
          commands={usedCommands}
          generateMarkdownPreview={this.generateMarkdownPreview}
          maxEditorHeight={84}
          minEditorHeight={84}
          minPreviewHeight={74}
          onChange={onChange}
          onTabChange={this.onTabChange}
          selectedTab={this.state.selectedTab}
          value={field.value}
          childProps={{
            writeButton: {
              tabIndex: -1,
            },
            previewButton: {
              tabIndex: -1,
            },
          }}
        />
      </div>
    );
  }
}
