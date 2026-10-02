import { useState, useEffect } from 'react';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCollected: 0,
    monthlyExpected: 0,
    pendingThisMonth: 0,
  });

  // Current month automatically nikalne ke liye
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/all`);
        const students = res.data;

        const totalStudents = students.length;
        let totalCollected = 0;
        let collectedThisMonth = 0;
        let monthlyExpected = 0;

        students.forEach(std => {
          // Har student ki monthly fee ko mila kar total expected revenue nikalna
          monthlyExpected += std.monthlyFee || 0;
          
          // Fee history check karna
          if (std.feeHistory && std.feeHistory.length > 0) {
            std.feeHistory.forEach(fee => {
              totalCollected += fee.amountPaid;
              // Agar current month ki fee hai to usko alag add karein
              if(fee.month === currentMonthName) {
                collectedThisMonth += fee.amountPaid;
              }
            });
          }
        });

        // Current month ka pending nikalna
        const pendingThisMonth = monthlyExpected - collectedThisMonth;

        setStats({
          totalStudents,
          totalCollected,
          monthlyExpected,
          pendingThisMonth: pendingThisMonth > 0 ? pendingThisMonth : 0
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [currentMonthName]);

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: <Users size={24} className="text-blue-600" />, bg: 'bg-blue-50' },
    { title: 'Total Collections (All Time)', value: `RS ${stats.totalCollected.toLocaleString()}`, icon: <Wallet size={24} className="text-emerald-600" />, bg: 'bg-emerald-50' },
    { title: 'Expected (This Month)', value: `RS ${stats.monthlyExpected.toLocaleString()}`, icon: <TrendingUp size={24} className="text-indigo-600" />, bg: 'bg-indigo-50' },
    { title: `Pending (${currentMonthName})`, value: `RS ${stats.pendingThisMonth.toLocaleString()}`, icon: <AlertCircle size={24} className="text-rose-600" />, bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Overview Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium font-bold text-blue-600">{currentMonthName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}