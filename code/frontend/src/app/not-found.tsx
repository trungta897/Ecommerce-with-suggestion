'use client';

import viCommon from '@/messages/vi/common.json';
import './globals.css';

export default function RootNotFound() {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <span className="text-2xl font-bold text-rose-500">404</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{viCommon.notFound.title}</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            {viCommon.notFound.description}
          </p>
          <a
            href="/vi"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 duration-200"
          >
            {viCommon.notFound.backHome}
          </a>
        </div>
      </body>
    </html>
  );
}
