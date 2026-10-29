"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Dumbbell, HeartPulse, RotateCcw, Sparkles } from "lucide-react";

type Goal = "strength" | "muscle" | "energy" | "weight";
type Experience = "beginner" | "regular" | "experienced";
type Equipment = "bodyweight" | "bands" | "weights" | "gym";
type Answers = { goal: Goal | ""; experience: Experience | ""; activity: "" | "low" | "some" | "consistent"; equipment: Equipment | ""; days: "" | "2" | "3" | "4" | "5"; minutes: "" | "20" | "30" | "45"; cardio: "" | "walk" | "cycle" | "dance" | "choice"; challenge: "" | "time" | "consistency" | "confidence" | "variety"; safety: "" | "none" | "concerns" | "private" };

const initial: Answers = { goal: "", experience: "", activity: "", equipment: "", days: "", minutes: "", cardio: "", challenge: "", safety: "" };
const questions: { key: keyof Answers; title: string; description: string; options: { value: string; label: string; detail: string }[] }[] = [
  { key: "goal", title: "What are you working toward?", description: "Choose the goal that matters most to you right now.", options: [
    { value: "strength", label: "Build strength", detail: "Feel stronger in and out of the gym" },
    { value: "muscle", label: "Build muscle", detail: "Focus on consistent resistance training" },
    { value: "energy", label: "Feel healthier", detail: "Improve your energy and overall fitness" },
    { value: "weight", label: "Manage my weight", detail: "Build a sustainable movement routine" },
  ] },
  { key: "experience", title: "How familiar are you with exercise?", description: "We'll meet you where you are.", options: [
    { value: "beginner", label: "Getting started", detail: "I'm new or returning after a break" },
    { value: "regular", label: "Some experience", detail: "I work out from time to time" },
    { value: "experienced", label: "Experienced", detail: "I already exercise regularly" },
  ] },
  { key: "activity", title: "How active have you been lately?", description: "This helps us suggest a realistic starting pace.", options: [
    { value: "low", label: "Not very active", detail: "Little structured exercise recently" },
    { value: "some", label: "A little active", detail: "Some movement most weeks" },
    { value: "consistent", label: "Active regularly", detail: "I already have a consistent routine" },
  ] },
  { key: "equipment", title: "What do you have available?", description: "Choose what you'll normally use.", options: [
    { value: "bodyweight", label: "No equipment", detail: "Bodyweight and a sturdy chair" },
    { value: "bands", label: "Resistance bands", detail: "Bands and a sturdy chair" },
    { value: "weights", label: "Dumbbells", detail: "A pair of weights and a sturdy chair" },
    { value: "gym", label: "A full gym", detail: "Access to weights and machines" },
  ] },
  { key: "days", title: "How many days can you make time?", description: "Pick a number that feels realistic for your week.", options: ["2", "3", "4", "5"].map((value) => ({ value, label: `${value} days`, detail: "per week" })) },
  { key: "minutes", title: "How long do you have per session?", description: "A little movement is better than none.", options: ["20", "30", "45"].map((value) => ({ value, label: `${value} minutes`, detail: "per session" })) },
  { key: "cardio", title: "What kind of movement do you enjoy?", description: "We'll use this for your cardio sessions.", options: [
    { value: "walk", label: "Walking", detail: "Outside or on a treadmill" },
    { value: "cycle", label: "Cycling", detail: "A bike or stationary bike" },
    { value: "dance", label: "Dancing", detail: "Move to music you enjoy" },
    { value: "choice", label: "Mix it up", detail: "Choose a different activity each time" },
  ] },
  { key: "challenge", title: "What usually gets in the way?", description: "We'll include a practical tip for your biggest challenge.", options: [
    { value: "time", label: "Finding time", detail: "My schedule is busy" },
    { value: "consistency", label: "Staying consistent", detail: "It's hard to keep the habit going" },
    { value: "confidence", label: "Knowing what to do", detail: "I want a clear place to start" },
    { value: "variety", label: "Keeping it interesting", detail: "I get bored with the same routine" },
  ] },
  { key: "safety", title: "Is there anything to check before you start?", description: "No details needed. Your answer stays on this page.", options: [
    { value: "none", label: "No concerns", detail: "I'm comfortable starting a general routine" },
    { value: "concerns", label: "I have a concern", detail: "For example, an injury, symptoms, or health condition" },
    { value: "private", label: "Prefer not to say", detail: "I'll review the safety guidance myself" },
  ] },
];

