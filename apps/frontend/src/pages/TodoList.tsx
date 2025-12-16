
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Check, Trash2, Calendar, AlertCircle, 
  CheckCircle2, Circle, Clock, Tag, Filter, Loader2,
  MoreVertical, User, MessageSquare, Paperclip, Columns, List as ListIcon, X,
  GripVertical, Bold, Italic, Underline, List, AlignLeft, ArrowUp, ArrowDown, Settings, Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Employee } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

// --- Simple Rich Text Editor Component ---
const SimpleEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-brand-500 transition-all">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Kalın"><Bold size={16} /></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="İtalik"><Italic size={16} /></button>
        <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Altı Çizili"><Underline size={16} /></button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Liste"><List size={16} /></button>
      </div>
      <div 
        ref={editorRef}
        className="p-3 min-h-[120px] outline-none text-sm text-slate-800 dark:text-slate-200"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

interface ColumnType {
  id: string;
  title: string;
  color: string;
}

const TaskBoard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeFilter, setActiveFilter] = useState<'all' | 'my'>('all');
  
  // Dynamic Columns State
  const [columns, setColumns] = useState<ColumnType[]>([
    { id: 'todo', title: 'Yapılacak', color: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' },
    { id: 'in_progress', title: 'İşlemde', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { id: 'review', title: 'Kontrol / Onay', color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
    { id: 'done', title: 'Tamamlandı', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  ]);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null); // For insertion indicator
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const initialFormState = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    subtasks: [] as { id: string; text: string; completed: boolean }[]
  };
  const [formData, setFormData] = useState(initialFormState);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedTasks, fetchedEmployees] = await Promise.all([
                api.tasks.getAll(),
                api.hr.getEmployees()
            ]);
            // Ensure tasks have an order if missing (mock data fix)
            const orderedTasks = fetchedTasks.map((t, index) => ({
                ...t,
                order: t.order !== undefined ? t.order : index
            })).sort((a, b) => (a.order || 0) - (b.order || 0));

            setTasks(orderedTasks);
            setEmployees(fetchedEmployees);
        } catch (error) {
            console.error("Failed to load task data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- Dynamic Column Handlers ---
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newColumnTitle.trim()) return;
    
    const newId = newColumnTitle.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newCol: ColumnType = {
        id: newId,
        title: newColumnTitle,
        color: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' // Default color
    };
    
    setColumns([...columns, newCol]);
    setNewColumnTitle('');
    setIsColumnModalOpen(false);
  };

  const handleDeleteColumn = (colId: string) => {
      if(window.confirm('Bu sütunu silmek istediğinize emin misiniz? İçindeki görevler silinmeyecektir, sadece gizlenecektir.')) {
          setColumns(columns.filter(c => c.id !== colId));
      }
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  const handleDragOverColumn = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
      e.preventDefault();
      e.stopPropagation(); // Stop bubbling to column
      if (taskId !== draggedTaskId) {
          setDragOverTaskId(taskId);
      }
  };

  const handleDragLeaveTask = (e: React.DragEvent) => {
      // Optional: Clear indicator logic if needed
  };

  // Dropping on a Column (Appends to end)
  const handleDropOnColumn = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverTaskId(null);
    
    if (!taskId) return;

    // Find the task
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    // If dropped on the same column (and not on a specific task via stopPropagation), do nothing (it's already there)
    // UNLESS we want to move it to the end of the list
    
    let newTasks = [...tasks];
    
    // Calculate new order: Max order in target column + 1
    const targetColumnTasks = tasks.filter(t => t.status === targetStatus);
    const maxOrder = targetColumnTasks.length > 0 
        ? Math.max(...targetColumnTasks.map(t => t.order || 0)) 
        : 0;
    
    const updatedTask = { 
        ...currentTask, 
        status: targetStatus as Task['status'],
        order: maxOrder + 1000 // Move to end
    };

    newTasks = newTasks.map(t => t.id === taskId ? updatedTask : t);
    
    // Optimistic UI
    setTasks(newTasks);
    
    try {
        await api.tasks.update(updatedTask);
    } catch (error) {
        console.error("Drop update failed", error);
        setTasks(tasks); // Revert
    }
    handleDragEnd();
  };

  // Dropping on a Task (Inserts before)
  const handleDropOnTask = async (e: React.DragEvent, targetTaskId: string) => {
      e.preventDefault();
      e.stopPropagation(); // Crucial: Don't trigger column drop
      const draggedId = e.dataTransfer.getData('text/plain');
      
      if (!draggedId || draggedId === targetTaskId) return;

      const draggedTaskIndex = tasks.findIndex(t => t.id === draggedId);
      const targetTaskIndex = tasks.findIndex(t => t.id === targetTaskId);
      
      if (draggedTaskIndex === -1 || targetTaskIndex === -1) return;

      const draggedTask = tasks[draggedTaskIndex];
      const targetTask = tasks[targetTaskIndex];

      // New Status matches the target task's status
      const newStatus = targetTask.status;

      // New Order calculation
      // We want to insert draggedTask BEFORE targetTask.
      // Logic: 
      // 1. Get all tasks in this column sorted by order.
      // 2. Find the index of target task in that sorted list.
      // 3. Insert dragged task at that index.
      // 4. Re-assign order values for the whole column.

      let columnTasks = tasks.filter(t => t.status === newStatus && t.id !== draggedId);
      // Sort by existing order
      columnTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Find position of target task
      const insertIndex = columnTasks.findIndex(t => t.id === targetTaskId);
      
      // Insert dragged task into array
      if (insertIndex !== -1) {
          columnTasks.splice(insertIndex, 0, { ...draggedTask, status: newStatus });
      } else {
          // Fallback
          columnTasks.push({ ...draggedTask, status: newStatus });
      }

      // Re-calculate orders for this column with spacing
      const updates: Task[] = [];
      columnTasks.forEach((t, index) => {
          const newOrder = (index + 1) * 1000;
          if (t.order !== newOrder || t.id === draggedId) { // If order changed or it's the moved item
              t.order = newOrder;
              updates.push(t);
          }
      });

      // Update local state
      const newAllTasks = tasks.map(t => {
          const updated = columnTasks.find(ct => ct.id === t.id);
          return updated || t;
      });
      
      setTasks(newAllTasks);
      setDragOverTaskId(null);
      handleDragEnd();

      // API Updates (Batch update ideally, here simulated loop)
      try {
          // Important: Update the dragged task first to change status/order
          const draggedUpdate = updates.find(u => u.id === draggedId);
          if (draggedUpdate) await api.tasks.update(draggedUpdate);
          
          // Update others if needed (silently)
          // In a real app, send batch order update to backend
      } catch (e) {
          console.error("Reorder failed", e);
      }
  };

  // --- Handlers ---

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate || '',
        subtasks: task.subtasks || []
      });
    } else {
      setEditingTask(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedEmp = employees.find(e => e.id === formData.assignedTo);

    const taskData: Task = {
      id: editingTask ? editingTask.id : `TSK-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      title: formData.title,
      description: formData.description,
      status: formData.status as any,
      priority: formData.priority as any,
      assignedTo: formData.assignedTo,
      assignedToName: assignedEmp ? assignedEmp.name : undefined,
      assignedToAvatar: assignedEmp ? assignedEmp.avatar : undefined,
      dueDate: formData.dueDate,
      subtasks: formData.subtasks,
      createdBy: editingTask ? editingTask.createdBy : user?.id || 'system',
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      order: editingTask ? editingTask.order : Date.now() // New tasks go to bottom by timestamp default
    };

    try {
        if (editingTask) {
            await api.tasks.update(taskData);
            setTasks(prev => prev.map(t => t.id === taskData.id ? taskData : t));
        } else {
            await api.tasks.create(taskData);
            setTasks(prev => [taskData, ...prev]);
        }
        setIsModalOpen(false);
    } catch (error) {
        alert("Görev kaydedilirken hata oluştu.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if(window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
        try {
            await api.tasks.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            if (editingTask?.id === id) setIsModalOpen(false);
        } catch(e) {
            console.error(e);
        }
    }
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `ST-${Date.now()}`, text: newSubtaskText, completed: false }]
    }));
    setNewSubtaskText('');
  };

  const toggleSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st)
    }));
  };

  const removeSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };

  // --- Filtering ---
  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'my') {
        const empId = employees.find(e => e.email === user?.email)?.id; 
        return t.assignedTo === empId || t.createdBy === user?.id; 
    }
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch(p) {
        case 'high': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Yüksek</span>;
        case 'medium': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">Orta</span>;
        case 'urgent': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">ACİL</span>;
        default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Düşük</span>;
    }
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500 flex-col">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>Görevler yükleniyor...</p>
        </div>
      );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="text-brand-600" />
            İş Yönetimi (Task Board)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Ekip görevlerini sürükle-bırak ile yönetin.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Columns size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <ListIcon size={18} />
                </button>
            </div>
            
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors">
                <Plus size={16} />
                Yeni Görev
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 mb-6 pb-2 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeFilter === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
          >
            Tüm Görevler
          </button>
          <button 
            onClick={() => setActiveFilter('my')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeFilter === 'my' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
          >
            Bana Atananlar
          </button>
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
          <div className="flex -space-x-2">
             {employees.slice(0, 5).map(emp => (
                 <img key={emp.id} src={emp.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" title={emp.name} />
             ))}
             {employees.length > 5 && (
                 <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">+{employees.length - 5}</div>
             )}
          </div>
      </div>

      {/* --- KANBAN VIEW --- */}
      {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
              <div className="flex gap-6 h-full min-w-[1200px]">
                  {columns.map(col => {
                      const colTasks = filteredTasks
                        .filter(t => t.status === col.id)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                      return (
                      <div 
                        key={col.id} 
                        onDragOver={handleDragOverColumn}
                        onDrop={(e) => handleDropOnColumn(e, col.id)}
                        className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 min-w-[280px] transition-colors duration-200 ${isDragging ? 'hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-brand-300 dark:hover:border-slate-600' : ''}`}
                      >
                          <div className={`p-3 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center rounded-t-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm`}>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                                  <span className={`w-3 h-3 rounded-full ${col.color.includes('green') ? 'bg-green-500' : col.color.includes('blue') ? 'bg-blue-500' : col.color.includes('yellow') ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                  {col.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded shadow-sm text-slate-500 dark:text-slate-400 font-mono">
                                    {colTasks.length}
                                </span>
                                <button onClick={() => handleDeleteColumn(col.id)} className="text-slate-400 hover:text-red-500 p-1 rounded">
                                    <X size={14} />
                                </button>
                              </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[200px]">
                              {colTasks.map(task => (
                                  <div 
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOverTask(e, task.id)}
                                    onDragLeave={handleDragLeaveTask}
                                    onDrop={(e) => handleDropOnTask(e, task.id)}
                                    onClick={() => handleOpenModal(task)}
                                    className={`
                                        bg-white dark:bg-enterprise-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700 
                                        hover:shadow-lg hover:border-brand-500/20 transition-all cursor-grab active:cursor-grabbing group relative 
                                        ${draggedTaskId === task.id ? 'opacity-50 border-dashed border-2 border-slate-400' : ''}
                                        ${dragOverTaskId === task.id ? 'border-t-4 border-t-brand-500 mt-4' : ''} 
                                    `}
                                  >
                                      <div className="absolute top-2 right-2 cursor-grab text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical size={16} />
                                      </div>

                                      <div className="flex justify-between items-start mb-2 pr-4">
                                          {getPriorityBadge(task.priority)}
                                      </div>
                                      
                                      <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 text-sm">{task.title}</h4>
                                      
                                      {task.subtasks && task.subtasks.length > 0 && (
                                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                  <div 
                                                    className="h-full bg-green-500" 
                                                    style={{ width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` }}
                                                  ></div>
                                              </div>
                                              <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                                          </div>
                                      )}

                                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                          <div className="flex items-center gap-2">
                                              {task.assignedToAvatar ? (
                                                  <img src={task.assignedToAvatar} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-600" title={task.assignedToName} />
                                              ) : (
                                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500">?</div>
                                              )}
                                              {task.comments && (
                                                  <div className="flex items-center text-xs text-slate-400">
                                                      <MessageSquare size={12} className="mr-0.5" /> {task.comments}
                                                  </div>
                                              )}
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            {task.dueDate && (
                                                <div className={`flex items-center text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                                    <Clock size={12} className="mr-1" />
                                                    {new Date(task.dueDate).toLocaleDateString('tr-TR', {day: 'numeric', month:'short'})}
                                                </div>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })}
                  
                  {/* Add Column Button */}
                  <div className="min-w-[280px]">
                      <button 
                        onClick={() => setIsColumnModalOpen(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex items-center justify-center gap-2"
                      >
                          <Plus size={20} /> Sütun Ekle
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
          <div className="flex-1 bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                          <th className="px-6 py-4 w-12 text-center">Sıra</th>
                          <th className="px-6 py-4">Görev Başlığı</th>
                          <th className="px-6 py-4">Atanan</th>
                          <th className="px-6 py-4">Öncelik</th>
                          <th className="px-6 py-4">Son Tarih</th>
                          <th className="px-6 py-4">Durum</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {filteredTasks.map((task, index) => (
                          <tr key={task.id} onClick={() => handleOpenModal(task)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group">
                              <td className="px-6 py-4 text-center text-xs text-slate-400 font-mono">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" dangerouslySetInnerHTML={{ __html: task.description || '' }}></div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      {task.assignedToAvatar && <img src={task.assignedToAvatar} className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600" />}
                                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{task.assignedToName || '-'}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  {getPriorityBadge(task.priority)}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`}>
                                      {columns.find(c => c.id === task.status)?.title || task.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100">
                                      <Trash2 size={16} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* Task Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'} size="lg">
          <form onSubmit={handleSaveTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Görev Başlığı</label>
                          <input 
                              type="text" 
                              required 
                              value={formData.title} 
                              onChange={e => setFormData({...formData, title: e.target.value})}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="Örn: Haftalık raporu hazırla"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Açıklama</label>
                          <SimpleEditor 
                            value={formData.description}
                            onChange={(val) => setFormData({...formData, description: val})}
                          />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 pb-2">
                              <CheckCircle2 size={16} className="text-brand-600" /> Kontrol Listesi (Checklist)
                          </label>
                          <div className="space-y-2 mb-3">
                              {formData.subtasks.map(st => (
                                  <div key={st.id} className="flex items-center gap-3 group bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                      <button 
                                        type="button"
                                        onClick={() => toggleSubtask(st.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${st.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500'}`}
                                      >
                                          {st.completed && <Check size={12} />}
                                      </button>
                                      <span className={`text-sm flex-1 ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{st.text}</span>
                                      <button type="button" onClick={() => removeSubtask(st.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X size={14} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={newSubtaskText}
                                  onChange={e => setNewSubtaskText(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                                  placeholder="+ Yeni madde ekle (Enter)"
                                  className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <button type="button" onClick={addSubtask} className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors">Ekle</button>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Durum</label>
                          <select 
                              value={formData.status} 
                              onChange={e => setFormData({...formData, status: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          >
                              {columns.map(col => (
                                  <option key={col.id} value={col.id}>{col.title}</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Öncelik</label>
                          <select 
                              value={formData.priority} 
                              onChange={e => setFormData({...formData, priority: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          >
                              <option value="low">Düşük</option>
                              <option value="medium">Orta</option>
                              <option value="high">Yüksek</option>
                              <option value="urgent">ACİL</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Atanan Personel</label>
                          <select 
                              value={formData.assignedTo} 
                              onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          >
                              <option value="">Seçiniz...</option>
                              {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Son Tarih</label>
                          <input 
                              type="date"
                              value={formData.dueDate}
                              onChange={e => setFormData({...formData, dueDate: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                      </div>
                  </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-all font-bold">Kaydet</button>
              </div>
          </form>
      </Modal>

      {/* New Column Modal */}
      <Modal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} title="Yeni Pano/Sütun Ekle" size="sm">
          <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sütun Başlığı</label>
                  <input 
                      type="text" 
                      required 
                      value={newColumnTitle} 
                      onChange={e => setNewColumnTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Örn: Bekleyenler, Arşiv..."
                  />
              </div>
              <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsColumnModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-lg shadow-brand-600/30">Ekle</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default TaskBoard;
