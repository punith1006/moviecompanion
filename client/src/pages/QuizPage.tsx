import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Trophy, Target, Zap, ChevronRight, Check, X } from 'lucide-react'
import axios from 'axios'

interface QuizState {
    active: boolean
    question?: string
    answer?: string
    userAnswer?: string
    correct?: boolean
    showResult: boolean
}

export default function QuizPage() {
    const [quiz, setQuiz] = useState<QuizState>({ active: false, showResult: false })
    const [stats, setStats] = useState({ total: 0, correct: 0 })
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')

    const startQuiz = async () => {
        setLoading(true)
        try {
            const response = await axios.post('/api/chat', {
                message: "Let's play a quiz!",
                user_id: 'default_user',
            })

            setQuiz({
                active: true,
                question: response.data.response,
                showResult: false,
            })
        } catch (error) {
            console.error('Failed to start quiz:', error)
            // Demo question
            setQuiz({
                active: true,
                question: '🎬 Who said the famous line: "I am the one who knocks"?',
                answer: 'Walter White',
                showResult: false,
            })
        } finally {
            setLoading(false)
        }
    }

    const submitAnswer = async () => {
        if (!input.trim()) return

        setLoading(true)
        try {
            const response = await axios.post('/api/chat', {
                message: input,
                user_id: 'default_user',
            })

            const isCorrect = response.data.response.toLowerCase().includes('correct')

            setQuiz((prev) => ({
                ...prev,
                userAnswer: input,
                correct: isCorrect,
                showResult: true,
            }))

            setStats((prev) => ({
                total: prev.total + 1,
                correct: prev.correct + (isCorrect ? 1 : 0),
            }))
        } catch (error) {
            // Demo result
            const isCorrect = input.toLowerCase().includes('walter')
            setQuiz((prev) => ({
                ...prev,
                userAnswer: input,
                correct: isCorrect,
                showResult: true,
            }))
            setStats((prev) => ({
                total: prev.total + 1,
                correct: prev.correct + (isCorrect ? 1 : 0),
            }))
        } finally {
            setLoading(false)
            setInput('')
        }
    }

    const nextQuestion = () => {
        setQuiz({ active: false, showResult: false })
        startQuiz()
    }

    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Quiz Time</h1>
                        <p className="text-white/50">Test your entertainment knowledge</p>
                    </div>
                </div>
            </motion.header>

            {/* Stats Cards */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto"
            >
                <div className="glass rounded-2xl p-6 text-center">
                    <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                    <p className="text-sm text-white/50">Questions</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{stats.correct}</p>
                    <p className="text-sm text-white/50">Correct</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                    <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{accuracy}%</p>
                    <p className="text-sm text-white/50">Accuracy</p>
                </div>
            </motion.div>

            {/* Quiz Area */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto"
            >
                {!quiz.active ? (
                    /* Start Screen */
                    <div className="glass rounded-3xl p-12 text-center">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-8xl mb-6"
                        >
                            🎯
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">Ready to Play?</h2>
                        <p className="text-white/60 mb-8">
                            I'll ask you questions about shows from your watch history. Let's see how much you remember!
                        </p>
                        <button
                            onClick={startQuiz}
                            disabled={loading}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg flex items-center gap-3 mx-auto hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                <>
                                    Start Quiz
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                ) : quiz.showResult ? (
                    /* Result Screen */
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`glass rounded-3xl p-12 text-center border-2 ${quiz.correct ? 'border-green-500/50' : 'border-red-500/50'
                            }`}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                            className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${quiz.correct
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                                    : 'bg-gradient-to-br from-red-400 to-orange-500'
                                }`}
                        >
                            {quiz.correct ? (
                                <Check className="w-10 h-10 text-white" />
                            ) : (
                                <X className="w-10 h-10 text-white" />
                            )}
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {quiz.correct ? '🎉 Correct!' : '😅 Not Quite!'}
                        </h2>
                        <p className="text-white/60 mb-6">
                            Your answer: <span className="text-white">{quiz.userAnswer}</span>
                        </p>
                        {quiz.answer && !quiz.correct && (
                            <p className="text-white/60 mb-6">
                                The answer was: <span className="text-green-400">{quiz.answer}</span>
                            </p>
                        )}

                        <button
                            onClick={nextQuestion}
                            disabled={loading}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center gap-3 mx-auto hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                        >
                            Next Question
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : (
                    /* Question Screen */
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="glass rounded-3xl p-8"
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-6">
                            Question #{stats.total + 1}
                        </div>

                        <p className="text-xl text-white mb-8 leading-relaxed">{quiz.question}</p>

                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                                placeholder="Type your answer..."
                                className="flex-1 px-5 py-4 rounded-xl glass text-lg"
                                autoFocus
                            />
                            <button
                                onClick={submitAnswer}
                                disabled={!input.trim() || loading}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Checking...' : 'Submit'}
                            </button>
                        </div>

                        <p className="text-center text-white/40 text-sm mt-4">
                            💡 Hint: Think about shows you've watched recently
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
