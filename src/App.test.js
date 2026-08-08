import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

it('renders the Compose Stack handbook', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  expect(div.textContent).toContain('Build, observe, and operate your CI platform.');
  ReactDOM.unmountComponentAtNode(div);
});
