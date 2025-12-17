export interface ServiceRecord {
  id: string;
  organization: string;
  serviceType: string;
  serviceTypeOther?: string;
  date: string; // ISO string YYYY-MM-DD
  moo: string; // Village No.
  village: string;
  subdistrict: string;
  district: string;
  province: string;
  beneficiaries: number;
  timestamp: number;
}

export type Organization = 
  | 'ศตม.1.4 เชียงใหม่'
  | 'นคม.1.4.1 ฝาง'
  | 'นคม.1.4.2 เชียงดาว'
  | 'นคม.1.4.3 ฮอด'
  | 'นคม.1.4.4 แม่แจ่ม'
  | 'นคม.1.4.5 อมก๋อย';

export const ORGANIZATIONS: Organization[] = [
  'ศตม.1.4 เชียงใหม่',
  'นคม.1.4.1 ฝาง',
  'นคม.1.4.2 เชียงดาว',
  'นคม.1.4.3 ฮอด',
  'นคม.1.4.4 แม่แจ่ม',
  'นคม.1.4.5 อมก๋อย'
];

export const SERVICE_TYPES = [
  'การพ่นสารเคมีควบคุมพาหะนำโรค',
  'การกำจัดลูกน้ำ ยุงและสำรวจความชุกของลูกน้ำ',
  'การตรวจวินิจฉัยค้นหาผู้ป่วยโรคไข้มาลาเรีย',
  'การให้ความรู้และสื่อความรู้',
  'การสนับสนุนเวชภัณฑ์และวัสดุอุปกรณ์',
  'อื่นๆ'
];

export const PROVINCES = ['เชียงใหม่', 'ลำพูน'];

// Simplified list of districts for the demo. In a real app, this would be comprehensive.
export const CHIANG_MAI_DISTRICTS = [
  'เมืองเชียงใหม่', 'จอมทอง', 'แม่แจ่ม', 'เชียงดาว', 'ดอยสะเก็ด', 'แม่แตง', 'แม่ริม', 'สะเมิง', 'ฝาง', 'แม่อาย', 'พร้าว', 'สันป่าตอง', 'สันกำแพง', 'สันทราย', 'หางดง', 'ฮอด', 'ดอยเต่า', 'อมก๋อย', 'สารภี', 'เวียงแหง', 'ไชยปราการ', 'แม่วาง', 'แม่ออน', 'ดอยหล่อ', 'กัลยาณิวัฒนา'
];

export const LAMPHUN_DISTRICTS = [
  'เมืองลำพูน', 'แม่ทา', 'บ้านโฮ่ง', 'ลี้', 'ทุ่งหัวช้าง', 'ป่าซาง', 'บ้านธิ', 'เวียงหนองล่อง'
];