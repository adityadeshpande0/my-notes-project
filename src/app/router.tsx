import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from '../pages/HomePage';
import { TrackPage } from '../pages/TrackPage';
import { TopicPage } from '../pages/TopicPage';
import { PlaygroundPage } from '../pages/PlaygroundPage';
import { AboutPage } from '../pages/AboutPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * All routes in one place. Child routes render inside <Layout>'s <Outlet />.
 * `:slug` is a URL parameter, read with useParams() in TopicPage.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dsa', element: <TrackPage track="dsa" /> },
      { path: 'dsa/:slug', element: <TopicPage track="dsa" /> },
      { path: 'react', element: <TrackPage track="react" /> },
      { path: 'react/:slug', element: <TopicPage track="react" /> },
      { path: 'playground', element: <PlaygroundPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
