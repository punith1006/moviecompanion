'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Target, CheckCircle, XCircle, Clock, Brain } from 'lucide-react';
import { MainLayout } from '@/components/layouts';
import { api, WatchEntry } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

interface QuizQuestion {
    question: string;
    options: string[];
    correct_index: number;
    fun_fact: string;
}

type QuizState = 'select' | 'playing' | 'results';

export default function QuizPage() {
    const { user } = useAuthStore();
    const [completedShows, setCompletedShows] = useState<WatchEntry[]>([]);
    const [selectedShow, setSelectedShow] = useState<WatchEntry | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [quizState, setQuizState] = useState<QuizState>('select');
    const [isLoading, setIsLoading] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0, xp: 0 });
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [takenQuizzes, setTakenQuizzes] = useState<{ showId: number; difficulty: string }[]>([]);

    const { checkAuth } = useAuthStore();

    useEffect(() => {
        loadCompletedShows();
        loadTakenQuizzes();
    }, []);

    const loadTakenQuizzes = async () => {
        const result = await api.getCompletedQuizzes();
        if (result.success && result.data) {
            setTakenQuizzes(result.data);
        }
    };

    const loadCompletedShows = async () => {
        const result = await api.getWatchHistory({ status: 'completed' });
        if (result.success && result.data) {
            setCompletedShows(result.data.items);
        }
    };

    const startQuiz = async () => {
        if (!selectedShow) return;

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    showTitle: selectedShow.title,
                    showId: selectedShow.tmdbId,
                    numQuestions: 5,
                    difficulty,
                }),
            });

            const data = await response.json();

            if (data.success && data.questions) {
                setQuestions(data.questions);
                setQuizState('playing');
                setCurrentQuestion(0);
                setUserAnswers([]);
            }
        } catch (error) {
            console.error('Failed to generate quiz:', error);
        }
        setIsLoading(false);
    };

    const handleAnswer = async (answerIndex: number) => {
        const newAnswers = [...userAnswers, answerIndex];
        setUserAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Calculate results
            let correct = 0;
            newAnswers.forEach((answer, i) => {
                if (answer === questions[i].correct_index) correct++;
            });

            // Calculate optimistic XP (will be overwritten by backend response)
            const xpPerQuestion = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
            let finalXp = correct * xpPerQuestion + (correct === questions.length ? 50 : 0);

            // Submit to backend
            try {
                if (selectedShow) {
                    const result = await api.submitQuiz({
                        showId: selectedShow.tmdbId,
                        showTitle: selectedShow.title,
                        difficulty,
                        score: correct,
                        totalQuestions: questions.length,
                        questions: questions.map((q, i) => ({
                            question: q.question,
                            userAnswer: q.options[newAnswers[i]],
                            correctAnswer: q.options[q.correct_index],
                            isCorrect: newAnswers[i] === q.correct_index
                        }))
                    });

                    if (result.success && result.data) {
                        finalXp = result.data.xpEarned;
                        checkAuth(); // Refresh user stats globally!
                        // Update local taken quizzes
                        setTakenQuizzes(prev => [...prev, { showId: selectedShow.tmdbId, difficulty }]);
                    } else {
                        // Likely already completed or error
                        console.warn('Quiz submission failed or already completed:', result.error);
                        if (result.error?.includes('already completed')) {
                            finalXp = 0;
                        }
                    }
                }
            } catch (err) {
                console.error('Quiz submission error:', err);
                // Fallback: If network error, maybe don't show XP? Or assume 0.
                finalXp = 0;
            }

            setScore({
                correct,
                total: questions.length,
                xp: finalXp,
            });
            setQuizState('results');
        }
    };

    const resetQuiz = () => {
        setQuizState('select');
        setSelectedShow(null);
        setQuestions([]);
        setCurrentQuestion(0);
        setUserAnswers([]);
    };

    return (
        <MainLayout>
            <div className="flex flex-col h-full p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                            Quiz Mode
                        </h1>
                        <p className="text-gray-400">Test your knowledge and earn XP</p>
                    </div>

                    {user && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="font-semibold text-yellow-400">{user.stats.totalXP} XP</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {quizState === 'select' && (
                            <motion.div
                                key="select"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-2xl"
                            >
                                <div className="glass p-6">
                                    <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                                        <Target className="w-6 h-6 text-violet-400" />
                                        Choose a Show
                                    </h2>

                                    {completedShows.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                            <p className="text-gray-400">Complete some shows first to unlock quizzes!</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto">
                                                {completedShows.map((show) => (
                                                    <button
                                                        key={show._id}
                                                        onClick={() => setSelectedShow(show)}
                                                        className={`p-3 rounded-xl text-left transition-all ${selectedShow?._id === show._id
                                                            ? 'bg-violet-500/30 border-2 border-violet-500'
                                                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <p className="font-medium text-white truncate">{show.title}</p>
                                                        <p className="text-sm text-gray-400 capitalize">{show.type}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
                                                <div className="flex gap-2">
                                                    {(['easy', 'medium', 'hard'] as const).map((d) => {
                                                        const isCompleted = selectedShow && takenQuizzes.some(
                                                            q => q.showId === selectedShow.tmdbId && q.difficulty === d
                                                        );

                                                        return (
                                                            <button
                                                                key={d}
                                                                onClick={() => setDifficulty(d)}
                                                                disabled={isCompleted}
                                                                className={`flex-1 py-2 rounded-lg capitalize transition-all border ${difficulty === d
                                                                    ? 'bg-violet-500 text-white border-violet-500'
                                                                    : isCompleted
                                                                        ? 'bg-green-500/10 text-green-500 border-green-500/30 cursor-not-allowed'
                                                                        : 'bg-white/10 text-gray-400 border-transparent hover:bg-white/20'
                                                                    }`}
                                                            >
                                                                {d} {isCompleted && '✓'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <button
                                                onClick={startQuiz}
                                                disabled={!selectedShow || isLoading}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-700 transition-all"
                                            >
                                                {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {quizState === 'playing' && questions[currentQuestion] && (
                            <motion.div
                                key={`question-${currentQuestion}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="w-full max-w-2xl"
                            >
                                <div className="glass p-6">
                                    {/* Progress */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-gray-400">
                                            Question {currentQuestion + 1} of {questions.length}
                                        </span>
                                        <div className="flex gap-1">
                                            {questions.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${i < currentQuestion
                                                        ? 'bg-violet-500'
                                                        : i === currentQuestion
                                                            ? 'bg-violet-400'
                                                            : 'bg-gray-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question */}
                                    <h2 className="text-xl font-display font-bold text-white mb-6">
                                        {questions[currentQuestion].question}
                                    </h2>

                                    {/* Options */}
                                    <div className="space-y-3">
                                        {questions[currentQuestion].options.map((option, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswer(i)}
                                                className="w-full p-4 rounded-xl bg-white/5 text-left text-white hover:bg-violet-500/30 hover:border-violet-500 border-2 border-transparent transition-all"
                                            >
                                                <span className="inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8 mr-3 font-medium">
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {quizState === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-2xl"
                            >
                                <div className="glass p-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                                        <Trophy className="w-10 h-10 text-white" />
                                    </div>

                                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                                        {score.correct === score.total ? 'Perfect!' : score.correct >= score.total / 2 ? 'Great Job!' : 'Keep Learning!'}
                                    </h2>

                                    <p className="text-gray-400 mb-6">
                                        You scored {score.correct} out of {score.total}
                                    </p>

                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-8">
                                        <Zap className="w-6 h-6 text-yellow-400" />
                                        <span className="text-xl font-bold text-yellow-400">+{score.xp} XP</span>
                                    </div>

                                    {/* Results breakdown */}
                                    <div className="space-y-3 mb-8 text-left">
                                        {questions.map((q, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                                {userAnswers[i] === q.correct_index ? (
                                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-white text-sm">{q.question}</p>
                                                    {userAnswers[i] !== q.correct_index && (
                                                        <p className="text-green-400 text-sm mt-1">
                                                            Correct: {q.options[q.correct_index]}
                                                        </p>
                                                    )}
                                                    {q.fun_fact && (
                                                        <p className="text-gray-500 text-xs mt-1">💡 {q.fun_fact}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={resetQuiz}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:from-violet-600 hover:to-purple-700 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
}
