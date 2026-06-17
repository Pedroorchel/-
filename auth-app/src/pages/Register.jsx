import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Register({ onCancel, onRegistered }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      alert('As senhas não conferem')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message || 'Erro ao cadastrar')
    } else {
      // signup usually requires email confirmation depending on supabase settings
      onRegistered && onRegistered()
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4">Criar conta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
          <input value={confirm} onChange={(e)=>setConfirm(e.target.value)} type="password" required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <div className="flex gap-2">
          <button disabled={loading} type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
