// Fix: Import GenerateContentResponse for proper typing of API results.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { User, UserRole, SystemStatus, Recommendation, ChartData, Grade, CommunicationLog, Announcement, LeaveRequest } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Wraps an asynchronous API call with a retry mechanism featuring exponential backoff.
 * If the API call fails, it will be retried up to `maxRetries` times.
 * @param apiCall The asynchronous function to execute.
 * @param maxRetries The maximum number of retry attempts. Defaults to 3.
 * @param initialDelay The initial delay between retries in milliseconds. Defaults to 1000.
 * @param factor The multiplier for the delay for each subsequent retry. Defaults to 2.
 * @returns A promise that resolves with the result of the API call.
 * @throws The error from the last failed attempt if all retries are exhausted.
 */
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  factor: number = 2
): Promise<T> => {
  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.warn(`API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= factor;
      }
    }
  }
  console.error(`API call failed after ${maxRetries} attempts.`, lastError);
  throw lastError;
};

export const getAIDiagnosis = async (): Promise<{ diagnosis: string; solution: string }> => {
  try {
    // Fix: Explicitly type the response to ensure '.text' property is accessible.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "As an AI system administrator for a classroom dashboard platform, diagnose a fictional, minor technical issue (e.g., 'intermittent API latency'). Provide a brief diagnosis and a recommended automated solution. Respond in JSON format with keys 'diagnosis' and 'solution'.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    diagnosis: { type: Type.STRING },
                    solution: { type: Type.STRING }
                }
            }
        }
    }));
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error fetching AI diagnosis:", error);
    return {
      diagnosis: "Could not retrieve AI diagnosis. A network error occurred.",
      solution: "Please check your connection and try again. If the problem persists, contact support.",
    };
  }
};

interface AnalyticsData {
  currentUser: User;
  allUsers: User[];
  grades: Grade[];
  announcements: Announcement[];
  leaveRequests: LeaveRequest[];
  communicationLogs: CommunicationLog[];
}

export const getPredictiveAnalytics = async (data: AnalyticsData): Promise<{ suggestions: string[], chartData: ChartData[] }> => {
  const { currentUser, allUsers, grades, announcements, leaveRequests } = data;
  let prompt = '';

  try {
    switch (currentUser.role) {
      case UserRole.Administrator: {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const students = allUsers.filter(u => u.role === UserRole.Student);
        const teachers = allUsers.filter(u => u.role === UserRole.Teacher);
        const activeUsers = allUsers.filter(u => u.status === 'Active').length;
        const recentAnnouncements = announcements.filter(a => new Date(a.timestamp) > thirtyDaysAgo).length;
        const recentLeaveRequests = leaveRequests.filter(r => new Date(r.fromDate) > thirtyDaysAgo);

        const dataSummary = `
          - Total Users: ${allUsers.length} (${students.length} Students, ${teachers.length} Teachers)
          - Active Users: ${activeUsers} (${allUsers.length > 0 ? ((activeUsers / allUsers.length) * 100).toFixed(0) : 0}%)
          - Announcements (Last 30 days): ${recentAnnouncements}
          - Leave Requests (Last 30 days): ${recentLeaveRequests.length} total (${recentLeaveRequests.filter(r => r.status === 'Pending').length} pending)
        `;

        prompt = `You are an AI analyst for a classroom dashboard. Based on the following real-time platform data, generate insights for an Administrator.
        **Platform Snapshot:**
        ${dataSummary}
        
        **Your Task:**
        1.  Provide 3 brief, actionable suggestions for the administrator to improve platform engagement or address potential issues.
        2.  Generate data for a simple bar chart showing platform activity. The chart should have 4 bars. Example topics: "Active Students", "Active Teachers", "Announcements Posted", "Files Shared". Use realistic but representative integer values based on the provided snapshot.
        
        Respond ONLY in JSON format with keys 'suggestions' (an array of 3 strings) and 'chartData' (an array of 4 objects with 'name' and 'value' keys, where value is a number).`;
        break;
      }

      case UserRole.Teacher: {
        const myStudents = allUsers.filter(u => u.role === UserRole.Student && u.teacherId === currentUser.id);
        const myStudentIds = myStudents.map(s => s.id);
        const recentGrades = grades.filter(g => myStudentIds.includes(g.studentId));
        
        let avgScore = 0;
        let lowScorers = 0;
        if (recentGrades.length > 0) {
            const uniqueTests = [...new Set(recentGrades.map(g => g.testTitle))];
            const latestTestTitle = uniqueTests.length > 0 ? uniqueTests[uniqueTests.length - 1] : recentGrades[0].testTitle;
            const latestGrades = recentGrades.filter(g => g.testTitle === latestTestTitle);

            avgScore = latestGrades.reduce((acc, g) => acc + g.score, 0) / latestGrades.length;
            lowScorers = latestGrades.filter(g => g.score < 65).length;
        }

        const gradeDistribution = recentGrades.reduce((acc, grade) => {
            if (grade.score >= 90) acc['A (90-100)']++;
            else if (grade.score >= 80) acc['B (80-89)']++;
            else if (grade.score >= 70) acc['C (70-79)']++;
            else acc['D/F (<70)']++;
            return acc;
        }, { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D/F (<70)': 0 });

        const dataSummary = `
          - Total Students in Class: ${myStudents.length}
          - Latest Test Analysis: Average score is ${avgScore.toFixed(1)}%. ${lowScorers} students have scores below 65%.
        `;
        
        prompt = `You are an AI teaching assistant. Based on the following real-time data for my class, generate insights for me, the Teacher.
        **Class Snapshot:**
        ${dataSummary}
        
        **Your Task:**
        1.  Provide 3 brief, actionable suggestions to help my students. You can identify general trends or suggest teaching strategies. Mentioning specific (but fictional) student names for praise or concern is acceptable if it makes the suggestion more concrete (e.g., "Consider pairing high-achievers like 'Student A' with those who are struggling...").
        2.  Generate data for a simple bar chart showing the grade distribution for recent tests. Use this exact data for the chart: ${JSON.stringify(gradeDistribution)}.
        
        Respond ONLY in JSON format with keys 'suggestions' (an array of 3 strings) and 'chartData' (an array of 4 objects, using the keys from the provided data as 'name' and the values as 'value').`;
        break;
      }
      
      case UserRole.Student: {
          const myGrades = grades.filter(g => g.studentId === currentUser.id);
          const myLeaveRequests = leaveRequests.filter(r => r.user.id === currentUser.id && r.status === 'Approved');
          
          const gradeSummary = myGrades.length > 0
              ? myGrades.slice(-5).map(g => `${g.subject}: ${g.score}%`).join(', ')
              : 'No grades recorded.';
          
          const avgScore = myGrades.length > 0
              ? (myGrades.reduce((acc, g) => acc + g.score, 0) / myGrades.length).toFixed(1)
              : 'N/A';
          
          const calculateDaysBetween = (from: string, to: string): number => {
              const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime());
              return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          };
          const leaveDaysTaken = myLeaveRequests.reduce((acc, req) => acc + calculateDaysBetween(req.fromDate, req.toDate), 0);
          
          const dataSummary = `
              - My recent grades: ${gradeSummary}
              - My average score is: ${avgScore}%
              - Approved leave days taken: ${leaveDaysTaken}
          `;

          prompt = `You are a friendly AI academic advisor. Based on my following real-time data, generate insights for me, a Student.
          **My Snapshot:**
          ${dataSummary}
          
          **Your Task:**
          1.  Provide 3 brief, encouraging, and actionable suggestions to help me improve my academic performance or manage my time better. Identify potential strengths or weaknesses based on my grades.
          2.  Generate data for a simple bar chart showing my scores across my last 5 subjects. If I have fewer than 5 grades, show all of them.
          
          Respond ONLY in JSON format with keys 'suggestions' (an array of 3 strings) and 'chartData' (an array of objects with 'name' (subject) and 'value' (score) keys).`;
          break;
      }

      default:
        return { suggestions: ["No analytics available for your role."], chartData: [] };
    }
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    chartData: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                value: { type: Type.NUMBER }
                            },
                            required: ['name', 'value']
                        }
                    }
                },
                required: ['suggestions', 'chartData']
            }
        }
    }));

    const jsonStr = response.text.trim();
    const parsedResponse = JSON.parse(jsonStr);

    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions) || !parsedResponse.chartData || !Array.isArray(parsedResponse.chartData)) {
        throw new Error("AI response did not match the expected format.");
    }
    
    if (currentUser.role === UserRole.Teacher) {
        parsedResponse.chartData = parsedResponse.chartData.map((item: ChartData) => ({
            ...item,
            name: item.name.split(' ')[0]
        }));
    }

    return parsedResponse;

  } catch (error) {
    console.error("Error fetching predictive analytics:", error);
    return {
      suggestions: ["Failed to load real-time AI suggestions. The model may be busy. Please try again in a moment."],
      chartData: [{ name: 'Error', value: 0 }],
    };
  }
};


export const categorizeFile = async (fileName: string): Promise<{ category: string, tags: string[], isDuplicate: boolean }> => {
    try {
        const prompt = `An educational file named "${fileName}" was uploaded to a classroom dashboard. Suggest a primary category (e.g., 'Worksheet', 'Lesson Plan', 'Reading Material', 'Assessment'), generate 3-4 relevant tags, and randomly decide if it's a potential duplicate. Respond in JSON with keys 'category' (string), 'tags' (array of strings), and 'isDuplicate' (boolean).`;

        // Fix: Explicitly type the response to ensure '.text' property is accessible.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isDuplicate: { type: Type.BOOLEAN }
                    }
                }
            }
        }));
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error categorizing file:", error);
        return { category: 'Uncategorized', tags: ['error'], isDuplicate: false };
    }
};

