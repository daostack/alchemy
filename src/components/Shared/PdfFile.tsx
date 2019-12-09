import { Document, Page } from "react-pdf/dist/entry.webpack";
import * as React from "react";
import * as css from "./PdfFile.scss";

export interface IExternalPropos {
  fileUrl: string;
}

export default class PdfFile extends React.Component<IExternalPropos, {
  numPages: number;
  pageNumber: number;
}> {
    
  constructor(props: IExternalPropos) {
    super(props);
    this.state = {
      numPages: null,
      pageNumber: 1,
    };
  }

  private onDocumentLoadSuccess = (document: { numPages: number} ) => {
    this.setState({ numPages: document.numPages });
  }

  render(): RenderOutput {
    const { numPages } = this.state;

    return <div className={css.pdfContainer}>
      <Document file={`${window.location.protocol}//${window.location.host}/assets/${this.props.fileUrl}`}
        className="reactPdfDocument"
        onLoadSuccess={this.onDocumentLoadSuccess}
        loading="Loading...">
        {Array.from(
          new Array(numPages),
          (el, index) => (
            <Page className="reactPdfDocumentPage"
              key={`page_${index + 1}`}
              pageNumber={index + 1}
            />
          ),
        )}
      </Document>
    </div>;
  }
}
