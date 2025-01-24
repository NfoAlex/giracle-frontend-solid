import { createEffect, onMount, type Component } from 'solid-js';
import { initWS } from './WS/WScontroller';
import { useParams } from '@solidjs/router';

const App: Component = () => {
  return (
    <div>
      <p>Appのとこ</p>
    </div>
  );
};

export default App;
