// Shop catalogue. Prices are in crystals (◆). name: [ru, uz, en]
export const SHOP = {
  banner: [
    { id: 'deep', price: 0, name: ['Глубокий космос', 'Chuqur koinot', 'Deep space'] },
    { id: 'nebula', price: 60, name: ['Туманность', 'Tumanlik', 'Nebula'] },
    { id: 'aurora', price: 80, name: ['Северное сияние', 'Qutb yog‘dusi', 'Aurora'] },
    { id: 'mars', price: 90, name: ['Закат на Марсе', 'Marsda quyosh botishi', 'Sunset on Mars'] },
    { id: 'starfall', price: 100, name: ['Звездопад', 'Yulduz yomg‘iri', 'Starfall'] },
    { id: 'saturn', price: 120, name: ['Кольца Сатурна', 'Saturn halqalari', 'Saturn’s rings'] },
    { id: 'samarkand', price: 150, name: ['Ночной Самарканд', 'Tungi Samarqand', 'Samarkand by night'] },
    { id: 'crystals', price: 180, name: ['Кристальная пещера', 'Billur g‘ori', 'Crystal cave'] },
    { id: 'royal', price: 0, premium: true, name: ['Королевский', 'Qirollik', 'Royal'] },
    { id: 'blackhole', price: 0, premium: true, name: ['Чёрная дыра', 'Qora tuynuk', 'Black hole'] }
  ],
  avatar: [
    { id: 'astro', price: 0, name: ['Астронавт', 'Kosmonavt', 'Astronaut'] },
    { id: 'qalam', price: 0, name: ['Калам', 'Qalam', 'Qalam'] },
    { id: 'moon', price: 40, name: ['Луна', 'Oy', 'Moon'] },
    { id: 'alien', price: 70, name: ['Пришелец', 'O‘zga sayyoralik', 'Alien'] },
    { id: 'robot', price: 90, name: ['Робот', 'Robot', 'Robot'] },
    { id: 'meteor', price: 120, name: ['Метеорит', 'Meteorit', 'Meteor'] }
  ],
  frame: [
    { id: 'none', price: 0, name: ['Без рамки', 'Ramkasiz', 'No frame'] },
    { id: 'gold', price: 50, name: ['Золото', 'Oltin', 'Gold'] },
    { id: 'neon', price: 80, name: ['Неон', 'Neon', 'Neon'] },
    { id: 'plasma', price: 110, name: ['Плазма', 'Plazma', 'Plasma'] },
    { id: 'rainbow', price: 160, name: ['Радуга', 'Kamalak', 'Rainbow'] },
    { id: 'crown', price: 0, premium: true, name: ['Корона', 'Toj', 'Crown'] }
  ],
  rocket: [
    { id: 'classic', price: 0, name: ['Классика', 'Klassik', 'Classic'], c: ['#E2E8F0', '#F87171', '#22D3EE'] },
    { id: 'sky', price: 60, name: ['Небесная', 'Osmon', 'Sky'], c: ['#E0F2FE', '#0EA5E9', '#FDE68A'] },
    { id: 'candy', price: 80, name: ['Карамель', 'Karamel', 'Candy'], c: ['#FCE7F3', '#EC4899', '#A5F3FC'] },
    { id: 'gold', price: 120, name: ['Золотая', 'Oltin', 'Golden'], c: ['#FEF3C7', '#F59E0B', '#7C3AED'] },
    { id: 'stealth', price: 150, name: ['Стелс', 'Stels', 'Stealth'], c: ['#334155', '#865DFF', '#22D3EE'] }
  ],
  boost: [
    { id: 'hearts', price: 20, name: ['Полные сердца', 'To‘liq yuraklar', 'Full hearts'], desc: ['Сразу 5 сердец', 'Darhol 5 ta yurak', 'Refill to 5 hearts'] },
    { id: 'freeze', price: 40, name: ['Заморозка серии', 'Seriyani muzlatish', 'Streak freeze'], desc: ['Сохранит серию, если пропустишь один день', 'Bir kun o‘tkazib yuborsang, seriyani saqlaydi', 'Keeps your streak if you miss a day'], max: 2 }
  ]
};
export const item = (kind, id) => SHOP[kind].find((x) => x.id === id) || SHOP[kind][0];
export const nameOf = (it, lang) => it.name[{ ru: 0, uz: 1, en: 2 }[lang] ?? 0];
