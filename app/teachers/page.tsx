'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, UserPlus, Clock, Pencil, 
  Trash2, Search, X, Check, Loader2, AlertCircle 
} from 'lucide-react'

export default function ManageTeachersPage() {
  // --- States สำหรับฟอร์มเพิ่มข้อมูล ---
  const [title, setTitle] = useState('นาย')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [hours, setHours] = useState(20)
  
  const [teachers, setTeachers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  
  // --- States สำหรับการแก้ไข (Inline Edit) ---
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('นาย')
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editHours, setEditHours] = useState(20)

  const router = useRouter()

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers')
      const data = await res.json()
      setTeachers(Array.isArray(data) ? data : [])
    } catch (err) { console.error("Fetch error:", err) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          first_name: firstName.trim(), 
          last_name: lastName.trim(), 
          max_hours: hours 
        }),
      })
      const data = await res.json()
      
      if (res.ok) {
        alert('บันทึกข้อมูลบุคลากรเรียบร้อยแล้ว')
        setFirstName('')
        setLastName('')
        setHours(20)
        fetchTeachers()
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch (err) { alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้') } 
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (confirm('ยืนยันการลบข้อมูลบุคลากร? ข้อมูลตารางเวลาที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบ')) {
      try {
        const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchTeachers()
        else alert('ลบข้อมูลไม่สำเร็จ ข้อมูลอาจถูกใช้งานอยู่ในส่วนอื่น')
      } catch (err) { alert('เกิดข้อผิดพลาดในการลบข้อมูล') }
    }
  }

  const startEdit = (teacher: any) => {
    setEditingId(teacher.teacher_id)
    setEditTitle(teacher.title || 'นาย')
    setEditFirstName(teacher.first_name || '')
    setEditLastName(teacher.last_name || '')
    setEditHours(teacher.max_hours_per_week || teacher.max_hours)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacher_id: id, 
          title: editTitle,
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          max_hours: editHours 
        })
      })
      const data = await res.json()

      if (res.ok) {
        setEditingId(null)
        fetchTeachers()
      } else {
        alert(data.error || 'แก้ไขข้อมูลไม่สำเร็จ')
      }
    } catch (err) { alert('เกิดข้อผิดพลาดในการสื่อสารกับฐานข้อมูล') }
  }

  const filteredTeachers = teachers.filter(t => 
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-slate-900 font-sans">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-blue-700 transition-colors font-bold text-sm tracking-tight text-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับสู่หน้าแดชบอร์ด
      </button>

      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center gap-5">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-lg text-white">
            <UserPlus size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ระบบจัดการฐานข้อมูลบุคลากร</h1>
            <p className="text-slate-500 font-medium text-black">เพิ่ม แก้ไข และลบรายชื่อผู้สอนในระบบจัดการตารางเรียน</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ส่วนที่ 1: ฟอร์มเพิ่มข้อมูล */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-6 text-black">
              <h3 className="font-bold text-lg text-slate-800 border-l-4 border-blue-600 pl-4 mb-4">ลงทะเบียนบุคลากรใหม่</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">คำนำหน้า</label>
                  <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="อาจารย์">อาจารย์</option>
                    <option value="ดร.">ดร.</option>
                    <option value="ผศ.">ผศ.</option>
                    <option value="รศ.">รศ.</option>
                  </select>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">ชื่อจริง</label>
                  <input required type="text" placeholder="ชื่อ" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-600" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">นามสกุล</label>
                  <input required type="text" placeholder="นามสกุล" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-600" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">ชั่วโมงสอนสูงสุด</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-600" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-md flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-white">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> บันทึกข้อมูลเข้าสู่ระบบ</>}
              </button>
            </form>
          </div>

          {/* ส่วนที่ 2: เมนูทางลัด */}
          <div className="lg:col-span-1 text-black">
            <div className="bg-white border border-slate-200 rounded-[1.5rem] p-8 text-center shadow-sm h-full flex flex-col justify-center items-center group">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                <Clock size={32} className="text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">เงื่อนไขเวลา</h3>
              <button onClick={() => router.push('/teachers/availability')} className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-3 rounded-xl font-bold text-sm transition-all border border-slate-200 uppercase tracking-wide mt-4 text-black">
                ตั้งค่าเวลาสอน
              </button>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3: ตาราง */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden text-black">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-black">
            <h3 className="text-xl font-bold text-slate-800 text-black">รายชื่อบุคลากร ({teachers.length})</h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="ค้นหาชื่อหรือนามสกุล..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto text-black">
            <table className="w-full text-left text-black">
              <thead className="bg-slate-50 text-slate-600 text-[12px] font-bold uppercase tracking-wider border-b text-black">
                <tr>
                  <th className="px-8 py-4">คำนำหน้า</th>
                  <th className="px-8 py-4">ชื่อจริง - นามสกุล</th>
                  <th className="px-8 py-4 text-center">ชั่วโมงสอนสูงสุด</th>
                  <th className="px-8 py-4 text-right text-black">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-black">
                {filteredTeachers.map((t) => (
                  <tr key={t.teacher_id} className={`transition-all text-black ${editingId === t.teacher_id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-8 py-5 text-black">
                      {editingId === t.teacher_id ? (
                        <select value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border border-blue-400 rounded-lg font-bold outline-none bg-white">
                          <option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option><option value="อาจารย์">อาจารย์</option><option value="ดร.">ดร.</option>
                        </select>
                      ) : (
                        <span className="font-medium text-slate-500 text-black">{t.title || '-'}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-black">
                      {editingId === t.teacher_id ? (
                        <div className="flex gap-2">
                          <input type="text" className="w-full p-2 border border-blue-400 rounded-lg font-bold outline-none" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                          <input type="text" className="w-full p-2 border border-blue-400 rounded-lg font-bold outline-none" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 text-black">{t.first_name} {t.last_name}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center text-black text-black">
                      {editingId === t.teacher_id ? (
                        <input type="number" className="w-24 p-2 border border-blue-400 rounded-lg font-bold outline-none text-center" value={editHours} onChange={(e) => setEditHours(Number(e.target.value))} />
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-black">{t.max_hours_per_week || t.max_hours} ชม.</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right space-x-1 text-black">
                      {editingId === t.teacher_id ? (
                        <>
                          <button onClick={() => handleUpdate(t.teacher_id)} className="p-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-md"><Check size={18} /></button>
                          <button onClick={cancelEdit} className="p-2.5 text-white bg-slate-400 rounded-lg hover:bg-slate-500 transition-all shadow-md"><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(t)} className="p-2.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(t.teacher_id)} className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </>
                      )}
                    </td>
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