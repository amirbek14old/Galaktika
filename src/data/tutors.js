// Online lessons: demo schedule. Teachers are fictional and labelled as such in the UI.
// slot: [daysFromToday, time, topic, isLiveNow?]
export const TUTORS = [
  { n: 'Нилуфар Каримова', s: 'math', g: [1, 3], exp: 12, group: 8, slots: [[0, '16:00', 'Таблица умножения играючи', 1], [2, '17:30', 'Задачи в два действия']] },
  { n: 'Елена Ким', s: 'eng', g: [1, 3], exp: 9, group: 6, slots: [[0, '18:00', 'Colors and animals'], [1, '15:00', 'Numbers song']] },
  { n: 'Гулнора Саидова', s: 'uzb', g: [1, 3], exp: 14, group: 8, slots: [[1, '17:00', "Alifbo: o‘qishni o‘rganamiz"], [3, '16:00', "So‘zlashuv: oilam"]] },
  { n: 'Дилноза Юсупова', s: 'rus', g: [1, 3], exp: 20, group: 10, slots: [[1, '14:00', 'Жи-ши, ча-ща без ошибок'], [4, '15:00', 'Читаем по слогам']] },
  { n: 'Азиз Рахимов', s: 'math', g: [2, 3], exp: 15, solo: true, slots: [[1, '16:30', 'Сложение и вычитание до 100'], [3, '16:30', 'Периметр на примерах']] },
  { n: 'Малика Турсунова', s: 'nature', g: [1, 3], exp: 11, group: 10, slots: [[2, '17:00', 'Времена года'], [4, '17:00', 'Животные нашего края']] },
  { n: 'Зарина Хамидова', s: 'math', g: [1, 2], exp: 16, group: 6, slots: [[1, '15:30', 'Числа до 20'], [5, '11:00', 'Счёт десятками']] }
];
/** "Today" / "Tomorrow" / "Mon, 20.10" in the current language. t = translator from useT(). */
export function slotDate(d, t) {
  const x = new Date(); x.setDate(x.getDate() + d);
  if (d === 0) return t('today');
  if (d === 1) return t('tomorrow');
  return `${t.list('dow')[x.getDay()]}, ${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`;
}
