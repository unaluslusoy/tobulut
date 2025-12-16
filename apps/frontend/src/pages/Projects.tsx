
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, MoreVertical, Calendar, Clock, 
  AlertCircle, CheckCircle2, Circle, ArrowRight, Filter, Search,
  Layout, List, Trash2, Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const Projects: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    
    // Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await api.tasks.getAll();
            setTasks(data);
        } catch (error) {
            console.error("Tasks fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newTask: any = { // Using any cast to bypass partial type strictness for creation
                title: newTaskTitle,
                description: newTaskDesc,
                priority: newTaskPriority,
                status: newTaskStatus,
                tenantId: user?.tenantId || 'system',
                createdBy: user?.id,
                assignedTo: user?.id, // Auto-assign to self for now
                assignedToName: user?.name,
                assignedToAvatar: user?.avatar
            };

            await api.tasks.create(newTask);
            setShowNewTaskModal(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            fetchTasks();
        } catch (error) {
            console.error(error);
            alert('Görev oluşturulurken hata oluştu.');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await api.tasks.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error(error);
        }
    };
    
    const handleStatusChange = async (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => {
        try {
           const updatedTask = { ...task, status: newStatus };
           // Optimistic update
           setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
           await api.tasks.update(updatedTask);
        } catch (error) {
            console.error(error);
            fetchTasks(); // Revert on error
        }
    };

    // Columns Configuration
    const columns = [
        { id: 'todo', title: 'Yapılacaklar', color: 'bg-slate-100', icon: Circle, items: tasks.filter(t => t.status === 'todo') },
        { id: 'in_progress', title: 'Devam Edenler / Eksikler', color: 'bg-blue-50', icon: Clock, items: tasks.filter(t => t.status === 'in_progress') },
        { id: 'done', title: 'Tamamlananlar', color: 'bg-green-50', icon: CheckCircle2, items: tasks.filter(t => t.status === 'done') }
    ];

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-[#0B1120]">
            
            {/* Header / Toolbar */}
            <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
                        <CheckSquare size={20} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">Projeler & İşler</h1>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
                        {tasks.length} Görev
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                        <button 
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'}`}
                        >
                            <Layout size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowNewTaskModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Yeni Görev</span>
                    </button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="h-full flex gap-6 min-w-[800px]">
                    {columns.map((col) => (
                        <div key={col.id} className="flex-1 flex flex-col h-full min-w-[280px] max-w-sm bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 flex-shrink-0">
                            {/* Column Header */}
                            <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-xl ${col.id === 'done' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <col.icon size={18} className={col.id === 'done' ? 'text-green-600' : col.id === 'in_progress' ? 'text-blue-600' : 'text-slate-500'} />
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{col.title}</h3>
                                    <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                                        {col.items.length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            {/* Tasks List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {col.items.map((task) => (
                                    <div 
                                        key={task.id} 
                                        className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 group hover:shadow-md transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${getPriorityColor(task.priority)}`}>
                                                {task.priority === 'urgent' ? 'Acil' : task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                            </span>
                                            <button 
                                                onClick={(e) => handleDelete(task.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 leading-tight">{task.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description || 'Açıklama yok'}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                {task.assignedToAvatar ? (
                                                    <img src={task.assignedToAvatar} className="w-5 h-5 rounded-full ring-1 ring-white" alt="Assignee" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                        {task.assignedToName?.substring(0,2).toUpperCase() || 'NA'}
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-slate-400">{task.createdAt ? new Date(task.createdAt).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}) : ''}</span>
                                            </div>
                                            
                                            {/* Quick Move Actions */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {col.id !== 'todo' && (
                                                    <button onClick={() => handleStatusChange(task, 'todo')} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Yapılacaklara Taşı">
                                                        <ArrowRight size={12} className="rotate-180" />
                                                    </button>
                                                )}
                                                {col.id !== 'in_progress' && (
                                                    <button onClick={() => handleStatusChange(task, 'in_progress')} className="p-1 hover:bg-blue-50 text-blue-500 rounded" title="Devam Edenlere Taşı">
                                                        <Clock size={12} />
                                                    </button>
                                                )}
                                                {col.id !== 'done' && (
                                                    <button onClick={() => handleStatusChange(task, 'done')} className="p-1 hover:bg-green-50 text-green-500 rounded" title="Tamamlandı İşaretle">
                                                        <CheckCircle2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={() => {
                                        setNewTaskStatus(col.id as any);
                                        setShowNewTaskModal(true);
                                    }}
                                    className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    <Plus size={14} /> Görev Ekle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* New Task Modal */}
            {showNewTaskModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Yeni Görev Oluştur</h3>
                            <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                                <Filter size={20} className="rotate-45" /> {/* Using Filter as X icon replacement if X not imported, wait I imported Trash2 etc.. check imports. Ah I didn't import X. Let me use Trash2? No. I'll just use text or existing icons. I imported Layout, List etc. Let's use custom svg or just close text. */}
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Başlık</label>
                                <input 
                                    required
                                    type="text" 
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="Görev başlığı..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                                <textarea 
                                    rows={3}
                                    value={newTaskDesc}
                                    onChange={e => setNewTaskDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                    placeholder="Detaylı açıklama..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Öncelik</label>
                                    <select 
                                        value={newTaskPriority}
                                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="low">Düşük</option>
                                        <option value="medium">Orta</option>
                                        <option value="high">Yüksek</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Durum</label>
                                    <select 
                                        value={newTaskStatus}
                                        onChange={(e: any) => setNewTaskStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="todo">Yapılacak</option>
                                        <option value="in_progress">Devam Eden</option>
                                        <option value="done">Tamamlandı</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowNewTaskModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-600/20 transition-all hover:scale-105"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
