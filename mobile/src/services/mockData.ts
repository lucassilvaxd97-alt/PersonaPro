// src/services/mockData.ts

export const ALUNO_MOCK = {
  nome: "Dino Silva",
  foto: "https://github.com/shadcn.png",
  meta: "Hipertrofia",
};

export const TREINO_MOCK = [
  {
    id: "1",
    titulo: "Treino A - Peito e Tríceps",
    exercicios: [
      { nome: "Supino Reto", series: 4, reps: "10-12", carga: "30kg" },
      { nome: "Supino Inclinado", series: 3, reps: "12", carga: "25kg" },
      { nome: "Tríceps Corda", series: 4, reps: "15", carga: "20kg" },
    ],
  },
  {
    id: "2",
    titulo: "Treino B - Costas e Bíceps",
    exercicios: [
      { nome: "Puxada Frontal", series: 4, reps: "10", carga: "45kg" },
      { nome: "Remada Curvada", series: 3, reps: "12", carga: "30kg" },
      { nome: "Rosca Direta", series: 3, reps: "10", carga: "10kg" },
    ],
  },
];

export const DIETA_MOCK = [
  {
    horario: "08:00",
    refeicao: "Café da Manhã",
    alimentos: ["2 Ovos", "1 Pão Integral", "Café Preto"],
  },
  {
    horario: "12:00",
    refeicao: "Almoço",
    alimentos: ["150g Frango", "100g Arroz", "Salada à vontade"],
  },
  {
    horario: "16:00",
    refeicao: "Lanche",
    alimentos: ["1 Whey Protein", "1 Maçã"],
  },
];