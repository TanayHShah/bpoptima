import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [fileUrl, setFileUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const api = axios.create({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchData = async () => {
        if (!token) return;
        try {
            const [j, w] = await Promise.all([
                api.get('/api/v1/jobs'),
                api.get('/api/v1/webhooks')
            ]);
            setJobs(j.data);
            setWebhooks(w.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, []);

    const submitJob = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (fileUrl) formData.append('file_url', fileUrl);

        const host = window.location.origin;
        formData.append('webhook_url', webhookUrl || `${host}/api/v1/webhooks`);

        try {
            await api.post('/api/v1/jobs', formData);
            setFile(null);
            setFileUrl('');
            setWebhookUrl('');
            e.target.reset();
            fetchData();
        } catch (err) {
            alert('Job creation failed: ' + (err.response?.data?.detail || err.message));
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedJobs = [...jobs].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (!token) return null;

    return (
        <div className="min-h-screen p-8">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        BP Optima
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm">Secure Document Processing API Dashboard</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white bg-darker/50 hover:bg-gray-800 border border-gray-700/50 px-4 py-2 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <div className="glass rounded-xl p-6 lg:col-span-1 shadow-2xl h-fit border-t border-blue-500/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        New Job Request
                    </h2>
                    <form onSubmit={submitJob} className="space-y-5">
                        <div className="group">
                            <label className="block text-sm font-medium text-gray-400 mb-1 group-focus-within:text-blue-400 transition-colors">File URL</label>
                            <input
                                type="url"
                                value={fileUrl}
                                onChange={e => setFileUrl(e.target.value)}
                                placeholder="https://example.com/doc.pdf"
                                className="w-full bg-darker/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="relative py-3 flex items-center">
                            <div className="flex-grow border-t border-gray-700/50"></div>
                            <span className="mx-4 text-xs font-bold text-gray-500 uppercase">OR</span>
                            <div className="flex-grow border-t border-gray-700/50"></div>
                        </div>
                        <div className="group">
                            <label className="block text-sm font-medium text-gray-400 mb-1 group-focus-within:text-blue-400 transition-colors">Upload Document</label>
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files[0])}
                                className="w-full bg-darker/50 border border-gray-700/50 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 hover:-translate-y-0.5"
                        >
                            {loading ? 'Processing...' : 'Initiate Pipeline'}
                        </button>
                    </form>
                </div>

                {/* Jobs List */}
                <div className="glass rounded-xl p-6 lg:col-span-2 shadow-2xl border-t border-indigo-500/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Active Tasks
                        </div>
                        <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 text-xs rounded-full">{jobs.length} total</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-xs uppercase text-gray-400 border-b border-gray-800">
                                <tr>
                                    <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('file_url')}>Source {sortConfig.key === 'file_url' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('result')}>Result</th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('created_at')}>Created {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {sortedJobs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8">No tasks in queue</td></tr>
                                ) : sortedJobs.map(job => (
                                    <tr key={job.id} className="hover:bg-gray-800/20 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs">{job.id.substring(0, 8)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    job.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                                                        job.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                                                            'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 truncate max-w-[150px] text-xs" title={job.file_url}>{job.file_url || 'File Upload'}</td>
                                        <td className="px-4 py-4">
                                            {job.result ? (
                                                <div className="bg-darker p-2 rounded max-h-24 overflow-auto custom-scrollbar">
                                                    <pre className="text-[10px] text-teal-400">{JSON.stringify(job.result, null, 2)}</pre>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right text-xs">
                                            {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Webhooks Display */}
                <div className="glass rounded-xl p-6 lg:col-span-3 shadow-2xl border-t border-purple-500/20 mt-4">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Received Webhooks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {webhooks.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-gray-500">Waiting for mock backend webhooks...</div>
                        ) : webhooks.map((wh, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-darker to-gray-900 rounded-xl p-4 shadow border border-gray-800">
                                <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                                    <span className="text-xs font-mono text-gray-300">Job {wh.payload.job_id?.substring(0, 8)}</span>
                                    <span className="text-[10px] text-green-400 uppercase tracking-widest">Delivered</span>
                                </div>
                                <pre className="text-xs text-emerald-300 overflow-x-auto custom-scrollbar max-h-32">
                                    {JSON.stringify(wh.payload, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
