import { fromJS, List, Map, OrderedMap } from 'immutable';

enum ActionStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
};

export const typeFromNameAndStatus = (name: string, status: ActionStatus) => `${name}_${status}`.toUpperCase();

export const actionObj = (name, status: ActionStatus, data) => {
  return {
    type: typeFromNameAndStatus(name, status),
    name,
    status,
    ...data
  };
};

const fail = (name, func, options={}) => {
  return (err, dispatch) => {
    console.error(err.stack);
    dispatch(actionObj(name, ActionStatus.ERROR, { error: err.stack }));
  };
}

const success = (name, func, options={}) => {
  return (payload) => {
    return (dispatch, getState) => {
      try {
        dispatch(actionObj(name, ActionStatus.SUCCESS, {
          ...options,
          payload,
        }))
      } catch (err) {
        fail(name, func, options)(err, dispatch);
      }
    }
  }
};

export const start = (name, func, options={}) => {
  return (...params) => {
    return (dispatch, getState) => {
      (async () => {
        dispatch(actionObj(name, ActionStatus.PENDING, {}));
        try {
          let res = await func(...params)
          // if res has .xhr and .req, it's probably a response object
          if (res.xhr && res.req) {
            res = res.body
          }

          success(name, func, options)(res);
        } catch (err) {
          fail(name, func, options)(err, dispatch);
        }
      })();
    }
  }
};

enum ReduceMethods {
  SET = 'SET',
  UPDATE = 'UPDATE',
  CLEAR = 'CLEAR',
  DELETE = 'DELETE',
};

interface actionOptions {
  reduceMethod?: ReduceMethods;
};

export const actionCreator = (name, func, options: actionOptions) => {
  return {
    start: start(name, func, options),
    success: success(name, func, options),
    fail: fail(name, func, options),
    START: typeFromNameAndStatus(name, ActionStatus.PENDING),
    SUCCESS: typeFromNameAndStatus(name, ActionStatus.SUCCESS),
    ERROR: typeFromNameAndStatus(name, ActionStatus.ERROR),
  };
};

export const newList = (arr: Array<any>, { fromTemplate }): List<any> => {
  if (!fromTemplate) {
    fromTemplate = fromJS;
  }

  return List(arr.map((item) => {
    return fromTemplate(item);
  }));
}

export const mergeList = (list: List<any>, arr: Array<any>, { key, fromTemplate, merge }): List<any> => {
  if (merge) return merge(list, arr, { key, fromTemplate });
  if (!key) return list.merge(newList(arr, { fromTemplate }));
  if (!fromTemplate) {
    fromTemplate = fromJS;
  }

  // TODO look into using .mergeWith method
  let tempMap = OrderedMap();
  list.forEach((item) => {
    const k = item.get(key);
    tempMap = tempMap.set(k, item);
  });
  arr.forEach((item) => {
    const k = item[key];
    const tempItem = tempMap.get(k);
    if (tempItem) {
      tempMap = tempMap.set(k,
        (tempItem as Record<any, any>).mergeWith((oldVal, newVal, valKey) => {
          if (valKey in item.attributes || valKey === key) return newVal;
          return oldVal;
        }, fromTemplate(item))
      );
    } else {
      tempMap = tempMap.set(k, fromTemplate(item));
    }
  })
  return tempMap.toList();
}

interface reducerOptions {
  key?: string;
  fromTemplate?: () => {};
  merge?: () => {};
}

export const createReducer = (actionName, options: reducerOptions) => {
  return (state = Map({ data: List() }), action) => {
    const {
      name,
      status,
      payload,
      type,
      error,
      successTemplate,
      successMerge,
      reduceMethod,
      deleteKeyValue,
      ...rest
    } = action;
    const {
      key,
      fromTemplate,
      merge
    } = options;
    if (actionName !== name) return state;

    if (status === ActionStatus.SUCCESS) {
      let data
      if (payload) {
        data = payload.data;
        if (typeof data === 'object' && data.constructor.name !== 'Array') {
          data = [data];
        }
      }

      const meta = (payload && payload.meta) || {};
      if (reduceMethod === ReduceMethods.SET) {
        return state.merge({
          data: newList(data, { fromTemplate }),
          status,
          ...meta,
          ...rest
        });
      } else if (reduceMethod === ReduceMethods.UPDATE) {
        return state.merge({
          data: mergeList(state.get('data'), data, {
            key,
            fromTemplate: successTemplate || fromTemplate,
            merge: successMerge || merge,
          }),
          status,
          ...meta,
          ...rest
        });
      } else if (reduceMethod === ReduceMethods.CLEAR) {
        return state.merge({
          data: List(),
          status,
          ...meta,
          ...rest
        });
      } else if (reduceMethod === ReduceMethods.DELETE) {
        return state.merge({
          data: state.get('data').filter((item) => {
            return item.get(key) !== deleteKeyValue
          }),
          status,
          ...rest
        });
      }
    }

    return state.merge({ status, error, ...rest });
  }
}
