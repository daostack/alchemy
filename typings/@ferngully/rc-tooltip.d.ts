declare module "@ferngully/rc-tooltip" {
  import * as React from "react";

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  export as namespace RCTooltip;

  declare namespace RCTooltip {
    export type Trigger = "hover" | "click" | "focus";
    export type Placement =
      "left" | "right" | "top" | "bottom" |
      "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    export interface Props extends React.Props<any> {
      overlayClassName?: string;
      trigger?: Trigger[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      overlayStyle?: React.CSSProperties;
      prefixCls?: string;
      transitionName?: string;
      onVisibleChange?: (visible?: boolean) => void;
      afterVisibleChange?: (visible?: boolean) => void;
      visible?: boolean;
      defaultVisible?: boolean;
      placement?: Placement | Record<string, any>;
      align?: Record<string, any>;
      onPopupAlign?: (popupDomNode: Element, align: Record<string, any>) => void;
      overlay: React.ReactNode;
      arrowContent?: React.ReactNode;
      getTooltipContainer?: () => Element;
      destroyTooltipOnHide?: boolean;
      id?: string;
    }
  }

  export default class Tooltip extends React.Component<RCTooltip.Props> {}
}
