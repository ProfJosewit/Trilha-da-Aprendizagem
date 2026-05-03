import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Student, cn } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Award, Medal } from 'lucide-react';

export default function Ranking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ordering by stars desc on the server.
    // We increase the limit to 1000 to ensure we capture more students for the grade filter.
    const q = query(collection(db, 'students'), orderBy('stars', 'desc'), limit(1000));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      
      // Secondary sort by trophies count client-side (since Firestore can't sort by array length directly)
      const sortedList = [...studentList].sort((a, b) => {
        if (b.stars !== a.stars) {
          return b.stars - a.stars;
        }
        return (b.trophies?.length || 0) - (a.trophies?.length || 0);
      });
      
      setStudents(sortedList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar ranking:", error);
      // Fallback: If stars desc requires an index that doesn't exist, it might fail.
      // In that case, we try without orderBy.
      const fallbackQuery = query(collection(db, 'students'), limit(1000));
      onSnapshot(fallbackQuery, (snapshot) => {
        const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        const sortedList = [...studentList].sort((a, b) => {
          if (b.stars !== a.stars) return b.stars - a.stars;
          return (b.trophies?.length || 0) - (a.trophies?.length || 0);
        });
        setStudents(sortedList);
        setLoading(false);
      });
    });
    
    return unsubscribe;
  }, []);

  const filteredStudents = students.filter(s => 
    gradeFilter === 'all' || s.grade?.trim() === gradeFilter
  );

  const uniqueGrades = (Array.from(new Set(students.map(s => s.grade?.trim()).filter(Boolean))) as string[]).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  if (loading) return <div className="text-center py-20">Carregando ranking...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-tech-cyan/20 text-tech-cyan rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.2)] border border-tech-cyan/30"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h1 className="text-6xl font-black text-white tracking-tighter font-display uppercase">Alunos Dedicados</h1>
        <p className="text-xl text-tech-magenta font-bold tracking-wide italic">"Quem ensina aprende ao ensinar e quem aprende ensina ao aprender."</p>
      </div>

      <div className="flex justify-center">
        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="px-6 py-3 rounded-2xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none font-black text-xs uppercase tracking-[0.2em] cursor-pointer shadow-lg hover:border-tech-cyan/30 transition-all"
        >
          <option value="all">Todas as Séries</option>
          {uniqueGrades.map(grade => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {filteredStudents.map((student, index) => {
            const isTop3 = index < 3;
            const rankColors = [
              "bg-gradient-to-br from-amber-300 to-amber-600 text-tech-bg shadow-[0_0_25px_rgba(251,191,36,0.5)]",
              "bg-gradient-to-br from-slate-200 to-slate-400 text-tech-bg shadow-[0_0_25px_rgba(226,232,240,0.5)]",
              "bg-gradient-to-br from-orange-400 to-orange-700 text-tech-bg shadow-[0_0_25px_rgba(249,115,22,0.5)]"
            ];

            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
                className={cn(
                  "glass-card p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-tech-cyan/50 transition-all",
                  isTop3 && "border-white/20 bg-white/5"
                )}
              >
                {/* Rank Number */}
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center font-black text-4xl shadow-lg font-display",
                  isTop3 ? rankColors[index] : "bg-tech-bg/50 text-slate-500 border border-white/5"
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="text-6xl w-24 h-24 bg-tech-bg/30 rounded-3xl flex items-center justify-center shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                  {student.avatar}
                </div>

                {/* Name & Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-black text-white font-display tracking-tight">
                      {student.name}
                    </h3>
                    {isTop3 && <Medal className={cn("w-8 h-8", index === 0 ? "text-amber-400" : index === 1 ? "text-slate-200" : "text-orange-400")} />}
                    {student.grade && (
                      <span className="px-3 py-1 rounded-xl bg-tech-cyan/10 text-tech-cyan text-[10px] font-black uppercase tracking-widest border border-tech-cyan/20">
                        {student.grade}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  {/* Trophies Count */}
                  <div className="flex items-center gap-4 bg-tech-magenta/10 px-8 py-5 rounded-3xl border border-tech-magenta/20 shadow-inner group-hover:bg-tech-magenta/20 transition-all">
                    <Trophy className="w-8 h-8 text-tech-magenta drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]" />
                    <span className="text-3xl font-black text-white font-display">{student.trophies?.length || 0}</span>
                  </div>
                  
                  {/* Stars Count */}
                  <div className="flex items-center gap-4 bg-tech-cyan/10 px-8 py-5 rounded-3xl border border-tech-cyan/20 shadow-inner group-hover:bg-tech-cyan/20 transition-all">
                    <Star className="w-8 h-8 text-tech-cyan fill-current drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                    <span className="text-3xl font-black text-white font-display">{student.stars}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredStudents.length === 0 && (
          <div className="text-center py-20 glass-card rounded-[2.5rem] border-2 border-dashed border-white/5">
            <p className="text-slate-500 font-bold italic">Nenhum aluno no ranking para esta série.</p>
          </div>
        )}
      </div>
    </div>
  );
}
