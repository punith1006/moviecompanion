import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    avatarUrl?: string;
    stats: {
        totalXP: number;
        level: number;
        quizStreak: number;
        showsWatched: number;
        hoursWatched: number;
    };
    preferences: {
        favoriteGenres: string[];
        dislikedGenres: string[];
        preferredPlatforms: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatarUrl: {
            type: String,
            default: null,
        },
        stats: {
            totalXP: { type: Number, default: 0 },
            level: { type: Number, default: 1 },
            quizStreak: { type: Number, default: 0 },
            showsWatched: { type: Number, default: 0 },
            hoursWatched: { type: Number, default: 0 },
        },
        preferences: {
            favoriteGenres: [{ type: String }],
            dislikedGenres: [{ type: String }],
            preferredPlatforms: [{ type: String }],
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving (Mongoose 8 async - no next() needed)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.set('toJSON', {
    transform: function (_doc, ret) {
        const obj = ret as { password?: string };
        obj.password = undefined;
        return ret;
    },
});

export const User = mongoose.model<IUser>('User', userSchema);
