import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { AuthProvider } from './auth';

// Keycloak initialization
const keycloak = new Keycloak({
  url: 'https://keycloak.example.com/auth',
  realm: 'YourRealm',
  clientId: 'YourClientId',
});

keycloak.init({ onLoad: 'login-required' }).success((authenticated) => {
  if (authenticated) {
    console.log('Authenticated');
    ReactDOM.render(
      <AuthProvider keycloak={keycloak}>
        <App />
      </AuthProvider>,
      document.getElementById('root')
    );
  } else {
    console.warn('Not authenticated');
  }
});
