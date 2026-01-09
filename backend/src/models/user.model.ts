import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    passwordHash: string;
    name: string;
    avatarUrl?: string;
    preferences: {
        favoriteGenres: string[];
        streamingServices: string[];
        contentRatings: string[];
    };
    quizStats: {
        totalCorrect: number;
        streak: number;
        lastPlayed?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        avatarUrl: {
            type: String,
        },
        preferences: {
            favoriteGenres: {
                type: [String],
                default: [],
            },
            streamingServices: {
                type: [String],
                default: [],
            },
            contentRatings: {
                type: [String],
                default: [],
            },
        },
        quizStats: {
            totalCorrect: {
                type: Number,
                default: 0,
            },
            streak: {
                type: Number,
                default: 0,
            },
            lastPlayed: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);
