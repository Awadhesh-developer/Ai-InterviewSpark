export type Testimonial = {
  id: string
  quote: string
  name: string
  role: string
  company: string
  avatar: string
  rating?: number
  date?: string
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    quote: "InterviewSpark helped me land two offers in three weeks. The AI feedback was shockingly on point.",
    name: 'Aisha Khan',
    role: 'Software Engineer',
    company: 'TechNova',
    avatar: '/avatars/01.svg',
    rating: 5,
    date: '2024-08-12'
  },
  {
    id: 't2',
    quote: "The STAR guidance made my behavioral answers crisp and confident.",
    name: 'Diego Martinez',
    role: 'Product Manager',
    company: 'BrightLoop',
    avatar: '/avatars/02.svg',
    rating: 5
  },
  {
    id: 't3',
    quote: "Real-time body language feedback was a game changer for video interviews.",
    name: 'Maya Patel',
    role: 'Data Scientist',
    company: 'InsightAI',
    avatar: '/avatars/03.svg',
    rating: 4
  },
  {
    id: 't4',
    quote: "I improved my answers by focusing on measurable outcomes — exactly what interviewers wanted.",
    name: 'Ethan Liu',
    role: 'Frontend Developer',
    company: 'PixelCraft',
    avatar: '/avatars/04.svg',
    rating: 5
  },
  {
    id: 't5',
    quote: "The tailored questions for my target companies felt eerily accurate.",
    name: 'Sara Johansson',
    role: 'UX Designer',
    company: 'Flowline',
    avatar: '/avatars/05.svg',
    rating: 5
  },
  {
    id: 't6',
    quote: "I went from nervous to prepared. The analytics dashboard kept me motivated.",
    name: 'Michael Brown',
    role: 'Cloud Engineer',
    company: 'SkyNetics',
    avatar: '/avatars/06.svg',
    rating: 4
  },
  {
    id: 't7',
    quote: "Got specific, constructive feedback after each mock. Worth every minute.",
    name: 'Hiro Tanaka',
    role: 'ML Engineer',
    company: 'DeepWave',
    avatar: '/avatars/01.svg',
    rating: 5
  },
  {
    id: 't8',
    quote: "The mobile experience let me practice anywhere. I actually enjoyed it!",
    name: 'Nora Williams',
    role: 'Business Analyst',
    company: 'DataBridge',
    avatar: '/avatars/02.svg',
    rating: 5
  }
]


