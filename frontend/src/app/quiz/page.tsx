"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Play,
    MessageSquare,
    History,
    BookmarkPlus,
    Sparkles,
    Menu,
    X,
    LogOut,
    Trophy,
    ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    funFact: string;
}

export default function QuizPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [questions] = useState<QuizQuestion[]>([
        {
            question: "In 'The Shawshank Redemption', what does Andy use to escape?",
            options: ["A spoon", "A rock hammer", "A knife", "His bare hands"],
            correctIndex: 1,
            funFact: "It took Andy 19 years to tunnel through the wall!"
        },
        {
            question: "What is the name of the coffee shop in 'Friends'?",
            options: ["The Coffee Bean", "Central Perk", "Cafe Friends", "The Orange Couch"],
            correctIndex: 1,
            funFact: "The couch was always reserved because it was the main set piece!"
        },
        {
            question: "Which movie features the quote 'I'll be back'?",
            options: ["RoboCop", "Die Hard", "The Terminator", "Predator"],
            correctIndex: 2,
            funFact: "Arnold Schwarzenegger almost said 'I will be back' instead!"
        },
        {
            question: "What is Walter White's alias in 'Breaking Bad'?",
            options: ["Danger", "Heisenberg", "The Cook", "Blue Sky"],
            correctIndex: 1,
            funFact: "The name comes from physicist Werner Heisenberg!"
        },
        {
            question: "In 'The Office', what is Dwight's last name?",
            options: ["Shrute", "Schrute", "Schrutte", "Schroot"],
            correctIndex: 1,
            funFact: "Dwight runs a beet farm called Schrute Farms!"
        },
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.push("/");
    };

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);
        if (index === questions[currentQuestion].correctIndex) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setScore(0);
        setShowResult(false);
    };

    return (
        <div className="flex h-screen bg-[#0f0d17]">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1625] border-r border-[#252033] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-[#252033]">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold font-['Outfit'] text-white">CinePal</span>
                        </Link>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span>Chat</span>
                        </Link>
                        <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <History className="w-5 h-5" />
                            <span>History</span>
                        </Link>
                        <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <BookmarkPlus className="w-5 h-5" />
                            <span>Watchlist</span>
                        </Link>
                        <Link href="/quiz" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-400">
                            <Sparkles className="w-5 h-5" />
                            <span>Quiz</span>
                        </Link>
                    </nav>
                    <div className="p-4 border-t border-[#252033]">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-violet-600">
                                <AvatarFallback className="bg-violet-600 text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-[#6b6873] hover:text-white hover:bg-[#252033]">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-64">
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#252033]">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    <span className="font-semibold text-white">Quiz</span>
                    <div className="w-10" />
                </header>

                <div className="flex-1 flex items-center justify-center p-6">
                    {!quizStarted ? (
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold font-['Outfit'] text-white mb-4">Movie & TV Quiz</h1>
                            <p className="text-[#a09dab] mb-8">Test your knowledge of movies and TV shows! Answer 5 questions and see how well you know your entertainment.</p>
                            <Button onClick={() => setQuizStarted(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl">
                                Start Quiz
                            </Button>
                        </div>
                    ) : showResult ? (
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                <Trophy className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold font-['Outfit'] text-white mb-2">Quiz Complete!</h1>
                            <p className="text-6xl font-bold text-violet-400 my-6">{score}/{questions.length}</p>
                            <p className="text-[#a09dab] mb-8">
                                {score === questions.length ? "Perfect score! You're a true entertainment expert! 🎉" :
                                    score >= 3 ? "Great job! You really know your stuff! 👏" :
                                        "Keep watching and you'll be an expert in no time! 🍿"}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={resetQuiz} className="bg-violet-600 hover:bg-violet-500">
                                    Play Again
                                </Button>
                                <Link href="/chat">
                                    <Button variant="outline" className="border-[#252033] text-white hover:bg-[#1a1625]">
                                        Back to Chat
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl">
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#a09dab]">Question {currentQuestion + 1} of {questions.length}</span>
                                    <span className="text-sm text-violet-400">Score: {score}</span>
                                </div>
                                <div className="h-2 bg-[#252033] rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
                                </div>
                            </div>

                            <div className="bg-[#1a1625] border border-[#252033] rounded-2xl p-8">
                                <h2 className="text-xl font-semibold text-white mb-6">{questions[currentQuestion].question}</h2>
                                <div className="space-y-3">
                                    {questions[currentQuestion].options.map((option, index) => {
                                        const isSelected = selectedAnswer === index;
                                        const isCorrect = index === questions[currentQuestion].correctIndex;
                                        const showColors = selectedAnswer !== null;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswer(index)}
                                                disabled={selectedAnswer !== null}
                                                className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${showColors && isCorrect ? "bg-green-500/20 border-green-500 text-green-400" :
                                                        showColors && isSelected && !isCorrect ? "bg-red-500/20 border-red-500 text-red-400" :
                                                            isSelected ? "bg-violet-600/20 border-violet-500 text-violet-400" :
                                                                "bg-[#252033] border-[#252033] text-white hover:border-violet-500/50"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedAnswer !== null && (
                                    <div className="mt-6 p-4 bg-[#252033] rounded-xl">
                                        <p className="text-sm text-[#a09dab]">
                                            <span className="text-violet-400 font-medium">Fun Fact:</span> {questions[currentQuestion].funFact}
                                        </p>
                                    </div>
                                )}

                                {selectedAnswer !== null && (
                                    <Button onClick={handleNext} className="w-full mt-6 bg-violet-600 hover:bg-violet-500">
                                        {currentQuestion < questions.length - 1 ? (
                                            <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
                                        ) : (
                                            "See Results"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
}
