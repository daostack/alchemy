import * as Mixpanel from "mixpanel-browser";

const doTracking = process.env.NODE_ENV === "production";

const actions = {
  identify: (id: string) => {
    if (doTracking) { Mixpanel.identify(id); }
  },
  alias: (id: string) => {
    if (doTracking) { Mixpanel.alias(id); }
  },
  reset: () => {
    if (doTracking) { Mixpanel.reset(); }
  },
  track: (name: string, props = {}) => {
    if (doTracking) { Mixpanel.track(name, props); }
  },
  trackLinks: (selector: string, name: string, callback: any) => {
    if (doTracking) { Mixpanel.track_links(selector, name, callback); }
  },
  register: (props: any) => {
    if (doTracking) { Mixpanel.register(props); }
  },
  people: {
    set: (props: any) => {
      if (doTracking) { Mixpanel.people.set(props); }
    },
  },
};

export default actions;
