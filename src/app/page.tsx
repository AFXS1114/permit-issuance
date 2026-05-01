'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import Certificate, { CertificateData } from '@/components/Certificate';
import PermitForm from '@/components/PermitForm';
import AnalyticsView from '@/components/AnalyticsView';
import ReportsView from '@/components/ReportsView';
import { Plus, LogOut, FileText, Trash2, Edit, Search, Filter, CheckCircle, Clock, MapPin, X, Users, Building2, BarChart3, Calendar } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'select-broker' | 'add-broker' | 'manage-brokers' | 'create' | 'edit' | 'analytics' | 'reports'>('list');
  const [permits, setPermits] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [brokerSearchQuery, setBrokerSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Helper to get local ISO string for datetime-local inputs
  const getLocalTime = (date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString();
  };

  const [formData, setFormData] = useState<CertificateData>({
    business_name: '',
    business_location: '',
    recipient_name: '',
    role: '',
    validity_start: '',
    validity_end: '',
    issue_date: getLocalTime().split('T')[0],
    permit_id: '',
    plate_no: '',
    driver_name: '',
    driver_name_2: '',
    driver_name_3: '',
    origin: 'PFDA-BFPC',
    destination: '',
    no_of_boxes: '',
    time_date: getLocalTime().slice(0, 16),
    valid_until: getLocalTime(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)).slice(0, 16),
    remarks: '',
    ticket_no: '',
    specie: 'LAWLAW(TAMBAN)'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brokerFormData, setBrokerFormData] = useState({
    business_name: '',
    business_location: '',
    recipient_name: '',
    role: '',
    validity_start: '',
    validity_end: '',
    permit_id: ''
  });
  const [destinations, setDestinations] = useState<any[]>([]);
  const [showDestModal, setShowDestModal] = useState(false);
  const [newDest, setNewDest] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second fail-safe

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) fetchPermits();
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchPermits();
        fetchDestinations();
        fetchBrokers(); // Added this
      }
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (brokerFormData.validity_start) {
      const startDate = new Date(brokerFormData.validity_start);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
        setBrokerFormData(prev => ({
          ...prev,
          validity_end: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [brokerFormData.validity_start]);

  const fetchPermits = async () => {
    const { data, error } = await supabase
      .from('rec_outgoing')
      .select('*, rec_brokers_info(*)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching permits:', error);
    else setPermits(data || []);
  };

  const fetchBrokers = async () => {
    const { data, error } = await supabase
      .from('rec_brokers_info')
      .select('*')
      .order('business_name', { ascending: true });

    if (error) console.error('Error fetching brokers:', error);
    else setBrokers(data || []);
  };

  const fetchDestinations = async () => {
    const { data, error } = await supabase
      .from('rec_destinations')
      .select('*')
      .order('destination', { ascending: true });

    if (error) console.error('Error fetching destinations:', error);
    else setDestinations(data || []);
  };

  const handleAddDestination = async () => {
    if (!newDest.trim()) return;

    try {
      const { error } = await supabase
        .from('rec_destinations')
        .insert([{ destination: newDest.toUpperCase() }]);

      if (error) throw error;

      showToast('Destination added successfully');
      setNewDest('');
      setShowDestModal(false);
      fetchDestinations();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  useEffect(() => {
    if (session) {
      fetchPermits();
      fetchBrokers();
    }
  }, [session]);

  const handleSave = async () => {
    if (!session || !selectedBroker) return;
    try {
      setLoading(true);

      const outgoingData = {
        broker_id: selectedBroker.id,
        issue_date: formData.issue_date,
        plate_no: formData.plate_no,
        driver_name: formData.driver_name,
        origin: formData.origin,
        destination: formData.destination,
        no_of_boxes: formData.no_of_boxes,
        time_date: formData.time_date,
        valid_until: formData.valid_until,
        remarks: formData.remarks,
        ticket_no: formData.ticket_no,
        specie: formData.specie,
        ...(session.user.id !== '00000000-0000-0000-0000-000000000000' && { user_id: session.user.id })
      };

      if (view === 'edit' && editingId) {
        const { error } = await supabase.from('rec_outgoing').update(outgoingData).eq('id', editingId);
        if (error) throw error;
        showToast('Permit updated successfully');
      } else {
        const { error } = await supabase.from('rec_outgoing').insert(outgoingData);
        if (error) throw error;
        showToast('New outgoing record created');
      }

      await fetchPermits();

      // Automatic print after save
      showToast(view === 'edit' ? 'Permit updated successfully' : 'New outgoing record created');

      setTimeout(() => {
        window.print();
        setView('list');
        resetForm();
      }, 800);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: '', business_location: '', recipient_name: '', role: '',
      validity_start: '', validity_end: '', issue_date: new Date().toISOString().split('T')[0],
      permit_id: '', plate_no: '', driver_name: '', origin: 'PFDA-BFPC', destination: '',
      no_of_boxes: '',
      time_date: new Date().toISOString().slice(0, 16),
      valid_until: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      remarks: '',
      ticket_no: '', specie: 'LAWLAW(TAMBAN)'
    });
    setEditingId(null);
    setBrokerSearchQuery(''); // Reset broker search when starting fresh
  };

  const handleEdit = (permit: any) => {
    setSelectedBroker(permit.rec_brokers_info);
    setFormData({
      business_name: permit.rec_brokers_info.business_name,
      business_location: permit.rec_brokers_info.business_location,
      recipient_name: permit.rec_brokers_info.recipient_name,
      role: permit.rec_brokers_info.role,
      validity_start: permit.rec_brokers_info.validity_start,
      validity_end: permit.rec_brokers_info.validity_end,
      permit_id: permit.rec_brokers_info.permit_id,
      issue_date: permit.issue_date,
      plate_no: permit.plate_no,
      driver_name: permit.driver_name,
      origin: permit.origin,
      destination: permit.destination,
      no_of_boxes: permit.no_of_boxes,
      time_date: permit.time_date,
      valid_until: permit.valid_until,
      remarks: permit.remarks,
      ticket_no: permit.ticket_no || '',
      specie: permit.specie || 'LAWLAW(TAMBAN)'
    });
    setEditingId(permit.id);
    setView('edit');
  };

  const handleEditBroker = (broker: any) => {
    setBrokerFormData({
      business_name: broker.business_name,
      business_location: broker.business_location,
      recipient_name: broker.recipient_name,
      role: broker.role,
      validity_start: broker.validity_start,
      validity_end: broker.validity_end,
      permit_id: broker.permit_id
    });
    setEditingId(broker.id);
    setView('add-broker');
  };

  const handleSaveBroker = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const isUpdating = !!editingId && view === 'add-broker';
      
      const { error } = isUpdating 
        ? await supabase
            .from('rec_brokers_info')
            .update(brokerFormData)
            .eq('id', editingId)
        : await supabase
            .from('rec_brokers_info')
            .insert({
              ...brokerFormData,
              ...(session.user.id !== '00000000-0000-0000-0000-000000000000' && { user_id: session.user.id })
            });

      if (error) throw error;

      showToast(isUpdating ? 'Broker updated successfully' : 'Broker registered successfully');
      await fetchBrokers();
      setView('manage-brokers');
      setBrokerFormData({
        business_name: '', business_location: '', recipient_name: '',
        role: '', validity_start: '', validity_end: '', permit_id: ''
      });
      setEditingId(null);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPermits = useMemo(() => {
    let result = permits.filter(p => {
      const matchesSearch = 
        p.rec_brokers_info?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rec_brokers_info?.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.permit_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ticket_no?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !dateFilter || p.issue_date === dateFilter;
      
      return matchesSearch && matchesDate;
    });
    return result;
  }, [permits, searchQuery, dateFilter]);

  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage);
  const paginatedPermits = filteredPermits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!session && !loading) return <Auth onBypass={() => setSession({ user: { id: '00000000-0000-0000-0000-000000000000', email: 'admin@pfda.com' } })} />;
  if (!session && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Authenticating...</p>
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <main className="min-h-screen pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl animate-in flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Modern Top Navigation */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Permit Issuance System</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">PFDA-BFPC</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 mr-4">
              <button onClick={() => setView('list')} className={`text-sm font-semibold transition ${view === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
              <button onClick={() => setView('analytics')} className={`text-sm font-semibold transition ${view === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Analytics</button>
              <button onClick={() => setView('reports')} className={`text-sm font-semibold transition ${view === 'reports' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Reports</button>
              <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">Settings</button>
            </nav>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <button
              onClick={() => { setView('select-broker'); resetForm(); fetchBrokers(); fetchDestinations(); }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95"
            >
              <Plus className="w-4 h-4" /> <span className="font-semibold text-sm">New Outgoing</span>
            </button>
            <button
              onClick={() => setShowDestModal(true)}
              className="bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-100 transition active:scale-95 border border-blue-100"
              title="Manage Destinations"
            >
              <MapPin className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setView('manage-brokers'); fetchBrokers(); }}
              className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-100 transition active:scale-95 border border-indigo-100"
              title="Manage Brokers"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-rose-600 transition p-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {view === 'list' && (
          <div className="animate-in">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Total Permits', value: permits.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Recently Issued Today', value: permits.filter(p => p.issue_date === new Date().toISOString().split('T')[0]).length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Registered Brokers', value: brokers.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-3xl flex items-center gap-4 border border-white">
                  <div className={`${stat.bg} p-4 rounded-2xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800">Outgoing Records</h2>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition" />
                    <input
                      type="text"
                      placeholder="Search business, ID, or ticket..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div className="relative group">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm w-full md:w-48 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    {dateFilter && (
                      <button 
                        onClick={() => setDateFilter('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-8 py-5">Permit Details</th>
                      <th className="px-8 py-5">Recipient Information</th>
                      <th className="px-8 py-5">Issue Date</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPermits.map((permit) => (
                      <tr key={permit.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-slate-900">{permit.rec_brokers_info?.permit_id}</div>
                          <div className="text-sm text-slate-500">{permit.rec_brokers_info?.business_name}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-semibold text-slate-700">{permit.rec_brokers_info?.recipient_name}</div>
                          <div className="text-xs text-slate-400">{permit.rec_brokers_info?.role}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-medium text-slate-600">{new Date(permit.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(permit)}
                              className="p-2.5 bg-white text-slate-400 hover:text-blue-600 hover:shadow-md rounded-xl transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete permit?')) supabase.from('rec_outgoing').delete().eq('id', permit.id).then(fetchPermits) }}
                              className="p-2.5 bg-white text-slate-400 hover:text-rose-600 hover:shadow-md rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-slate-50/50 px-8 py-5 flex items-center justify-between border-t border-slate-100">
                  <div className="text-sm text-slate-500 font-medium">
                    Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredPermits.length)}</span> of <span className="text-slate-900 font-bold">{filteredPermits.length}</span> records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(pageNum => pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1))
                        .map((pageNum, idx, arr) => (
                          <React.Fragment key={pageNum}>
                            {idx > 0 && arr[idx-1] !== pageNum - 1 && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 text-sm font-bold rounded-xl transition ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'}`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'select-broker' && (
          <div className="animate-in max-w-4xl mx-auto">
            <button onClick={() => setView('list')} className="mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition">&larr; Back to Dashboard</button>
            <div className="glass-card p-10 rounded-[2.5rem] border border-white">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-800">Select Broker Information</h2>
                <p className="text-slate-500">Choose a registered broker to proceed with the outgoing permit</p>
              </div>

              {/* Broker Search Box */}
              <div className="mb-8 relative group">
                <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" />
                <input
                  type="text"
                  placeholder="Search by business name or recipient..."
                  value={brokerSearchQuery}
                  onChange={(e) => setBrokerSearchQuery(e.target.value.toUpperCase())}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {brokers.filter(b =>
                  b.business_name.toLowerCase().includes(brokerSearchQuery.toLowerCase()) ||
                  b.recipient_name.toLowerCase().includes(brokerSearchQuery.toLowerCase())
                ).map((broker) => (
                  <button
                    key={broker.id}
                    onClick={() => {
                      setSelectedBroker(broker);
                      setFormData({
                        ...formData,
                        business_name: broker.business_name,
                        business_location: broker.business_location,
                        recipient_name: broker.recipient_name,
                        role: broker.role,
                        validity_start: broker.validity_start,
                        validity_end: broker.validity_end,
                        permit_id: broker.permit_id
                      });
                      setView('create');
                    }}
                    className="p-6 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl text-left transition-all group active:scale-95"
                  >
                    <div className="font-bold text-lg mb-1">{broker.business_name}</div>
                    <div className="text-sm opacity-70 mb-3">{broker.recipient_name}</div>
                    <div className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-white/20 rounded-lg inline-block">{broker.permit_id}</div>
                  </button>
                ))}

                <button
                  onClick={() => setView('add-broker')}
                  className="p-6 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-bold text-sm">Register New Broker</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'add-broker' && (
          <div className="animate-in max-w-2xl mx-auto">
            <button 
              onClick={() => setView(editingId ? 'manage-brokers' : 'select-broker')} 
              className="mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition"
            >
              &larr; Back to {editingId ? 'Management' : 'Selection'}
            </button>
            <div className="glass-card p-10 rounded-[2.5rem] border border-white">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingId ? 'Edit Broker Information' : 'Register New Broker'}</h2>
              <p className="text-slate-500 mb-8 text-sm">{editingId ? 'Update the details for this registered broker' : 'Enter the broker details to add them to the system'}</p>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                    <input
                      type="text"
                      value={brokerFormData.business_name}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, business_name: e.target.value.toUpperCase() })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input
                      type="text"
                      value={brokerFormData.business_location}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, business_location: e.target.value.toUpperCase() })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recipient Name</label>
                    <input
                      type="text"
                      value={brokerFormData.recipient_name}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, recipient_name: e.target.value.toUpperCase() })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Designation</label>
                    <input
                      type="text"
                      value={brokerFormData.role}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, role: e.target.value.toUpperCase() })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Permit ID (PTCB No.)</label>
                    <input
                      type="text"
                      value={brokerFormData.permit_id}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, permit_id: e.target.value.toUpperCase() })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Validity Start</label>
                    <input
                      type="date"
                      value={brokerFormData.validity_start}
                      onChange={(e) => setBrokerFormData({ ...brokerFormData, validity_start: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Validity End</label>
                    <input
                      type="date"
                      value={brokerFormData.validity_end}
                      readOnly
                      className="w-full px-5 py-3 bg-slate-100 border border-slate-100 rounded-2xl text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveBroker}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition active:scale-[0.98] shadow-xl shadow-slate-100 mt-4"
                >
                  {editingId ? 'Update Broker Information' : 'Register Broker'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <AnalyticsView permits={permits} brokers={brokers} />
        )}

        {view === 'reports' && (
          <ReportsView permits={permits} brokers={brokers} />
        )}

        {view === 'manage-brokers' && (
          <div className="animate-in max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => setView('list')} className="mb-2 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition">&larr; Back to Dashboard</button>
                <h2 className="text-3xl font-bold text-slate-800">Manage Brokers</h2>
                <p className="text-slate-500">View and update registered broker information</p>
              </div>
              <button 
                onClick={() => { setEditingId(null); setBrokerFormData({ business_name: '', business_location: '', recipient_name: '', role: '', validity_start: '', validity_end: '', permit_id: '' }); setView('add-broker'); }}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition shadow-xl"
              >
                <Plus className="w-5 h-5" /> Register New Broker
              </button>
            </div>

            {/* Manage Brokers Search */}
            <div className="mb-8 relative group max-w-2xl">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition" />
              <input
                type="text"
                placeholder="Filter brokers by name, business, or permit ID..."
                value={brokerSearchQuery}
                onChange={(e) => setBrokerSearchQuery(e.target.value.toUpperCase())}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold shadow-sm"
              />
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-8 py-5">Broker / Business</th>
                      <th className="px-8 py-5">Permit ID</th>
                      <th className="px-8 py-5">Recipient</th>
                      <th className="px-8 py-5">Validity</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brokers.filter(b => 
                      b.business_name.toLowerCase().includes(brokerSearchQuery.toLowerCase()) ||
                      b.recipient_name.toLowerCase().includes(brokerSearchQuery.toLowerCase()) ||
                      b.permit_id.toLowerCase().includes(brokerSearchQuery.toLowerCase())
                    ).map((broker) => (
                      <tr key={broker.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="font-bold text-slate-800 uppercase text-sm">{broker.business_name}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{broker.permit_id}</span>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500 uppercase">{broker.recipient_name}</td>
                        <td className="px-8 py-6 text-sm text-slate-500">
                          {broker.validity_start} - {broker.validity_end}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditBroker(broker)}
                              className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md rounded-xl transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { if (confirm(`Delete broker "${broker.business_name}"?`)) supabase.from('rec_brokers_info').delete().eq('id', broker.id).then(fetchBrokers) }}
                              className="p-2.5 bg-white text-slate-400 hover:text-rose-600 hover:shadow-md rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="flex flex-col lg:flex-row gap-10 items-start animate-in">
            <div className="w-full lg:w-[45%] no-print">
              <button
                onClick={() => setView('list')}
                className="mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition"
              >
                &larr; Return to Intelligence Dashboard
              </button>
              <div className="glass-card p-8 rounded-[2.5rem] border border-white">
                <PermitForm
                  data={formData}
                  onChange={setFormData}
                  onSubmit={handleSave}
                  destinations={destinations}
                  isEditing={view === 'edit'}
                />
              </div>
            </div>

            <div className="w-full lg:w-[55%] sticky top-24">
              <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl transition group-hover:bg-blue-500/20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl transition group-hover:bg-indigo-500/20"></div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-white p-1 rounded shadow-2xl transform transition hover:scale-[1.01] origin-top">
                    <div className="overflow-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                      <Certificate data={formData} />
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-3 no-print">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                      High-Fidelity A4 Live Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Destination Management Modal */}
      {showDestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Destination</h3>
              <button onClick={() => setShowDestModal(false)} className="text-slate-400 hover:text-rose-500 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination Name</label>
                <input
                  type="text"
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value.toUpperCase())}
                  placeholder="E.G. NAGA CITY"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDestination()}
                />
              </div>
              <button
                onClick={handleAddDestination}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition active:scale-[0.98] shadow-lg shadow-blue-100"
              >
                Save Destination
              </button>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recently Added</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-auto custom-scrollbar pr-2">
                  {destinations.slice(0, 10).map((d, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-100">{d.destination}</span>
                  ))}
                  {destinations.length === 0 && <p className="text-xs text-slate-400 italic">No destinations registered yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
