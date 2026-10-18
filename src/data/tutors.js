// Online lessons: demo schedule. Teachers are fictional and labelled as such in the UI.
// slot: [daysFromToday, time, topic, isLiveNow?]
export const TUTORS = [
  { n: 'Нилуфар Каримова', s: 'math', g: [5, 9], exp: 12, group: 8, slots: [[0, '16:00', 'Дроби без страха', 1], [2, '17:30', 'Уравнения за 30 минут']] },
  { n: 'Елена Ким', s: 'eng', g: [1, 11], exp: 9, group: 6, slots: [[0, '18:00', 'Speaking club: my hobby'], [1, '15:00', 'Past Simple в играх']] },
  { n: 'Гулнора Саидова', s: 'uzb', g: [1, 11], exp: 14, group: 8, slots: [[1, '17:00', "So'zlashuv: знакомимся"], [3, '16:00', 'Падежи на примерах']] },
  { n: 'Дилноза Юсупова', s: 'rus', g: [1, 9], exp: 20, group: 10, slots: [[1, '14:00', 'Жи-ши и другие правила'], [4, '15:00', 'Сочинение по картинке']] },
  { n: 'Азиз Рахимов', s: 'phys', g: [6, 11], exp: 15, solo: true, slots: [[1, '16:30', 'Законы Ньютона на опытах'], [3, '16:30', 'Подготовка к олимпиаде']] },
  { n: 'Шерзод Ахмедов', s: 'inf', g: [5, 11], exp: 7, group: 8, slots: [[2, '18:00', 'Первая игра на Python'], [5, '11:00', 'Алгоритмы для олимпиад']] },
  { n: 'Малика Турсунова', s: 'bio', g: [5, 11], exp: 11, group: 10, slots: [[3, '17:00', 'Клетка под микроскопом']] },
  { n: 'Бахтиёр Насыров', s: 'hist', g: [5, 11], exp: 18, group: 12, slots: [[2, '16:00', 'Эпоха Амира Темура']] },
  { n: 'Камола Исмоилова', s: 'chem', g: [7, 11], exp: 10, group: 8, slots: [[4, '17:00', 'Кислоты и щёлочи: опыты дома']] },
  { n: 'Зарина Хамидова', s: 'math', g: [1, 4], exp: 16, group: 6, slots: [[1, '15:30', 'Таблица умножения за неделю']] }
];
/** "Today" / "Tomorrow" / "Mon, 20.10" in the current language. t = translator from useT(). */
export function slotDate(d, t) {
  const x = new Date(); x.setDate(x.getDate() + d);
  if (d === 0) return t('today');
  if (d === 1) return t('tomorrow');
  return `${t.list('dow')[x.getDay()]}, ${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`;
}
