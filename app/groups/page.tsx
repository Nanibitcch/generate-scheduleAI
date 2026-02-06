'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, Users, Layers, GraduationCap, 
  Search, Pencil, Trash2, Loader2, Filter, X, Check, Settings2, AlertCircle
} from 'lucide-react'

export default function ManageGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  
  const [level, setLevel] = useState('ปวช.')
  const [academicYear, setAcademicYear] = useState('1')
  const [major, setMajor] = useState('')
  const [section, setSection] = useState('') 
  const [studentCount, setStudentCount] = useState(20)
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    level: '',
    academic_year: '',
    major: '',
    group_name: '', // 🚩 ตัวนี้แหละคือชื่อห้อง G6, G7
    student_count: 0
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('ทั้งหมด')
  const [filterYear, setFilterYear] = useState('ทั้งหมด')

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/student-groups')
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error("Fetch error:", err)
      setGroups([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/student-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          level, 
          academic_year: academicYear, 
          major, 
          group_name: section, // 🚩 ส่งค่าที่เรากรอกไปเป็นชื่อกลุ่ม
          student_count: studentCount
        }),
      })
      if (res.ok) {
        alert('บันทึกกลุ่มเรียนสำเร็จ!')
        setSection('')
        fetchGroups()
      } else {
        const data = await res.json()
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) { 
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ') 
    } finally { 
      setLoading(false) 
    }
  }

  const startEdit = (group: any) => {
    setEditingId(group.group_id)
    setEditForm({
      level: group.level,
      academic_year: group.academic_year,
      major: group.major,
      group_name: group.group_name, // 🚩 โหลดค่า G6, G7 เข้าฟอร์มแก้ไข
      student_count: group.student_count
    })
  }

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/student-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          group_id: id, 
          ...editForm
        }),
      })
      if (res.ok) {
        setEditingId(null)
        fetchGroups()
      } else {
        const data = await res.json()
        alert(data.error || 'แก้ไขไม่สำเร็จ')
      }
    } catch (err) { 
      alert('เกิดข้อผิดพลาดในการอัปเดต') 
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('ลบกลุ่มเรียนนี้ใช่หรือไม่?')) {
      const res = await fetch(`/api/student-groups?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error)
      }
      fetchGroups()
    }
  }

  const filteredGroups = groups.filter(g => {
    const matchSearch = `${g.level}${g.academic_year} ${g.major} ${g.group_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = filterLevel === 'ทั้งหมด' || g.level === filterLevel;
    const matchYear = filterYear === 'ทั้งหมด' || g.academic_year === filterYear;
    return matchSearch && matchLevel && matchYear;
  })

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-black text-left">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-teal-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
      </button>

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex items-center gap-4">
          <div className="bg-teal-600 p-3 rounded-2xl shadow-lg shadow-teal-200"><Users className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter italic uppercase">Core Group Management</h1>
            <p className="text-slate-500 font-medium tracking-tight">ระบบจัดการข้อมูลกลุ่มเรียน (กรุณากรอกเลขห้องที่ต้องการให้แสดงผล)</p>
          </div>
        </header>

        {/* 1. ฟอร์มบันทึก */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic block">ระดับ</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold italic outline-none focus:ring-2 focus:ring-teal-500">
                <option value="ปวช.">ปวช.</option><option value="ปวส.">ปวส.</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic block">ปีการศึกษา</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold italic outline-none focus:ring-2 focus:ring-teal-500">
                <option value="1">ปี 1</option><option value="2">ปี 2</option><option value="3">ปี 3</option>
              </select>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic block">สาขาวิชา</label>
              <input required type="text" placeholder="เช่น เทคโนโลยีสารสนเทศ" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold italic outline-none focus:ring-2 focus:ring-teal-500" value={major} onChange={(e) => setMajor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest italic block">เลขห้อง (G6, G7...)</label>
              <input required type="text" placeholder="G6" className="w-full p-3 bg-white border-2 border-teal-100 rounded-xl font-black text-teal-700 shadow-sm outline-none focus:ring-2 focus:ring-teal-500" value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center border border-slate-800 shadow-xl gap-4">
             <div className="text-white">
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Preview:</p>
                <h2 className="font-black text-2xl italic tracking-tight uppercase">
                  {level}{academicYear} <span className="text-teal-400">{major || '...'}</span> <span className="underline">ห้อง {section || '??'}</span>
                </h2>
             </div>
             <button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-teal-500/20 w-full md:w-auto justify-center">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} บันทึกห้องเรียน
             </button>
          </div>
        </form>

        {/* 2. ตารางแสดงผล */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">LVL/YR</th>
                  <th className="px-8 py-5">MAJOR</th>
                  <th className="px-8 py-5">ROOM NUMBER</th>
                  <th className="px-8 py-5">STATUS</th>
                  <th className="px-8 py-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map((group) => (
                  <tr key={group.group_id} className={`transition-all ${editingId === group.group_id ? 'bg-teal-50/50' : 'hover:bg-slate-50'}`}>
                    {editingId === group.group_id ? (
                      <>
                        <td className="px-8 py-4">
                          <div className="flex gap-1">
                            <select className="p-2 border rounded-lg font-bold text-xs" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})}><option value="ปวช.">ปวช.</option><option value="ปวส.">ปวส.</option></select>
                            <select className="p-2 border rounded-lg font-bold text-xs" value={editForm.academic_year} onChange={e => setEditForm({...editForm, academic_year: e.target.value})}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
                          </div>
                        </td>
                        <td className="px-8 py-4"><input className="w-full p-2 border rounded-lg font-bold text-sm bg-white" value={editForm.major} onChange={e => setEditForm({...editForm, major: e.target.value})} /></td>
                        <td className="px-8 py-4">
                           {/* 🚩 ส่วนแก้ไขชื่อห้อง */}
                           <input className="w-full p-2 border-2 border-teal-200 rounded-lg font-black text-teal-700 bg-white uppercase" value={editForm.group_name} onChange={e => setEditForm({...editForm, group_name: e.target.value})} />
                        </td>
                        <td className="px-8 py-4 text-slate-400 italic text-xs">Editing Mode...</td>
                        <td className="px-8 py-4 text-right space-x-2">
                          <button onClick={() => handleUpdate(group.group_id)} className="p-2 bg-teal-600 text-white rounded-xl shadow-md hover:bg-teal-700 transition-colors"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-300 text-white rounded-xl shadow-md hover:bg-slate-400 transition-colors"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-5">
                          <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-black italic shadow-sm uppercase">{group.level}{group.academic_year}</span>
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-700">{group.major}</td>
                        <td className="px-8 py-5 font-black text-teal-700 text-lg italic uppercase">
                           {/* 🚩 โชว์ชื่อห้องที่เรากรอก (G6, G7) ไม่ใช่ ID */}
                           ROOM {group.group_name}
                        </td>
                        <td className="px-8 py-5">
                          {(group.mapping_as_main?.length > 0 || group.mapping_as_sub?.length > 0) ? (
                            <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-100">Linked</span>
                          ) : (
                            <span className="text-slate-400 bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase">Single</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right space-x-1">
                          <button onClick={() => startEdit(group)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(group.group_id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
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