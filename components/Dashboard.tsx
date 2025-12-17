import React, { useMemo, useState } from 'react';
import { ServiceRecord, PROVINCES, ORGANIZATIONS, SERVICE_TYPES } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Filter, Map, Users, LayoutDashboard, FileText, Edit2, MapPin, Trash2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardProps {
  records: ServiceRecord[];
  onEditRecord?: (record: ServiceRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8', '#ff6b6b'];

const Dashboard: React.FC<DashboardProps> = ({ records, onEditRecord, onDeleteRecord }) => {
  const [provinceFilter, setProvinceFilter] = useState<string>('ทั้งหมด');
  const [organizationFilter, setOrganizationFilter] = useState<string>('ทั้งหมด');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  
  // State for Chart View (Overview vs By Type)
  const [trendView, setTrendView] = useState<'overview' | 'byType'>('overview');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Province filter
      const matchProvince = provinceFilter === 'ทั้งหมด' || record.province === provinceFilter;
      
      // Organization filter
      const matchOrg = organizationFilter === 'ทั้งหมด' || record.organization === organizationFilter;

      // Month range filter
      const recordMonth = record.date.substring(0, 7); // YYYY-MM
      let matchMonth = true;
      if (startMonth && endMonth) {
        matchMonth = recordMonth >= startMonth && recordMonth <= endMonth;
      } else if (startMonth) {
        matchMonth = recordMonth >= startMonth;
      } else if (endMonth) {
        matchMonth = recordMonth <= endMonth;
      }

      return matchProvince && matchOrg && matchMonth;
    });
  }, [records, provinceFilter, organizationFilter, startMonth, endMonth]);

  // 1. Total Beneficiaries
  const totalBeneficiaries = filteredRecords.reduce((sum, r) => sum + r.beneficiaries, 0);

  // 2. Service Type Distribution
  const serviceTypeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      const type = r.serviceType === 'อื่นๆ' ? 'อื่นๆ' : r.serviceType;
      let shortName = type;
      if (type.includes('พ่นสารเคมี')) shortName = 'พ่นสารเคมี';
      if (type.includes('กำจัดลูกน้ำ')) shortName = 'กำจัดลูกน้ำ';
      if (type.includes('ไข้มาลาเรีย')) shortName = 'ตรวจมาลาเรีย';
      if (type.includes('ให้ความรู้')) shortName = 'ให้ความรู้';
      if (type.includes('สนับสนุน')) shortName = 'สนับสนุนของ';

      counts[shortName] = (counts[shortName] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredRecords]);

  // 3. Top Districts
  const districtData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      counts[r.district] = (counts[r.district] || 0) + r.beneficiaries;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRecords]);

  // 4. Services per Organization (Now includes beneficiaries sum)
  const orgData = useMemo(() => {
    const data: { [key: string]: { name: string, count: number, beneficiaries: number } } = {};
    filteredRecords.forEach(r => {
        const shortOrg = r.organization.replace('นคม.1.4.', '').replace('ศตม.1.4 ', '');
        if (!data[shortOrg]) {
            data[shortOrg] = { name: shortOrg, count: 0, beneficiaries: 0 };
        }
        data[shortOrg].count += 1;
        data[shortOrg].beneficiaries += r.beneficiaries;
    });
    return Object.values(data);
  }, [filteredRecords]);

  // 5. Monthly Trend
  const monthlyTrendData = useMemo(() => {
    const dataMap: { [key: string]: any } = {};

    filteredRecords.forEach(r => {
      const m = r.date.substring(0, 7);
      
      if (!dataMap[m]) {
        dataMap[m] = { name: m, total: 0 };
        SERVICE_TYPES.forEach(t => {
           const key = t === 'อื่นๆ' ? 'อื่นๆ' : t;
           dataMap[m][key] = 0;
        });
      }

      dataMap[m].total += r.beneficiaries;
      const typeKey = r.serviceType === 'อื่นๆ' ? 'อื่นๆ' : r.serviceType;
      if (dataMap[m][typeKey] !== undefined) {
        dataMap[m][typeKey] += r.beneficiaries;
      } else {
        dataMap[m]['อื่นๆ'] += r.beneficiaries;
      }
    });

    return Object.values(dataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [filteredRecords]);

  // 6. Service Areas Summary
  const areasSummary = useMemo(() => {
    const districts = new Set(filteredRecords.map(r => r.province + r.district));
    const subdistricts = new Set(filteredRecords.map(r => r.province + r.district + r.subdistrict));
    const villages = new Set(filteredRecords.map(r => r.province + r.district + r.subdistrict + r.village + r.moo));
    return { districts: districts.size, subdistricts: subdistricts.size, villages: villages.size };
  }, [filteredRecords]);

  // 7. All Records for Table with Pagination
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.timestamp - a.timestamp);
  }, [records]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-lg shadow-pink-100 border border-pink-50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-pink-600 font-bold text-lg mb-2">
            <Filter className="w-6 h-6" />
            <span>ตัวกรองข้อมูล</span>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
             {/* Province Filter */}
             <div className="w-full lg:w-1/5">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">จังหวัด</label>
              <select 
                value={provinceFilter} 
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-gray-700 outline-none focus:ring-2 focus:ring-pink-300 transition"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
             </div>

             {/* Organization Filter */}
             <div className="w-full lg:w-2/5">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">หน่วยงาน</label>
              <div className="relative">
                <select 
                  value={organizationFilter} 
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-gray-700 outline-none focus:ring-2 focus:ring-pink-300 transition appearance-none"
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  {ORGANIZATIONS.map(org => <option key={org} value={org}>{org}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
             </div>

             {/* Month Filter */}
             <div className="flex gap-4 w-full lg:w-2/5">
               <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">ตั้งแต่เดือน</label>
                <input 
                  type="month" 
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-gray-700 outline-none focus:ring-2 focus:ring-pink-300 transition"
                />
               </div>
               <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">ถึงเดือน</label>
                <input 
                  type="month" 
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-gray-700 outline-none focus:ring-2 focus:ring-pink-300 transition"
                />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-6 text-white shadow-lg shadow-pink-200 flex items-center gap-4 transform transition hover:-translate-y-1">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-pink-100 text-sm font-medium">ผู้รับบริการรวม</p>
            <h3 className="text-3xl font-bold">{totalBeneficiaries.toLocaleString()}</h3>
            <p className="text-xs text-pink-100 mt-1 opacity-80">คน</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100 flex items-center gap-4 transform transition hover:-translate-y-1">
          <div className="bg-purple-100 p-3 rounded-full text-purple-500">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">จำนวนให้บริการ</p>
            <h3 className="text-3xl font-bold text-gray-800">{filteredRecords.length.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">ครั้ง</p>
          </div>
        </div>
         <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100 border border-gray-100 flex items-center gap-4 transform transition hover:-translate-y-1">
          <div className="bg-blue-100 p-3 rounded-full text-blue-500">
            <Map className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">พื้นที่สูงสุด</p>
            <h3 className="text-xl font-bold text-gray-800 truncate max-w-[140px]">
              {districtData.length > 0 ? districtData[0].name : '-'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">อำเภอ</p>
          </div>
        </div>
        
        {/* Service Area Summary Card */}
        <div className="bg-white rounded-2xl p-4 shadow-lg shadow-gray-100 border border-gray-100 flex flex-col justify-center transform transition hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                   <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-700 text-sm">พื้นที่ให้บริการ</h4>
            </div>
            <div className="flex justify-between text-center divide-x divide-gray-100">
                <div className="px-2 w-1/3">
                    <div className="text-xl font-bold text-gray-800">{areasSummary.districts}</div>
                    <div className="text-[10px] text-gray-400">อำเภอ</div>
                </div>
                <div className="px-2 w-1/3">
                    <div className="text-xl font-bold text-gray-800">{areasSummary.subdistricts}</div>
                    <div className="text-[10px] text-gray-400">ตำบล</div>
                </div>
                <div className="px-2 w-1/3">
                    <div className="text-xl font-bold text-gray-800">{areasSummary.villages}</div>
                    <div className="text-[10px] text-gray-400">หมู่บ้าน</div>
                </div>
            </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Type Pie Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
             <div className="w-1.5 h-6 bg-purple-400 rounded-full mr-3"></div>
             สัดส่วนประเภทการให้บริการ
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-700 flex items-center">
              <div className="w-1.5 h-6 bg-pink-400 rounded-full mr-3"></div>
              แนวโน้มผู้รับบริการ
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTrendView('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  trendView === 'overview' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ภาพรวม
              </button>
              <button
                onClick={() => setTrendView('byType')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  trendView === 'byType' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                แยกตามประเภท
              </button>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                />
                <Legend />
                {trendView === 'overview' ? (
                   <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="ผู้รับบริการรวม"
                    stroke="#ec4899" 
                    strokeWidth={4} 
                    dot={{r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff'}} 
                    activeDot={{ r: 8 }} 
                  />
                ) : (
                  SERVICE_TYPES.map((type, index) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      name={type.length > 20 ? type.substring(0, 15) + '...' : type}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Districts */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
                <div className="w-1.5 h-6 bg-blue-400 rounded-full mr-3"></div>
                อำเภอที่มีผู้รับบริการสูงสุด (คน)
            </h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={districtData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} stroke="#9ca3af" />
                    <Tooltip 
                    cursor={{fill: '#eff6ff'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                    />
                    <Bar dataKey="value" fill="#60a5fa" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Services per Unit (Updated: Dual Axis) */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
                <div className="w-1.5 h-6 bg-orange-400 rounded-full mr-3"></div>
                จำนวนการให้บริการรายหน่วยงาน
            </h3>
            <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={orgData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                
                {/* Left Axis: Beneficiaries */}
                <YAxis yAxisId="left" orientation="left" stroke="#ff8042" label={{ value: 'คน', angle: -90, position: 'insideLeft', textAnchor: 'middle' }} />
                
                {/* Right Axis: Counts */}
                <YAxis yAxisId="right" orientation="right" stroke="#8884d8" label={{ value: 'ครั้ง', angle: 90, position: 'insideRight', textAnchor: 'middle' }} />
                
                <Tooltip cursor={{fill: '#fff7ed'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                <Legend />
                
                <Bar yAxisId="right" dataKey="count" name="จำนวนครั้ง" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="beneficiaries" name="ผู้รับบริการ" fill="#ff8042" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Service Details Table with Pagination */}
      <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-700 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-pink-500" />
                รายละเอียดการให้บริการ (ทั้งหมด {sortedRecords.length} รายการ)
            </h3>
            <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
              หน้า {currentPage} จาก {Math.max(1, totalPages)}
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th scope="col" className="px-6 py-4 font-bold">วันที่</th>
                        <th scope="col" className="px-6 py-4 font-bold">หน่วยงาน</th>
                        <th scope="col" className="px-6 py-4 font-bold">บริการ</th>
                        <th scope="col" className="px-6 py-4 font-bold">สถานที่</th>
                        <th scope="col" className="px-6 py-4 font-bold text-right">จำนวน (คน)</th>
                        <th scope="col" className="px-6 py-4 font-bold text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentTableData.map((record) => (
                        <tr key={record.id} className="bg-white hover:bg-pink-50/20 transition duration-150">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {record.date}
                            </td>
                            <td className="px-6 py-4 truncate max-w-[150px]" title={record.organization}>
                                <span className="bg-gray-100 text-gray-700 py-1 px-2 rounded-lg text-xs font-semibold">
                                  {record.organization.split(' ')[0]}
                                </span>
                            </td>
                            <td className="px-6 py-4 truncate max-w-[200px]">
                                {record.serviceType === 'อื่นๆ' ? record.serviceTypeOther : record.serviceType}
                            </td>
                            <td className="px-6 py-4 truncate max-w-[200px] text-xs text-gray-500">
                                {record.village} {record.moo ? `ม.${record.moo}` : ''} {record.subdistrict}, {record.district}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-pink-600 font-bold bg-pink-50 px-2 py-1 rounded-md">
                                  {record.beneficiaries.toLocaleString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                      onClick={() => onEditRecord && onEditRecord(record)}
                                      className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition shadow-sm"
                                      title="แก้ไข"
                                  >
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                      onClick={() => onDeleteRecord && onDeleteRecord(record.id)}
                                      className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-xl hover:bg-red-100 transition shadow-sm"
                                      title="ลบ"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {sortedRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                    ยังไม่มีข้อมูลรายละเอียดการให้บริการ
                </div>
            ) : (
              /* Pagination Controls */
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 bg-white shadow-sm hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> ก่อนหน้า
                </button>
                
                <span className="text-sm font-medium text-gray-600">
                  หน้าที่ <span className="text-pink-600">{currentPage}</span> จาก {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 bg-white shadow-sm hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;