const exercises: Record<Equipment, string[][]> = {
  bodyweight: [["Chair squats", "Wall or incline push-ups", "Prone arm raises", "Glute bridges"], ["Sit-to-stands", "Wall or incline push-ups", "Prone arm raises", "Bird dogs"]],
  bands: [["Chair squats", "Resistance band rows", "Wall or incline push-ups", "Glute bridges"], ["Sit-to-stands", "Resistance band rows", "Wall or incline push-ups", "Bird dogs"]],
  weights: [["Goblet squats", "Dumbbell rows", "Incline push-ups", "Glute bridges"], ["Dumbbell deadlifts", "Dumbbell rows", "Incline push-ups", "Bird dogs"]],
  gym: [["Leg press or goblet squats", "Seated cable rows", "Chest press", "Glute bridges"], ["Dumbbell deadlifts", "Lat pulldowns", "Chest press", "Bird dogs"]],
};

const cardioNotes = { walk: "Walk outdoors or on a treadmill", cycle: "Ride a bike or stationary bike", dance: "Dance to music you enjoy", choice: "Choose a walk, bike ride, dance session, or another activity you enjoy" };
const challengeNotes = {
  time: "Put sessions on your calendar. On busy days, even a shorter session can help you keep the habit.",
  consistency: "Choose days you can repeat each week and check off each session as you complete it.",
  confidence: "Start with light resistance and learn each movement at your own pace. A qualified trainer can help with form.",
  variety: "Switch up your cardio activity or setting while keeping the strength movements consistent enough to track progress.",
};

const goalNotes: Record<Goal, string> = {
  strength: "Focus on controlled movement and gradually add resistance when your form feels solid.",
  muscle: "Use a manageable resistance and gradually build repetitions or resistance over time.",
  energy: "Choose movement you enjoy and aim for consistency before increasing the challenge.",
  weight: "Pair regular movement with sustainable eating habits. Progress and timelines vary from person to person.",
};

