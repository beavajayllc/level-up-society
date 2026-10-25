"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  RotateCcw,
} from "lucide-react";

const questions = [
  {
    id: "creditRepair",
    prompt: "Do you need credit repair?",
    options: ["Yes", "No", "I'm not sure"],
  },
  {
    id: "business",
    prompt: "Where are you with your business?",
    options: ["I own a business", "I'm getting one started", "I'm exploring ideas"],
  },
  {
    id: "goal",
    prompt: "What kind of support are you looking for?",
    options: [
      "Business funding",
      "Personal credit support",
      "Both funding and credit support",
      "I'm still figuring that out",
    ],
  },
  {
    id: "timeline",
    prompt: "When are you hoping to make progress?",
    options: ["As soon as possible", "In the next few months", "I'm planning ahead"],
  },
] as const;

type Answers = Partial<Record<(typeof questions)[number]["id"], string>>;

function recommendation(answers: Answers): string {
  const needsCreditRepair = answers.creditRepair === "Yes";
  const wantsCreditSupport =
    answers.goal === "Personal credit support" ||
    answers.goal === "Both funding and credit support";
  const wantsFunding =
    answers.goal === "Business funding" ||
    answers.goal === "Both funding and credit support";

  if (needsCreditRepair || wantsCreditSupport) {
    return "Start with a credit review, then map out the funding options that fit your goals.";
  }
  if (wantsFunding && answers.business === "I own a business") {
    return "Start with a business funding conversation and review the options that fit your plans.";
  }
  if (wantsFunding) {
    return "Build your business foundation and learn what lenders typically look for before pursuing funding.";
  }
  return "Explore the funding and credit education in the members area, then revisit your goals as they become clearer.";
}

export function FundingCreditQuestionnaire({
  bookingUrl,
}: {
  bookingUrl?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const complete = step === questions.length;
  const needsCall =
    answers.creditRepair === "Yes" || answers.creditRepair === "I'm not sure";

  function restart() {
    setAnswers({});
    setStep(0);
  }

  return (
    <section className="mt-10 max-w-3xl rounded-card border border-silver/10 bg-silver/[0.035] p-6 sm:p-9">
      {!complete ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-chrome">
              Question {step + 1} of {questions.length}
            </p>
            <p className="text-[13px] text-silver/40">About a minute</p>
          </div>
          <div
            className="mt-4 h-1 overflow-hidden rounded-full bg-silver/10"
            role="progressbar"
            aria-label="Questionnaire progress"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={step + 1}
          >
            <div
              className="h-full rounded-full bg-chrome transition-[width] duration-300"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>

          <fieldset className="mt-8">
            <legend className="text-[22px] font-semibold tracking-[-0.03em] text-silver sm:text-[26px]">
              {questions[step].prompt}
            </legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {questions[step].options.map((option) => {
                const selected = answers[questions[step].id] === option;
                return (
                  <label
                    key={option}
                    className={`flex min-h-14 cursor-pointer items-center rounded-tile border px-5 py-3 text-[15px] transition-colors ${
                      selected
                        ? "border-chrome/65 bg-chrome/10 text-silver"
                        : "border-silver/10 bg-ink/50 text-silver/65 hover:border-silver/25 hover:text-silver"
                    }`}
                  >
                    <input
                      type="radio"
                      name={questions[step].id}
                      value={option}
                      checked={selected}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [questions[step].id]: option,
                        }))
                      }
                      className="mr-3 h-4 w-4 accent-[#d8e0eb]"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="inline-flex h-11 items-center gap-2 rounded-pill border border-silver/15 px-5 text-sm text-silver/70 transition hover:border-silver/35 hover:text-silver"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            ) : <span />}
            <button
              type="button"
              disabled={!answers[questions[step].id]}
              onClick={() => {
                if (step === 0 && needsCall) {
                  setStep(questions.length);
                  return;
                }
                setStep((current) => current + 1);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step === questions.length - 1 ? "See your next step" : "Continue"}
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      ) : needsCall ? (
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-chrome">
            Your next step
          </p>
          <h2 className="mt-4 text-[25px] font-semibold tracking-[-0.03em] text-silver">
            Let&apos;s schedule a call
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-silver/60">
            Thanks for letting us know. A member of our team can talk with you about credit repair and help you figure out the next step that fits.
          </p>
          <p className="mt-4 text-[14px] text-silver/45">
            Your answer: <span className="text-silver/75">{answers.creditRepair}</span>
          </p>
          {bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink transition hover:brightness-[1.06]"
            >
              Schedule a call
              <CalendarDays size={16} />
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <p className="mt-7 rounded-tile border border-silver/10 bg-ink/50 p-4 text-sm text-silver/50">
              The booking link needs to be connected before members can schedule here.
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-silver/15 px-5 text-sm text-silver/70 transition hover:border-silver/35 hover:text-silver"
            >
              <ArrowLeft size={14} />
              Change answer
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-silver/15 px-5 text-sm text-silver/70 transition hover:border-silver/35 hover:text-silver"
            >
              <RotateCcw size={14} />
              Start over
            </button>
            <Link
              href="/members"
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-silver/15 px-5 text-sm text-silver/70 transition hover:border-silver/35 hover:text-silver"
            >
              Back to members area
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-chrome">
            Your next step
          </p>
          <h2 className="mt-4 text-[25px] font-semibold tracking-[-0.03em] text-silver">
            Here&apos;s a place to start
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-silver/60">
            {recommendation(answers)}
          </p>

          <div className="mt-7 rounded-tile border border-silver/10 bg-ink/50 p-5">
            <h3 className="text-sm font-semibold text-silver">Your answers</h3>
            <dl className="mt-4 space-y-3">
              {questions.map((question) => (
                <div key={question.id} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-5">
                  <dt className="text-[13px] text-silver/40">{question.prompt}</dt>
                  <dd className="text-[13px] text-silver/75 sm:text-right">
                    {answers[question.id]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-silver/35">
            This is a starting point, not financial advice. Your answers stay in this page and aren&apos;t submitted or saved.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-silver/15 px-5 text-sm text-silver/70 transition hover:border-silver/35 hover:text-silver"
            >
              <RotateCcw size={14} />
              Start over
            </button>
            <Link
              href="/members"
              className="inline-flex h-11 items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-5 text-sm font-medium text-ink transition hover:brightness-[1.06]"
            >
              Back to members area
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
