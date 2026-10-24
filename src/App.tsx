import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { DevnetConnectionProvider } from './chain/DevnetConnectionProvider.tsx'
import { Layout } from './components/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { TipPage } from './pages/TipPage.tsx'
import { PhantomRoot } from './phantom/PhantomRoot.tsx'
import { routerBasename } from './lib/tipLink.ts'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'tip/:address', element: <TipPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: routerBasename(import.meta.env.BASE_URL) },
)

export default function App() {
  return (
    <PhantomRoot>
      <DevnetConnectionProvider>
        <RouterProvider router={router} />
      </DevnetConnectionProvider>
    </PhantomRoot>
  )
}
