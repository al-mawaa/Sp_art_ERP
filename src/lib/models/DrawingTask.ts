import mongoose from 'mongoose';

export interface DrawingTaskDocument extends mongoose.Document {
  taskName: string;
  taskDate: Date;
  batchId: mongoose.Types.ObjectId;
  batchName: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DrawingTaskSchema = new mongoose.Schema<DrawingTaskDocument>(
  {
    taskName: { type: String, required: true, trim: true },
    taskDate: { type: Date, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    batchName: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
  },
  { timestamps: true, collection: 'drawing_tasks' },
);

const DrawingTask = (mongoose.models.DrawingTask as mongoose.Model<DrawingTaskDocument> | undefined) ??
  mongoose.model<DrawingTaskDocument>('DrawingTask', DrawingTaskSchema);

export default DrawingTask;
