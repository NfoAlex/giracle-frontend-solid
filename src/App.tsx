import { createEffect, onMount, type Component } from 'solid-js';
import LetsTest from './components/LetsTest';
import { initWS } from './WS/WScontroller';
import { useParams } from '@solidjs/router';

const App: Component = () => {
  return (
    <div>
      <LetsTest />
    </div>
  );
};

export default App;
