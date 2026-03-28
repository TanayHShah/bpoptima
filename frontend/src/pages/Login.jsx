import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const res = await axios.post(`/api/v1/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                localStorage.setItem('token', res.data.access_token);
                navigate('/');
            } else {
                await axios.post(`/api/v1/register?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass max-w-md w-full p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-blue-500 opacity-10 blur-3xl rounded-full"></div>
                <h2 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 relative z-10">
                    BP Optima
                </h2>
                <p className="text-gray-400 text-center mb-8 relative z-10">{isLogin ? 'Welcome back, sign in below' : 'Create a new account'}</p>

                {error && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg relative z-10">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Strategy</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-darker/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner" placeholder="name@company.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-darker/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner" placeholder="••••••••" />
                    </div>
                    <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2 rounded-lg transition-all disabled:opacity-50 mt-4 shadow-lg shadow-blue-500/20">
                        {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Initialize Account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 relative z-10">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        {isLogin ? 'Sign up here' : 'Login here'}
                    </button>
                </p>
            </div>
        </div>
    );
}
