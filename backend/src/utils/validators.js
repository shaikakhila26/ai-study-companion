const { z } = require('zod');

const register = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(200),
  }),
  params: z.any(),
  query: z.any(),
});

const login = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.any(),
  query: z.any(),
});

const createSpace = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    color: z.string().max(20).optional(),
    icon: z.string().max(40).optional(),
  }),
  params: z.any(),
  query: z.any(),
});

const createProject = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    goal: z.string().min(1).max(1000),
  }),
  params: z.object({ spaceId: z.string().min(1) }),
  query: z.any(),
});

const askTutor = z.object({
  body: z.object({ question: z.string().min(1).max(2000) }),
  params: z.object({ projectId: z.string().min(1) }),
  query: z.any(),
});

const submitAnswer = z.object({
  body: z.object({ questionId: z.string().min(1), answer: z.union([z.string(), z.number()]) }),
  params: z.object({ quizId: z.string().min(1) }),
  query: z.any(),
});

module.exports = { register, login, createSpace, createProject, askTutor, submitAnswer };
