import React from 'react';
import { Record } from 'immutable';

export const extendRecord = ({ attrs, funcs }) => {
  const klass = Record(attrs);
  for (const [k, v] of Object.entries(funcs)) {
    klass.prototype[k] = v;
  }
  return klass;
};

export const baseAttrs = {
};

export const baseFuncs = {
  render(props = {}) {
    return this.renderRecord(this.get('view'), props);
  },

  renderRecord(view, props = {}) {
    const recordView = view || (() => {
      return React.createElement('div');
    });
    const record = this;
    return React.createElement(recordView, { ...props, record });
  },

  tokenize() {
    // override
    return [];
  },

  toJSONString() {
    return JSON.stringify(this.toJS());
  }
};

export const baseRecord = (attrs = {}) => {
  return extendRecord({
    attrs: {
      ...baseAttrs,
      ...attrs
    },
    funcs: baseFuncs
  });
};
