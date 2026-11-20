import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from '../pages/HomePage';
import { TrackPage } from '../pages/TrackPage';
import { TopicPage } from '../pages/TopicPage';
import { PlaygroundPage } from '../pages/PlaygroundPage';
import { AboutPage } from '../pages/AboutPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { TRACK_IDS } from '../lib/types';

/**
 * All routes in one place. Child routes render inside <Layout>'s <Outlet />.
 * `:slug` is a URL parameter, read with useParams() in TopicPage.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      // Two routes per track: the track page (/dsa) and its topics (/dsa/binary-search).
      ...TRACK_IDS.flatMap((track) => [
        { path: track, element: <TrackPage track={track} /> },
        { path: `${track}/:slug`, element: <TopicPage track={track} /> },
      ]),
      { path: 'playground', element: <PlaygroundPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
