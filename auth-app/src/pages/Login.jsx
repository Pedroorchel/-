import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onRegister, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message || 'Erro ao entrar')
    } else if (data.session) {
      onLogin && onLogin()
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4">Entrar</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold">{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>

      <div className="mt-4 text-center">
        <button onClick={onRegister} className="text-indigo-600 font-medium">Cadastrar</button>
      </div>
    </div>
  )
}
