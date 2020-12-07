import * as React from "react";
import { useCallback, useMemo } from "react";
import { RouteComponentProps } from "react-router-dom";

import * as css from "./SelectProposal.scss";

const Select = React.lazy(() => import("react-select"));

interface IProps extends RouteComponentProps<{daoAvatarAddress: string}> {
  daoAvatarAddress: string;
  data: any;
}

export const SelectProposal: React.FC<IProps> = ({ daoAvatarAddress, data, history, match }) => {
  const handleChange = useCallback((el) => {
    const schemeId = el.value;
    history.push(`/dao/${match.params.daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  }, [daoAvatarAddress, history, match]);

  const options = useMemo(() => {
    return data.map(({ staticState }: any) => ({
      label: staticState.name,
      value: staticState.id,
    }));
  }, [data]);

  return (
    <div className={css.modalWindow}>
      <header className={css.header}>Header</header>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Select
          options={options}
          maxMenuHeight={100}
          onChange={handleChange}
        />
      </React.Suspense>
    </div>
  );
};
