import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import configureStore, { history } from './redux/configureStore';

import CoreLayout from 'src/layouts/CoreLayout';

const store = configureStore({});

interface AppProps {
}

class App extends React.Component<AppProps> {
  render() {
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}> { /* place ConnectedRouter under Provider */ }
          <CoreLayout />
        </ConnectedRouter>
      </Provider>
    );
  }
}

export default App;
