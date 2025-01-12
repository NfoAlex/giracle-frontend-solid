import { onMount, type Component } from 'solid-js';
import LetsTest from './components/LetsTest';
import { initWS } from './WS/WScontroller';

const App: Component = () => {
  //WS接続
  onMount(() => {
    initWS();
  });

  return (
    <div>
      <LetsTest />
    </div>
  );
};

export default App;
