import './styles/base.css'
import PublicSite from './public/PublicSite.jsx'
import Admin from './admin/Admin.jsx'

const isAdminRoute =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

function App() {
  return isAdminRoute ? <Admin /> : <PublicSite />
}

export default App