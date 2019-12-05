import { getArc } from "arc";
import { copyToClipboard } from "./util";

export const loadInitialFormValues = (scheme: string) => {
  const { search } = window.location;
  const params = new URLSearchParams(search);
  let initialFormValues;
  switch(scheme) {
    case "contributionReward":
      if(search.length > 0) {
        initialFormValues = {
          beneficiary: params.get("beneficiary"),
          description: params.get("description"),
          ethReward: Number(params.get("ethReward")),
          externalTokenAddress: params.get("externalTokenAddress"),
          externalTokenReward: Number(params.get("externalTokenReward")),
          nativeTokenReward: Number(params.get("nativeTokenReward")),
          reputationReward: Number(params.get("reputationReward")),
          title: params.get("title"),
          url: params.get("url"),
        };
      }
      else {
        initialFormValues = {
          beneficiary: "",
          description: "",
          ethReward: 0,
          externalTokenAddress: getArc().GENToken().address,
          externalTokenReward: 0,
          nativeTokenReward: 0,
          reputationReward: 0,
          title: "",
          url: "",
        };
      }
      return initialFormValues;
    case "genericSchemes":
      if(search.length > 0){
        initialFormValues = {
          
        };
      }
      else {
        initialFormValues = {
          
        };
      }
      return initialFormValues;
    
    case "dutchX":
      if(search.length > 0){
        initialFormValues = {};
      }
      else {
        initialFormValues = {};
      }
      return initialFormValues;
    case "signalScheme":  
      if(search.length > 0){
        initialFormValues = {};
      }
      else {
        initialFormValues = {};
      }
      return initialFormValues;
    default: 
      return {};
  }
};

export const exportFormValues = (values: any, tags: string[]) => {
  const queryString = Object.keys(values).map(key => key + "=" + values[key]).join("&");
  const { origin, pathname } = window.location;
  const url = origin + pathname + "?" + queryString + "&tags=" + JSON.stringify(tags);
  copyToClipboard(url);
};
