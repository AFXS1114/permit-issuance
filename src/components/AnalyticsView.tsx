import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Package, Map, Users, Fish, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  permits: any[];
  brokers: any[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ permits, brokers }) => {
  // Data Processing
  const stats = useMemo(() => {
    const totalBoxes = permits.reduce((sum, p) => sum + (parseInt(p.no_of_boxes) || 0), 0);
    const uniqueDestinations = new Set(permits.map(p => p.destination)).size;
    
    // Volume by Month
    const monthMap: any = {};
    const destMap: any = {};
    const brokerMap: any = {};
    const specieMap: any = {};

    permits.forEach(p => {
      // Month Trend
      const date = new Date(p.issue_date);
      const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[month] = (monthMap[month] || 0) + (parseInt(p.no_of_boxes) || 0);

      // Top Destinations
      destMap[p.destination] = (destMap[p.destination] || 0) + 1;

      // Top Brokers
      const brokerName = p.rec_brokers_info?.business_name || 'UNKNOWN';
      brokerMap[brokerName] = (brokerMap[brokerName] || 0) + 1;

      // Species
      const specie = p.specie || 'OTHER';
      specieMap[specie] = (specieMap[specie] || 0) + 1;
    });

    const monthData = Object.entries(monthMap).map(([name, volume]) => ({ name, volume })).slice(-12);
    const destData = Object.entries(destMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 8);
    const brokerData = Object.entries(brokerMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
    const specieData = Object.entries(specieMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6);

    return { totalBoxes, uniqueDestinations, monthData, destData, brokerData, specieData };
  }, [permits]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Volume" value={stats.totalBoxes.toLocaleString()} sub="Boxes Transported" icon={Package} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Network Reach" value={stats.uniqueDestinations.toLocaleString()} sub="Unique Destinations" icon={Map} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Broker Network" value={brokers.length.toLocaleString()} sub="Registered Entities" icon={Users} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Total Permits" value={permits.length.toLocaleString()} sub="Historical Records" icon={TrendingUp} color="text-rose-600" bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <ChartCard title="Operational Volume Trend" sub="Monthly box transport velocity" icon={Calendar}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Destinations */}
        <ChartCard title="Top Logistic Destinations" sub="Highest frequency delivery points" icon={Map}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.destData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Species Breakdown */}
        <ChartCard title="Species Distribution" sub="Commercial volume by fish type" icon={Fish}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.specieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.specieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 min-w-[200px]">
              {stats.specieData.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Top Brokers */}
        <ChartCard title="Market Share Leaders" sub="Top performing broker businesses" icon={Users}>
          <div className="space-y-5">
            {stats.brokerData.map((b, i) => (
              <div key={i} className="group p-4 bg-slate-50 hover:bg-white hover:shadow-xl transition-all rounded-2xl border border-transparent hover:border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{b.name}</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{b.count} <span className="text-[10px] text-slate-400 font-normal ml-1">PERMITS</span></span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000" 
                    style={{ width: `${(b.count / stats.brokerData[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, bg }: any) => (
  <div className="glass-card p-8 rounded-[2.5rem] border border-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
    <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className={`${bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="relative z-10">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3>
      <p className="text-xs text-slate-500 font-medium">{sub}</p>
    </div>
  </div>
);

const ChartCard = ({ title, sub, icon: Icon, children }: any) => (
  <div className="glass-card p-8 rounded-[3rem] border border-white hover:shadow-2xl transition-all duration-500 bg-white/50 backdrop-blur-xl">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);

export default AnalyticsView;
