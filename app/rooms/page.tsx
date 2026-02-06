'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, School, Hash, Users, Search, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'

export default function ManageRoomsPage() {
  const [roomName, setRoomName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [rooms, setRooms] = useState<any[]>([]) 
  const [searchTerm, setSearchTerm] = useState('') 
  const [loading, setLoading] = useState(false)
  
  // --- States สำหรับการแก้ไข (Inline Edit) ---
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRoomName, setEditRoomName] = useState('')
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editCapacity, setEditCapacity] = useState(30)

  const router = useRouter()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      setRooms(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Fetch error:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_name: roomName.trim(), 
          room_number: roomNumber.trim(),
          capacity 
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('บันทึกข้อมูลห้องเรียนสำเร็จ!')
        setRoomName(''); setRoomNumber(''); setCapacity(30);
        fetchRooms()
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`)
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('ยืนยันการลบห้องเรียนนี้?')) {
      try {
        const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchRooms()
        else alert('ลบไม่สำเร็จ ข้อมูลอาจถูกใช้งานอยู่')
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบ')
      }
    }
  }

  // --- ฟังก์ชันเข้าสู่โหมดแก้ไข (Inline) ---
  const startEdit = (room: any) => {
    setEditingId(room.room_id)
    setEditRoomName(room.room_name)
    setEditRoomNumber(room.room_number)
    setEditCapacity(room.capacity)
  }

  // --- ฟังก์ชันบันทึกการแก้ไข (Update) ---
  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_id: id, 
          room_name: editRoomName.trim(), 
          room_number: editRoomNumber.trim(),
          capacity: editCapacity 
        })
      })
      const data = await res.json()
      if (res.ok) {
        setEditingId(null)
        fetchRooms()
      } else {
        alert(`แก้ไขไม่สำเร็จ: ${data.error}`)
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ API')
    }
  }

  const filteredRooms = rooms.filter(r => 
    r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen p-8 animate-fade-in bg-slate-50 text-black">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
      </button>

      <div className="max-w-5xl mx-auto space-y-10">
        <header>
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-white">
              <School size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">จัดการข้อมูลห้องเรียน</h1>
              <p className="text-slate-500 font-medium">ระบุรายละเอียดชื่อห้องและเลขที่ห้องให้ชัดเจน</p>
            </div>
          </div>
        </header>

        {/* 1. ฟอร์มเพิ่มห้องเรียน (Layout เดิมเป๊ะ) */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <h3 className="font-bold text-lg text-slate-800 border-b pb-4 flex items-center gap-2">
            <Save size={20} className="text-blue-600"/> เพิ่มห้องเรียนใหม่
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><School className="w-4 h-4 text-blue-500" /> ชื่อห้องเรียน</label>
              <input required type="text" placeholder="เช่น ห้องปฏิบัติการคอมพิวเตอร์" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Hash className="w-4 h-4 text-blue-500" /> เลขห้อง / รหัสห้อง</label>
              <input required type="text" placeholder="เช่น 401" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> ความจุผู้เรียน (ที่นั่ง)</label>
            <input required type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> บันทึกข้อมูลห้องเรียน</>}
          </button>
        </form>

        {/* 2. ตารางแสดงรายชื่อห้อง (Layout เดิมแต่ระบบใหม่) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">รายการห้องเรียนทั้งหมด ({rooms.length})</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="ค้นหาเลขห้องหรือชื่อห้อง..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-4">เลขห้อง</th>
                  <th className="px-8 py-4">ชื่อห้องเรียน</th>
                  <th className="px-8 py-4 text-center">ความจุ</th>
                  <th className="px-8 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((r) => (
                  <tr key={r.room_id} className={`transition-all ${editingId === r.room_id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                    {editingId === r.room_id ? (
                      // ✅ โหมดแก้ไข (Inline)
                      <>
                        <td className="px-8 py-4"><input className="w-24 p-2 border-2 border-blue-400 rounded-lg font-bold" value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} /></td>
                        <td className="px-8 py-4"><input className="w-full p-2 border-2 border-blue-400 rounded-lg font-bold" value={editRoomName} onChange={e => setEditRoomName(e.target.value)} /></td>
                        <td className="px-8 py-4 text-center"><input type="number" className="w-20 p-2 border-2 border-blue-400 rounded-lg text-center font-bold" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))} /></td>
                        <td className="px-8 py-4 text-right space-x-2">
                          <button onClick={() => handleUpdate(r.room_id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 shadow-md"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      // 👁️ โหมดแสดงผลปกติ
                      <>
                        <td className="px-8 py-4"><span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">{r.room_number}</span></td>
                        <td className="px-8 py-4 font-bold text-slate-700">{r.room_name}</td>
                        <td className="px-8 py-4 text-center text-slate-600 font-bold">{r.capacity} คน</td>
                        <td className="px-8 py-4 text-right space-x-1">
                          <button onClick={() => startEdit(r)} className="p-2.5 text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(r.room_id)} className="p-2.5 text-red-400 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
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