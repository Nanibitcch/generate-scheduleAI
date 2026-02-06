'use client'
import { useState, useEffect, useMemo } from 'react' // 🚩 เพิ่ม useMemo
import { useRouter } from 'next/navigation'
import { 
  Users, School, BookOpen, Play, ShieldCheck, 
  GraduationCap, ClipboardCheck, CheckCircle2, 
  BarChart3, Clock, ChevronDown, Calendar,
  LayoutDashboard, Settings, LogOut, Sparkles, Activity, Search,
  Link2, Zap, ArrowRight, Monitor, Loader2, User as UserIcon // 🚩 เพิ่ม UserIcon
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false) // 🚩 [INJECTED] ตัวแปรเช็คสิทธิ์
  const [userData, setUserData] = useState<any>(null) // 🚩 [INJECTED] เก็บข้อมูลผู้ใช้ที่ Login
  const [data, setData] = useState({
    teachers: 0, courses: 0, rooms: 0, groups: 0, enrollments: 0, groupList: []
  })
  
  const [selectedLevel, setSelectedLevel] = useState("ปวช.")
  const [selectedYear, setSelectedYear] = useState("1")
  const [selectedMajor, setSelectedMajor] = useState("")
  const [loading, setLoading] = useState(true)

  // 🚩 [INJECTED SECURITY LOGIC] เช็คการล็อคอิน
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/login')
    } else {
      setUserData(JSON.parse(user)) // 🚩 ดึงชื่อมาเก็บไว้โชว์
      setIsAuthorized(true)
    }
  }, [router]);

  // 🚩 [INJECTED LOGOUT LOGIC] ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const uniqueMajors = Array.from(new Set(data.groupList.map((g: any) => g.major))).filter(Boolean)

  // 🚩 [INJECTED LOGIC 1] ระบบเลือกสาขาอัตโนมัติเมื่อข้อมูลโหลดเสร็จ (กันตารางว่าง)
  useEffect(() => {
    if (!selectedMajor && uniqueMajors.length > 0) {
      setSelectedMajor(String(uniqueMajors[0]));
    }
  }, [uniqueMajors, selectedMajor]);

  // 🚩 [INJECTED LOGIC 2] ระบบ Debugger เพื่อดูว่าทำไม Filter แล้วไม่เจอ (ดูใน Console F12)
  useEffect(() => {
    if (data.groupList.length > 0) {
      console.log("--- DEBUG FILTER ---");
      console.log("ค่าที่มึงเลือกในหน้าจอ:", { selectedLevel, selectedYear, selectedMajor });
      console.log("ตัวอย่างข้อมูลใน DB:", data.groupList[0]);
    }
  }, [selectedLevel, selectedYear, selectedMajor, data.groupList]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true)
        const [statsRes, groupsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/enrollments') 
        ])
        const statsJson = await statsRes.json()
        const groupsJson = await groupsRes.json()
        
        if (!statsJson.error) {
          setData({ ...statsJson, groupList: groupsJson.groups || [] })
        }
      } catch (error) { console.error("Fetch error:", error) }
      finally { setLoading(false) }
    }
    if (isAuthorized) fetchHomeData() // ดึงข้อมูลเมื่อมีสิทธิ์เท่านั้น
  }, [isAuthorized])
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, groupsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/enrollments') 
      ])
      const statsJson = await statsRes.json()
      const groupsJson = await groupsRes.json()
      if (!statsJson.error) {
        setData({ ...statsJson, groupList: groupsJson.groups || [] })
      }
    } catch (error) { console.error("Fetch error:", error) }
    finally { setLoading(false) }
  }

  // 🚩 [INJECTED LOGIC 3] กรองข้อมูลแบบ "ถึก" (ล้างช่องว่าง + กันจุดหาย)
  const filteredGroups = useMemo(() => {
    return data.groupList.filter((g: any) => {
      const dbMajor = String(g.major || "").trim();
      const dbLevel = String(g.level || "").trim();
      const dbYear = String(g.academic_year || "").trim();

      const uiMajor = String(selectedMajor || "").trim();
      const uiLevel = String(selectedLevel || "").trim();
      const uiYear = String(selectedYear || "").trim();

      return (
        dbMajor === uiMajor && 
        dbLevel === uiLevel && 
        dbYear === uiYear
      );
    });
  }, [data.groupList, selectedMajor, selectedLevel, selectedYear]);

  // 🚩 [INJECTED RENDER GUARD] ป้องกันหน้าจอแวบ
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      
      {/* --- SIDEBAR MENU --- */}
      <aside className="w-72 bg-slate-900 min-h-screen flex flex-col p-6 text-white sticky top-0 shadow-2xl z-20 text-left">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20">AITC</div>
          <div>
            <h2 className="font-black leading-none text-lg italic tracking-tighter uppercase">Scheduler</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise v2.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-4 px-2 tracking-widest">Main Modules</p>
          
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-blue-600 shadow-lg shadow-blue-500/20 transition-all text-sm mb-4">
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button 
            onClick={() => router.push('/public-schedules')} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-emerald-400 hover:bg-emerald-400/10 border border-transparent hover:border-emerald-400/30 transition-all text-sm mb-4"
          >
            <Monitor size={18} /> ตารางาสอนออนไลน์
          </button>
          
          <button onClick={() => router.push('/teachers')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all text-sm">
            <Users size={18} /> อาจารย์
          </button>
          
          <button onClick={() => router.push('/rooms')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all text-sm">
            <School size={18} /> ห้องเรียน
          </button>
          
          <button onClick={() => router.push('/courses')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all text-sm">
            <BookOpen size={18} /> รายวิชา
          </button>

          <div className="py-2"><div className="h-[1px] bg-slate-800 mx-2"></div></div>

          <button onClick={() => router.push('/groups')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all text-sm">
            <GraduationCap size={18} /> จัดการกลุ่มเรียน
          </button>

          <button 
            onClick={() => router.push('/manage-groups')} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-amber-400 hover:bg-amber-400/10 border border-transparent hover:border-amber-400/30 transition-all text-sm"
          >
            <Link2 size={18} className="rotate-45" /> ตั้งค่าเรียนรวม (Rules)
          </button>

          <button onClick={() => router.push('/enrollments')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-blue-400 hover:bg-blue-500/10 transition-all text-sm">
            <ClipboardCheck size={18} /> มอบหมายงานสอน
          </button>
        </nav>
        
        {/* 🚩 [INJECTED] ส่วนแสดงโปรไฟล์ผู้ใช้ด้านล่าง Sidebar */}
        <div className="pt-4 pb-2 px-2 border-t border-slate-800 mb-2">
           <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                {userData?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate text-left">
                <p className="text-[11px] font-black text-white leading-none truncate mb-1">{userData?.name || 'Unknown User'}</p>
                <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">{userData?.role || 'Staff Member'}</p>
              </div>
           </div>
           <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 md:p-12 h-screen overflow-y-auto text-left">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              System <span className="text-blue-600">Overview</span>
            </h1>
            <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
              <Activity size={16} className="text-emerald-500" />
              จัดการตารางาสอนอัจฉริยะ Gemini AI | 2026 Enterprise
            </p>
          </div>
          
          {/* 🚩 [INJECTED] ส่วนแสดงชื่อผู้ใช้ด้านขวาบน */}
          <div className="flex items-center gap-4 bg-white p-3 px-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Signed in as</p>
                <p className="text-sm font-black text-slate-900 tracking-tighter">{userData?.name || 'User'}</p>
             </div>
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                <UserIcon size={20} />
             </div>
          </div>
        </header>

        {/* 1. Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-left">
          {[
            { label: 'อาจารย์', value: data.teachers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'รายวิชา', value: data.courses, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'ห้องเรียน', value: data.rooms, icon: School, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'กลุ่มเรียน', value: data.groups, icon: GraduationCap, color: 'text-teal-600', bg: 'bg-teal-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : stat.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 2. AI Action Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left mb-10">
          
          <div className="lg:col-span-2 relative bg-slate-900 rounded-[3.5rem] p-10 overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 blur-[120px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">AI Selection Hub</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-70">เลือกข้อมูลสาขาเพื่อแสดงรายการห้องเรียน</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest text-left block">Level</label>
                  <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-slate-800 text-white px-5 py-4 rounded-2xl border border-slate-700 outline-none focus:border-blue-500 font-bold transition-all appearance-none"
                  >
                    <option value="ปวช.">ปวช.</option>
                    <option value="ปวส.">ปวส.</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest text-left block">Year</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-slate-800 text-white px-5 py-4 rounded-2xl border border-slate-700 outline-none focus:border-blue-500 font-bold transition-all appearance-none"
                  >
                    <option value="1">ชั้นปีที่ 1</option>
                    <option value="2">ชั้นปีที่ 2</option>
                    <option value="3">ชั้นปีที่ 3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest text-left block">Major (สาขา)</label>
                  <select 
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                    className="w-full bg-slate-800 text-white px-5 py-4 rounded-2xl border border-slate-700 outline-none focus:border-blue-500 font-bold transition-all appearance-none"
                  >
                    <option value="">เลือกสาขาวิชา...</option>
                    {uniqueMajors.map((major: any, i) => (
                      <option key={i} value={major}>{major}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                   <Zap size={18} className="text-white fill-white" />
                </div>
                <p className="text-xs text-blue-200 font-medium leading-relaxed">
                  ระบบจะกรองข้อมูลห้องเรียนตามเงื่อนไขที่มึงเลือกด้านบน <br/>
                  <span className="font-black text-blue-400 uppercase tracking-tighter">กรุณาเลือกจัดตารางที่ห้องเรียนหลัก (Main Group) เท่านั้น</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col text-left">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 uppercase italic tracking-tighter">
                <BarChart3 className="w-6 h-6 text-blue-600" /> Data Validation
              </h3>
              <div className="space-y-4 flex-1">
                {[
                  { name: 'อาจารย์และห้องเรียน', status: data.teachers > 0 && data.rooms > 0 },
                  { name: 'โครงสร้างหลักสูตรวิชา', status: data.courses > 0 },
                  { name: 'การมอบหมายงานสอน', status: data.enrollments > 0 },
                  { name: 'กลุ่มเรียนรายสาขา', status: data.groups > 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                    {item.status ? (
                      <div className="bg-emerald-500 p-1 rounded-lg shadow-lg shadow-emerald-500/20"><CheckCircle2 size={14} className="text-white" /></div>
                    ) : (
                      <div className="bg-amber-500 p-1 rounded-lg shadow-lg shadow-amber-500/20"><Clock size={14} className="text-white" /></div>
                    )}
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* 🚩 3. รายการห้องเรียน (Single Group Selection Area) */}
        {selectedMajor && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Select Room to Schedule</h3>
              </div>
              <span className="text-xs font-black bg-slate-200 px-4 py-1.5 rounded-full text-slate-500 uppercase tracking-widest">
                {filteredGroups.length} Rooms Found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredGroups.map((group: any) => {
                // 🚩 Logic ใหม่สำหรับการตรวจสอบสถานะ Mapping
                const isMain = group.mapping_as_main && group.mapping_as_main.length > 0;
                const isSub = group.mapping_as_sub && group.mapping_as_sub.length > 0;
                
                // ดึงชื่อห้องย่อยทั้งหมด (กรณีเป็นห้องหลัก)
                const subGroups = group.mapping_as_main?.map((m: any) => m.sub_group?.group_name).filter(Boolean) || [];
                // ดึงชื่อห้องหลัก (กรณีเป็นห้องย่อย)
                const mainGroupName = group.mapping_as_sub?.[0]?.main_group?.group_name;

                return (
                  <div 
                    key={group.group_id} 
                    className={`group bg-white p-8 rounded-[3rem] border-2 transition-all duration-300 relative overflow-hidden ${
                      isSub ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10'
                    }`}
                  >
                    {/* Badge แสดงสถานะเรียนร่วม */}
                    {isMain && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Link2 size={12} className="rotate-45" /> Combined Mode
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Room Identity</p>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                        ROOM {group.group_name}
                      </h4>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-tight">Capacity</span>
                          <span className="font-black text-slate-900">{group.student_count || 0} Students</span>
                        </div>
                        
                        {/* 🚩 แสดงรายการห้องย่อย (ถ้าเราเป็นห้องหลัก) */}
                        {isMain && (
                          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                             <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Joined With:</p>
                             <div className="flex flex-wrap gap-2">
                               {subGroups.map((name: string) => (
                                 <span key={name} className="bg-white px-3 py-1 rounded-lg text-xs font-black text-blue-700 shadow-sm border border-blue-200">
                                   ROOM {name}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}

                        {/* 🚩 แจ้งเตือน (ถ้าเราเป็นห้องย่อย) */}
                        {isSub && (
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                             <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                               ⚠️ This room is joined to ROOM {mainGroupName}
                             </p>
                             <p className="text-[8px] font-bold text-slate-400 mt-1">กรุณาจัดตารางที่ห้องหลักเพื่อ Sync ข้อมูล</p>
                          </div>
                        )}
                    </div>

                    <button
                      disabled={isSub}
                      onClick={() => router.push(`/generate?groupId=${group.group_id}&groupName=${group.group_name}&level=${selectedLevel}&year=${selectedYear}&major=${selectedMajor}`)}
                      className={`w-full py-4 rounded-[1.5rem] font-black text-sm uppercase italic tracking-tighter transition-all flex items-center justify-center gap-2 ${
                        isSub 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-900 text-white hover:bg-blue-600 group-hover:scale-[1.02] active:scale-95 shadow-lg'
                      }`}
                    >
                      {isSub ? 'Auto Sync Only' : (
                        <>Run AI Generator <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}