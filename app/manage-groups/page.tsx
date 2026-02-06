'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, Users, GraduationCap, 
  Layers, Plus, Trash2, Loader2, Link2, 
  CheckCircle2, AlertCircle, Info, ChevronDown, ArrowRight
} from 'lucide-react'

export default function CombinedGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([]) // ข้อมูลกลุ่มเรียนหลัก
  const [mappings, setMappings] = useState<any[]>([]) // ข้อมูลการจับคู่ (Mapping)
  
  // --- State สำหรับฟอร์มจับคู่เรียนรวม ---
  const [formData, setFormData] = useState({
    major: '',
    main_group_id: '', // ID ของห้องหลัก
    sub_group_id: '',  // ID ของห้องรอง
    combined_name: ''  // ชื่อเรียกกลุ่มรวม (Option)
  })

  // 🚩 ดึงรายชื่อสาขาที่ไม่ซ้ำกันมาทำตัวเลือก
  const uniqueMajors = Array.from(new Set(groups.map(g => g.major))).filter(Boolean)

  // 🚩 กรองเฉพาะห้องที่อยู่ในสาขาที่เลือก
  const availableGroups = groups.filter(g => g.major === formData.major)

  useEffect(() => { 
    fetchInitialData() 
  }, [])

  const fetchInitialData = async () => {
    try {
      const [groupsRes, mappingRes] = await Promise.all([
        fetch('/api/student-groups'),
        fetch('/api/combined-group-mappings') // 🚩 มึงต้องสร้าง API ตัวนี้เพื่อดึงตาราง Mapping แยก
      ])
      setGroups(await groupsRes.json())
      setMappings(await mappingRes.json())
    } catch (err) { console.error("Fetch error:", err) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.main_group_id || !formData.sub_group_id) return alert('กรุณาเลือกห้องให้ครบ')
    setLoading(true)
    
    try {
      // 🚩 บันทึกลงตาราง Mapping แยก (ไม่กระทบตาราง student_groups หลัก)
      const res = await fetch('/api/combined-group-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          main_group_id: Number(formData.main_group_id),
          sub_group_id: Number(formData.sub_group_id),
          combined_name: `${formData.major} - Combined`
        }),
      })

      if (res.ok) {
        alert('สร้างความสัมพันธ์เรียนรวมสำเร็จ!')
        setFormData({ ...formData, main_group_id: '', sub_group_id: '' })
        fetchInitialData()
      } else {
        const err = await res.json()
        alert(err.error || 'บันทึกไม่สำเร็จ')
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally { setLoading(false) }
  }

  const handleDeleteMapping = async (id: number) => {
    if (confirm('ยกเลิกการเรียนรวมนี้ใช่หรือไม่? (ข้อมูลกลุ่มเรียนหลักจะไม่ถูกลบ)')) {
      await fetch(`/api/combined-group-mappings?id=${id}`, { method: 'DELETE' })
      fetchInitialData()
    }
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-slate-900 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex items-center gap-5">
          <div className="bg-amber-500 p-4 rounded-3xl shadow-xl shadow-amber-200">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Combined Group Mapping</h1>
            <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">จัดการความสัมพันธ์ "เรียนรวม" แบบแยกตารางฐานข้อมูล</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🛠️ ส่วนตั้งค่าการจับคู่ (Mapping Form) */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 sticky top-8">
              <h3 className="font-black text-slate-800 uppercase italic flex items-center gap-2 border-b pb-4">
                <Link2 className="text-amber-500" size={20} /> Create New Link
              </h3>

              {/* เลือกสาขาก่อนเพื่อกรองห้อง */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Select Major (เลือกสาขา)</label>
                <select 
                  className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.major}
                  onChange={e => setFormData({...formData, major: e.target.value, main_group_id: '', sub_group_id: ''})}
                >
                  <option value="">-- เลือกสาขาวิชา --</option>
                  {uniqueMajors.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
              </div>

              {formData.major && (
                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-5 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">2. Main Room (ห้องหลัก)</label>
                    <select 
                      className="w-full p-4 bg-white rounded-xl font-black text-amber-700 border-2 border-amber-200 outline-none"
                      value={formData.main_group_id}
                      onChange={e => setFormData({...formData, main_group_id: e.target.value})}
                    >
                      <option value="">-- เลือกห้องที่เป็นตัวตั้งต้น --</option>
                      {availableGroups.map(g => (
                        <option key={g.group_id} value={g.group_id}>ห้อง {g.group_name} ({g.level}{g.academic_year})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center py-2 text-amber-300">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">3. Combine With (นำมาเรียนรวม)</label>
                    <select 
                      className="w-full p-4 bg-white rounded-xl font-black text-amber-700 border-2 border-amber-200 outline-none"
                      value={formData.sub_group_id}
                      onChange={e => setFormData({...formData, sub_group_id: e.target.value})}
                    >
                      <option value="">-- เลือกห้องที่จะมาเกาะเรียน --</option>
                      {availableGroups
                        .filter(g => g.group_id !== Number(formData.main_group_id))
                        .map(g => (
                          <option key={g.group_id} value={g.group_id}>ห้อง {g.group_name} ({g.level}{g.academic_year})</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !formData.main_group_id || !formData.sub_group_id} 
                className="w-full bg-slate-900 hover:bg-amber-500 text-white py-5 rounded-3xl font-black text-lg shadow-xl flex items-center justify-center gap-3 uppercase italic transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} บันทึกการจับคู่
              </button>
            </form>
          </div>

          {/* 📊 ตารางแสดงสถานะการจับคู่ (Mapping Table) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-black text-slate-800 uppercase italic flex items-center gap-2">
                     <CheckCircle2 className="text-emerald-500" size={20} /> Active Combined Rules
                  </h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="px-8 py-5">Main Room (Master)</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5">Sub Group (Linked)</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mappings.map((map) => (
                        <tr key={map.mapping_id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                             <p className="font-black text-slate-800 text-lg italic leading-none uppercase">ห้อง {map.main_group.group_name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{map.main_group.major}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className="flex justify-center text-amber-500"><Link2 size={20} className="animate-pulse" /></div>
                          </td>
                          <td className="px-8 py-5">
                             <p className="font-black text-amber-600 text-lg italic leading-none uppercase">ห้อง {map.sub_group.group_name}</p>
                             <div className="inline-block bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 border border-amber-100">Linked Account</div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button 
                               onClick={() => handleDeleteMapping(map.mapping_id)}
                               className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {mappings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-32 text-center">
                            <AlertCircle className="mx-auto text-slate-200 mb-2" size={48} />
                            <p className="text-slate-400 font-bold italic">ยังไม่มีการตั้งค่าเรียนรวม</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}