// Bu dosya, uygulamanın kök bileşenidir ve RouterProvider ile rotaları bağlar.
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
