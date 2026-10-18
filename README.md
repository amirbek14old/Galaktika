# Galaktika

A space-themed learning app built for the hackathon on modern education («Современное образование / Zamonaviy ta'lim»). Each subject is a galaxy, and each term's topic is a planet. Finishing all the missions on a planet flies the rocket to the next one.

The main idea is **finding the cause of a mistake, not just the mistake**: Diagnose → Explain → Teach → Practice → Reassess → Adapt.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # tests for the diagnostic engine
npm run build          # production build → dist/
npm run build:single   # the whole app in one index.html → dist-single/
```

Requirements: Node 18+. No backend or API keys are needed. Progress is saved in the browser (localStorage), and the profile page has a button to restore the demo progress.

## What's inside

| Section | What it does |
|---|---|
| **Galaxy** | The path: 4 planets (terms) with 2–3 missions each. Missions are Duolingo-style tasks: multiple choice, picture choice, compare, type a fraction or number, shade a shape, match pairs, put in order, build a sentence. |
| **Subjects** | Grades 1–11, plus 11 subjects that become available by grade (physics from grade 6, chemistry from grade 7, and so on). |
| **Diagnostics** | A Bayesian engine over named hypotheses. It picks the follow-up question with the greatest information gain, shows its probabilities and the evidence behind them, then recommends a mini-lesson. |
| **Mini-lesson** | Goal → explanation → visual → worked example → guided practice with a hint → independent practice → re-test on new questions. If the re-test fails, it offers an alternative explanation. |
| **"Trap" detection** | Inside the fraction missions, a typical mistake (for example 1/4 + 2/4 = 3/8) triggers a "Why?" explanation and adds a targeted task. |
| **Online lessons** | Teachers create appointments. Students join group classes for crystals or open lessons for $1.50, and can raise their hand to get the floor. |
| **For parents** | A report without grades: topics to review, traps, a 5-minute activity to do at home, and a copy button for Telegram. |
| **Achievements** | Awarded only for meaningful actions: first planet, first diagnostic, closing a gap, and so on. |

## New in v3

- **Meteor streak**: the day streak is an animated meteorite. When the streak grows, a burning meteor flies across the screen. Optional streak freezes are available in the shop.
- **Crystals**: the currency. You earn them for missions, planets, diagnostics and achievements, and they fly into your wallet after a mission. You spend them in the **Shop** on banners, avatars, frames, rocket skins, full hearts and streak freezes.
- **Profile** with a banner, framed avatar, rank and an edit screen.
- **Theory** for every planet (grades 1–11, all subjects): key ideas and a worked example.
- **Procedural planets**: noise textures (oceans, gas giants, rocky moons, lava, ice), rotation, shading, rings and a moon.
- **Russian / O'zbekcha / English** for the interface, subjects and topic titles. Question and theory text is still in Russian.
- Hand-drawn touches: the mascot's greeting, a "you are here!" note, and underlined headings.

## New in v4

- **One app for two roles**: in the profile you choose *student* or *parent* and set the grade. Parent mode opens the **Report**, which has the notifications feed, stats and tips for home.
- **Parent notifications**: wins (a mission with no mistakes, a whole planet, a closed gap) and problems (low accuracy, a repeated trap, a diagnostic result). They can also come as browser notifications on the device.
- **Photo avatar**: upload any picture; it's cropped to a circle and saved on the device.
- **Video classes for crystals**: classes with professors cost 30–40 ◆, and cancelling refunds them. The classroom has an animated teacher, a board, a chat, "raise hand" and your own camera. The teacher is a demo; a real video service plugs in here.
- New purple and dark-blue design with background planets.

## New in v5

- **The knowledge map is gone.** Diagnostics now leads back to the Galaxy.
- **Creating a profile (onboarding)**: language → role (student / parent / **teacher**) → name → grade (or subject for teachers). Profile → "New profile" starts it again.
- **Teacher role**: the "My classes" page shows earnings (80% to the teacher, 20% to the platform). Teachers create appointments with a topic, subject, grades, date/time, length, and either a small group paid in crystals or an open lesson for $1.50. They run the class in host mode, where they see the queue of raised hands and click "Give the floor".
- **Open lesson for $1.50**: no seat limit. The checkout shows the split: $1.20 to the teacher and $0.30 to Galaktika. In class, a raised hand leads to the teacher giving you the floor and your microphone turning on.
- **Premium for $10/month**: the Royal and Black hole banners, a Crown frame, a Premium badge, unlimited hearts, ×2 crystals for missions, and **5 free online lessons**.
- Payments are a **demo**: no money is charged and no card details are asked for. Payme, Click or Stripe plug in at `components/Pay.jsx → Checkout`.
- For appointments to be visible across devices you need a server (for example Supabase: `lessons`, `bookings` and `payments` tables) and a video service (LiveKit or Jitsi). For now everything is stored in localStorage on one device, and the other students in a class are simulated.

## New in v6

- **"Squared notebook" design**: a white and grey page with a light grid and a red margin line, white cards and dark text. The video classroom and the streak celebration stay dark on purpose.

## Structure

```
src/
  lib/        diagnostic.js (engine + mastery model), questions.js (task model and checking),
              store.js (state + localStorage), fx.js (sounds and animations), util.js
  data/       subjects.js (subject × grade → planets), math.js (task generators for grades 1–11),
              banks.js (question banks for other subjects), fractions.js (fractions + traps),
              concepts.js (concepts + mini-lessons), tutors.js, lessons.js (appointments, 80/20 split, Premium)
  components/ Lesson (mission player), QuestionBody, InlineQuestion, Starfield, ui
  pages/      Galaxy, Subjects, Diagnostic, Online (student + teacher), Shop, ParentHome, Profile
  components/ VideoRoom (student / host), Pay (Checkout, Premium), Onboarding
```

## 3-minute demo script

1. **Galaxy**: show the planets, open the current planet, and start a mission. Give one wrong answer on purpose to show the animation and the "trap" with its "Why?" button.
2. **Diagnostics**: type **2/5** for the problem 1/2 + 1/3. Show how the probabilities on the right change after each follow-up question.
3. **Conclusion**: open "What the conclusion is based on", then start the mini-lesson and pass the re-test.
4. **Teacher**: Profile → "I'm a teacher" → "Open lesson right now" → Start class → give the floor to a raised hand.
5. **Student**: switch back to student → Online → the teacher's lesson is in the schedule → $1.50 → raise your hand.
6. **Premium**: $10 → 5 free lessons, the crown, ∞ hearts.

## Limitations

- The interface is in Russian; the Uzbek version is the next step.
- The full diagnostic covers fractions (grade 5). For the other topics, tasks are generated or taken from the question banks.
- Online lessons are a demo with no video connection.
- The mastery estimate is an educational hint, not a final verdict.
