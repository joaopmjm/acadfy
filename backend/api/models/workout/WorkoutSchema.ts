import { BaseSchema } from 'ts-framework-mongo';

const WorkoutSchema = new BaseSchema({
  name: String,
  user: String,
  creator: String,
  exercises: [],
  counter: Number,
  completed: Boolean,
});

export default WorkoutSchema;

