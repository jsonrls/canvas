import { quizScore } from "@/lib/ai/study-view-state";
import { ButtonControl } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
} from "@/components/ui/icons";
import type { StudyPack } from "@/lib/ai/study-pack";

export function SummaryView({ pack }: { pack: StudyPack }): React.ReactElement {
  return (
    <div className="ai-summary-layout">
      <section className="ai-summary-lead">
        <p className="ai-section-kicker">Room synthesis</p>
        <h2>{pack.summary.title}</h2>
        <p>{pack.summary.overview}</p>
      </section>

      <section className="ai-output-card">
        <div className="ai-output-card__heading">
          <CheckCircle2 aria-hidden="true" size={19} />
          <h3>High-yield takeaways</h3>
        </div>
        <ol className="ai-key-point-list">
          {pack.summary.keyPoints.map((point, index) => (
            <li key={`${index}-${point}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{point}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ai-output-card ai-output-card--questions">
        <div className="ai-output-card__heading">
          <CircleHelp aria-hidden="true" size={19} />
          <h3>Questions still worth resolving</h3>
        </div>
        {pack.summary.openQuestions.length > 0 ? (
          <ul>
            {pack.summary.openQuestions.map((question, index) => (
              <li key={`${index}-${question}`}>{question}</li>
            ))}
          </ul>
        ) : (
          <p className="ai-inline-empty">
            The notes did not leave a clear unresolved question.
          </p>
        )}
      </section>
    </div>
  );
}

export function QuizView({
  answers,
  onAnswer,
  onReset,
  pack,
}: {
  answers: Record<number, number>;
  onAnswer(questionIndex: number, optionIndex: number): void;
  onReset(): void;
  pack: StudyPack;
}): React.ReactElement {
  const { answeredCount, correctCount } = quizScore(pack.quiz, answers);

  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Active recall</p>
          <h2>Practice the room&apos;s core ideas</h2>
        </div>
        <div className="ai-quiz-score" aria-live="polite">
          <strong>
            {correctCount}/{answeredCount}
          </strong>
          <span>correct so far</span>
        </div>
      </div>

      <div className="ai-quiz-list">
        {pack.quiz.map((item, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isAnswered = selectedAnswer !== undefined;
          const isCorrect = selectedAnswer === item.answerIndex;

          return (
            <article
              className="ai-quiz-card"
              key={`${questionIndex}-${item.question}`}
            >
              <span className="ai-quiz-card__number">
                Question {questionIndex + 1} of {pack.quiz.length}
              </span>
              <h3>{item.question}</h3>
              <div
                className="ai-answer-grid"
                role="group"
                aria-label={`Answers for question ${questionIndex + 1}`}
              >
                {item.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const showCorrect =
                    isAnswered && optionIndex === item.answerIndex;
                  const showIncorrect = isSelected && !isCorrect;

                  return (
                    <ButtonControl
                      variant="custom"
                      aria-pressed={isSelected}
                      className={`ai-answer-button${showCorrect ? " ai-answer-button--correct" : ""}${showIncorrect ? " ai-answer-button--incorrect" : ""}`}
                      disabled={isAnswered}
                      key={`${optionIndex}-${option}`}
                      onClick={() => onAnswer(questionIndex, optionIndex)}
                      type="button"
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      {option}
                      {showCorrect ? (
                        <Check aria-hidden="true" size={17} />
                      ) : null}
                    </ButtonControl>
                  );
                })}
              </div>
              {isAnswered ? (
                <div
                  className={`ai-answer-feedback${isCorrect ? " ai-answer-feedback--correct" : ""}`}
                  role="status"
                >
                  <strong>{isCorrect ? "Correct." : "Review this one."}</strong>
                  <p>{item.explanation}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {answeredCount > 0 ? (
        <ButtonControl
          variant="secondary"
          className="ai-secondary-button"
          onClick={onReset}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset quiz
        </ButtonControl>
      ) : null}
    </div>
  );
}

export function FlashcardsView({
  onToggle,
  pack,
  revealedCards,
}: {
  onToggle(index: number): void;
  pack: StudyPack;
  revealedCards: Set<number>;
}): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Rapid review</p>
          <h2>Flashcards from the shared notes</h2>
          <p>Choose a card to reveal its answer.</p>
        </div>
        <span className="ai-count-badge">{pack.flashcards.length} cards</span>
      </div>
      <div className="ai-flashcard-grid">
        {pack.flashcards.map((card, index) => {
          const isRevealed = revealedCards.has(index);

          return (
            <ButtonControl
              variant="custom"
              aria-label={`${isRevealed ? "Hide" : "Reveal"} answer for flashcard ${index + 1}`}
              aria-pressed={isRevealed}
              className={`ai-flashcard${isRevealed ? " ai-flashcard--revealed" : ""}`}
              key={`${index}-${card.front}`}
              onClick={() => onToggle(index)}
              type="button"
            >
              <span className="ai-flashcard__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="ai-flashcard__label">
                {isRevealed ? "Answer" : "Prompt"}
              </span>
              <strong>{isRevealed ? card.back : card.front}</strong>
              <small>
                {isRevealed ? "Choose to hide" : "Choose to reveal"}
              </small>
            </ButtonControl>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationsView({
  pack,
}: {
  pack: StudyPack;
}): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Study direction</p>
          <h2>What to work on next</h2>
          <p>Actions selected from gaps and connections in this snapshot.</p>
        </div>
      </div>
      <div className="ai-recommendation-list">
        {pack.recommendations.map((recommendation, index) => (
          <article key={`${index}-${recommendation.title}`}>
            <span className="ai-recommendation-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span
                className={`ai-kind-badge ai-kind-badge--${recommendation.kind}`}
              >
                {recommendation.kind}
              </span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.rationale}</p>
              <strong>{recommendation.nextStep}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MisconceptionsView({
  pack,
}: {
  pack: StudyPack;
}): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Cautious review</p>
          <h2>Claims that may need another look</h2>
          <p>These are review prompts, not definitive corrections.</p>
        </div>
      </div>

      {pack.misconceptions.length > 0 ? (
        <div className="ai-misconception-list">
          {pack.misconceptions.map((item, index) => (
            <article key={`${index}-${item.suspectedClaim}`}>
              <div className="ai-misconception-card__heading">
                <span>Review signal {String(index + 1).padStart(2, "0")}</span>
                <span
                  className={`ai-confidence ai-confidence--${item.confidence}`}
                >
                  {item.confidence} confidence
                </span>
              </div>
              <h3>{item.suspectedClaim}</h3>
              <div className="ai-correction-grid">
                <div>
                  <span>Possible correction</span>
                  <p>{item.correction}</p>
                </div>
                <div>
                  <span>Why it matters</span>
                  <p>{item.whyItMatters}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ai-positive-empty">
          <CheckCircle2 aria-hidden="true" size={26} />
          <div>
            <h3>No supported misconception signal</h3>
            <p>
              The assistant did not find a claim it could responsibly flag.
              Continue verifying the notes against course sources.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
