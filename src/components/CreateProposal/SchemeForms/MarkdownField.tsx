import { FieldProps } from "formik";
import * as React from "react";
import ReactMde from "react-mde";
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
      selectedTab: "write"
    };
  }

  public render() {
    const { field, onChange } = this.props;

    return (
      <div>
        <ReactMde
          onChange={onChange}
          onTabChange={(tab) => { this.setState({ selectedTab: tab}); }}
          value={field.value}
          generateMarkdownPreview={(markdown) =>
            Promise.resolve(<ReactMarkdown source={markdown} />)
          }
          selectedTab={this.state.selectedTab}
        />
      </div>
    );
  }
}
