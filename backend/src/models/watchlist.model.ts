import mongoose, { Document, Schema } from 'mongoose';

export type Priority = 'must_watch' | 'interested' | 'maybe';
export type ContentType = 'movie' | 'tv';

export interface IWatchlist extends Document {
    userId: mongoose.Types.ObjectId;
    contentId: string;
    contentType: ContentType;
    priority: Priority;
    title: string;
    posterPath?: string;
    createdAt: Date;
    updatedAt: Date;
}

const watchlistSchema = new Schema<IWatchlist>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        contentId: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ['movie', 'tv'],
            required: true,
        },
        priority: {
            type: String,
            enum: ['must_watch', 'interested', 'maybe'],
            default: 'interested',
        },
        title: {
            type: String,
            required: true,
        },
        posterPath: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicates
watchlistSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export const Watchlist = mongoose.model<IWatchlist>('Watchlist', watchlistSchema);
