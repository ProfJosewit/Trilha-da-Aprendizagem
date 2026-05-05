import React, { useState, useEffect } from 'react';
import { useAuth, Student, Suggestion, TROPHIES, cn } from '../App';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Star, Trophy, MessageSquare, CheckCircle, XCircle, UserPlus, Search, ChevronRight, Award, Users } from 'lucide-react';

export default function TeacherDashboard() {
  const { user, isTeacher, loginTeacher, logout } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', grade: '' });
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ id: string | 'all'; type: 'student' | 'suggestion' | 'all_students' | 'all_suggestions' } | null>(null);
  const [bulkStatus, setBulkStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isTeacher) {
      const unsubStudents = onSnapshot(query(collection(db, 'students'), orderBy('name')), (snapshot) => {
        setStudents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      });
      const unsubSuggestions = onSnapshot(query(collection(db, 'suggestions'), orderBy('createdAt', 'desc')), (snapshot) => {
        setSuggestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion)));
      });
      return () => {
        unsubStudents();
        unsubSuggestions();
      };
    }
  }, [isTeacher]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginTeacher(loginForm.username, loginForm.password);
    if (!success) {
      setError('Credenciais incorretas.');
    } else {
      setError('');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 glass-card rounded-[3rem] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-cyan/5 rounded-full blur-2xl -z-10" />
        <div className="w-24 h-24 bg-tech-cyan/10 rounded-[2rem] flex items-center justify-center text-tech-cyan mb-8 mx-auto shadow-[0_0_20px_rgba(34,211,238,0.2)] border border-tech-cyan/20">
          <Users className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 font-display uppercase tracking-tight">Acesso Professor</h2>
        <p className="text-slate-400 mb-10 font-medium">Identifique-se para gerenciar a trilha.</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="block text-xs font-black text-tech-cyan uppercase tracking-widest mb-2 ml-2">Usuário</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none font-medium transition-all"
              required
            />
          </div>
          <div className="text-left">
            <label className="block text-xs font-black text-tech-cyan uppercase tracking-widest mb-2 ml-2">Senha</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none font-medium transition-all"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-tech-cyan text-tech-bg rounded-2xl font-black hover:bg-white transition-all shadow-lg shadow-tech-cyan/20 uppercase tracking-widest text-xs"
          >
            Entrar no Comando
          </button>
        </form>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-600">Acesso Restrito</h2>
        <p className="text-slate-600 mt-2">Apenas o professor pode acessar esta área.</p>
        <button onClick={logout} className="mt-4 text-indigo-600 font-bold underline">Sair e tentar novamente</button>
      </div>
    );
  }

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) return;
    await addDoc(collection(db, 'students'), {
      ...newStudent,
      grade: newStudent.grade.trim(),
      avatar: '🙂',
      stars: 0,
      trophies: []
    });
    setNewStudent({ name: '', email: '', grade: '' });
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, 'students', id));
    setShowConfirmDelete(null);
  };

  const deleteAllStudents = async () => {
    const batch = students.map(s => deleteDoc(doc(db, 'students', s.id)));
    await Promise.all(batch);
    setShowConfirmDelete(null);
    setBulkStatus({ type: 'success', message: 'Todos os alunos foram removidos.' });
    setTimeout(() => setBulkStatus(null), 3000);
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n');
    let addedCount = 0;

    try {
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(/[,;\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          const name = parts[0];
          const email = parts[1];
          const grade = parts[2] || newStudent.grade.trim();
          
          if (name && email) {
            await addDoc(collection(db, 'students'), {
              name,
              email,
              grade,
              avatar: '🙂',
              stars: 0,
              trophies: []
            });
            addedCount++;
          }
        }
      }

      if (addedCount > 0) {
        setBulkInput('');
        setIsBulkMode(false);
        setBulkStatus({ type: 'success', message: `${addedCount} alunos adicionados com sucesso!` });
        setTimeout(() => setBulkStatus(null), 3000);
      } else {
        setBulkStatus({ type: 'error', message: 'Nenhum aluno válido encontrado. Use o formato: Nome, Email' });
      }
    } catch (err) {
      setBulkStatus({ type: 'error', message: 'Erro ao processar lista. Verifique o formato.' });
    }
  };

  const deleteSuggestion = async (id: string) => {
    await deleteDoc(doc(db, 'suggestions', id));
    setShowConfirmDelete(null);
  };

  const deleteAllSuggestions = async () => {
    const batch = suggestions.map(s => deleteDoc(doc(db, 'suggestions', s.id)));
    await Promise.all(batch);
    setShowConfirmDelete(null);
    setBulkStatus({ type: 'success', message: 'Todas as mensagens foram removidas.' });
    setTimeout(() => setBulkStatus(null), 3000);
  };

  const updateStars = async (id: string, current: number, delta: number) => {
    await updateDoc(doc(db, 'students', id), {
      stars: Math.max(0, current + delta)
    });
  };

  const updateGrade = async (id: string, newGrade: string) => {
    await updateDoc(doc(db, 'students', id), {
      grade: newGrade.trim()
    });
  };

  const toggleTrophy = async (student: Student, trophyId: string) => {
    try {
      const currentTrophies = student.trophies || [];
      const hasTrophy = Array.isArray(currentTrophies) && currentTrophies.includes(trophyId);
      
      await updateDoc(doc(db, 'students', student.id), {
        trophies: hasTrophy ? arrayRemove(trophyId) : arrayUnion(trophyId)
      });
    } catch (err) {
      console.error("Error toggling trophy:", err);
      setBulkStatus({ type: 'error', message: 'Erro ao atualizar conquista. Verifique sua conexão.' });
      setTimeout(() => setBulkStatus(null), 3000);
    }
  };

  const handleFeedback = async (suggestion: Suggestion, feedback: string) => {
    try {
      await updateDoc(doc(db, 'suggestions', suggestion.id), {
        feedback,
        status: 'answered'
      });
    } catch (err) {
      console.error("Error updating feedback:", err);
    }
  };

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(searchLower) || 
                         s.email.toLowerCase().includes(searchLower) ||
                         (s.grade?.toLowerCase().includes(searchLower));
    const matchesGrade = gradeFilter === 'all' || s.grade?.trim() === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const uniqueGrades = (Array.from(new Set(students.map(s => s.grade?.trim()).filter(Boolean))) as string[]).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div className="space-y-12">
      {/* Add Student Section */}
      <section className="glass-card p-8 rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tech-cyan/10 text-tech-cyan rounded-lg">
              <UserPlus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">
              {isBulkMode ? 'Adicionar em Massa' : 'Adicionar Novo Aluno'}
            </h2>
          </div>
          <button 
            onClick={() => setIsBulkMode(!isBulkMode)}
            className="text-[10px] font-black text-tech-cyan uppercase tracking-widest hover:underline"
          >
            {isBulkMode ? 'Voltar para Simples' : 'Modo em Massa (CSV)'}
          </button>
        </div>

        {bulkStatus && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              "mb-4 p-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2",
              bulkStatus.type === 'success' ? "bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
            )}
          >
            {bulkStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {bulkStatus.message}
          </motion.div>
        )}

        {isBulkMode ? (
          <form onSubmit={handleBulkAdd} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <p className="flex-1 text-xs text-slate-500 font-bold">
                Cole uma lista de alunos (um por linha) no formato: <span className="text-tech-cyan">Nome, Email, Série (opcional)</span>
              </p>
              <div className="flex items-center gap-2 bg-tech-bg/50 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                <span className="text-[10px] font-black text-tech-cyan uppercase tracking-widest">Série Padrão:</span>
                <input
                  type="text"
                  placeholder="Ex: 5º B"
                  value={newStudent.grade}
                  onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}
                  className="w-24 bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none focus:text-tech-cyan"
                />
              </div>
            </div>
            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              placeholder="Exemplo:&#10;João Silva, joao@email.com&#10;Maria Santos, maria@email.com"
              className="w-full h-32 px-4 py-3 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none font-mono text-sm resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-tech-cyan text-tech-bg py-4 rounded-xl font-black hover:bg-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-tech-cyan/20"
            >
              <Plus className="w-5 h-5" /> Processar e Adicionar Tripulação
            </button>
          </form>
        ) : (
          <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Nome Completo"
              value={newStudent.name}
              onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
              className="px-4 py-3 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email do Aluno"
              value={newStudent.email}
              onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
              className="px-4 py-3 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none"
              required
            />
            <input
              type="text"
              placeholder="Série (Ex: 5º Ano)"
              value={newStudent.grade}
              onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}
              className="px-4 py-3 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none"
            />
            <button
              type="submit"
              className="bg-tech-cyan text-tech-bg py-3 rounded-xl font-black hover:bg-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              <Plus className="w-5 h-5" /> Adicionar
            </button>
          </form>
        )}
      </section>

      {/* Students List Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tech-magenta/10 text-tech-magenta rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">Gerenciar Alunos</h2>
            {students.length > 0 && (
              <button
                onClick={() => setShowConfirmDelete({ id: 'all', type: 'all_students' })}
                className="ml-2 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                title="Excluir todos os alunos"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir Todos</span>
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none w-full md:w-64"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none font-bold text-xs uppercase tracking-widest cursor-pointer"
            >
              <option value="all">Todas as Séries</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {filteredStudents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/5"
              >
                <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[10px]">Nenhum explorador encontrado...</p>
              </motion.div>
            ) : (
              filteredStudents.map(student => (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 rounded-[2rem] flex flex-col lg:flex-row gap-8 hover:border-tech-cyan/30 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-6 min-w-[300px]">
                    <div className="text-4xl w-20 h-20 bg-tech-bg/50 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 shrink-0">
                      {student.avatar}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-black text-xl text-white font-display uppercase tracking-tight leading-tight">{student.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-tech-cyan uppercase tracking-widest">Série:</span>
                        <input
                          type="text"
                          defaultValue={student.grade || ''}
                          placeholder="Ex: 5º B"
                          onBlur={(e) => updateGrade(student.id, e.target.value)}
                          className="w-24 px-2 py-1 rounded-lg bg-tech-cyan/5 text-tech-cyan text-[10px] font-black uppercase tracking-widest border border-tech-cyan/20 focus:bg-tech-cyan/10 focus:ring-1 focus:ring-tech-cyan outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1">{student.email}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-tech-cyan font-black">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{student.stars || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-tech-magenta font-black">
                          <Trophy className="w-4 h-4" />
                          <span className="text-sm">{Array.isArray(student.trophies) ? student.trophies.length : 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-6">
                    {/* Stars Control */}
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Energia:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStars(student.id, student.stars || 0, -1)}
                          className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-center font-black text-xl border border-white/10"
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateStars(student.id, student.stars || 0, 1)}
                          className="w-10 h-10 rounded-xl bg-tech-cyan/10 text-tech-cyan hover:bg-tech-cyan/20 transition-colors flex items-center justify-center font-black text-xl border border-tech-cyan/20"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Trophies Grid */}
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Módulos de Conquista:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                        {TROPHIES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => toggleTrophy(student, t.id)}
                            title={t.description}
                            className={cn(
                              "p-2 text-[9px] font-black rounded-xl border transition-all text-center leading-tight h-16 flex flex-col items-center justify-center gap-1 uppercase tracking-tighter",
                              Array.isArray(student.trophies) && student.trophies.includes(t.id)
                                ? "bg-tech-cyan text-tech-bg border-tech-cyan shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                : "bg-white/5 text-slate-500 border-white/5 hover:border-tech-cyan/30"
                            )}
                          >
                            <Award className={cn("w-4 h-4", Array.isArray(student.trophies) && student.trophies.includes(t.id) ? "text-tech-bg" : "text-slate-600")} />
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="flex items-start justify-end">
                    <button
                      onClick={() => setShowConfirmDelete({ id: student.id, type: 'student' })}
                      className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Suggestions Section */}
      <section className="glass-card p-8 rounded-[2rem]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tech-magenta/10 text-tech-magenta rounded-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">Comunicações da Tripulação</h2>
          </div>
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete({ id: 'all', type: 'all_suggestions' })}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              title="Excluir todas as mensagens"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir Todas</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <p className="text-center text-slate-500 py-8 font-bold italic">Nenhum sinal recebido da base.</p>
          ) : (
            suggestions.map(s => (
              <div key={s.id} className="p-6 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-white font-display uppercase tracking-tight">{s.studentName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.studentEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      s.status === 'pending' ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" : "bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/20"
                    )}>
                      {s.status === 'pending' ? 'Processando' : 'Respondido'}
                    </span>
                    <button 
                      onClick={() => setShowConfirmDelete({ id: s.id, type: 'suggestion' })}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="Excluir mensagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-300 mb-4 bg-tech-bg/50 p-4 rounded-xl border border-white/5 text-sm font-medium leading-relaxed">"{s.text}"</p>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resposta do Comando:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Transmitir resposta..."
                      defaultValue={s.feedback}
                      onBlur={e => handleFeedback(s, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-tech-bg/50 border border-white/10 text-white focus:ring-2 focus:ring-tech-cyan outline-none text-sm"
                    />
                    <button className="p-2 bg-tech-cyan text-tech-bg rounded-xl hover:bg-white transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-tech-bg/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-8 rounded-[2.5rem] max-w-sm w-full text-center border-red-500/30"
            >
              <div className="w-20 h-20 bg-red-400/10 rounded-[2rem] flex items-center justify-center text-red-400 mb-6 mx-auto border border-red-400/20">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 font-display uppercase tracking-tight">Confirmar Exclusão</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                {showConfirmDelete.type === 'student' 
                  ? 'Esta ação removerá o aluno e todo o seu progresso permanentemente.' 
                  : showConfirmDelete.type === 'all_students'
                  ? 'ATENÇÃO: Isso excluirá TODOS os alunos e seus progressos. Esta ação não pode ser desfeita!'
                  : showConfirmDelete.type === 'all_suggestions'
                  ? 'ATENÇÃO: Isso excluirá TODAS as mensagens recebidas. Esta ação não pode ser desfeita!'
                  : 'Esta mensagem será apagada para sempre.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="py-3 rounded-xl bg-white/5 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showConfirmDelete.type === 'student') deleteStudent(showConfirmDelete.id as string);
                    else if (showConfirmDelete.type === 'all_students') deleteAllStudents();
                    else if (showConfirmDelete.type === 'all_suggestions') deleteAllSuggestions();
                    else deleteSuggestion(showConfirmDelete.id as string);
                  }}
                  className="py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
