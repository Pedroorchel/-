import React from 'react'

export default function Welcome({ user, profile, onSignOut }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow text-center">
      <h2 className="text-2xl font-semibold mb-4">Bem-vindo{user?.email ? `, ${user.email}` : ''}!</h2>
      <p className="text-gray-600 mb-2">Autenticado com sucesso.</p>
      {profile ? (
        <div className="mt-4 text-left text-sm text-gray-700 space-y-2">
          <div><strong>Nome:</strong> {profile.full_name || profile.email || 'Sem nome'}</div>
          <div><strong>Profissão:</strong> {profile.profession || 'Não informado'}</div>
          <div><strong>Cidade:</strong> {profile.city || 'Não informado'}</div>
          <div><strong>Bio:</strong> {profile.bio || 'Não informado'}</div>
          <div><strong>Skills:</strong> {profile.skills || 'Não informado'}</div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Nenhum perfil encontrado no banco de dados.</p>
      )}
      <button onClick={onSignOut} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-md font-semibold">Sair</button>
    </div>
  )
}
