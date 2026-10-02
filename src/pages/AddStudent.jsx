import { useState, useEffect } from 'react';
import { Save, Settings, Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';

export default function AddStudent() {
  // --- SETTINGS & CONFIGURATION STATE ---
  const [showSettings, setShowSettings] = useState(false);
  const [classesConfig, setClassesConfig] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', fee: '' });
  const [editingClassId, setEditingClassId] = useState(null); // Edit check karne ke liye
  const sections = ['A', 'B', 'C', 'D']; 

  // --- DATA STATE ---
  const [allStudents, setAllStudents] = useState([]); // Sab bacho ka data store karega
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    rollNo: '', // Auto Generate Hoga Class/Section ke hisaab se
    selectedClass: '',
    selectedSection: 'A',
    monthlyFee: '',
    contact: ''
  });

  // 1. Initial Load: Classes Config aur Backend se Sab Students Data lana
  useEffect(() => {
    // Classes load karna
    const savedClasses = JSON.parse(localStorage.getItem('schoolClasses'));
    if (savedClasses && savedClasses.length > 0) {
      setClassesConfig(savedClasses);
    } else {
      const defaultClasses = [
        { id: 1, name: 'Nursery', fee: 1500 },
        { id: 2, name: 'Prep', fee: 1800 },
        { id: 3, name: 'Class 1', fee: 2000 },
        { id: 4, name: 'Class 10', fee: 3500 }
      ];
      setClassesConfig(defaultClasses);
      localStorage.setItem('schoolClasses', JSON.stringify(defaultClasses));
    }

    // Backend se sab students uthana taake class-wise hisaab lag sake
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/all`);
        setAllStudents(res.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  // 2. Class/Section Change Par Auto Roll Number Nikalna
  useEffect(() => {
    if (!formData.selectedClass) {
      setFormData(prev => ({ ...prev, rollNo: '' }));
      return;
    }

    // Jo class aur section select kiya hai, uska string banayein
    const targetClassString = `${formData.selectedClass} - ${formData.selectedSection}`;
    
    // Sirf is class aur section ke bacho ko filter karein
    const classStudents = allStudents.filter(s => s.studentClass === targetClassString);

    if (classStudents.length === 0) {
      // Agar is class mein koi bacha nahi, to Roll No 1
      setFormData(prev => ({ ...prev, rollNo: '1' }));
    } else {
      // Is class ke sabse bade Roll No mein +1 karein
      const rollNumbers = classStudents
        .map(s => parseInt(s.rollNo))
        .filter(n => !isNaN(n));
      const nextRoll = rollNumbers.length > 0 ? Math.max(...rollNumbers) + 1 : 1;
      setFormData(prev => ({ ...prev, rollNo: nextRoll.toString() }));
    }
  }, [formData.selectedClass, formData.selectedSection, allStudents]);

  // 3. Class Select Karne Par Auto Fee Lagana
  const handleClassChange = (e) => {
    const className = e.target.value;
    const selectedClassObj = classesConfig.find(c => c.name === className);
    
    setFormData(prev => ({
      ...prev,
      selectedClass: className,
      monthlyFee: selectedClassObj ? selectedClassObj.fee.toString() : ''
    }));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.selectedClass) {
      alert('Please select a class first!');
      return;
    }

    try {
      const finalData = {
        name: formData.name,
        fatherName: formData.fatherName,
        rollNo: formData.rollNo,
        studentClass: `${formData.selectedClass} - ${formData.selectedSection}`,
        monthlyFee: Number(formData.monthlyFee),
        contact: formData.contact
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/add`, finalData);
      alert('Student record saved successfully!');
      window.location.reload(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving student!');
    }
  };

  // --- SETTINGS PANEL FUNCTIONS (ADD, EDIT, DELETE) ---
  const handleAddOrUpdateClass = () => {
    if (!newClass.name || !newClass.fee) return;
    
    let updatedClasses;
    if (editingClassId) {
      // Update Mode
      updatedClasses = classesConfig.map(c => 
        c.id === editingClassId ? { ...c, name: newClass.name, fee: Number(newClass.fee) } : c
      );
    } else {
      // Add Mode
      updatedClasses = [...classesConfig, { id: Date.now(), name: newClass.name, fee: Number(newClass.fee) }];
    }
    
    setClassesConfig(updatedClasses);
    localStorage.setItem('schoolClasses', JSON.stringify(updatedClasses));
    setNewClass({ name: '', fee: '' });
    setEditingClassId(null);
  };

  const handleEditClass = (cls) => {
    setNewClass({ name: cls.name, fee: cls.fee });
    setEditingClassId(cls.id);
  };

  const handleDeleteClass = (id) => {
    const updatedClasses = classesConfig.filter(c => c.id !== id);
    setClassesConfig(updatedClasses);
    localStorage.setItem('schoolClasses', JSON.stringify(updatedClasses));
    if (editingClassId === id) {
      setNewClass({ name: '', fee: '' });
      setEditingClassId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ---------------- SETTINGS TOP BAR ---------------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div 
          className="p-4 bg-slate-800 text-white flex justify-between items-center cursor-pointer hover:bg-slate-900 transition"
          onClick={() => setShowSettings(!showSettings)}
        >
          <div className="flex items-center gap-2">
            <Settings size={20} />
            <span className="font-bold">Manage Classes & Fees Setup</span>
          </div>
          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
            {showSettings ? 'Close Setup' : 'Open Setup'}
          </span>
        </div>

        {/* Expandable Setup Panel */}
        {showSettings && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">
              {editingClassId ? 'Edit Class Category' : 'Add New Class Category'}
            </h3>
            <div className="flex gap-4 mb-6">
              <input type="text" placeholder="Class Name (e.g. 5th)" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
              <input type="number" placeholder="Default Fee (RS)" value={newClass.fee} onChange={(e) => setNewClass({...newClass, fee: e.target.value})} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
              <button onClick={handleAddOrUpdateClass} className={`text-white px-5 py-2 rounded-lg font-bold flex items-center gap-1 transition ${editingClassId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingClassId ? 'Update' : <><Plus size={18} /> Add</>}
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Available Classes</h3>
            <div className="flex flex-wrap gap-3">
              {classesConfig.map((cls) => (
                <div key={cls.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
                  <span className="font-bold text-slate-800">{cls.name}</span>
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">RS {cls.fee}</span>
                  
                  {/* Edit & Delete Buttons */}
                  <div className="flex gap-1 ml-2 border-l border-slate-200 pl-2">
                    <button onClick={() => handleEditClass(cls)} className="text-amber-500 hover:bg-amber-50 p-1 rounded transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteClass(cls.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- ADMISSION FORM ---------------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800">New Student Admission</h2>
          <p className="text-sm text-slate-500 mt-1">Roll number is auto-generated strictly based on selected Class & Section.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dynamic Class Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Class *</label>
              <select name="selectedClass" value={formData.selectedClass} onChange={handleClassChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" required>
                <option value="">-- Choose Class --</option>
                {classesConfig.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            {/* Static Section Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Section *</label>
              <select name="selectedSection" value={formData.selectedSection} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" required>
                {sections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            {/* Roll Number (Auto Read-Only Class Wise) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Roll Number</span>
                <span className="text-emerald-600 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                  {formData.selectedClass ? 'Auto-Generated (Class Wise)' : 'Select Class First'}
                </span>
              </label>
              <input type="text" name="rollNo" value={formData.rollNo} readOnly placeholder="Select class to generate" className="w-full px-4 py-3 bg-slate-200 border border-slate-300 text-slate-600 font-bold rounded-xl cursor-not-allowed outline-none" />
            </div>

            {/* Auto-filled Monthly Fee */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Monthly Fee (RS) *</span>
                <span className="text-blue-600 text-xs bg-blue-100 px-2 py-0.5 rounded-full">Auto-Filled</span>
              </label>
              <input type="number" name="monthlyFee" value={formData.monthlyFee} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-blue-200 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700" required />
            </div>

            {/* Personal Details */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Ali Khan" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Father's Name *</label>
              <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="e.g. Ahmed Khan" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contact Number</label>
              <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="0300-0000000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-200">
            <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <Save size={20} />
              Register Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}