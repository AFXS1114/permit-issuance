import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, Calendar, Search, FileSpreadsheet, File as FilePdf, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsViewProps {
  permits: any[];
  brokers: any[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ permits, brokers }) => {
  const [brokerFilter, setBrokerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter Logic
  const filteredData = useMemo(() => {
    return permits.filter(p => {
      const brokerName = p.rec_brokers_info?.business_name || '';
      const matchesBroker = !brokerFilter || brokerName === brokerFilter;
      const matchesSearch = !searchQuery ||
        brokerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.permit_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.destination?.toLowerCase().includes(searchQuery.toLowerCase());

      const issueDate = p.issue_date;
      const matchesStart = !startDate || issueDate >= startDate;
      const matchesEnd = !endDate || issueDate <= endDate;

      // If a broker is selected, ignore the date range
      const dateCondition = brokerFilter ? true : (matchesStart && matchesEnd);

      return matchesBroker && matchesSearch && dateCondition;
    });
  }, [permits, brokerFilter, searchQuery, startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredData.map(p => ({
      'Permit ID': p.permit_id,
      'Issue Date': p.issue_date,
      'Business Name': p.rec_brokers_info?.business_name,
      'Recipient': p.rec_brokers_info?.recipient_name,
      'Origin': p.origin,
      'Destination': p.destination,
      'Boxes': p.no_of_boxes,
      'Driver': p.driver_name,
      'Plate No': p.plate_no,
      'Time': p.time_date,
      'Remarks': p.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outgoing Permits');
    XLSX.writeFile(wb, `Permit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('BFPC - Permit Issuance Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 27);
    }

    const tableColumn = ["Permit ID", "Date", "Business Name", "Recipient", "Destination", "Boxes"];
    const tableRows = filteredData.map(p => [
      p.permit_id,
      p.issue_date,
      p.rec_brokers_info?.business_name,
      p.rec_brokers_info?.recipient_name,
      p.destination,
      p.no_of_boxes
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillStyle: '#1e293b', textColor: [255, 255, 255] }
    });

    doc.save(`Permit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reporting Center</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Data Export & Audit Logs</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition border border-emerald-100"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition border border-rose-100"
          >
            <FilePdf className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/5 p-6 rounded-[2rem] border border-slate-100">
        <div className="relative group">
          <Users className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={brokerFilter}
            onChange={(e) => setBrokerFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition appearance-none"
          >
            <option value="">ALL BROKERS</option>
            {brokers.map((b, i) => (
              <option key={i} value={b.business_name}>{b.business_name}</option>
            ))}
          </select>
        </div>

        <div className="relative group">
          <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition"
          />
          <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-blue-500 rounded-full border border-blue-50">FROM DATE</span>
        </div>

        <div className="relative group">
          <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition"
          />
          <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-rose-500 rounded-full border border-rose-50">TO DATE</span>
        </div>

        <div className="relative group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="SEARCH ANYTHING..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Permit Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistic Route</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-900 text-sm tracking-tight">{p.permit_id}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{p.issue_date}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700 text-sm">{p.rec_brokers_info?.business_name}</div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-1">{p.rec_brokers_info?.recipient_name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                      <span className="text-slate-400 uppercase">From</span> {p.origin}
                    </div>
                    <div className="text-xs font-bold text-slate-600 flex items-center gap-2 mt-1">
                      <span className="text-slate-400 uppercase">To</span> {p.destination}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black">
                      {p.no_of_boxes} BOXES
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            SHOWING <span className="text-slate-900">{paginatedData.length}</span> OF <span className="text-slate-900">{filteredData.length}</span> RECORDS
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-600 px-4">PAGE {currentPage} OF {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white transition disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Users = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default ReportsView;
