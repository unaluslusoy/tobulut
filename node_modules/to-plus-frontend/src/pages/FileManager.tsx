
import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, File, Download, Trash2, ChevronRight, Home, LayoutGrid, 
  List as ListIcon, Loader2, Upload, Plus, MoreVertical, FolderPlus,
  Edit2, ArrowLeft, Search, Filter, Info, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FileItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
  size: number;
  updatedAt?: Date; // Mock
}

// Mock Tree Data Structure
interface TreeItem {
  name: string;
  path: string;
  children?: TreeItem[];
  isOpen?: boolean;
}

const FileManager: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Core State
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showHidden, setShowHidden] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dynamic Tree State (Based on fetched files that are directories)
    const [treeFolders, setTreeFolders] = useState<FileItem[]>([]);

    // Role Check
    useEffect(() => {
        if (!user || (user.role !== 'superuser' && user.role !== 'admin')) {
            navigate('/');
            return;
        }
        fetchFiles(currentPath);
    }, [currentPath, user]);

    const fetchFiles = async (path: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.admin.listFiles(path);
            const enrichedData = data.map((d: any) => ({
                ...d,
                updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date()
            }));
            
            setFiles(enrichedData);

            // If we are at root (or generally), update the sidebar tree with directories found in this view
            // to allow quick navigation? Or better, fetch ROOT directories once for the tree?
            // User said "direk dizin göstersin", implying the *current* structure.
            // For now, let's just make the sidebar show the directories from the current fetch 
            // OR if we want a persistent tree, we would need a separate fetch. 
            // Given "no demo menu", let's show the directories of the current path in sidebar as "Subfolders".
            const dirs = enrichedData.filter((f: any) => f.type === 'directory');
            setTreeFolders(dirs);

        } catch (err) {
            console.error(err);
            setFiles([]); // No mock data
            setTreeFolders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        // STRICT SECURITY: Ensure we don't navigate outside of allowed scope
        // Assuming 'path' comes from API data which is relative to root.
        // We just update state.
        setCurrentPath(path);
        setSelectedItems([]);
    };

    // ... (rest of code)

    // Render Sidebar List (Flat list of current subfolders instead of recursive tree for now)
    const renderSidebarFolders = () => {
        return (
             <div className="pl-1">
                 {/* Always show Root/Home option */}
                 <div 
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-sm font-medium mb-1 transition-colors
                        ${currentPath === '' ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    onClick={() => handleNavigate('')}
                >
                    <Home size={16} className="mr-3" />
                    Ana Dizin
                </div>

                {/* List Subdirectories of Current Path */}
                {treeFolders.length > 0 && (
                    <div className="mt-2">
                        <div className="px-3 text-xs font-bold text-slate-400 uppercase mb-2">Alt Klasörler</div>
                        {treeFolders.map((folder) => (
                            <div 
                                key={folder.path}
                                className="flex items-center px-3 py-2 rounded-lg cursor-pointer text-sm mb-0.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => handleNavigate(folder.path)}
                            >
                                <Folder size={16} className="mr-3 text-amber-500" />
                                <span className="truncate">{folder.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const breadcrumbs = currentPath.split('/').filter(Boolean);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
            {/* LEFT SIDEBAR: FILE TREE */}
            <div className="w-72 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Folder className="text-brand-600" size={20} />
                        Klasörler
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {renderSidebarFolders()}
                </div>

                {/* Storage Info Widget */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between text-xs mb-2 text-slate-500">
                        <span>Depolama</span>
                        <span>75%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-brand-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">15 GB / 20 GB kullanıldı</p>
                </div>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
                
                {/* TOOLBAR */}
                <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-[#111827] shrink-0 gap-4">
                    
                    {/* Left: Search & Breadcrumbs */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 overflow-hidden whitespace-nowrap mask-linear-fade">
                            <button 
                                onClick={() => handleNavigate('')}
                                className="hover:text-brand-600 transition-colors"
                            >
                                <Home size={16} />
                            </button>
                            {breadcrumbs.length > 0 && <ChevronRight size={14} className="mx-2 shrink-0" />}
                            {breadcrumbs.map((part, i) => (
                                <div key={i} className="flex items-center">
                                    <span 
                                        className={`cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${i === breadcrumbs.length - 1 ? 'font-bold text-slate-900 dark:text-white' : ''}`}
                                        onClick={() => handleNavigate(breadcrumbs.slice(0, i + 1).join('/'))}
                                    >
                                        {part}
                                    </span>
                                    {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="mx-2 shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 && (
                            <div className="flex items-center gap-1 mr-4 pr-4 border-r border-slate-200 dark:border-slate-700 animate-fade-in">
                                <span className="text-xs text-slate-500 mr-2 font-medium">{selectedItems.length} seçildi</span>
                                <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sil">
                                    <Trash2 size={18} />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" title="Yeniden Adlandır">
                                    <Edit2 size={18} />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="İndir">
                                    <Download size={18} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                        
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95 ml-2">
                            <Upload size={16} />
                            <span className="hidden sm:inline">Yükle</span>
                        </button>
                         <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ml-1">
                            <FolderPlus size={20} className="text-emerald-600"/>
                        </button>
                    </div>
                </div>

                {/* FILE GRID/LIST AREA */}
                <div className="flex-1 overflow-y-auto p-6" onClick={() => setSelectedItems([])}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Loader2 size={40} className="animate-spin mb-4 text-brand-500" />
                            <p>Dosyalar yükleniyor...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Folder size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="font-medium text-lg">Bu klasör boş</p>
                            <p className="text-sm mt-1 opacity-70">Yeni dosya yükleyin veya klasör oluşturun.</p>
                        </div>
                    ) : (
                        <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                                {files.map((file) => {
                                    const isSelected = selectedItems.includes(file.name);
                                    return (
                                        <div 
                                            key={file.name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(e.metaKey || e.ctrlKey) {
                                                    toggleSelection(file.name, true);
                                                } else {
                                                    file.type === 'directory' ? handleNavigate(file.path) : toggleSelection(file.name, false);
                                                }
                                            }}
                                            className={`
                                                group relative flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer select-none
                                                ${isSelected 
                                                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 ring-1 ring-brand-500 shadow-sm' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600 hover:shadow-md'}
                                            `}
                                        >
                                            <div className={`w-14 h-14 mb-3 flex items-center justify-center rounded-2xl ${file.type === 'directory' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'} transition-transform group-hover:scale-110 duration-200`}>
                                                {file.type === 'directory' ? <Folder size={32} fill="currentColor" fillOpacity={0.2} /> : <File size={32} />}
                                            </div>
                                            
                                            <div className="w-full text-center relative group/tooltip">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                                                    {file.name}
                                                </p>
                                                {/* Tooltip for long names */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap max-w-[200px] truncate shadow-xl">
                                                    {file.name}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-100 dark:bg-slate-900/50 py-0.5 px-2 rounded-full inline-block">
                                                    {formatSize(file.size)}
                                                </p>
                                            </div>

                                            {/* Hover Actions */}
                                            {file.type === 'file' && (
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button className="p-1 bg-white dark:bg-slate-700 rounded shadow hover:text-brand-600 text-slate-500">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                 <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" />
                                            </th>
                                            <th className="px-4 py-3">Dosya Adı</th>
                                            <th className="px-4 py-3">Boyut</th>
                                            <th className="px-4 py-3">Tür</th>
                                            <th className="px-4 py-3">Tarih</th>
                                            <th className="px-4 py-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {files.map((file) => (
                                             <tr 
                                                key={file.name} 
                                                onClick={(e) => {
                                                    // Simple toggle logic
                                                    toggleSelection(file.name, false); 
                                                }}
                                                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedItems.includes(file.name) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedItems.includes(file.name)} 
                                                        onChange={() => {}}
                                                        className="rounded border-slate-300 dark:border-slate-600" 
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${file.type === 'directory' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {file.type === 'directory' ? <Folder size={18} /> : <File size={18} />}
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md" title={file.name}>
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{formatSize(file.size)}</td>
                                                <td className="px-4 py-3 text-slate-500 uppercase text-xs">{file.name.split('.').pop()}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {file.updatedAt?.toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileManager;
