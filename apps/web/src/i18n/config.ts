import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'it', 'ru'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский'
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  pt: '🇵🇹',
  it: '🇮🇹',
  ru: '🇷🇺'
}

// Cultural interview styles and preferences
export const culturalInterviewStyles: Record<Locale, {
  style: string
  characteristics: string[]
  commonQuestions: string[]
  etiquette: string[]
}> = {
  en: {
    style: 'Direct and Achievement-Focused',
    characteristics: [
      'Direct communication style',
      'Focus on individual achievements',
      'Emphasis on problem-solving skills',
      'Behavioral questions using STAR method'
    ],
    commonQuestions: [
      'Tell me about yourself',
      'What are your strengths and weaknesses?',
      'Describe a challenging situation you overcame',
      'Where do you see yourself in 5 years?'
    ],
    etiquette: [
      'Firm handshake and eye contact',
      'Arrive 10-15 minutes early',
      'Dress professionally',
      'Ask thoughtful questions about the role'
    ]
  },
  es: {
    style: 'Relationship-Focused and Collaborative',
    characteristics: [
      'Emphasis on team collaboration',
      'Personal relationships matter',
      'Respect for hierarchy',
      'Family-work balance considerations'
    ],
    commonQuestions: [
      'Háblame de ti',
      '¿Cómo trabajas en equipo?',
      '¿Qué te motiva en el trabajo?',
      '¿Cómo manejas el estrés?'
    ],
    etiquette: [
      'Warm greeting and personal connection',
      'Show interest in company culture',
      'Demonstrate respect for authority',
      'Discuss work-life balance appropriately'
    ]
  },
  fr: {
    style: 'Intellectual and Structured',
    characteristics: [
      'Emphasis on education and qualifications',
      'Structured and formal approach',
      'Intellectual discussions valued',
      'Attention to detail and precision'
    ],
    commonQuestions: [
      'Parlez-moi de votre parcours',
      'Quelles sont vos compétences clés?',
      'Comment gérez-vous les défis?',
      'Pourquoi ce poste vous intéresse?'
    ],
    etiquette: [
      'Formal address until invited otherwise',
      'Well-prepared and articulate responses',
      'Show cultural awareness',
      'Demonstrate analytical thinking'
    ]
  },
  de: {
    style: 'Thorough and Process-Oriented',
    characteristics: [
      'Detailed and thorough discussions',
      'Process and methodology focus',
      'Punctuality highly valued',
      'Technical competence emphasis'
    ],
    commonQuestions: [
      'Erzählen Sie von sich',
      'Wie gehen Sie an Probleme heran?',
      'Was sind Ihre Stärken?',
      'Warum möchten Sie hier arbeiten?'
    ],
    etiquette: [
      'Punctuality is crucial',
      'Prepare detailed examples',
      'Show systematic thinking',
      'Demonstrate reliability'
    ]
  },
  zh: {
    style: 'Harmony and Long-term Focused',
    characteristics: [
      'Emphasis on harmony and respect',
      'Long-term commitment valued',
      'Team success over individual',
      'Continuous learning mindset'
    ],
    commonQuestions: [
      '请介绍一下自己',
      '你如何处理团队冲突？',
      '你的职业规划是什么？',
      '你如何持续学习？'
    ],
    etiquette: [
      'Show respect for seniority',
      'Demonstrate humility',
      'Emphasize team contributions',
      'Express commitment to growth'
    ]
  },
  ja: {
    style: 'Respectful and Group-Oriented',
    characteristics: [
      'Respect and politeness paramount',
      'Group harmony valued',
      'Attention to detail',
      'Long-term perspective'
    ],
    commonQuestions: [
      '自己紹介をお願いします',
      'チームワークについて教えてください',
      '困難をどう乗り越えますか？',
      '将来の目標は何ですか？'
    ],
    etiquette: [
      'Bow appropriately',
      'Show deep respect',
      'Demonstrate group mindset',
      'Express dedication'
    ]
  },
  ko: {
    style: 'Hierarchical and Relationship-Based',
    characteristics: [
      'Respect for hierarchy',
      'Relationship building important',
      'Education and credentials valued',
      'Dedication and hard work emphasized'
    ],
    commonQuestions: [
      '자기소개를 해주세요',
      '팀워크 경험을 말해주세요',
      '어려움을 어떻게 극복하나요？',
      '회사에 어떻게 기여할 수 있나요？'
    ],
    etiquette: [
      'Show proper respect',
      'Demonstrate work ethic',
      'Emphasize learning attitude',
      'Express loyalty'
    ]
  },
  pt: {
    style: 'Personal and Relationship-Focused',
    characteristics: [
      'Personal connections valued',
      'Warm and friendly approach',
      'Family considerations important',
      'Flexibility appreciated'
    ],
    commonQuestions: [
      'Fale sobre você',
      'Como trabalha em equipe?',
      'Quais são seus objetivos?',
      'Como lida com pressão?'
    ],
    etiquette: [
      'Warm and personal greeting',
      'Show genuine interest',
      'Demonstrate adaptability',
      'Express enthusiasm'
    ]
  },
  it: {
    style: 'Expressive and Relationship-Oriented',
    characteristics: [
      'Expressive communication style',
      'Personal relationships matter',
      'Passion and enthusiasm valued',
      'Style and presentation important'
    ],
    commonQuestions: [
      'Mi parli di lei',
      'Come lavora in squadra?',
      'Cosa la motiva?',
      'Quali sono i suoi punti di forza?'
    ],
    etiquette: [
      'Show enthusiasm and passion',
      'Demonstrate personal style',
      'Build personal connection',
      'Express creativity'
    ]
  },
  ru: {
    style: 'Direct and Competence-Focused',
    characteristics: [
      'Direct communication style',
      'Technical competence valued',
      'Educational background important',
      'Resilience and adaptability'
    ],
    commonQuestions: [
      'Расскажите о себе',
      'Каковы ваши сильные стороны?',
      'Как вы решаете проблемы?',
      'Почему вы хотите работать здесь?'
    ],
    etiquette: [
      'Be direct and honest',
      'Show technical expertise',
      'Demonstrate problem-solving',
      'Express determination'
    ]
  }
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
