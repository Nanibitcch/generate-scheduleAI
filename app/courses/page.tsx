'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, BookOpen, Hash, Clock, 
  Search, Pencil, Trash2, X, Check, Loader2 
} from 'lucide-react'

export default function ManageCoursesPage() {
  const [courseCode, setCourseCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [theoryHours, setTheoryHours] = useState(2)
  const [labHours, setLabHours] = useState(0)
  const [courses, setCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  
  // --- States สำหรับการแก้ไข (Inline Edit) ---
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    course_code: '',
    subject_name: '',
    theory_hours: 0,
    lab_hours: 0
  })

  const router = useRouter()

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) { console.error("Fetch error:", err) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          course_code: courseCode.trim(), 
          subject_name: subjectName.trim(),
          theory_hours: theoryHours,
          lab_hours: labHours
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('บันทึกรายวิชาสำเร็จ!')
        setCourseCode(''); setSubjectName(''); setTheoryHours(2); setLabHours(0);
        fetchCourses()
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อ') } 
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (confirm('คุณต้องการลบรายวิชานี้ใช่หรือไม่?')) {
      try {
        const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchCourses()
        else alert('ลบไม่สำเร็จ วิชานี้อาจถูกใช้งานอยู่')
      } catch (err) { alert('เกิดข้อผิดพลาด') }
    }
  }

  const startEdit = (course: any) => {
    setEditingId(course.course_id)
    setEditForm({
      course_code: course.course_code,
      subject_name: course.subject_name,
      theory_hours: course.theory_hours,
      lab_hours: course.lab_hours
    })
  }

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: id, ...editForm })
      })
      const data = await res.json()
      if (res.ok) {
        setEditingId(null)
        fetchCourses()
      } else {
        alert(data.error || 'แก้ไขไม่สำเร็จ')
      }
    } catch (err) { alert('เกิดข้อผิดพลาดในการอัปเดต') }
  }

  const filteredCourses = courses.filter(c => 
    c.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-slate-900 font-sans">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-orange-700 font-bold text-sm tracking-tight">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับสู่หน้าแดชบอร์ด
      </button>

      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center gap-5">
          <div className="bg-orange-600 p-4 rounded-2xl shadow-lg text-white">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Manage Courses</h1>
            <p className="text-slate-500 font-medium">จัดการข้อมูลหลักสูตรและกำหนดชั่วโมงเรียนทฤษฎี/ปฏิบัติ</p>
          </div>
        </header>

        {/* 1. ฟอร์มเพิ่มรายวิชา */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-800 border-l-4 border-orange-600 pl-4">เพิ่มรายวิชาใหม่</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">รหัสวิชา</label>
              <input required type="text" placeholder="3000-1201" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">ชื่อรายวิชา</label>
              <input required type="text" placeholder="ภาษาอังกฤษเพื่อการสื่อสาร" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">ชั่วโมงทฤษฎี</label>
              <input type="number" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" value={theoryHours} onChange={(e) => setTheoryHours(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">ชั่วโมงปฏิบัติ</label>
              <input type="number" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" value={labHours} onChange={(e) => setLabHours(Number(e.target.value))} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-md flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> บันทึกข้อมูลวิชา</>}
          </button>
        </form>

        {/* 2. ตารางแสดงรายวิชา */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-black">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <h3 className="text-xl font-bold text-slate-800">รายวิชาในระบบ ({courses.length})</h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="ค้นหารหัสหรือชื่อวิชา..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-8 py-4">รหัสวิชา</th>
                  <th className="px-8 py-4">ชื่อรายวิชา</th>
                  <th className="px-8 py-4 text-center">ท/ป</th>
                  <th className="px-8 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => (
                  <tr key={course.course_id} className={`transition-all ${editingId === course.course_id ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'}`}>
                    {editingId === course.course_id ? (
                      <>
                        <td className="px-8 py-4"><input className="w-full p-2 border border-orange-400 rounded-lg font-bold" value={editForm.course_code} onChange={e => setEditForm({...editForm, course_code: e.target.value})} /></td>
                        <td className="px-8 py-4"><input className="w-full p-2 border border-orange-400 rounded-lg font-bold" value={editForm.subject_name} onChange={e => setEditForm({...editForm, subject_name: e.target.value})} /></td>
                        <td className="px-8 py-4 text-center flex gap-1 justify-center">
                          <input type="number" className="w-12 p-2 border border-orange-400 rounded-lg text-center" value={editForm.theory_hours} onChange={e => setEditForm({...editForm, theory_hours: Number(e.target.value)})} />
                          <input type="number" className="w-12 p-2 border border-orange-400 rounded-lg text-center" value={editForm.lab_hours} onChange={e => setEditForm({...editForm, lab_hours: Number(e.target.value)})} />
                        </td>
                        <td className="px-8 py-4 text-right space-x-2">
                          <button onClick={() => handleUpdate(course.course_id)} className="p-2 text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-md"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-white bg-slate-400 rounded-lg hover:bg-slate-500 shadow-md"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-4 font-mono font-bold text-orange-600">{course.course_code}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{course.subject_name}</td>
                        <td className="px-8 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{course.theory_hours}-{course.lab_hours}</span>
                        </td>
                        <td className="px-8 py-4 text-right space-x-1">
                          <button onClick={() => startEdit(course)} className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(course.course_id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}