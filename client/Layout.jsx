import React  from 'react';
import { Switch } from 'react-router';
import { Route, Link} from 'react-router-dom';

export default (mediator, routes, footer, sidebar) => (
  <div className="app sidebar-app">
    <div className={mediator.sidebar ? 'sidebar sidebar-expanded' : 'sidebar'}>
      <div className="sidebar-header">
        <h2>
          <span className="glyphicon glyphicon-chevron-left sidebar-toggle" onClick={function () { mediator.sidebar = !mediator.sidebar; mediator.render(); }}></span>
          App Shell
        </h2>
      </div>
      <div className="sidebar-content">
        <ul className="list-unstyled">
          {routes.map((route, index) => (
            <li key={index}><Link to={route.path}>{route.name}</Link></li>
          ))}
        </ul>
        {sidebar || ''}
      </div>
      <div className="sidebar-footer">
        {footer || ''}
      </div>
    </div>
    <div className="sidebar-toggle" onClick={function () { mediator.sidebar = !mediator.sidebar; mediator.render(); }}>
      <span className="glyphicon glyphicon-menu-hamburger"></span>
    </div>
    <div className="content">
      <div className="body container-fluid">
        <div className="row">
          <div className="col-sm-12">
            <Switch>
            {routes.map((route, index) => (
              <Route
                exact={route.exact}
                key={index}
                path={route.path}
                component={route.component(mediator)}
              />
            ))}
            </Switch>
          </div>
        </div>
      </div>
    </div>
  </div>
);

