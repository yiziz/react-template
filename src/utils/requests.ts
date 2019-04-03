
import axios from 'axios';
import humps from 'humps';

export const ApiBaseUrl = {
};

const decamelizeData = (data) => {
  let decamelizedData = data;
  const constructorName = data.constructor.name;
  if (constructorName === 'FormData') {
    decamelizedData = decamelizeFormData(data);
  } else if (constructorName === 'Object' || constructorName === 'Array') {
    decamelizedData = humps.decamelizeKeys(data);
  }
  return decamelizedData;
}

const decamelizeFormData = (formData) => {
  for (const key of formData.keys()) {
    const decamelizedKey = humps.decamelize(key);
    formData.set(decamelizedKey, decamelizeData(formData.get(key)));
    if (key !== decamelizedKey) {
      formData.delete(key);
    }
  }
  return formData;
}

const customSend = (originalSend) => {
  return (data) => {
    return originalSend(decamelizeData(data))
  }
}

export const setRequestDefaults = () => {
  // auth - awt token
  // if (token) {
  //   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  // } else {
  //   axios.defaults.headers.common['Authorization'] = '';
  // }
}

const defaultRequest = axios.create();

export default defaultRequest
