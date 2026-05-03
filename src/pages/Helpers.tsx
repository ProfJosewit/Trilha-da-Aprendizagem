import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, Student, cn } from '../App';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Award, Search, Users, ChevronRight, ListOrdered, Trash2, LayoutGrid, Star, Trophy, XCircle, Send, ArrowUp, ArrowDown } from 'lucide-react';

export default function Helpers() {
  const { isTeacher } = useAuth();
  const [helpers, setHelpers] = useState<Student[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    // We listen to all students because we need to know who is and who isn't a helper
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setHelpers(all.filter(s => s.isHelper).sort((a, b) => (a.helperOrder ?? 0) - (b.helperOrder ?? 0)));
    });
    return unsubscribe;
  }, []);

  const handleBulkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    try {
      const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
      const snapshot = await getDocs(collection(db, 'students'));
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      const batch = writeBatch(db);
      let foundCount = 0;
      const notFound: string[] = [];

      // HELPER: Normalize string for comparison (remove accents, lowercase, trim)
      const normalize = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      // 1. Reset ONLY students who are currently helpers to save writes
      const currentHelpers = allStudents.filter(s => s.isHelper);
      currentHelpers.forEach(s => {
        batch.update(doc(db, 'students', s.id), { 
          isHelper: false,
          helperOrder: 999 
        });
      });

      // 2. Assign new helpers based on names and grades in list
      lines.forEach((line, index) => {
        const [namePart, gradePart] = line.split(',').map(s => s.trim());
        if (!namePart) return;

        const normalizedInputName = normalize(namePart);
        
        // Find by exact match first, then by normalized match
        const student = allStudents.find(s => normalize(s.name) === normalizedInputName);
        
        if (student) {
          const updateData: any = {
            isHelper: true,
            helperOrder: index
          };
          
          if (gradePart) {
            updateData.grade = gradePart;
          }

          batch.update(doc(db, 'students', student.id), updateData);
          foundCount++;
        } else {
          notFound.push(namePart);
        }
      });

      await batch.commit();

      if (notFound.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Organizado ${foundCount} ajudantes. Os seguintes nomes não foram encontrados: ${notFound.join(', ')}` 
        });
      } else {
        setStatus({ 
          type: 'success', 
          message: `${foundCount} ajudantes organizados com sucesso!` 
        });
        setBulkInput('');
        setIsBulkMode(false);
      }
      
      setTimeout(() => setStatus(null), 8000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Erro ao processar lista no banco de dados.' });
    }
  };

  const moveHelper = async (studentId: string, direction: 'up' | 'down') => {
    const idx = helpers.findIndex(h => h.id === studentId);
    if (idx === -1) return;
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= helpers.length) return;

    const current = helpers[idx];
    const neighbor = helpers[newIdx];

    const batch = writeBatch(db);
    batch.update(doc(db, 'students', current.id), { helperOrder: newIdx });
    batch.update(doc(db, 'students', neighbor.id), { helperOrder: idx });
    await batch.commit();
  };

  const removeHelper = async (studentId: string) => {
    await updateDoc(doc(db, 'students', studentId), {
      isHelper: false,
      helperOrder: 999
    });
  };

  const helpersByGrade = helpers.reduce((acc, curr) => {
    const grade = curr.grade || 'Indefinida';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(curr);
    return acc;
  }, {} as Record<string, Student[]>);

  const sortedGrades = Object.keys(helpersByGrade).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <section className="text-center space-y-6 pt-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-tech-magenta/10 rounded-[2.5rem] flex items-center justify-center text-tech-magenta mx-auto shadow-[0_0_40px_rgba(244,114,182,0.2)] border-2 border-tech-magenta/20 transform rotate-12"
        >
          <Award className="w-12 h-12" />
        </motion.div>
        
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white font-display uppercase tracking-tight"
          >
            Alunos <span className="text-tech-magenta">Ajudantes</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs"
          >
            Liderança e Cooperação na Trilha
          </motion.p>
        </div>

        {/* Teacher Controls: Bulk Order */}
        {isTeacher && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mt-12 glass-card p-8 rounded-[2.5rem] border-tech-magenta/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <ListOrdered className="text-tech-magenta w-6 h-6" />
                <h3 className="text-white font-black uppercase text-sm tracking-widest leading-none">Definir Lista e Ordem</h3>
              </div>
              <button 
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-[10px] font-black uppercase tracking-widest text-tech-magenta hover:text-white transition-colors"
                id="toggle-bulk-helpers"
              >
                {isBulkMode ? 'Cancelar' : 'Abrir Editor de Lista'}
              </button>
            </div>

            {status && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={cn(
                  "mb-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                  status.type === 'success' ? "bg-tech-magenta/10 text-tech-magenta border border-tech-magenta/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
                )}
              >
                {status.type === 'success' ? <Award className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {status.message}
              </motion.div>
            )}

            <AnimatePresence>
              {isBulkMode && (
                <motion.form 
                  onSubmit={handleBulkOrder}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <p className="text-left text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Format: <span className="text-tech-magenta">Nome, Série</span> (ex: João Silva, 5º Ano A) <br/>
                    A ordem na lista será a mesma em que os nomes aparecem aqui.
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={"João Silva, 5º Ano A\nMaria Oliveira, 6º Ano B\nPedro Santos, 4º Ano C"}
                    className="w-full h-48 px-4 py-3 rounded-2xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-magenta outline-none font-mono text-sm resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-tech-magenta text-tech-bg py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg shadow-tech-magenta/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Aplicar Nova Ordem
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Main List */}
      <section className="max-w-6xl mx-auto px-4">
        {helpers.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[3rem] border-2 border-dashed border-white/5">
            <Users className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
            <p className="text-slate-500 font-black italic uppercase tracking-widest text-xs">Nenhum ajudante escalado no momento.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedGrades.map((grade, gradeIdx) => (
              <motion.div
                key={grade}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gradeIdx * 0.1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-tech-cyan/10 rounded-xl flex items-center justify-center text-tech-cyan border border-tech-cyan/20">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">{grade}</h2>
                  </div>
                  <span className="text-xs font-black text-tech-magenta bg-tech-magenta/10 px-4 py-2 rounded-full border border-tech-magenta/20 tracking-widest">
                    {helpersByGrade[grade].length} {helpersByGrade[grade].length === 1 ? 'LÍDER' : 'LÍDERES'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {helpersByGrade[grade].map((helper, idx) => (
                    <motion.div
                      key={helper.id}
                      whileHover={{ y: -5 }}
                      layout
                      className="glass-card p-6 rounded-[2.5rem] border-white/5 relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-tech-magenta/5 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500" />
                      
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-tech-bg/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10 group-hover:border-tech-magenta/30 transition-colors shrink-0">
                          {helper.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-white font-display uppercase tracking-tight truncate leading-tight">
                            {helper.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-tech-magenta animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ajudante #{idx + 1}</span>
                          </div>
                        </div>
                        
                        {isTeacher && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveHelper(helper.id, 'up')}
                              className="p-1.5 text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors border border-transparent hover:border-tech-cyan/20"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveHelper(helper.id, 'down')}
                              className="p-1.5 text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors border border-transparent hover:border-tech-cyan/20"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeHelper(helper.id)}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-tech-cyan fill-current" />
                          <span className="text-xs font-black text-tech-cyan">{helper.stars}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Trophy className="w-3.5 h-3.5" />
                            <span className="text-xs font-black">{helper.trophies.length}</span>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-tech-magenta group-hover:bg-tech-magenta/10 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
