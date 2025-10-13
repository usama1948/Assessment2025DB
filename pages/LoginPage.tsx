import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        const success = await login(username, password);
        if (!success) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        }
    } catch(err) {
        setError('حدث خطأ أثناء محاولة تسجيل الدخول.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-sky-700">نظام إدارة المدارس</h1>
          <p className="text-slate-500 mt-2">يرجى تسجيل الدخول للمتابعة</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              اسم المستخدم
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="admin, supervisor, أو الرقم الوطني للمدرسة"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 transition"
            >
              {loading && <SpinnerIcon className="animate-spin ml-3 h-5 w-5 text-white" />}
              {loading ? 'جارِ التحقق...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
         <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold mb-2 text-slate-700">معلومات الدخول:</h4>
            <p><strong>مسؤول النظام:</strong> admin / admin123 (كلمة مرور افتراضية، يمكن تغييرها من إعدادات الحساب).</p>
            <p className="mt-2">
                يتم إنشاء حسابات المشرفين والمدراء من قبل مسؤول النظام عبر صفحة "إدارة المستخدمين".
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
