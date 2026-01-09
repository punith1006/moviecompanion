import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import DiscoverPage from './pages/DiscoverPage'
import MyShowsPage from './pages/MyShowsPage'
import QuizPage from './pages/QuizPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="my-shows" element={<MyShowsPage />} />
          <Route path="quiz" element={<QuizPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
