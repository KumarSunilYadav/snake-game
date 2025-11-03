export const saveScore = (score, difficulty) => {
  const scores = JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
  scores.push({ score, difficulty, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('spaceShooterScores', JSON.stringify(scores.slice(0, 50)));
};

export const getScores = () => {
  return JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
};
