import React, { useState, useEffect } from 'react';
import { useAuth, Student, Suggestion, TROPHIES, AVATARS, cn } from '../App';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, MessageSquare, Send, CheckCircle, XCircle, UserIcon, Award, Sparkles, GraduationCap } from 'lucide-react';

export default function StudentDashboard() {
  const { user, loginStudent } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'student' && user.email) {
      const q = query(collection(db, 'students'), where('email', '==', user.email));
      const unsubStudent = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setStudent({ id: doc.id, ...doc.data() } as Student);
        } else {
          setStudent(null);
        }
        setLoading(false);
      });

      const qSug = query(collection(db, 'suggestions'), where('studentEmail', '==', user.email));
      const unsubSug = onSnapshot(qSug, (snapshot) => {
        setSuggestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion)));
      });

      return () => {
        unsubStudent();
        unsubSug();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await loginStudent(loginEmail);
    if (!success) {
      setError('E-mail não encontrado. Peça ao professor para te cadastrar!');
    }
  };

  const updateAvatar = async (avatar: string) => {
    if (student) {
      await updateDoc(doc(db, 'students', student.id), { avatar });
      setShowAvatarPicker(false);
    }
  };

  const sendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion || !student) return;
    await addDoc(collection(db, 'suggestions'), {
      studentEmail: student.email,
      studentName: student.name,
      text: newSuggestion,
      feedback: '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setNewSuggestion('');
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 glass-card rounded-[3rem] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-cyan/5 rounded-full blur-2xl -z-10" />
        <div className="w-24 h-24 bg-tech-magenta/10 rounded-[2rem] flex items-center justify-center text-tech-magenta mb-8 mx-auto shadow-[0_0_20px_rgba(244,114,182,0.2)] border border-tech-magenta/20">
          <GraduationCap className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 font-display uppercase tracking-tight">Área do Aluno</h2>
        <p className="text-slate-400 mb-10 font-medium">Inicie sua jornada para acessar sua trilha.</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="block text-xs font-black text-tech-magenta uppercase tracking-widest mb-2 ml-2">Seu E-mail</label>
            <input
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="seu.email@escola.com"
              className="w-full px-5 py-4 rounded-2xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-magenta outline-none font-medium transition-all"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-tech-magenta text-tech-bg rounded-2xl font-black hover:bg-white transition-all shadow-lg shadow-tech-magenta/20 uppercase tracking-widest text-xs"
          >
            Acessar Trilha
          </button>
        </form>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-4 border-tech-cyan border-t-transparent rounded-full"
      />
    </div>
  );

  if (!student) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 glass-card rounded-[3rem] text-center border-red-500/20">
        <div className="w-24 h-24 bg-red-400/10 rounded-[2rem] flex items-center justify-center text-red-400 mb-8 mx-auto border border-red-400/20 shadow-[0_0_20px_rgba(248,113,113,0.2)]">
          <XCircle className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 font-display uppercase tracking-tight">Sinal não Encontrado</h2>
        <p className="text-slate-400 mb-8 font-medium">
          O e-mail <span className="text-tech-cyan font-black">{user.email}</span> não está na lista de alunos. 
          Peça ao <span className="text-tech-magenta font-black">Professor</span> para te adicionar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header / Profile */}
      <section className="glass-card p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tech-cyan/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-tech-magenta/5 rounded-full blur-3xl -z-10" />
        
        <div className="relative group">
          <div className="text-8xl w-40 h-40 bg-tech-bg/50 rounded-[2.5rem] flex items-center justify-center shadow-inner border-2 border-white/10 group-hover:scale-105 transition-transform">
            {student.avatar}
          </div>
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="absolute -bottom-2 -right-2 p-4 bg-tech-cyan text-tech-bg rounded-2xl shadow-lg hover:bg-white transition-all shadow-tech-cyan/30"
          >
            <Sparkles className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2">
            <h2 className="text-6xl font-black text-white font-display uppercase tracking-tight leading-none">{student.name}</h2>
            {student.grade && (
              <span className="px-4 py-1 rounded-xl bg-tech-cyan/10 text-tech-cyan text-xs font-black uppercase tracking-widest border border-tech-cyan/20 mb-1">
                {student.grade}
              </span>
            )}
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-8">{student.email}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-8">
            <div className="flex items-center gap-5 bg-tech-cyan/10 px-10 py-6 rounded-3xl border border-tech-cyan/20 shadow-inner">
              <Star className="w-10 h-10 text-tech-cyan fill-current drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
              <div>
                <span className="block text-4xl font-black text-white font-display leading-none">{student.stars}</span>
                <span className="text-[10px] font-black text-tech-cyan uppercase tracking-[0.2em]">Estrelas</span>
              </div>
            </div>
            <div className="flex items-center gap-5 bg-tech-magenta/10 px-10 py-6 rounded-3xl border border-tech-magenta/20 shadow-inner">
              <Trophy className="w-10 h-10 text-tech-magenta drop-shadow-[0_0_12px_rgba(244,114,182,0.7)]" />
              <div>
                <span className="block text-4xl font-black text-white font-display leading-none">{student.trophies.length}</span>
                <span className="text-[10px] font-black text-tech-magenta uppercase tracking-[0.2em]">Troféus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-8 rounded-[2.5rem] border-tech-cyan/30"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">Escolha seu Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => updateAvatar(a)}
                  className={cn(
                    "text-3xl w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:scale-125 hover:bg-white/10",
                    student.avatar === a ? "bg-tech-cyan/20 ring-2 ring-tech-cyan" : "bg-white/5"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trophies Section */}
      <section className="glass-card p-10 rounded-[3rem]">
        <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-4 font-display uppercase tracking-tight">
          <Award className="w-8 h-8 text-tech-magenta" /> Galeria de Conquistas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {TROPHIES.map(t => {
            const hasTrophy = student.trophies.includes(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-4",
                  hasTrophy 
                    ? "bg-tech-cyan/5 border-tech-cyan/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
                    : "bg-white/5 border-white/5 opacity-30 grayscale"
                )}
              >
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mb-2",
                  hasTrophy ? "bg-tech-cyan/10 text-tech-cyan" : "bg-slate-800 text-slate-600"
                )}>
                  <Trophy className="w-10 h-10" />
                </div>
                <h4 className={cn("font-black text-xs leading-tight uppercase tracking-tight", hasTrophy ? "text-white" : "text-slate-500")}>
                  {t.name}
                </h4>
                <p className="text-[10px] text-slate-500 leading-tight font-bold">{t.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Suggestions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="glass-card p-10 rounded-[3rem]">
          <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4 font-display uppercase tracking-tight">
            <MessageSquare className="w-8 h-8 text-tech-magenta" /> Sugestões para o Professor
          </h3>
          <form onSubmit={sendSuggestion} className="space-y-6">
            <textarea
              value={newSuggestion}
              onChange={e => setNewSuggestion(e.target.value)}
              placeholder="Qual sua próxima grande ideia?"
              className="w-full h-40 px-6 py-6 rounded-[2rem] bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-magenta outline-none resize-none font-medium"
              required
            />
            <button
              type="submit"
              className="w-full py-5 bg-tech-magenta text-tech-bg rounded-2xl font-black hover:bg-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-tech-magenta/20 uppercase tracking-widest text-sm"
            >
              <Send className="w-6 h-6" /> Enviar Mensagem
            </button>
          </form>
        </section>

        <section className="glass-card p-10 rounded-[3rem]">
          <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4 font-display uppercase tracking-tight">
            <CheckCircle className="w-8 h-8 text-tech-cyan" /> Respostas do Professor
          </h3>
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            {suggestions.length === 0 ? (
              <p className="text-center text-slate-500 py-16 font-black uppercase tracking-widest text-xs italic">Nenhuma resposta recebida.</p>
            ) : (
              suggestions.map(s => (
                <div key={s.id} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                  <p className="text-slate-400 text-sm mb-6 italic font-medium leading-relaxed">"{s.text}"</p>
                  {s.status === 'answered' ? (
                    <div className="bg-tech-bg/50 p-6 rounded-2xl border border-tech-cyan/20 shadow-inner">
                      <p className="text-[10px] font-black text-tech-cyan uppercase tracking-[0.3em] mb-3">Resposta do Professor:</p>
                      <p className="text-white font-bold leading-relaxed">{s.feedback}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] flex items-center gap-3 animate-pulse">
                      <Sparkles className="w-4 h-4" /> Aguardando resposta...
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
