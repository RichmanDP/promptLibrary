import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Gallery from './pages/Gallery'
import Settings from './pages/Settings'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
