'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, ClipboardCheck, User, Book, Users, 
  Home, Search, Filter, Pencil, Trash2, X, Check, Loader2 
} from 'lucide-react'

export default function EnrollmentPage() {
  const [data, setData] = useState<any>({ courses: [], teachers: [], groups: [], enrollments: [], rooms: [] })
  const [form, setForm] = useState({ course_id: '', teacher_id: '', group_id: '', room_id: '' })
  const [loading, setLoading] = useState(false)
  
  // 🔍 State สำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroupId, setFilterGroupId] = useState('')

  // 📝 State สำหรับการแก้ไข (Inline Edit)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ course_id: '', teacher_id: '', group_id: '', room_id: '' })
  
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await fetch('/api/enrollments')
    const json = await res.json()
    setData(json)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.course_id || !form.teacher_id || !form.group_id) return alert('กรุณาเลือกข้อมูลให้ครบ')
    
    setLoading(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    
    if (res.ok) {
      alert('มอบหมายงานสอนสำเร็จ!')
      setForm({ course_id: '', teacher_id: '', group_id: '', room_id: '' })
      fetchData()
    }
    setLoading(false)
  }

  // --- ฟังก์ชันเข้าสู่โหมดแก้ไข ---
  const startEdit = (en: any) => {
    setEditingId(en.enrollment_id)
    setEditForm({
      course_id: en.course_id.toString(),
      teacher_id: en.teacher_id.toString(),
      group_id: en.group_id.toString(),
      room_id: en.preferred_room_id ? en.preferred_room_id.toString() : ''
    })
  }

  // --- ฟังก์ชันบันทึกการแก้ไข (Update) ---
  const handleUpdate = async (id: number) => {
    const res = await fetch('/api/enrollments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: id, ...editForm }),
    })

    if (res.ok) {
      setEditingId(null)
      fetchData()
    } else {
      alert('แก้ไขล้มเหลว')
    }
  }

  // --- ฟังก์ชันลบ ---
  const handleDelete = async (id: number) => {
    if (confirm('ยกเลิกการมอบหมายงานสอนนี้ใช่หรือไม่?')) {
      const res = await fetch(`/api/enrollments?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else {
        const err = await res.json()
        alert(err.error || 'ลบไม่ได้')
      }
    }
  }

  const filteredEnrollments = data.enrollments.filter((en: any) => {
    const teacherName = en.teachers?.name || '';
    const subjectName = en.courses?.subject_name || '';
    const courseCode = en.courses?.course_code || '';
    
    const matchesSearch = 
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroupId === '' || en.group_id.toString() === filterGroupId;

    return matchesSearch && matchesGroup;
  })

  return (
    <div className="min-h-screen p-8 animate-fade-in text-black bg-slate-50">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-white">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Teacher Assignment</h1>
              <p className="text-slate-500 font-medium">จัดการคู่มือการสอน รายวิชา และการล็อคห้องเรียน</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ส่วนฟอร์มบันทึก (ด้านซ้าย) */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm sticky top-8">
              <h3 className="font-bold text-lg text-slate-800 border-l-4 border-blue-600 pl-3">มอบหมายงานใหม่</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subject (วิชา)</label>
                  <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})}>
                    <option value="">เลือกรายวิชา...</option>
                    {data.courses.map((c: any) => <option key={c.course_id} value={c.course_id}>[{c.course_code}] {c.subject_name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teacher (ผู้สอน)</label>
                  <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})}>
                    <option value="">เลือกอาจารย์...</option>
                    {data.teachers.map((t: any) => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Student Group (กลุ่ม)</label>
                  <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})}>
                    <option value="">เลือกกลุ่มเรียน...</option>
                    {data.groups.map((g: any) => <option key={g.group_id} value={g.group_id}>{g.level}{g.academic_year} {g.major} ({g.group_name})</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1 italic">Optional Room Lock</label>
                  <select className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-blue-700" value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})}>
                    <option value="">-- อัตโนมัติ (AI เลือก) --</option>
                    {data.rooms?.map((r: any) => <option key={r.room_id} value={r.room_id}>{r.room_number} ({r.room_name})</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={16} /> Confirm Assignment</>}
              </button>
            </form>
          </div>

          {/* ส่วนตารางและการกรอง (ด้านขวา) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="ค้นหาตามวิชา หรือ ชื่ออาจารย์..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="w-full md:w-64 px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-sm" value={filterGroupId} onChange={(e) => setFilterGroupId(e.target.value)}>
                <option value="">ทั้งหมดทุกกลุ่มเรียน</option>
                {data.groups.map((g: any) => <option key={g.group_id} value={g.group_id}>{g.group_name} ({g.major})</option>)}
              </select>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
                  <tr>
                    <th className="p-5">Subject Information</th>
                    <th className="p-5">Assigned Teacher</th>
                    <th className="p-5">Target Group</th>
                    <th className="p-5">Room Lock</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((en: any) => (
                    <tr key={en.enrollment_id} className={`transition-all ${editingId === en.enrollment_id ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                      {editingId === en.enrollment_id ? (
                        /* 🛠️ โหมดแก้ไข (Inline Edit) */
                        <>
                          <td className="p-4">
                            <select className="w-full p-2 border border-blue-400 rounded-lg text-xs font-bold" value={editForm.course_id} onChange={e => setEditForm({...editForm, course_id: e.target.value})}>
                              {data.courses.map((c: any) => <option key={c.course_id} value={c.course_id}>{c.subject_name}</option>)}
                            </select>
                          </td>
                          <td className="p-4">
                            <select className="w-full p-2 border border-blue-400 rounded-lg text-xs font-bold" value={editForm.teacher_id} onChange={e => setEditForm({...editForm, teacher_id: e.target.value})}>
                              {data.teachers.map((t: any) => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
                            </select>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">🔒 Lock Group</span>
                          </td>
                          <td className="p-4">
                            <select className="w-full p-2 border border-blue-400 rounded-lg text-xs font-bold" value={editForm.room_id} onChange={e => setEditForm({...editForm, room_id: e.target.value})}>
                              <option value="">AI Auto</option>
                              {data.rooms.map((r: any) => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                            </select>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleUpdate(en.enrollment_id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 shadow-md"><X size={16} /></button>
                          </td>
                        </>
                      ) : (
                        /* 👁️ โหมดแสดงผลปกติ */
                        <>
                          <td className="p-5">
                            <div className="font-black text-slate-800 leading-tight italic">{en.courses?.subject_name}</div>
                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 opacity-70">{en.courses?.course_code}</div>
                          </td>
                          <td className="p-5 font-bold text-slate-600">{en.teachers?.name}</td>
                          <td className="p-5">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">
                              {en.student_groups?.group_name}
                            </span>
                          </td>
                          <td className="p-5">
                            {en.preferred_room ? (
                              <div className="flex items-center gap-1.5 text-blue-600 font-black italic">
                                <Home size={14} /> {en.preferred_room.room_number}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase italic">Dynamic AI</span>
                            )}
                          </td>
                          <td className="p-5 text-right space-x-1">
                            <button onClick={() => startEdit(en)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Assignment"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(en.enrollment_id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Remove Assignment"><Trash2 size={18} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEnrollments.length === 0 && (
                <div className="p-20 text-center text-slate-300 italic font-medium bg-white">No teaching assignments found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}