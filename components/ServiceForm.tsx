import React, { useState, useEffect } from 'react';
import { ServiceRecord, Organization, ORGANIZATIONS, SERVICE_TYPES, PROVINCES, CHIANG_MAI_DISTRICTS, LAMPHUN_DISTRICTS } from '../types';
import { Save, PlusCircle, MapPin, Calendar, Users, Activity, Home, Edit2, X, Hash, FileText } from 'lucide-react';

interface ServiceFormProps {
  onSave: (record: Omit<ServiceRecord, 'id' | 'timestamp'>) => void;
  onUpdate?: (record: Omit<ServiceRecord, 'id' | 'timestamp'>) => void;
  editingRecord?: ServiceRecord | null;
  onCancel?: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onSave, onUpdate, editingRecord, onCancel }) => {
  const [formData, setFormData] = useState({
    organization: ORGANIZATIONS[0],
    serviceType: SERVICE_TYPES[0],
    serviceTypeOther: '',
    date: new Date().toISOString().split('T')[0],
    moo: '',
    village: '',
    subdistrict: '',
    district: CHIANG_MAI_DISTRICTS[0],
    province: PROVINCES[0],
    beneficiaries: 0,
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Populate form when editingRecord changes
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        organization: editingRecord.organization as any,
        serviceType: editingRecord.serviceType,
        serviceTypeOther: editingRecord.serviceTypeOther || '',
        date: editingRecord.date,
        moo: editingRecord.moo || '',
        village: editingRecord.village,
        subdistrict: editingRecord.subdistrict,
        district: editingRecord.district,
        province: editingRecord.province,
        beneficiaries: editingRecord.beneficiaries,
      });
    } else {
      // Reset defaults
      setFormData({
        organization: ORGANIZATIONS[0],
        serviceType: SERVICE_TYPES[0],
        serviceTypeOther: '',
        date: new Date().toISOString().split('T')[0],
        moo: '',
        village: '',
        subdistrict: '',
        district: CHIANG_MAI_DISTRICTS[0],
        province: PROVINCES[0],
        beneficiaries: 0,
      });
    }
  }, [editingRecord]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    setFormData({
      ...formData,
      province: newProvince,
      district: newProvince === 'เชียงใหม่' ? CHIANG_MAI_DISTRICTS[0] : LAMPHUN_DISTRICTS[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRecord && onUpdate) {
      onUpdate(formData);
      setNotification('แก้ไขข้อมูลเรียบร้อยแล้ว!');
    } else {
      onSave(formData);
      setNotification('บันทึกข้อมูลเรียบร้อยแล้ว!');
      setFormData(prev => ({
        ...prev,
        serviceTypeOther: '',
        moo: '',
        village: '',
        subdistrict: '',
        beneficiaries: 0
      }));
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const currentDistricts = formData.province === 'เชียงใหม่' ? CHIANG_MAI_DISTRICTS : LAMPHUN_DISTRICTS;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shadow-inner ${editingRecord ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
            {editingRecord ? <Edit2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{editingRecord ? 'แก้ไขข้อมูลรายงาน' : 'บันทึกรายงานผล'}</h2>
            <p className="text-sm text-gray-500">กรอกข้อมูลการปฏิบัติงานเพื่อบันทึกลงในระบบฐานข้อมูล</p>
          </div>
        </div>
        {editingRecord && onCancel && (
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-400 hover:text-red-500 px-4 py-2 hover:bg-red-50 rounded-lg transition duration-200 text-sm font-medium"
          >
            <X className="w-4 h-4" /> ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center shadow-sm animate-bounce">
          <div className="bg-emerald-100 p-1.5 rounded-full mr-3">
            <Save className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: ข้อมูลทั่วไป */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-700">ข้อมูลการปฏิบัติงาน</h3>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-600">วันที่ดำเนินการ</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-600">หน่วยงาน</label>
                        <select
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value as Organization })}
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                        >
                            {ORGANIZATIONS.map(org => (
                            <option key={org} value={org}>{org}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">ประเภทกิจกรรม</label>
                    <select
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                    >
                        {SERVICE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                
                {formData.serviceType === 'อื่นๆ' && (
                    <div className="space-y-1.5 animate-fade-in">
                         <label className="text-sm font-semibold text-gray-600">โปรดระบุ</label>
                        <input
                            type="text"
                            placeholder="ระบุประเภทการให้บริการ..."
                            value={formData.serviceTypeOther}
                            onChange={(e) => setFormData({ ...formData, serviceTypeOther: e.target.value })}
                            required
                            className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                )}
            </div>
          </div>

          {/* Section 2: สถานที่ */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                <MapPin className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-gray-700">สถานที่ให้บริการ</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 uppercase font-bold">จังหวัด</label>
                    <select
                        value={formData.province}
                        onChange={handleProvinceChange}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                    >
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 uppercase font-bold">อำเภอ</label>
                    <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                    >
                        {currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-gray-400 uppercase font-bold">ตำบล</label>
                    <input
                        type="text"
                        value={formData.subdistrict}
                        onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                        required
                        placeholder="ระบุตำบล"
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                    />
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div className="col-span-1 space-y-1.5">
                         <label className="text-xs text-gray-400 uppercase font-bold">หมู่ที่</label>
                         <input
                            type="text"
                            value={formData.moo}
                            onChange={(e) => setFormData({ ...formData, moo: e.target.value })}
                            placeholder="-"
                            className="w-full p-2.5 text-center rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                        />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                         <label className="text-xs text-gray-400 uppercase font-bold">หมู่บ้าน</label>
                         <input
                            type="text"
                            value={formData.village}
                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                            required
                            placeholder="ชื่อหมู่บ้าน"
                            className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* Right Column: Stats & Action */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Section 3: ผลลัพธ์ */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-indigo-200" />
                        <h3 className="font-bold text-indigo-100">ผลการให้บริการ</h3>
                    </div>
                    
                    <label className="block text-sm text-indigo-100 mb-2">จำนวนผู้รับบริการ (คน)</label>
                    <div className="relative">
                        <input
                            type="number"
                            min="1"
                            value={formData.beneficiaries === 0 ? '' : formData.beneficiaries}
                            onChange={(e) => setFormData({ ...formData, beneficiaries: parseInt(e.target.value) || 0 })}
                            required
                            placeholder="0"
                            className="w-full p-4 text-3xl font-bold text-center rounded-xl bg-white/20 border border-indigo-400/30 text-white placeholder-indigo-300 focus:bg-white/30 focus:border-white outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <button
                    type="submit"
                    className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-1 active:translate-y-0 flex justify-center items-center gap-2 ${
                        editingRecord 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                    }`}
                >
                    {editingRecord ? <Edit2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {editingRecord ? 'บันทึกการแก้ไข' : 'ยืนยันการบันทึก'}
                </button>
                
                {editingRecord && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full mt-3 py-3 text-gray-500 font-semibold rounded-xl hover:bg-gray-100 transition duration-200"
                    >
                        ยกเลิก
                    </button>
                )}
            </div>
            
            {/* Helper Text */}
            <div className="text-center">
                <p className="text-xs text-gray-400">
                    * กรุณาตรวจสอบความถูกต้องก่อนบันทึก<br/>
                    ข้อมูลจะถูกส่งไปยังฐานข้อมูลทันที
                </p>
            </div>

        </div>
      </form>
    </div>
  );
};

export default ServiceForm;