export function FitnessPlanner() {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [step, setStep] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const question = questions[step];
  const selected = answers[question.key];
  const goalLabel = questions[0].options.find((option) => option.value === answers.goal)?.label;
  const days = Number(answers.days);
  const minutes = Number(answers.minutes);
  const startingSlow = answers.activity === "low" || answers.experience === "beginner";
  const sets = startingSlow || minutes === 20 ? "1–2" : "2–3";
  const strengthSessions = (answers.goal === "strength" || answers.goal === "muscle") && days >= 4 && !startingSlow ? 3 : 2;
  const cardioMinutes = answers.activity === "low" ? Math.min(minutes, 10) : minutes;
  const reps = answers.goal === "strength" ? "8–10" : "8–12";
  const moves = answers.equipment ? exercises[answers.equipment] : exercises.bodyweight;

  function choose(value: string) {
    setAnswers((previous) => ({ ...previous, [question.key]: value }));
  }

  return (
    <section aria-labelledby="fitness-planner-title" className="mt-10 max-w-4xl rounded-card border border-silver/10 bg-silver/[0.035] p-6 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-strong"><Sparkles size={15} /> Your next step</p>
          <h2 id="fitness-planner-title" className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.03em] text-silver">Build your fitness plan</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver/70">Build an adult fitness starting plan around your goals, current routine, equipment, and schedule.</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome"><Dumbbell size={20} /></span>
      </div>

      {!showPlan ? (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-silver/65"><span>Question {step + 1} of {questions.length}</span><span>{Math.round(((step + 1) / questions.length) * 100)}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-silver/10"><div className="h-full rounded-full bg-accent-strong transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
          <fieldset className="mt-7">
            <legend className="text-xl font-semibold tracking-[-0.02em] text-silver">{question.title}</legend>
            <p className="mt-2 text-sm text-silver/65">{question.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => (
                <label key={option.value} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition ${selected === option.value ? "border-accent-strong/60 bg-accent-strong/10" : "border-silver/10 bg-ink/50 hover:border-silver/30"}`}>
                  <span><span className="block text-sm font-semibold text-silver">{option.label}</span><span className="mt-1 block text-xs leading-relaxed text-silver/65">{option.detail}</span></span>
                  <input type="radio" name={question.key} value={option.value} checked={selected === option.value} onChange={() => choose(option.value)} className="h-4 w-4 accent-accent-strong" />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-7 flex items-center justify-between gap-3">
            {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 text-sm font-medium text-silver/70 hover:text-silver"><ArrowLeft size={16} /> Back</button> : <span />}
            <button type="button" disabled={!selected} onClick={() => step === questions.length - 1 ? setShowPlan(true) : setStep(step + 1)} className="inline-flex items-center gap-2 rounded-pill bg-accent-strong px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">{step === questions.length - 1 ? "See my plan" : "Continue"} <ArrowRight size={16} /></button>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-silver/55">Your answers stay in this browser session and aren&apos;t sent to our servers.</p>
        </div>
      ) : (
        <div className="mt-8" aria-live="polite">
          <div className="rounded-2xl border border-accent-strong/20 bg-accent-strong/[0.07] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">Your starting plan</p>
            <h3 className="mt-2 text-xl font-semibold text-silver">{goalLabel} · {days} days a week</h3>
            <p className="mt-2 text-sm leading-relaxed text-silver/75">{goalNotes[answers.goal as Goal]} Your week includes {strengthSessions} full-body strength sessions{days > strengthSessions ? ` and ${days - strengthSessions} cardio ${days - strengthSessions === 1 ? "session" : "sessions"}` : ""}. Leave at least one rest day between strength sessions and arrange the other sessions around your week.</p>
            {startingSlow ? <p className="mt-2 text-sm leading-relaxed text-silver/75">Start gently. If the full schedule feels like too much, begin with fewer sessions and build toward your selected {days} days.</p> : null}
          </div>
          {answers.safety !== "none" ? <div className="mt-5 rounded-2xl border border-accent-strong/25 bg-accent-strong/[0.07] p-5 text-sm leading-relaxed text-silver/80"><strong className="text-silver">Before you start:</strong> {answers.safety === "concerns" ? "Talk with a qualified health professional about your injury, symptoms, condition, or concerns and what movement is appropriate for you. The routine below is general and does not account for individual limitations." : "If you have an injury, symptoms, a chronic condition, or concerns about starting exercise, ask a qualified health professional what activity is appropriate for you. This routine does not account for individual limitations."}</div> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: days }, (_, index) => {
              const strength = index === 0 || index === 2 || (days === 2 && index === 1) || (strengthSessions === 3 && index === days - 1);
              const variant = index === 0 || (strengthSessions === 3 && index === days - 1) ? 0 : 1;
              return (
                <div key={index} className="rounded-2xl border border-silver/10 bg-ink/50 p-5">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-strong">{strength ? <Dumbbell size={15} /> : <HeartPulse size={15} />} Session {index + 1} · {strength ? `up to ${minutes}` : `about ${cardioMinutes}`} min</p>
                  <h4 className="mt-3 font-semibold text-silver">{strength ? "Full-body strength" : "Comfortable cardio"}</h4>
                  {strength ? <><p className="mt-2 text-sm leading-relaxed text-silver/70">Warm up with 3–5 minutes of easy movement. Try {sets} sets of {reps} controlled repetitions of each:</p><ul className="mt-2 space-y-1">{moves[variant].slice(0, minutes === 20 ? 3 : 4).map((move) => <li key={move} className="flex gap-2 text-sm text-silver/75"><Check size={14} className="mt-1 shrink-0 text-accent-strong" />{move}</li>)}</ul><p className="mt-3 text-xs leading-relaxed text-silver/60">Rest 60–90 seconds between sets or longer as needed. Choose a comfortable resistance and finish with a few minutes of easy movement. Take more time if you need it.</p></> : <p className="mt-2 text-sm leading-relaxed text-silver/70">{answers.cardio ? cardioNotes[answers.cardio] : "Choose an activity you enjoy"}. Start and finish at an easy pace. In between, work toward a pace where you can still talk. {answers.activity === "low" ? "Start with up to 10 minutes and add time gradually as it feels comfortable." : "Keep the effort comfortable and adjust the time to fit your energy."}</p>}
                </div>
              );
            })}
          </div>
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-silver/70">
            {answers.challenge ? <p><strong className="text-silver">Make it stick:</strong> {challengeNotes[answers.challenge]}</p> : null}
            <p><strong className="text-silver">How to progress:</strong> Once sessions feel manageable, add a few repetitions, a little resistance, or a few minutes of cardio gradually. Track what you did and take recovery days when needed.</p>
            <p><strong className="text-silver">Keep building:</strong> Start at a comfortable level and increase gradually. For adults, the long-term guideline is 150 minutes of moderate activity and two muscle-strengthening days per week. Your starting plan can be below that; add activity as you&apos;re ready. <a className="text-accent-strong underline underline-offset-2" href="https://www.cdc.gov/physical-activity-basics/guidelines/adults.html" target="_blank" rel="noopener noreferrer">See CDC guidelines</a>.</p>
            <p>This is general fitness guidance, not medical advice. If you have an injury, symptoms, a chronic condition, or concerns about starting exercise, check with a qualified health professional first. Stop if you feel pain, dizziness, or unwell.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4"><button type="button" onClick={() => { setShowPlan(false); setStep(0); }} className="inline-flex items-center gap-2 text-sm font-semibold text-accent-strong hover:underline"><ClipboardList size={16} /> Edit answers</button><button type="button" onClick={() => { setAnswers(initial); setStep(0); setShowPlan(false); }} className="inline-flex items-center gap-2 text-sm font-medium text-silver/65 hover:text-silver"><RotateCcw size={15} /> Start over</button></div>
          <p className="mt-4 text-xs text-silver/55">Your plan stays in this browser session. It will reset when you leave or refresh the page.</p>
        </div>
      )}
    </section>
  );
}
