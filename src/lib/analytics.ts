/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
import * as Mixpanel from "mixpanel-browser";

// const doTracking = process.env.NODE_ENV === "production";
const doTracking = (
  process.env.MIXPANEL_TOKEN &&
  (process.env.NODE_ENV === "production") &&
  [
    "https://alchemy.daostack.io",
    "https://alchemy-xdai.daostack.io/",
    "https://alchemy-staging-rinkeby.herokuapp.com/",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ].includes(window.location.origin)
);

const actions = {
  identify: (id: string): void => {
    if (doTracking) { Mixpanel.identify(id); }
  },
  alias: (id: string): void => {
    if (doTracking) { Mixpanel.alias(id); }
  },
  reset: (): void => {
    if (doTracking) { Mixpanel.reset(); }
  },
  track: (name: string, props = {}): void => {
    if (doTracking) { Mixpanel.track(name, props); }
  },
  trackLinks: (selector: string, name: string, callback: any): void => {
    if (doTracking) { Mixpanel.track_links(selector, name, callback); }
  },
  register: (props: any): void => {
    if (doTracking) { Mixpanel.register(props); }
  },
  people: {
    set: (props: any): void => {
      if (doTracking) { Mixpanel.people.set(props); }
    },
  },
};

export default actions;
