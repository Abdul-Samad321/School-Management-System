import { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import axios from 'axios';

export default function PayFee() {
  const [searchRollNo, setSearchRollNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [classesConfig, setClassesConfig] = useState([]);
  
  const sections = ['A', 'B', 'C', 'D'];
  const [student, setStudent] = useState(null);
  
  // Smart States
  const [pendingMonths, setPendingMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Class settings ko local storage se uthana
  useEffect(() => {
    const savedClasses = JSON.parse(localStorage.getItem('schoolClasses')) || [];
    setClassesConfig(savedClasses);
  }, []);

  // Mahino ka hisaab lagane ka smart function (Admission date se aaj tak)
  const calculatePendingMonths = (studentData) => {
    if (!studentData) return [];
    const requiredMonths = [];
    
    // Admission date se start karega (fallback to current date if missing)
    let current = new Date(studentData.createdAt || new Date());
    current.setDate(1); 
    
    // Aaj ke maheene tak calculate karega
    const end = new Date();
    end.setDate(1);

    while (current <= end) {
      requiredMonths.push(current.toLocaleString('default', { month: 'long', year: 'numeric' }));
      current.setMonth(current.getMonth() + 1);
    }

    // Jo pay ho chuke hain unko nikal dega
    const paidMonths = (studentData.feeHistory || []).map(fee => fee.month);
    return requiredMonths.filter(m => !paidMonths.includes(m));
  };

  // Class + Roll No se search karna
  const handleSearch = async () => {
    if (!searchRollNo || !selectedClass) {
      alert('Please select Class and enter Roll No!');
      return;
    }
    try {
      const targetClassString = `${selectedClass} - ${selectedSection}`;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/search/${encodeURIComponent(targetClassString)}/${searchRollNo}`);
      
      const foundStudent = res.data;
      setStudent(foundStudent);
      
      // Jaise hi student mile, uske pending months nikal lo
      const pending = calculatePendingMonths(foundStudent);
      setPendingMonths(pending);
      // Dropdown mein automatically pehla pending month select ho jayega
      setSelectedMonth(pending.length > 0 ? pending[0] : ''); 

    } catch (error) {
      alert('Student not found! Check Class, Section, and Roll No.');
      setStudent(null);
    }
  };

  const handlePayment = async () => {
    if (!selectedMonth) {
      alert('Please select a month!');
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/pay`, {
        rollNo: student.rollNo,
        studentClass: student.studentClass,
        month: selectedMonth,
        amountPaid: student.monthlyFee
      });
      
      alert(res.data.message);
      
      // Payment hone ke baad UI ko fauran update karna
      const updatedStudent = res.data.student;
      setStudent(updatedStudent);
      
      // Pending months ki list dobara banayenge (jo abhi pay hua wo nikal jayega)
      const newPending = calculatePendingMonths(updatedStudent);
      setPendingMonths(newPending);
      setSelectedMonth(newPending.length > 0 ? newPending[0] : '');

    } catch (error) {
      alert(error.response?.data?.message || 'Payment processing failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ---------------- SEARCH SECTION ---------------- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard size={24} className="text-blue-600" />
          Fee Payment Terminal
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700">
            <option value="">-- Select Class --</option>
            {classesConfig.map(cls => (
              <option key={cls.id} value={cls.name}>{cls.name}</option>
            ))}
          </select>

          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700">
            {sections.map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchRollNo}
              onChange={(e) => setSearchRollNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Roll No..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <button onClick={handleSearch} className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-8 py-3 rounded-xl transition shadow-md hover:shadow-lg">
            Search
          </button>
        </div>
      </div>

      {/* ---------------- PAYMENT BOX ---------------- */}
      {student && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shadow-sm border border-blue-200">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 inline-block px-2 py-0.5 rounded-md mb-1 border border-emerald-200">
                  Record Found
                </p>
                <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{student.name}</h3>
                <p className="text-slate-500 font-medium mt-1.5 text-sm">
                  <span className="text-slate-700 font-bold uppercase">Class {student.studentClass}</span> • Roll No: {student.rollNo} • S/O {student.fatherName}
                </p>
              </div>
            </div>
            <div className="text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fixed Monthly Fee</p>
              <p className="text-2xl font-black text-blue-600 mt-0.5">RS {student.monthlyFee}</p>
            </div>
          </div>

          {/* Payment Action Area (Conditional Rendering) */}
          {pendingMonths.length > 0 ? (
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-rose-500" />
                <p className="text-sm font-bold text-slate-700">Select pending month to process payment:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 shadow-sm"
                >
                  <option value="" disabled>-- Select Pending Month --</option>
                  {pendingMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button onClick={handlePayment} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  <CreditCard size={20} /> Process RS {student.monthlyFee}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <UserCheck size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">All Dues Cleared!</h3>
                <p className="text-emerald-600 font-medium text-sm mt-1">This student has no pending fee from their admission date up to the current month.</p>
              </div>
            </div>
          )}

          {/* Recent History (Sleek UI) */}
          {student.feeHistory && student.feeHistory.length > 0 && (
            <div className="mt-8">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                Recent Payment Log
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {/* Sort descending (newest first) */}
                {[...student.feeHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).map((history, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold">
                      <CheckCircle size={16} /> {history.month}
                    </span>
                    <span className="text-xs text-slate-400 font-medium mt-1">Paid: {new Date(history.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}