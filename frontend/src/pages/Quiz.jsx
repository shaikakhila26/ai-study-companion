import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import ErrorBanner from '../components/ErrorBanner.jsx';

// Quiz progress needs to survive a refresh, a lost connection, or an
// accidentally closed tab -- so the in-progress quiz's id is persisted to
// localStorage per Project, and on mount the full quiz state is
// reconstructed from the backend (which already has every answered
// question) rather than restarting from scratch.
const storageKey = (projectId) => `asc_quiz_${projectId}`;

export default function Quiz() {
  const { projectId } = useParams();
  const [quizId, setQuizId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedQuizId = localStorage.getItem(storageKey(projectId));
    if (!savedQuizId) {
      setRestoring(false);
      return;
    }
    client
      .get(`/quiz/${savedQuizId}`)
      .then((res) => {
        const quiz = res.data.quiz;
        if (quiz.status === 'completed' || quiz.questions.length === 0) {
          localStorage.removeItem(storageKey(projectId));
          setRestoring(false);
          return;
        }
        const last = quiz.questions[quiz.questions.length - 1];
        setQuizId(quiz._id);
        setQuestion(last);
        setQuestionNumber(quiz.questions.length);
        if (last.answeredAt) {
          // Last question was answered but "Next" was never clicked (e.g. tab
          // closed right after answering) -- restore the feedback view too.
          setFeedback(last);
        } else {
          setFeedback(null);
          setSelectedOption(null);
          setOpenAnswer('');
        }
      })
      .catch(() => {
        // Saved quiz no longer exists or belongs to a different account -- discard it.
        localStorage.removeItem(storageKey(projectId));
      })
      .finally(() => setRestoring(false));
  }, [projectId]);

  const start = async () => {
    setLoading(true);
    setError('');
    setSummary(null);
    try {
      const res = await client.post(`/projects/${projectId}/quiz/start`);
      setQuizId(res.data.quizId);
      localStorage.setItem(storageKey(projectId), res.data.quizId);
      setQuestion(res.data.question);
      setQuestionNumber(res.data.questionNumber);
      setFeedback(null);
      setSelectedOption(null);
      setOpenAnswer('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const answer = question.type === 'mcq' ? selectedOption : openAnswer;
    if (answer === null || answer === undefined || answer === '') return;
    setLoading(true);
    setError('');
    try {
      const res = await client.post(`/quiz/${quizId}/answer`, { questionId: question._id, answer });
      setFeedback(res.data.question);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.post(`/quiz/${quizId}/next`);
      if (res.data.done) {
        setSummary(res.data.quiz.summary);
        setQuestion(null);
        localStorage.removeItem(storageKey(projectId));
      } else {
        setQuestion(res.data.question);
        setQuestionNumber(res.data.questionNumber);
        setFeedback(null);
        setSelectedOption(null);
        setOpenAnswer('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load next question');
    } finally {
      setLoading(false);
    }
  };

  if (restoring) {
    return <div className="p-8 text-center text-slate-400 text-sm">Restoring your quiz...</div>;
  }

  return (
    <div className="space-y-6">
      <Link to={`/projects/${projectId}`} className="text-sm text-brand-600">&larr; Project dashboard</Link>
      <h1 className="text-2xl font-semibold text-slate-800">Adaptive Quiz</h1>
      <ErrorBanner message={error} />

      {!quizId && !summary && (
        <div className="card text-center">
          <p className="text-sm text-slate-500 mb-4">
            Questions adapt to your current mastery — concepts you're weaker or less certain on come up more.
          </p>
          <button className="btn-primary" onClick={start} disabled={loading}>
            {loading ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      )}

      {question && (
        <div className="card space-y-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Question {questionNumber}</span>
            <span>
              {question.concept} • {question.difficulty}
            </span>
          </div>
          <p className="font-medium">{question.prompt}</p>

          {question.type === 'mcq' ? (
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm ${
                    (feedback ? feedback.userAnswer === i : selectedOption === i) ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="option"
                    checked={feedback ? feedback.userAnswer === i : selectedOption === i}
                    onChange={() => setSelectedOption(i)}
                    disabled={!!feedback}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="input"
              rows={4}
              placeholder="Type your answer..."
              value={feedback ? feedback.userAnswer : openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              disabled={!!feedback}
            />
          )}

          {!feedback ? (
            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <div className="space-y-3">
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  feedback.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}
              >
                <div className="font-medium mb-1">{feedback.isCorrect ? 'Correct' : 'Not quite'}</div>
                <div>{feedback.feedback}</div>
                {feedback.missingConcepts?.length > 0 && (
                  <div className="text-xs mt-2">Missing: {feedback.missingConcepts.join(', ')}</div>
                )}
                {typeof feedback.score === 'number' && (
                  <div className="text-xs mt-1">Score: {Math.round(feedback.score * 100)}%</div>
                )}
              </div>
              <button className="btn-primary" onClick={next} disabled={loading}>
                {loading ? 'Loading...' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      )}

      {summary && (
        <div className="card text-center space-y-3">
          <h2 className="font-semibold text-lg">Quiz complete</h2>
          <p className="text-sm text-slate-600">
            {summary.correct} / {summary.totalQuestions} correct
            {summary.averageScore !== null && ` • average score ${Math.round(summary.averageScore * 100)}%`}
          </p>
          <button className="btn-secondary" onClick={start}>
            Take another quiz
          </button>
          <Link to={`/projects/${projectId}/growth`} className="btn-primary inline-block">
            View growth
          </Link>
        </div>
      )}
    </div>
  );
}