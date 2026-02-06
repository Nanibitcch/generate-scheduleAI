'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Clock, Calendar, User, ListChecks, Trash2, Pencil, X, Loader2 } from 'lucide-react'

export default function TeacherAvailabilityPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [savedSlots, setSavedSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // เช็คว่ากำลังแก้ไขอยู่ไหม
  
  const [form, setForm] = useState({
    teacher_id: '',
    day_of_week: 'Mon',
    start_time: '08:00',
    end_time: '16:00'
  })
  const router = useRouter()

  const fetchData = async () => {
    try {
      const res = await fetch('/api/teachers/availability')
      const data = await res.json()
      if (data.teachers) setTeachers(data.teachers)
      if (data.savedSlots) setSavedSlots(data.savedSlots)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.teacher_id) return alert('กรุณาเลือกอาจารย์')

    setLoading(true)
    try {
      // ใช้ method POST เสมอ (หรือจะแยก PUT ก็ได้ แต่ API ส่วนใหญ่ใช้ POST บันทึกทับตาม Composite Key)
      const res = await fetch('/api/teachers/availability', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        alert(isEditing ? 'อัปเดตข้อมูลสำเร็จ!' : 'บันทึกข้อมูลสำเร็จ!')
        resetForm()
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  // --- ฟังก์ชันลบข้อมูล ---
  const handleDelete = async (t_id: number, day: string, start: string) => {
    if (!confirm('คุณต้องการลบเงื่อนไขเวลานี้ใช่หรือไม่?')) return

    try {
      const res = await fetch(`/api/teachers/availability?teacher_id=${t_id}&day_of_week=${day}&start_time=${start}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchData()
      } else {
        alert('ลบไม่สำเร็จ')
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ')
    }
  }

  // --- ฟังก์ชันดึงข้อมูลกลับมาแก้ไข ---
  const handleEdit = (slot: any) => {
    setIsEditing(true)
    // แปลงเวลา ISO กลับเป็น HH:mm เพื่อใส่ใน input type="time"
    const startHhMm = new Date(slot.start_time).getUTCHours().toString().padStart(2, '0') + ':' + 
                     new Date(slot.start_time).getUTCMinutes().toString().padStart(2, '0');
    const endHhMm = new Date(slot.end_time).getUTCHours().toString().padStart(2, '0') + ':' + 
                   new Date(slot.end_time).getUTCMinutes().toString().padStart(2, '0');

    setForm({
      teacher_id: slot.teacher_id.toString(),
      day_of_week: slot.day_of_week,
      start_time: startHhMm,
      end_time: endHhMm
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setForm({ teacher_id: '', day_of_week: 'Mon', start_time: '08:00', end_time: '16:00' })
    setIsEditing(false)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('th-TH', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    })
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-slate-900">
      <button onClick={() => router.push('/teachers')} className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 font-bold transition-all">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้ารายชื่ออาจารย์
      </button>

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg text-white">
              <Clock size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">เงื่อนไขเวลาสอน</h1>
              <p className="text-slate-500 font-medium">ระบุช่วงวันที่อาจารย์สะดวกหรือไม่สะดวกสอน</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ส่วนฟอร์ม */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all shadow-sm space-y-6 sticky top-8 ${isEditing ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {isEditing ? <Pencil className="text-amber-500" size={20}/> : <Save className="text-indigo-600" size={20} />}
                  {isEditing ? 'แก้ไขเงื่อนไขเวลา' : 'เพิ่มเงื่อนไขใหม่'}
                </h3>
                {isEditing && (
                  <button onClick={resetForm} className="text-slate-400 hover:text-red-500">
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">อาจารย์ผู้สอน</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
                    required value={form.teacher_id} disabled={isEditing}
                    onChange={e => setForm({...form, teacher_id: e.target.value})}
                  >
                    <option value="">-- เลือกรายชื่ออาจารย์ --</option>
                    {teachers.map((t: any) => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">วันที่สะดวก</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
                    value={form.day_of_week} disabled={isEditing}
                    onChange={e => setForm({...form, day_of_week: e.target.value})}>
                    <option value="Mon">วันจันทร์ (Mon)</option>
                    <option value="Tue">วันอังคาร (Tue)</option>
                    <option value="Wed">วันพุธ (Wed)</option>
                    <option value="Thu">วันพฤหัสบดี (Thu)</option>
                    <option value="Fri">วันศุกร์ (Fri)</option>
                    <option value="Sat">วันเสาร์ (Sat)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">เริ่ม</label>
                    <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">ถึง</label>
                    <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || !form.teacher_id} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-100'}`}>
                {loading ? <Loader2 className="animate-spin" /> : isEditing ? <Pencil size={18}/> : <Save size={18}/>}
                {loading ? 'กำลังบันทึก...' : isEditing ? 'ยืนยันการแก้ไข' : 'บันทึกเงื่อนไขเวลา'}
              </button>
            </form>
          </div>

          {/* ส่วนตาราง */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold flex items-center gap-2 text-slate-800">
                  <ListChecks className="text-indigo-600" /> รายการที่บันทึกแล้ว
                </h3>
                <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full uppercase">
                  Total: {savedSlots.length}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                    <tr>
                      <th className="px-8 py-4">อาจารย์</th>
                      <th className="px-8 py-4">วัน</th>
                      <th className="px-8 py-4">ช่วงเวลา</th>
                      <th className="px-8 py-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {savedSlots.length > 0 ? (
                      savedSlots.map((slot: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-5 font-bold text-slate-700">{slot.teachers?.name}</td>
                          <td className="px-8 py-5">
                            <span className="bg-white border-2 border-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black">
                              {slot.day_of_week}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-mono font-bold text-indigo-600 text-sm">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </td>
                          <td className="px-8 py-5 text-right space-x-2">
                            <button onClick={() => handleEdit(slot)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="แก้ไข">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDelete(slot.teacher_id, slot.day_of_week, slot.start_time)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all" title="ลบ">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 font-medium italic">ยังไม่มีข้อมูลช่วงเวลาที่สะดวก</td>
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