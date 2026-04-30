import React from 'react';
import { CertificateData } from './Certificate';
import { Printer, Save, ChevronRight, Building2, User, Calendar, MapPin, Tag } from 'lucide-react';

interface PermitFormProps {
  data: CertificateData;
  onChange: (newData: CertificateData) => void;
  onSubmit: () => void;
  isEditing?: boolean;
}

const InputGroup = ({ label, name, value, onChange, type = "text", placeholder = "", icon: Icon, readOnly = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
        {Icon && <Icon size={16} />}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm font-medium transition-all outline-none ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'}`}
      />
    </div>
  </div>
);

const PermitForm: React.FC<PermitFormProps> = ({ data, onChange, onSubmit, isEditing }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-6 opacity-75">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">1</div>
          <h3 className="text-lg font-bold text-slate-800">Registration Details (Selected Broker)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-2">
            <InputGroup label="Permit ID (PTCB No.)" name="permit_id" value={data.permit_id} onChange={handleChange} readOnly icon={Tag} />
          </div>
          <InputGroup label="Business Name" name="business_name" value={data.business_name} onChange={handleChange} readOnly icon={Building2} />
          <InputGroup label="Recipient Name" name="recipient_name" value={data.recipient_name} onChange={handleChange} readOnly icon={User} />
          <div className="col-span-2">
            <InputGroup label="Business Location" name="business_location" value={data.business_location} onChange={handleChange} readOnly icon={MapPin} />
          </div>
          <InputGroup label="Role / Designation" name="role" value={data.role} onChange={handleChange} readOnly />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">2</div>
          <h3 className="text-lg font-bold text-slate-800">Trip & Footer Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-2">
            <InputGroup label="Issue Date" name="issue_date" type="date" value={data.issue_date} onChange={handleChange} icon={Calendar} />
          </div>
          <InputGroup label="Plate No." name="plate_no" value={data.plate_no} onChange={handleChange} placeholder="ABC-1234" />
          
          <div className="space-y-3">
            <InputGroup label="Driver 1 Name" name="driver_name" value={data.driver_name} onChange={handleChange} />
            {data.driver_name_2 !== undefined && (
              <div className="animate-in">
                <InputGroup label="Driver 2 Name" name="driver_name_2" value={data.driver_name_2} onChange={handleChange} />
              </div>
            )}
            {data.driver_name_3 !== undefined && (
              <div className="animate-in">
                <InputGroup label="Driver 3 Name" name="driver_name_3" value={data.driver_name_3} onChange={handleChange} />
              </div>
            )}
            
            {(!data.hasOwnProperty('driver_name_3') || data.driver_name_3 === undefined) && (
              <button 
                type="button"
                onClick={() => {
                  if (data.driver_name_2 === undefined) {
                    onChange({ ...data, driver_name_2: '' });
                  } else if (data.driver_name_3 === undefined) {
                    onChange({ ...data, driver_name_3: '' });
                  }
                }}
                className="flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest pl-1 transition"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">+</div>
                Add Assistant Driver
              </button>
            )}
          </div>
          <InputGroup label="Origin" name="origin" value={data.origin} onChange={handleChange} />
          <InputGroup label="Destination" name="destination" value={data.destination} onChange={handleChange} />
          <InputGroup label="No. of Box(es)" name="no_of_boxes" value={data.no_of_boxes} onChange={handleChange} />
          <InputGroup label="Time / Date" name="time_date" value={data.time_date} onChange={handleChange} />
          <InputGroup label="Valid Until" name="valid_until" value={data.valid_until} onChange={handleChange} />
          <InputGroup label="Remarks" name="remarks" value={data.remarks} onChange={handleChange} />
        </div>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition hover:bg-slate-50 hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Printer className="w-5 h-5" /> Print Certificate
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl transition hover:bg-slate-800 hover:shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Save className="w-5 h-5" /> {isEditing ? 'Update Record' : 'Finalize & Issue'}
        </button>
      </div>
    </div>
  );
};

export default PermitForm;
