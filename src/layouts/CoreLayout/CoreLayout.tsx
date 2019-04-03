import React from 'react';
import { Route, Switch } from 'react-router';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import Home from 'src/routes/Home';

class CoreLayout extends React.Component {

  render() {
    return (
      <div>
        <Switch>
          <Route exact path="/" component={Home} />
        </Switch>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
  };
}

export default withRouter(connect(mapStateToProps, { })(CoreLayout));