export const getRecommendationsForRole = async (role: UserRole): Promise<Recommendation[]> => {
    try {
        const prompt = `Generate 3 personalized recommendations for a ${role} using a classroom dashboard. 
        For a Student, provide study tips or remind them of upcoming deadlines.
        For a Teacher, suggest new engagement strategies or resources.
        For an Administrator, recommend platform optimizations or training opportunities.
        For each, provide a title, a short description, and a category (e.g., 'Productivity', 'Teaching Strategy', 'Platform Tip'). Respond in JSON as an array of objects with keys 'title', 'description', and 'category'.`;
        
        // Fix: Explicitly type the response to ensure '.text' property is accessible.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            category: { type: Type.STRING }
                        }
                    }
                }
            }
        }));

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [{ title: 'Error', description: 'Could not load recommendations.', category: 'System' }];
    }
};

export const getSmartReply = async (context: string): Promise<string> => {
    try {
        const prompt = `Based on the following context for a user in a classroom dashboard: "${context}", generate a concise and professional smart reply. For example, if it's a leave request, write a reason. If it's a notification, make it encouraging.`;
        // Fix: Explicitly type the response to ensure '.text' property is accessible.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating smart reply:", error);
        return "Unable to generate a reply at this time.";
    }
};


export const generateStudentPerformanceSummary = async (studentName: string, grades: Grade[], communicationLogs: CommunicationLog[]): Promise<string> => {
    try {
        const gradeSummary = grades.length > 0
            ? grades.map(g => `- ${g.subject} (${g.testTitle}): ${g.score}% (${g.grade}) - Comments: ${g.comments}`).join('\n')
            : 'No grades recorded.';
            
        const logSummary = communicationLogs.length > 0
            ? communicationLogs.map(l => `- ${l.timestamp.toLocaleDateString()}: ${l.note}`).join('\n')
            : 'No communication logs recorded.';

        const prompt = `
            Act as an experienced and insightful school educator providing a performance summary for a student named ${studentName}.
            Analyze the provided academic and communication data to generate a holistic, professional, and easy-to-read summary.

            **Student Name:** ${studentName}

            **Academic Performance Data:**
            ${gradeSummary}

            **Communication Log Data:**
            ${logSummary}

            **Your Task:**
            Based on all the data above, write a performance summary. The summary should be well-structured and include the following sections:
            1.  **Overall Summary:** A brief, high-level overview of the student's current standing.
            2.  **Academic Strengths:** Identify subjects or areas where the student excels. Mention specific examples from their grades.
            3.  **Areas for Improvement:** Gently point out subjects or skills that could be improved. Look for patterns in lower scores or comments.
            4.  **Behavioral/Communicative Observations (if applicable):** Based on the communication log, are there any patterns of behavior or parent communication to note?
            5.  **Actionable Recommendations:** Provide 2-3 concrete, actionable suggestions for the student, parents, or teacher to help the student's development.

            The tone should be encouraging, professional, and constructive. Format the output clearly using Markdown for headings (e.g. ## Heading) and bullet points.
        `;
        
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        
        return response.text;
    } catch (error) {
        console.error("Error generating student performance summary:", error);
        return "Unable to generate AI summary at this time. Please check the connection or try again later.";
    }
};

export const generateText = async (goal: string, context?: string): Promise<string> => {
    try {
        const prompt = `Your task is to generate a piece of text based on a specific goal and optional context.
        **Goal:** ${goal}
        **Context/Input Text:** ${context || 'None'}
        
        Please provide only the generated text as a raw string response, without any extra formatting or explanation.`;
        
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text.trim();
    } catch (error) {
        console.error("Error generating text:", error);
        return "Unable to generate a response at this time.";
    }
};

export const generateStudyTips = async (grades: Grade[]): Promise<string[]> => {
    try {
        const gradeSummary = grades.length > 0
            ? grades.map(g => `- ${g.subject}: ${g.score}%`).join('\n')
            : 'No recent grades available.';

        const prompt = `Based on these recent grades for a student:\n${gradeSummary}\n\nGenerate 3 concise, encouraging, and actionable study tips. Focus on subjects with lower scores if any, otherwise provide general good habits. Respond in JSON format with a key 'tips' which is an array of strings.`;
        
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        }));
        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        return parsed.tips || [];
    } catch (error) {
        console.error("Error generating study tips:", error);
        return ["Could not load AI study tips. Please try again later."];
    }
};