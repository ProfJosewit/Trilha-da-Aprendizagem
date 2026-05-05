import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Student, cn } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Award } from 'lucide-react';

export default function Ranking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ordering by name alphabetical to remove the "ranking" competitive feel.
    const q = query(collection(db, 'students'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar alunos:", error);
      // Fallback
      const fallbackQuery = query(collection(db, 'students'));
      onSnapshot(fallbackQuery, (snapshot) => {
        const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(studentList.sort((a, b) => a.name.localeCompare(b.name)));
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

  if (loading) return <div className="text-center py-20">Carregando lista de alunos...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-tech-magenta/20 text-tech-magenta rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,114,182,0.2)] border border-tech-magenta/30"
        >
          <Award className="w-12 h-12" />
        </motion.div>
        <h1 className="text-6xl font-black text-white tracking-tighter font-display uppercase">Galeria de Alunos</h1>
        <p className="text-xl text-tech-cyan font-bold tracking-wide italic">"Quem ensina aprende ao ensinar e quem aprende ensina ao aprender."</p>
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
                className="glass-card p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-tech-cyan/50 transition-all border-white/5 bg-white/5"
              >
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
                    {student.grade && (
                      <span className="px-3 py-1 rounded-xl bg-tech-cyan/10 text-tech-cyan text-[10px] font-black uppercase tracking-widest border border-tech-cyan/20">
                        {student.grade}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  {/* Stars Count */}
                  <div className="flex items-center gap-4 bg-tech-cyan/10 px-8 py-5 rounded-3xl border border-tech-cyan/20 shadow-inner group-hover:bg-tech-cyan/20 transition-all">
                    <Star className="w-8 h-8 text-tech-cyan fill-current drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                    <div>
                      <span className="block text-3xl font-black text-white font-display leading-none">{student.stars || 0}</span>
                      <span className="text-[8px] font-black text-tech-cyan uppercase tracking-widest">Energia</span>
                    </div>
                  </div>

                  {/* Trophies Count */}
                  <div className="flex items-center gap-4 bg-tech-magenta/10 px-8 py-5 rounded-3xl border border-tech-magenta/20 shadow-inner group-hover:bg-tech-magenta/20 transition-all">
                    <Trophy className="w-8 h-8 text-tech-magenta drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]" />
                    <div>
                      <span className="block text-3xl font-black text-white font-display leading-none">{student.trophies?.length || 0}</span>
                      <span className="text-[8px] font-black text-tech-magenta uppercase tracking-widest">Conquistas</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredStudents.length === 0 && (
          <div className="text-center py-20 glass-card rounded-[2.5rem] border-2 border-dashed border-white/5">
            <p className="text-slate-500 font-bold italic">Nenhum aluno encontrado para esta série.</p>
          </div>
        )}
      </div>
    </div>
  );
}
