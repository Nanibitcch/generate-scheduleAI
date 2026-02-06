'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Loader2, ArrowRight, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log("🚀 กำลังส่งข้อมูลไปที่ API:", { username, password }); // 🚩 DEBUG 1

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' // 🚩 มั่นใจว่า API อ่าน JSON ออก
        },
        body: JSON.stringify({ username, password }),
      })
      
      console.log("📡 API ตอบกลับมาด้วย Status:", res.status); // 🚩 DEBUG 2

      const data = await res.json()

      if (res.ok) {
        console.log("✅ ล็อคอินผ่าน! ข้อมูล User:", data.user);
        // 🚩 เก็บข้อมูลลง localStorage เพื่อใช้โชว์ชื่อในหน้า Dashboard
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/') 
      } else {
        console.error("❌ ล็อคอินไม่ผ่าน:", data.error);
        alert(data.error || "รหัสผ่านไม่ถูกต้องนะไอ้สอง!")
      }
    } catch (err) {
      console.error("🔥 ระบบพังที่ฝั่ง Fetch:", err);
      alert("ระบบหลอนว่ะ เช็คใน Console (F12) ดูซิ!");
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-black">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-white relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600 rounded-full opacity-10"></div>
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-200 rotate-3">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">AITC Scheduler</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Staff Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest text-left block">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="กรอกชื่อผู้ใช้" 
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 transition-all font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest text-left block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                placeholder="กรอกรหัสผ่าน" 
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-blue-500 transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 p-5 bg-slate-900 text-white rounded-2xl font-black text-lg uppercase flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login Now <ArrowRight size={20} /></>}
          </button>
        </form>

        {/* 🚩 [ADDED] ปุ่ม Register สำหรับคนยังไม่มีไอดี */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ยังไม่มีบัญชีผู้ใช้งาน?</p>
          <button 
            onClick={() => router.push('/register')}
            className="w-full p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
          >
            <UserPlus size={18} /> Create New Account
          </button>
        </div>

        <p className="mt-8 text-center text-slate-300 text-[9px] font-bold uppercase tracking-widest">
          © 2026 AITC IT SOLUTIONS
        </p>
      </div>
    </div>
  )
}