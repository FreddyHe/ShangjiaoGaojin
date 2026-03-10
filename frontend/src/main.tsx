import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import ExtractPage from './pages/ExtractPage'
import GeneratePage from './pages/GeneratePage'
import UploadPage from './pages/UploadPage'
import TemplatesPage from './pages/TemplatesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

const router = createBrowserRouter([
  { path: '/', element: <Layout><TemplatesPage /></Layout> },
  { path: '/upload', element: <Layout><UploadPage /></Layout> },
  { path: '/templates', element: <Layout><TemplatesPage /></Layout> },
  { path: '/extract', element: <Layout><ExtractPage /></Layout> },
  { path: '/generate', element: <Layout><GeneratePage /></Layout> },
  { path: '/history', element: <Layout><HistoryPage /></Layout> },
  { path: '/settings', element: <Layout><SettingsPage /></Layout> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
