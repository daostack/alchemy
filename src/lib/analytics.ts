import * as Mixpanel from 'mixpanel-browser';
console.log("loading analytics");
// TODO: init here, or in app load? of i do it here wont it happen many times?
//Mixpanel.init(process.env.MIXPANEL_TOKEN);

let env_check = true; //process.env.NODE_ENV === 'production';

let actions = {
  identify: (id: string) => {
    console.log("Analytics set identity", id);
    if (env_check) Mixpanel.identify(id);
  },
  alias: (id: string) => {
    console.log("Analytics set alias", id);
    if (env_check) Mixpanel.alias(id);
  },
  reset: () => {
    console.log("Analytics reset identity");
    if (env_check) Mixpanel.reset();
  },
  track: (name: string, props = {}) => {
    console.log("Analytics track event:", name, props);
    if (env_check) Mixpanel.track(name, props);
  },
  track_links: (selector: string, name: string, callback: any) => {
    console.log("Analytics track links:", selector, name);
    if (env_check) Mixpanel.track_links(selector, name, callback);
  },
  register: (props: any) => {
    console.log("Analytics register properties:", props);
    if (env_check) Mixpanel.register(props);
  },
  people: {
    set: (props: any) => {
      console.log("Analytics people properties:", props);
      if (env_check) Mixpanel.people.set(props);
    },
  },
};

export default actions;