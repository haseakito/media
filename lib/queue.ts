import { Job, Queue, Worker } from "bullmq";
import { emailProcessors } from "./worker";
import connection from "./redis"

// Define the properties for createQueue
interface createQueueProps {
  name: string;
}

// Function handling creating a new queue
const createQueue = ({ name }: createQueueProps) => {
  return new Queue(name, {
    connection: connection,
    defaultJobOptions: {
      attempts: 3,
    },
  });
};

// Define the type for a processor function
type Processor = (job: Job) => Promise<void>;

// Define the type for the processors map
interface ProcessorsMap {
  [key: string]: Processor;
}

// Define the properties for createWorker
interface createWorkerProps {
  name: string;
  processors: ProcessorsMap;
}

// Function handling creating a new worker
const createWorker = ({ name, processors }: createWorkerProps) => {
  return new Worker(
    name,
    async (job) => {
      // Determine the processor based on job name
      const processor = processors[job.name];

      if (processor) {
        await processor(job);
      } else {
        console.error(`No processor found for job: ${job.name}`);
      }
    },
    {
      connection: connection,
    }
  );
};

// Initialize the email queue and worker
const emailQueue = createQueue({ name: "email" });
createWorker({ name: "email", processors: emailProcessors });

export { emailQueue };
