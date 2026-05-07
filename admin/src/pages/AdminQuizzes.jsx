import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Upload, Filter, Edit2, Trash2, Loader2 } from 'lucide-react'
import { quizzesService } from '../services/services'

export default function AdminQuizzes() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: response, isLoading } = useQuery({
    queryKey: ['adminQuizzes'],
    queryFn: quizzesService.getQuizzes
  })

  const quizzes = response?.data || []
  const filteredQuizzes = quizzes.filter(q => (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quiz Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage questions, topics, and bulk uploads.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Upload size={16} /> Bulk Upload
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20">
            <Plus size={16} /> Add Quiz
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 dark:border-slate-800">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search quizzes..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors w-full md:w-auto justify-center">
            <Filter size={16} /> Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Quiz Title</th>
                <th className="px-6 py-4 font-medium">Topic</th>
                <th className="px-6 py-4 font-medium">Questions</th>
                <th className="px-6 py-4 font-medium">Difficulty</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                    <p className="mt-2">Loading quizzes...</p>
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No quizzes found.
                  </td>
                </tr>
              ) : filteredQuizzes.map(quiz => (
                <tr key={quiz.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30 group">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{quiz.title || 'Untitled'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {quiz.topic || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{quiz.questions || 0} items</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      quiz.difficulty === 'Easy' ? 'text-green-600 dark:text-green-400' :
                      quiz.difficulty === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        quiz.difficulty === 'Easy' ? 'bg-green-600 dark:bg-green-400' :
                        quiz.difficulty === 'Medium' ? 'bg-amber-600 dark:bg-amber-400' :
                        'bg-red-600 dark:bg-red-400'
                      }`}></span>
                      {quiz.difficulty || 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      quiz.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {quiz.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/20 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/20 dark:hover:text-red-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
