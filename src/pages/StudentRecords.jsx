import { useState, useEffect } from 'react';
import { Edit2, X, CheckCircle, Clock, Filter, AlertCircle, Trash2, User } from 'lucide-react';
import axios from 'axios';

export default function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Filters State
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availableClasses, setAvailableClasses] = useState([]);

  // Modals State
  const [editModalData, setEditModalData] = useState(null);
  const [statusModalData, setStatusModalData] = useState(null);

  const getRequiredMonths = (createdAt) => {
    const months = [];
    let current = new Date(createdAt);
    current.setDate(1); 
    const end = new Date();
    end.setDate(1);

    while (current <= end) {
      months.push(current.toLocaleString('default', { month: 'long', year: 'numeric' }));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/all`);
      const data = res.data;
      
      const processedData = data.map(std => {
        const requiredMonths = getRequiredMonths(std.createdAt || new Date());
        const paidMonths = (std.feeHistory || []).map(fee => fee.month);
        const pendingMonths = requiredMonths.filter(m => !paidMonths.includes(m));
        
        return {
          ...std,
          calculatedStatus: pendingMonths.length === 0 ? 'Paid' : 'Pending',
          pendingMonthsList: pendingMonths
        };
      });

      setStudents(processedData);
      setFilteredStudents(processedData);
      
      const classes = [...new Set(processedData.map(s => s.studentClass))].filter(Boolean);
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;
    if (classFilter !== 'All') {
      result = result.filter(s => s.studentClass === classFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter(s => s.calculatedStatus === statusFilter);
    }
    setFilteredStudents(result);
  }, [classFilter, statusFilter, students]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/edit/${editModalData._id}`, {
        name: editModalData.name,
        fatherName: editModalData.fatherName,
        contact: editModalData.contact
      });
      setEditModalData(null);
      fetchStudents(); 
    } catch (error) {
      alert('Error updating student!');
    }
  };

  // --- NAYA DELETE FUNCTION ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the record of ${name}?`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${id}`);
        fetchStudents(); // List refresh karega
      } catch (error) {
        alert('Error deleting student!');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ---------------- PREMIUM FILTERS BAR ---------------- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
            <Filter size={24} />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-lg leading-tight">Filter Records</h3>
            <p className="text-xs text-slate-500 font-medium">Sort by class or fee status</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 w-full md:w-48 transition"
          >
            <option value="All">All Classes</option>
            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 w-full md:w-48 transition"
          >
            <option value="All">All Fee Status</option>
            <option value="Paid">Fully Paid</option>
            <option value="Pending">Pending Dues</option>
          </select>
        </div>
      </div>

      {/* ---------------- PREMIUM RECORDS TABLE ---------------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Student Directory</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Total {filteredStudents.length} students found.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-bold">Student Info</th>
                <th className="px-6 py-4 font-bold">Academic</th>
                <th className="px-6 py-4 font-bold">Monthly Fee</th>
                <th className="px-6 py-4 font-bold">Fee Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 font-medium">
                    <User size={48} className="mx-auto text-slate-200 mb-3" />
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr key={std._id} className="hover:bg-blue-50/30 transition duration-150">
                    
                    {/* 1. Profile / Student Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm">
                          {std.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{std.name}</p>
                          <p className="text-xs text-slate-500 font-medium">S/O {std.fatherName || '-'}</p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Academic Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class {std.studentClass || 'N/A'}</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5">Roll No: {std.rollNo}</span>
                      </div>
                    </td>
                    
                    {/* 3. Fee Column */}
                    <td className="px-6 py-4 font-bold text-slate-700">
                      RS {std.monthlyFee || '0'}
                    </td>
                    
                    {/* 4. Fee Status Column */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setStatusModalData(std)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${
                          std.calculatedStatus === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-md' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:shadow-md animate-pulse'
                        }`}
                      >
                        {std.calculatedStatus === 'Paid' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                        {std.calculatedStatus}
                      </button>
                    </td>
                    
                    {/* 5. Actions Column (Edit + Delete) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setEditModalData({...std})}
                          title="Edit Details"
                          className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 p-2 rounded-lg transition shadow-sm"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(std._id, std.name)}
                          title="Delete Record"
                          className="bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 p-2 rounded-lg transition shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- EDIT MODAL (Unchanged Logic, Enhanced UI) ---------------- */}
      {editModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">Edit Student Details</h3>
              <button onClick={() => setEditModalData(null)} className="text-slate-400 hover:text-rose-500 transition bg-slate-50 hover:bg-rose-50 rounded-full p-2">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 bg-slate-50">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                  Class, Roll No, and Fee amounts cannot be modified here to protect the integrity of financial records.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Student Name</label>
                <input type="text" value={editModalData.name} onChange={(e) => setEditModalData({...editModalData, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Father's Name</label>
                <input type="text" value={editModalData.fatherName} onChange={(e) => setEditModalData({...editModalData, fatherName: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Contact Number</label>
                <input type="text" value={editModalData.contact || ''} onChange={(e) => setEditModalData({...editModalData, contact: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-md hover:shadow-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- FEE STATUS INFO MODAL (Unchanged Logic, Enhanced UI) ---------------- */}
      {statusModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 border-b flex justify-between items-center ${statusModalData.calculatedStatus === 'Paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${statusModalData.calculatedStatus === 'Paid' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {statusModalData.calculatedStatus === 'Paid' ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}
                  {statusModalData.calculatedStatus === 'Paid' ? 'Fee Cleared Up to Date' : 'Pending Fee Alert'}
                </h3>
                <p className="text-sm font-medium opacity-80 mt-1">{statusModalData.name} • {statusModalData.studentClass}</p>
              </div>
              <button onClick={() => setStatusModalData(null)} className="text-slate-500 hover:text-slate-800 transition bg-white rounded-full p-2 shadow-sm border border-slate-200 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50">
              {statusModalData.calculatedStatus === 'Paid' ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={16}/> Recent Payment History
                  </h4>
                  {statusModalData.feeHistory && statusModalData.feeHistory.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {[...statusModalData.feeHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12).map((fee, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                              <CheckCircle size={20} className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{fee.month}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">Paid on: {new Date(fee.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">RS {fee.amountPaid}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 bg-white p-4 rounded-xl border border-slate-200">No payment history found yet.</p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle size={16}/> Outstanding Months
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {statusModalData.pendingMonthsList.map((month, idx) => (
                      <div key={idx} className="bg-white border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-sm text-center font-bold">
                        {month}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-5 bg-white border border-rose-100 rounded-xl flex justify-between items-center shadow-sm">
                    <span className="text-slate-600 font-bold uppercase text-sm tracking-wider">Total Pending</span>
                    <span className="text-2xl font-extrabold text-rose-600">
                      RS {statusModalData.pendingMonthsList.length * (statusModalData.monthlyFee || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}