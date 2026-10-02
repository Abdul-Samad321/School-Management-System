import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddStudent from './pages/AddStudent';
import StudentRecords from './pages/StudentRecords';
import PayFee from './pages/PayFee';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Navbar har page par upar show hoga */}
        <Navbar /> 
        
        {/* Pages yahan change honge */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/records" element={<StudentRecords />} />
            <Route path="/pay-fee" element={<PayFee />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;