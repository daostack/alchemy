require('mutationobserver-shim')
jsdom = require('jsdom');

const doc = jsdom.jsdom('<!doctype html><html><body></body></html>', {
  url: 'http://test/'
});
const window = doc.defaultView.de;
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});