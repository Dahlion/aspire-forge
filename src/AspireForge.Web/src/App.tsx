import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { KeycloakProvider } from '@react-keycloak/web';
import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
const keycloak = new Keycloak({
  url: 'https://<your-keycloak-url>/auth',
  realm: '<your-realm>',
  clientId: '<your-client-id>',
});

const App: React.FC = () => {
  return (
    <KeycloakProvider keycloak={keycloak}>
      <Router>
        <Switch>
          <Route path='/' exact>
            <h1>Welcome to Aspire Forge!</h1>
          </Route>
          {/* Add more routes as needed */}
        </Switch>
      </Router>
    </KeycloakProvider>
  );
};

export default App;
