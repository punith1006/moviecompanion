import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizScore extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    showId: number;
    showTitle: string;
    score: number;
    totalQuestions: number;
    xpEarned: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timeTaken: number; // in seconds
    questions: Array<{
        question: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
    }>;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const quizScoreSchema = new Schema<IQuizScore>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        showId: {
            type: Number,
            required: true,
        },
        showTitle: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        totalQuestions: {
            type: Number,
            required: true,
            min: 1,
        },
        xpEarned: {
            type: Number,
            required: true,
            default: 0,
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        timeTaken: {
            type: Number,
            required: true,
        },
        questions: [
            {
                question: { type: String, required: true },
                userAnswer: { type: String, required: true },
                correctAnswer: { type: String, required: true },
                isCorrect: { type: Boolean, required: true },
            },
        ],
        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
quizScoreSchema.index({ userId: 1, showId: 1 });
quizScoreSchema.index({ userId: 1, completedAt: -1 });

export const QuizScore = mongoose.model<IQuizScore>('QuizScore', quizScoreSchema);
