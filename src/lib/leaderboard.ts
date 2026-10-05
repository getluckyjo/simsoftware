/**
 * This week's closest-to-the-pin board for the demo: invented players in
 * the cities the brief talks about, the same every load. The golfer's shot
 * is ranked against it.
 */

export interface BoardRow { name: string; city: string; cm: number; you?: boolean }

const PEOPLE: [string, string][] = [
  ['M. Kim', 'Seoul'], ['T. Nkosi', 'Sandton'], ['J. Carter', 'Nashville'], ['A. Patel', 'London'],
  ['S. van Wyk', 'Cape Town'], ['D. Lee', 'Chantilly'], ['R. Govender', 'Umhlanga'], ['L. Rossi', 'Milan'],
  ['K. Mokoena', 'Pretoria'], ['C. Nguyen', 'Singapore'], ['P. Botha', 'Stellenbosch'], ['E. Walsh', 'Sydney'],
  ['H. Park', 'Busan'], ['N. Dlamini', 'Durban'], ['G. Smith', 'Chiswick'], ['B. Jacobs', 'Bloemfontein'],
  ['F. Ali', 'Dubai'], ['W. Daniels', 'Hermanus'], ['Y. Tanaka', 'Tokyo'], ['O. Sithole', 'Soweto'],
  ['I. Moreno', 'Miami'], ['Z. Khumalo', 'Midrand'], ['V. Pillay', 'Ballito'], ['A. Venter', 'George'],
  ['S. Choi', 'Incheon'], ['M. Fourie', 'Paarl'], ['T. Brown', 'Charlotte'], ['R. Naidoo', 'Rosebank'],
  ['J. Okafor', 'Lagos'], ['C. Meyer', 'Windhoek'], ['L. Molefe', 'Gaborone'], ['D. Adams', 'Bedfordview'],
  ['K. Reddy', 'Chatsworth'], ['P. Laurent', 'Mauritius'], ['H. Kruger', 'Nelspruit'], ['E. Zulu', 'Pietermaritzburg'],
  ['B. Harris', 'Glasgow'],
]

export const WEEK_BOARD: BoardRow[] = PEOPLE.map(([name, city], i) => ({
  name,
  city,
  // 53 cm at the top, spreading out to about 11 m.
  cm: Math.round(53 + i * i * 0.62 + i * 11 + ((i * 37) % 13)),
})).sort((a, b) => a.cm - b.cm)

export interface Ranked { rows: BoardRow[]; rank: number; total: number }

/** Insert the golfer and return the rows to show: the top three, then the golfer with a neighbour either side. */
export function rankShot(name: string, cm: number): Ranked {
  const all = [...WEEK_BOARD, { name, city: 'Bay 2', cm, you: true }].sort((a, b) => a.cm - b.cm || (a.you ? -1 : 1))
  const rank = all.findIndex(r => r.you) + 1
  return { rows: all, rank, total: all.length }
}
