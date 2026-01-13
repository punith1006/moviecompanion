import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QuizScore } from '../models/QuizScore';
import { User } from '../models/User';

export async function getCompletedQuizzes(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!._id;
        const quizzes = await QuizScore.find({ userId }).select('showId difficulty');
        res.json({ success: true, data: quizzes });
    } catch (error) {
        console.error('Get Completed Quizzes Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function submitQuiz(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!._id;
        const { showId, showTitle, difficulty, score, totalQuestions, questions, timeTaken } = req.body;

        // Validation
        if (!showId || !showTitle || !difficulty || score === undefined || !totalQuestions) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // Check if quiz already completed for this show + difficulty
        const existingScore = await QuizScore.findOne({
            userId,
            showId,
            difficulty
        });

        if (existingScore) {
            res.status(409).json({
                success: false,
                message: 'Quiz already completed for this difficulty',
                code: 'ALREADY_COMPLETED'
            });
            return;
        }

        // Calculate XP (Backend validation recommended, but using provided logic for now)
        // Easy: 10, Medium: 20, Hard: 30 per question
        // Bonus: 50 for perfect score
        const xpPerQuestion = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
        const calculatedXP = (score * xpPerQuestion) + (score === totalQuestions ? 50 : 0);

        // Create Quiz Score Record
        const newScore = await QuizScore.create({
            userId,
            showId,
            showTitle,
            difficulty,
            score,
            totalQuestions,
            xpEarned: calculatedXP,
            questions: questions || [], // Optional: store answers
            timeTaken: timeTaken || 0
        });

        // Update User XP and Stats
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $inc: {
                    'stats.totalXP': calculatedXP,
                    'stats.quizStreak': 1, // Simple increment for now
                    // 'stats.quizzesCompleted': 1 // If schema had this
                }
            },
            { new: true }
        );

        res.status(201).json({
            success: true,
            data: {
                xpEarned: calculatedXP,
                totalXP: user?.stats.totalXP,
                score: newScore
            }
        });

    } catch (error) {
        console.error('Submit Quiz Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
