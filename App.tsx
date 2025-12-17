import React, { useState, useEffect } from 'react';
import { ServiceRecord } from './types';
import ServiceForm from './components/ServiceForm';
import Dashboard from './components/Dashboard';
import { FileSpreadsheet, Plus, PieChart, Bug, Loader2, Wifi, WifiOff } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- ตั้งค่า URL ของ Google Apps Script Web App ที่นี่ ---
// หากยังไม่มี ให้ปล่อยว่างไว้ '' ระบบจะทำงานแบบ Offline (เก็บข้อมูลในเครื่องชั่วคราว)
const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxDlvmZoYaZq939AD4vfSqphppN6-mkLesmt37UUbWztfEaKVkoitKkrUx73V2fXHidKQ/exec'; 

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(!!GOOGLE_WEB_APP_URL);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (GOOGLE_WEB_APP_URL) {
      fetchFromGoogleSheet();
    }
  }, []);

  const fetchFromGoogleSheet = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch(GOOGLE_WEB_APP_URL);
      
      // Check for content type to catch Google Auth pages or HTML errors
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        throw new Error("Received HTML instead of JSON. Check deployment version.");
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      // Ensure numeric fields are numbers
      const formattedData = data.map((item: any) => ({
        ...item,
        beneficiaries: Number(item.beneficiaries),
        timestamp: Number(item.timestamp)
      }));
      setRecords(formattedData);
      setIsOnlineMode(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsOnlineMode(false);
      
      let errorMessage = "ไม่สามารถดึงข้อมูลได้";
      if ((error as Error).message.includes("Received HTML")) {
        errorMessage = "กรุณา Deploy Google Apps Script แบบ 'New Version' เพื่ออัปเดตโค้ด";
      } else {
        errorMessage = "ไม่สามารถเชื่อมต่อ Google Sheets ได้ (ตรวจสอบสิทธิ์ 'Anyone')";
      }
      setConnectionError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToGoogleSheet = async (action: 'create' | 'update' | 'delete', recordData: any) => {
    if (!GOOGLE_WEB_APP_URL) return;

    // Background sync - do not block UI with loading state for long periods
    // but show loading if desired. Here we keep it subtle or use the existing loader.
    setIsLoading(true);
    try {
      // FIX: Use mode: 'no-cors' to avoid CORS errors on Google Apps Script redirects for POST requests.
      // Note: With 'no-cors', we cannot read the response status/body, but the request will be sent.
      await fetch(GOOGLE_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify({ action, ...recordData }),
        headers: {
            'Content-Type': 'text/plain', 
        }
      });
      
      // Since we use no-cors, we assume success if no network error occurred.
      // We rely on optimistic UI updates (already done in handleSaveRecord etc).
    } catch (error) {
      console.error("Error syncing data:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async (newRecordData: Omit<ServiceRecord, 'id' | 'timestamp'>) => {
    const newRecord: ServiceRecord = {
      ...newRecordData,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    // Optimistic Update
    setRecords(prev => [newRecord, ...prev]);

    if (GOOGLE_WEB_APP_URL) {
      await syncToGoogleSheet('create', newRecord);
    }
  };

  const handleUpdateRecord = async (updatedRecordData: Omit<ServiceRecord, 'id' | 'timestamp'>) => {
    if (!editingRecord) return;
    
    const updatedFullRecord = { 
        ...updatedRecordData, 
        id: editingRecord.id, 
        timestamp: editingRecord.timestamp 
    };

    setRecords(prev => prev.map(record => 
      record.id === editingRecord.id 
        ? updatedFullRecord
        : record
    ));
    setEditingRecord(null);

    if (GOOGLE_WEB_APP_URL) {
      await syncToGoogleSheet('update', updatedFullRecord);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?')) {
      setRecords(prev => prev.filter(record => record.id !== id));
      
      if (GOOGLE_WEB_APP_URL) {
        await syncToGoogleSheet('delete', { id });
      }
    }
  };

  const handleEditClick = (record: ServiceRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  const handleExportExcel = () => {
    const dataToExport = records.map(r => ({
      'วันที่': r.date,
      'หน่วยงาน': r.organization,
      'ประเภทบริการ': r.serviceType === 'อื่นๆ' ? `อื่นๆ: ${r.serviceTypeOther}` : r.serviceType,
      'จำนวนผู้รับบริการ': r.beneficiaries,
      'หมู่ที่': r.moo,
      'หมู่บ้าน/กลุ่มบ้าน': r.village,
      'ตำบล': r.subdistrict,
      'อำเภอ': r.district,
      'จังหวัด': r.province
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Report");
    XLSX.writeFile(workbook, "VBDC_Report.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 font-sans relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-small">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-3" />
                <p className="text-gray-600 font-bold">กำลังเชื่อมต่อข้อมูล...</p>
            </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2.5 rounded-2xl shadow-lg shadow-pink-300 transform hover:scale-105 transition duration-300">
                 <Bug className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 leading-tight">ศตม.1.4 เชียงใหม่</h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                    ระบบรายงานผลการให้บริการเฝ้าระวังป้องกันควบคุมโรคติดต่อนำโดยแมลง
                    </p>
                    {/* Status Indicator */}
                    {isOnlineMode ? (
                         <span className="flex items-center text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <Wifi className="w-3 h-3 mr-1" /> ออนไลน์
                         </span>
                    ) : (
                        <span className="flex items-center text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                            <WifiOff className="w-3 h-3 mr-1" /> ออฟไลน์
                         </span>
                    )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  setActiveTab('form');
                  setEditingRecord(null);
                }}
                className={`px-5 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'form' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-200 transform scale-105' 
                  : 'text-gray-500 hover:bg-white hover:shadow-md'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>บันทึก</span>
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-lg shadow-purple-200 transform scale-105' 
                  : 'text-gray-500 hover:bg-white hover:shadow-md'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>สรุปผล</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error / Offline Notification */}
        {(!isOnlineMode || connectionError) && (
            <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                    <WifiOff className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h4 className="font-bold">เชื่อมต่อ Google Sheets ไม่สำเร็จ</h4>
                    <p className="text-sm mt-1">
                      {connectionError || "ระบบทำงานแบบ Offline ชั่วคราว ข้อมูลจะไม่ถูกบันทึกไปยัง Cloud"}
                    </p>
                    {!connectionError && GOOGLE_WEB_APP_URL && (
                       <p className="text-xs mt-2 text-orange-600 bg-orange-100/50 p-2 rounded">
                         คำแนะนำ: หากคุณเพิ่งวาง URL ตรวจสอบให้แน่ใจว่าได้ Deploy เป็น "Web App" และตั้งค่า 
                         <strong> Who has access</strong> เป็น <strong>Anyone (ทุกคน)</strong> แล้ว
                       </p>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'dashboard' && records.length > 0 && (
          <div className="flex justify-end mb-6">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-green-200 transition transform hover:-translate-y-1 font-bold"
            >
              <FileSpreadsheet className="w-5 h-5" />
              ส่งออก Excel
            </button>
          </div>
        )}

        {activeTab === 'form' ? (
          <div className="animate-fade-in">
             <ServiceForm 
               onSave={handleSaveRecord} 
               onUpdate={handleUpdateRecord}
               editingRecord={editingRecord}
               onCancel={handleCancelEdit}
             />
          </div>
        ) : (
          <div className="animate-fade-in">
            {records.length === 0 ? (
              <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-[2rem] shadow-xl border-2 border-dashed border-pink-200 mx-auto max-w-2xl">
                <div className="bg-gradient-to-br from-pink-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <PieChart className="w-12 h-12 text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">ยังไม่มีข้อมูล</h3>
                <p className="text-gray-500 mt-2 text-lg">กรุณาบันทึกข้อมูลการให้บริการเพื่อดูรายงานสรุป</p>
                <button 
                  onClick={() => setActiveTab('form')}
                  className="mt-8 px-8 py-3 bg-white text-pink-600 font-bold rounded-full shadow-lg border border-pink-100 hover:bg-pink-50 transition transform hover:scale-105"
                >
                  ไปที่หน้าบันทึกข้อมูล &rarr;
                </button>
              </div>
            ) : (
              <Dashboard 
                records={records} 
                onEditRecord={handleEditClick} 
                onDeleteRecord={handleDeleteRecord}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;