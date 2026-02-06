'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Loader2, ArrowRight, UserPlus, Mail } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password }),
      })
      
      const data = await res.json()

      if (res.ok) {
        alert("สมัครสมาชิกสำเร็จแล้วไอ้สอง! ไปล็อคอินซะ")
        router.push('/login')
      } else {
        alert(data.error || "สมัครไม่สำเร็จว่ะ ลองดูใหม่อีกที")
      }
    } catch (err) {
      alert("ระบบสมัครหลอนว่ะ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-black">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-white relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-600 rounded-full opacity-10"></div>
        
        <div className="text-center mb-10 text-left">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-200 -rotate-3">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Join AITC</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Create New Staff Account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" placeholder="ชื่อ-นามสกุล" 
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-emerald-500 transition-all font-bold"
                value={name} onChange={(e) => setName(e.target.value)} required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" placeholder="ไอดีผู้ใช้" 
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-emerald-500 transition-all font-bold"
                value={username} onChange={(e) => setUsername(e.target.value)} required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" placeholder="รหัสผ่าน" 
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-emerald-500 transition-all font-bold"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-6 p-5 bg-emerald-500 text-white rounded-2xl font-black text-lg uppercase flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Sign Up Now <ArrowRight size={20} /></>}
          </button>
        </form>

        <button 
          onClick={() => router.push('/login')}
          className="w-full mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
        >
          Have an account? <span className="underline">Login here</span>
        </button>
      </div>
    </div>
  )
}