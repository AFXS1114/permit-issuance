'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import Certificate, { CertificateData } from '@/components/Certificate';
import PermitForm from '@/components/PermitForm';
import { Plus, LogOut, FileText, Trash2, Edit, Search, Filter, CheckCircle, Clock, MapPin, X } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'select-broker' | 'add-broker' | 'create' | 'edit'>('list');
  const [permits, setPermits] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CertificateData>({
    business_name: '',
    business_location: '',
    recipient_name: '',
    role: '',
    validity_start: '',
    validity_end: '',
    issue_date: new Date().toISOString().split('T')[0],
    permit_id: '',
    plate_no: '',
    driver_name: '',
    driver_name_2: '',
    driver_name_3: '',
    origin: 'PFDA-BFPC',
    destination: '',
    no_of_boxes: '',
    time_date: new Date().toISOString().slice(0, 16),
    valid_until: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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
      remarks: permit.remarks
    });
    setEditingId(permit.id);
    setView('edit');
  };

  const handleSaveBroker = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rec_brokers_info')
        .insert({
          ...brokerFormData,
          ...(session.user.id !== '00000000-0000-0000-0000-000000000000' && { user_id: session.user.id })
        });
      
      if (error) throw error;
      
      showToast('Broker registered successfully');
      await fetchBrokers();
      setView('select-broker');
      setBrokerFormData({
        business_name: '', business_location: '', recipient_name: '',
        role: '', validity_start: '', validity_end: '', permit_id: ''
      });
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPermits = permits.filter(p => 
    p.rec_brokers_info?.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.permit_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.rec_brokers_info?.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Periss</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">PFDA-BFPC Official</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 mr-4">
              <button onClick={() => setView('list')} className={`text-sm font-semibold transition ${view === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
              <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">Analytics</button>
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
                { label: 'Recently Issued', value: permits.filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000)).length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Active Brokers', value: new Set(permits.map(p => p.broker_id)).size, icon: Filter, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                <h2 className="text-xl font-bold text-slate-800">Outgoing Permits Inventory</h2>
                <div className="relative group">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition" />
                  <input 
                    type="text" 
                    placeholder="Search by business, ID, or recipient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-100 transition"
                  />
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
                    {filteredPermits.map((permit) => (
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
                              onClick={() => { if(confirm('Delete permit?')) supabase.from('rec_outgoing').delete().eq('id', permit.id).then(fetchPermits) }} 
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

        {view === 'select-broker' && (
          <div className="animate-in max-w-4xl mx-auto">
            <button onClick={() => setView('list')} className="mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition">&larr; Back to Dashboard</button>
            <div className="glass-card p-10 rounded-[2.5rem] border border-white">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-800">Select Broker Information</h2>
                <p className="text-slate-500">Choose a registered broker to proceed with the outgoing permit</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brokers.map((broker) => (
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
            <button onClick={() => setView('select-broker')} className="mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-semibold text-sm transition">&larr; Back to Selection</button>
            <div className="glass-card p-10 rounded-[2.5rem] border border-white">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">Register New Broker</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                    <input 
                      type="text" 
                      value={brokerFormData.business_name}
                      onChange={(e) => setBrokerFormData({...brokerFormData, business_name: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={brokerFormData.business_location}
                      onChange={(e) => setBrokerFormData({...brokerFormData, business_location: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recipient Name</label>
                    <input 
                      type="text" 
                      value={brokerFormData.recipient_name}
                      onChange={(e) => setBrokerFormData({...brokerFormData, recipient_name: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Designation</label>
                    <input 
                      type="text" 
                      value={brokerFormData.role}
                      onChange={(e) => setBrokerFormData({...brokerFormData, role: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Permit ID (PTCB No.)</label>
                    <input 
                      type="text" 
                      value={brokerFormData.permit_id}
                      onChange={(e) => setBrokerFormData({...brokerFormData, permit_id: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Validity Start</label>
                    <input 
                      type="date" 
                      value={brokerFormData.validity_start}
                      onChange={(e) => setBrokerFormData({...brokerFormData, validity_start: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Validity End</label>
                    <input 
                      type="date" 
                      value={brokerFormData.validity_end}
                      onChange={(e) => setBrokerFormData({...brokerFormData, validity_end: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveBroker}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition active:scale-[0.98] shadow-xl shadow-slate-100 mt-4"
                >
                  Register Broker
                </button>
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
