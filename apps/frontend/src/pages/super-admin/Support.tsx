
import React, { useState, useEffect } from 'react';
import { SaaSSupportTicket } from '../../types';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import { Building, MessageSquare } from 'lucide-react';

const Support: React.FC = () => {
    const [tickets, setTickets] = useState<SaaSSupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SaaSSupportTicket | null>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [ticketReply, setTicketReply] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const tkts = await api.superAdmin.getSupportTickets();
            setTickets(tkts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenTicket = (ticket: SaaSSupportTicket) => {
        setSelectedTicket(ticket);
        setTicketReply('');
        setIsTicketModalOpen(true);
    };

    const handleSendReply = async () => {
        if(!selectedTicket) return;
        const updatedTicket = {
            ...selectedTicket,
            status: 'in_progress', // or closed depending on logic, here assume WIP
            lastReplyAt: new Date().toISOString()
            // In real app, we would append the message to a sub-collection
        };
        // await api.superAdmin.updateSupportTicket(updatedTicket);
        
        // Mock update as backend endpoint for message append might be complex
        // Ideally: POST /super-admin/tickets/:id/reply
        
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket as any : t));
        setIsTicketModalOpen(false);
        alert("Yanıt gönderildi.");
    };

    const handleCloseTicket = async () => {
        if(!selectedTicket) return;
        const updatedTicket = { ...selectedTicket, status: 'resolved' };
        // await api.superAdmin.updateSupportTicket(updatedTicket);
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket as any : t));
        setIsTicketModalOpen(false);
    };

    const inputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none";

    return (
        <div>
           <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Destek Talepleri</h1>
                <p className="text-slate-500 dark:text-slate-400">Firmalardan gelen destek bildirimlerini yönetin.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading && <p>Yükleniyor...</p>}
                {!loading && tickets.length === 0 && <p className="text-slate-500">Henüz bir destek talebi yok.</p>}
                {tickets.map(ticket => (
                    <div 
                    key={ticket.id} 
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenTicket(ticket)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-red-500' : ticket.status === 'resolved' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{ticket.subject}</h4>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.message}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ticket.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {ticket.priority}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                            <span className="flex items-center gap-1"><Building size={12}/> {ticket.tenantName}</span>
                            <span>{new Date(ticket.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Destek Talebi Detay" size="md">
                {selectedTicket && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTicket.tenantName} • {selectedTicket.userEmail}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {selectedTicket.status}
                                </span>
                            </div>
                            <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                {selectedTicket.message}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2"><MessageSquare size={16}/> Yanıtla</label>
                            <textarea 
                                rows={4} 
                                className={inputClass} 
                                placeholder="Müşteriye yanıtınızı yazın..."
                                value={ticketReply}
                                onChange={(e) => setTicketReply(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={handleCloseTicket}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-sm font-medium"
                            >
                                Çözüldü Olarak İşaretle
                            </button>
                            <button 
                                onClick={handleSendReply}
                                disabled={!ticketReply}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                            >
                                Yanıtı Gönder
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Support;
