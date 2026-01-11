import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        metadata?: {
            type?: 'text' | 'recap' | 'recommendation' | 'quiz';
            toolsUsed?: string[];
            showId?: number;
        };
    }>;
    isActive: boolean;
    lastInteractionAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ['user', 'assistant', 'system'],
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                metadata: {
                    type: {
                        type: String,
                        enum: ['text', 'recap', 'recommendation', 'quiz'],
                        default: 'text',
                    },
                    toolsUsed: [{ type: String }],
                    showId: { type: Number },
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        lastInteractionAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding active conversations
conversationSchema.index({ userId: 1, isActive: 1 });
conversationSchema.index({ userId: 1, lastInteractionAt: -1 });

export const Conversation = mongoose.model<IConversation>(
    'Conversation',
    conversationSchema
);
