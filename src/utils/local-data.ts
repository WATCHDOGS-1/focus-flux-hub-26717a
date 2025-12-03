interface Task {
  id: number;
  content: string;
  completed: boolean;
  indent: number;
}

interface LocalStudyData {
  notesSummary: string;
  tasks: Task[];
}

const NOTES_KEY = "onlyfocus_notes_content";
const TASKS_KEY = "onlyfocus_task_list";

/**
 * Fetches local study data (Notes and Tasks) from browser storage.
 */
export const getLocalStudyData = (): LocalStudyData => {
  // 1. Notes Content
  const notesHtml = localStorage.getItem(NOTES_KEY) || "";
  
  // Simple sanitization/summary: remove HTML tags and truncate
  const notesText = notesHtml.replace(/<[^>]*>/g, ' ').trim();
  const notesSummary = notesText.length > 200 ? notesText.substring(0, 200) + "..." : notesText;

  // 2. Task List
  let tasks: Task[] = [];
  try {
    const tasksJson = localStorage.getItem(TASKS_KEY);
    if (tasksJson) {
      tasks = JSON.parse(tasksJson) as Task[];
    }
  } catch (e) {
    console.error("Failed to parse local tasks:", e);
  }

  return {
    notesSummary,
    tasks: tasks.filter(t => !t.completed), // Only show incomplete tasks
  };
};