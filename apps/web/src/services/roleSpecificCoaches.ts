import { 
  RoleSpecificCoach, 
  QuestionTemplate, 
  EvaluationCriteria, 
  LearningPathStep, 
  IndustryInsight,
  LearningResource,
  Milestone
} from './aiInterviewService'

export class RoleSpecificCoachFactory {
  static createProductManagerCoach(): RoleSpecificCoach {
    return {
      role: 'product-manager',
      expertise: [
        'Product Strategy',
        'Market Research',
        'User Experience Design',
        'Data Analysis',
        'Stakeholder Management',
        'Roadmap Planning',
        'A/B Testing',
        'Go-to-Market Strategy',
        'Competitive Analysis',
        'Metrics & KPIs',
        'Customer Development',
        'Agile Methodologies',
        'Product Analytics',
        'Pricing Strategy',
        'Product Marketing'
      ],
      questionTemplates: [
        {
          category: 'Product Strategy',
          questions: [
            'How would you prioritize features for a product with limited engineering resources?',
            'Describe a time when you had to pivot a product strategy based on market feedback.',
            'How do you balance user needs with business objectives?',
            'Tell me about a product you launched that didn\'t meet expectations.',
            'How would you approach entering a new market with an existing product?'
          ],
          followUps: [
            'What frameworks did you use for prioritization?',
            'How did you measure the success of the pivot?',
            'What stakeholder challenges did you face?',
            'How did you communicate the strategy to different teams?'
          ],
          evaluationPoints: [
            'Strategic thinking',
            'Data-driven decisions',
            'Stakeholder management',
            'User empathy',
            'Business acumen',
            'Framework usage',
            'Communication clarity'
          ],
          idealResponseStructure: 'Context → Framework/Process → Decision rationale → Execution → Outcomes → Learnings'
        },
        {
          category: 'Data Analysis & Metrics',
          questions: [
            'How do you determine which metrics to track for a new product feature?',
            'Describe a time when data contradicted your intuition about a product decision.',
            'How would you design an A/B test for a major product change?',
            'Tell me about a time you had to present complex data to executives.',
            'How do you balance quantitative data with qualitative user feedback?'
          ],
          followUps: [
            'What was the statistical significance?',
            'How did you ensure data quality?',
            'What tools did you use for analysis?',
            'How did you handle conflicting data sources?'
          ],
          evaluationPoints: [
            'Analytical thinking',
            'Statistical understanding',
            'Data interpretation',
            'Metric selection',
            'Experimentation design',
            'Communication of insights'
          ],
          idealResponseStructure: 'Problem → Hypothesis → Methodology → Analysis → Insights → Action'
        }
      ],
      evaluationCriteria: {
        technical: {
          weight: 0.2,
          keyIndicators: ['Data analysis', 'Technical understanding', 'Tool proficiency'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic understanding of product tools and metrics',
              examples: ['Can use analytics tools', 'Understands basic metrics', 'Reads technical specifications']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Solid technical skills for product management',
              examples: ['Designs A/B tests', 'Analyzes user data', 'Works with engineering teams']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong technical product management skills',
              examples: ['Advanced analytics', 'Technical product strategy', 'API and system understanding']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Expert-level technical product leadership',
              examples: ['Technical vision setting', 'Complex system design input', 'Data science collaboration']
            }
          ]
        },
        behavioral: {
          weight: 0.3,
          keyIndicators: ['Leadership', 'Influence', 'Collaboration', 'Customer empathy'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic stakeholder management and collaboration',
              examples: ['Works with cross-functional teams', 'Communicates clearly', 'Shows customer focus']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Good leadership and influence without authority',
              examples: ['Influences without authority', 'Manages stakeholder expectations', 'Resolves conflicts']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong product leadership and organizational influence',
              examples: ['Drives organizational change', 'Builds product culture', 'Mentors other PMs']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional product leadership and strategic influence',
              examples: ['Shapes company strategy', 'Builds product organizations', 'Industry thought leadership']
            }
          ]
        },
        communication: {
          weight: 0.25,
          keyIndicators: ['Stakeholder communication', 'Data storytelling', 'Vision articulation'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Clear communication with immediate stakeholders',
              examples: ['Writes clear requirements', 'Presents to team', 'Documents decisions']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Effective communication across all levels',
              examples: ['Presents to executives', 'Tells data stories', 'Facilitates meetings']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Exceptional communication and storytelling',
              examples: ['Influences through communication', 'Builds compelling narratives', 'Public speaking']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Masterful communication and thought leadership',
              examples: ['Industry speaking', 'Influential writing', 'Shapes market conversations']
            }
          ]
        },
        leadership: {
          weight: 0.15,
          keyIndicators: ['Vision setting', 'Team building', 'Strategic thinking'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Shows leadership potential in product decisions',
              examples: ['Takes ownership', 'Makes decisions', 'Shows initiative']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Demonstrates product leadership within team',
              examples: ['Sets product vision', 'Leads product initiatives', 'Builds consensus']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong product leadership across organization',
              examples: ['Influences product strategy', 'Builds product teams', 'Drives culture change']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional product leadership and vision',
              examples: ['Sets company direction', 'Builds product organizations', 'Industry leadership']
            }
          ]
        },
        problemSolving: {
          weight: 0.1,
          keyIndicators: ['Strategic thinking', 'Creative solutions', 'Systems thinking'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Solves straightforward product problems',
              examples: ['Addresses user complaints', 'Fixes process issues', 'Implements solutions']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Solves complex product challenges',
              examples: ['Balances competing priorities', 'Finds creative solutions', 'Thinks systematically']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Excels at complex, strategic problem solving',
              examples: ['Solves market problems', 'Creates innovative solutions', 'Anticipates challenges']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional strategic problem solving',
              examples: ['Solves industry problems', 'Creates new markets', 'Transforms organizations']
            }
          ]
        }
      },
      learningPath: [
        {
          id: 'pm-fundamentals',
          title: 'Product Management Fundamentals',
          description: 'Master core PM skills including strategy, prioritization, and stakeholder management',
          type: 'knowledge',
          prerequisites: [],
          estimatedTime: 50,
          resources: [
            {
              type: 'book',
              title: 'Inspired by Marty Cagan',
              description: 'Essential guide to product management best practices',
              difficulty: 'beginner',
              estimatedTime: 15
            },
            {
              type: 'course',
              title: 'Product Strategy and Roadmapping',
              description: 'Learn to create compelling product strategies and roadmaps',
              difficulty: 'intermediate',
              estimatedTime: 20
            },
            {
              type: 'practice',
              title: 'Stakeholder Management Simulation',
              description: 'Practice managing complex stakeholder relationships',
              difficulty: 'intermediate',
              estimatedTime: 15
            }
          ],
          milestones: [
            {
              id: 'pm-fund-1',
              title: 'Product Strategy Presentation',
              description: 'Create and present a comprehensive product strategy',
              criteria: ['Market analysis', 'Competitive positioning', 'Clear roadmap', 'Stakeholder buy-in'],
              assessmentType: 'project'
            }
          ]
        }
      ],
      industryInsights: [
        {
          topic: 'AI-Powered Product Development',
          trend: 'Integration of AI capabilities into product development processes',
          impact: 'high',
          timeframe: '2024-2026',
          recommendations: [
            'Learn about AI/ML product applications',
            'Understand AI ethics and responsible AI development',
            'Practice with AI-powered analytics tools',
            'Study AI product case studies'
          ],
          sources: ['Product Management AI Report', 'AI Product Development Survey']
        }
      ]
    }
  }

  static createSoftwareEngineerCoach(): RoleSpecificCoach {
    return {
      role: 'software-engineer',
      expertise: [
        'Data Structures & Algorithms',
        'System Design',
        'Code Quality & Best Practices',
        'Testing & Debugging',
        'Performance Optimization',
        'API Design',
        'Database Design',
        'Security Principles',
        'DevOps & CI/CD',
        'Agile Development',
        'Microservices Architecture',
        'Cloud Computing',
        'Machine Learning Integration',
        'Mobile Development',
        'Web Development'
      ],
      questionTemplates: [
        {
          category: 'Technical Problem Solving',
          questions: [
            'Describe a complex technical challenge you faced and how you solved it.',
            'How do you approach debugging a system that\'s failing in production?',
            'Walk me through your process for designing a scalable system.',
            'Tell me about a time you had to optimize the performance of an application.',
            'How would you handle a situation where your code review was heavily criticized?'
          ],
          followUps: [
            'What alternative approaches did you consider?',
            'How did you measure the success of your solution?',
            'What would you do differently next time?',
            'How did you communicate the technical details to non-technical stakeholders?'
          ],
          evaluationPoints: [
            'Problem decomposition',
            'Technical depth',
            'Solution creativity',
            'Implementation details',
            'Trade-off analysis',
            'Communication clarity',
            'Learning from failure'
          ],
          idealResponseStructure: 'STAR method with technical details, trade-offs, and measurable outcomes'
        },
        {
          category: 'System Design',
          questions: [
            'Design a URL shortening service like bit.ly',
            'How would you design a chat application for millions of users?',
            'Design a recommendation system for an e-commerce platform.',
            'How would you design a distributed cache system?',
            'Design a real-time analytics dashboard for a social media platform.'
          ],
          followUps: [
            'How would you handle scale?',
            'What about data consistency?',
            'How would you monitor this system?',
            'What are the potential failure points?',
            'How would you ensure security?'
          ],
          evaluationPoints: [
            'Scalability considerations',
            'Database design',
            'API design',
            'Caching strategies',
            'Monitoring and alerting',
            'Security considerations',
            'Cost optimization'
          ],
          idealResponseStructure: 'Requirements gathering → High-level design → Deep dive → Scale considerations → Trade-offs'
        },
        {
          category: 'Behavioral & Leadership',
          questions: [
            'Tell me about a time you had to mentor a junior developer.',
            'Describe a situation where you disagreed with a technical decision made by your team.',
            'How do you stay updated with new technologies and trends?',
            'Tell me about a time you had to work with a difficult team member.',
            'Describe a project where you had to learn a new technology quickly.'
          ],
          followUps: [
            'What was the outcome?',
            'How did you handle the conflict?',
            'What did you learn from this experience?',
            'How do you apply this learning to future situations?'
          ],
          evaluationPoints: [
            'Leadership potential',
            'Continuous learning',
            'Conflict resolution',
            'Mentoring ability',
            'Adaptability',
            'Team collaboration'
          ],
          idealResponseStructure: 'STAR method focusing on interpersonal skills and growth mindset'
        }
      ],
      evaluationCriteria: {
        technical: {
          weight: 0.4,
          keyIndicators: ['Code quality', 'System design', 'Problem solving', 'Best practices', 'Architecture knowledge'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic understanding of programming concepts and simple problem solving',
              examples: ['Can write simple functions', 'Understands basic data structures', 'Knows fundamental algorithms']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Solid programming skills with some system design knowledge',
              examples: ['Can design simple systems', 'Understands databases and APIs', 'Implements design patterns']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong technical skills with system design expertise',
              examples: ['Can design scalable systems', 'Understands distributed systems', 'Optimizes for performance']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Expert-level technical skills and architecture knowledge',
              examples: ['Designs complex distributed systems', 'Deep performance optimization', 'Technical thought leadership']
            }
          ]
        },
        behavioral: {
          weight: 0.25,
          keyIndicators: ['Teamwork', 'Communication', 'Learning agility', 'Conflict resolution', 'Mentoring'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic interpersonal skills and team collaboration',
              examples: ['Works well in team', 'Communicates clearly', 'Accepts feedback']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Good collaboration and communication skills',
              examples: ['Mentors junior developers', 'Handles feedback well', 'Contributes to team decisions']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong leadership and mentoring abilities',
              examples: ['Leads technical discussions', 'Resolves team conflicts', 'Drives team improvements']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional leadership and influence',
              examples: ['Drives technical culture', 'Influences org-wide decisions', 'Builds high-performing teams']
            }
          ]
        },
        communication: {
          weight: 0.2,
          keyIndicators: ['Clarity', 'Technical explanation', 'Stakeholder communication', 'Documentation'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Can communicate basic technical concepts clearly',
              examples: ['Explains code to peers', 'Writes clear documentation', 'Asks good questions']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Effectively communicates with technical and non-technical stakeholders',
              examples: ['Presents technical solutions', 'Writes technical proposals', 'Facilitates discussions']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Excellent technical communication across all levels',
              examples: ['Influences technical decisions', 'Mentors through communication', 'Translates business needs']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional technical communication and thought leadership',
              examples: ['Speaks at conferences', 'Writes influential content', 'Shapes industry conversations']
            }
          ]
        },
        leadership: {
          weight: 0.1,
          keyIndicators: ['Technical leadership', 'Mentoring', 'Decision making', 'Vision setting'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Shows potential for leadership',
              examples: ['Takes initiative on tasks', 'Helps teammates', 'Shows ownership']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Demonstrates technical leadership in team settings',
              examples: ['Leads small projects', 'Mentors junior developers', 'Makes technical decisions']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong technical leadership across multiple teams',
              examples: ['Leads major initiatives', 'Influences technical strategy', 'Develops other leaders']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional technical leadership and vision',
              examples: ['Sets technical direction', 'Builds engineering culture', 'Drives organizational change']
            }
          ]
        },
        problemSolving: {
          weight: 0.05,
          keyIndicators: ['Analytical thinking', 'Creativity', 'Systematic approach', 'Innovation'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Can solve basic problems with guidance',
              examples: ['Debugs simple issues', 'Follows established patterns', 'Learns from examples']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Independently solves complex problems',
              examples: ['Debugs complex issues', 'Designs solutions', 'Adapts existing solutions']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Excels at solving complex, ambiguous problems',
              examples: ['Solves novel problems', 'Creates innovative solutions', 'Thinks outside the box']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional problem-solving with strategic impact',
              examples: ['Solves organization-wide problems', 'Creates breakthrough solutions', 'Anticipates future problems']
            }
          ]
        }
      },
      learningPath: [
        {
          id: 'se-fundamentals',
          title: 'Programming Fundamentals Mastery',
          description: 'Master core programming concepts, data structures, and algorithms',
          type: 'knowledge',
          prerequisites: [],
          estimatedTime: 60,
          resources: [
            {
              type: 'course',
              title: 'Advanced Data Structures and Algorithms',
              description: 'Deep dive into complex data structures and algorithmic thinking',
              difficulty: 'intermediate',
              estimatedTime: 30
            },
            {
              type: 'practice',
              title: 'LeetCode Problem Solving',
              description: 'Solve 150+ coding problems across different difficulty levels',
              difficulty: 'intermediate',
              estimatedTime: 40
            },
            {
              type: 'book',
              title: 'Clean Code by Robert Martin',
              description: 'Learn principles of writing maintainable, readable code',
              difficulty: 'beginner',
              estimatedTime: 20
            }
          ],
          milestones: [
            {
              id: 'se-fund-1',
              title: 'Algorithm Proficiency Test',
              description: 'Solve complex algorithmic problems within time constraints',
              criteria: ['Optimal time complexity', 'Clean code structure', 'Edge case handling'],
              assessmentType: 'practice'
            },
            {
              id: 'se-fund-2',
              title: 'Code Quality Review',
              description: 'Demonstrate ability to write production-quality code',
              criteria: ['Follows best practices', 'Proper error handling', 'Comprehensive testing'],
              assessmentType: 'project'
            }
          ]
        },
        {
          id: 'se-system-design',
          title: 'System Design Excellence',
          description: 'Learn to design scalable, distributed systems for real-world applications',
          type: 'skill',
          prerequisites: ['se-fundamentals'],
          estimatedTime: 80,
          resources: [
            {
              type: 'book',
              title: 'Designing Data-Intensive Applications',
              description: 'Comprehensive guide to building scalable systems',
              difficulty: 'advanced',
              estimatedTime: 50
            },
            {
              type: 'course',
              title: 'System Design Interview Course',
              description: 'Practice designing systems like Netflix, Uber, Twitter',
              difficulty: 'advanced',
              estimatedTime: 30
            },
            {
              type: 'practice',
              title: 'Build a Distributed System',
              description: 'Implement a real distributed system with multiple services',
              difficulty: 'advanced',
              estimatedTime: 60
            }
          ],
          milestones: [
            {
              id: 'se-sys-1',
              title: 'System Design Interview Simulation',
              description: 'Successfully design a complex distributed system in interview setting',
              criteria: ['Scalability planning', 'Database design', 'API architecture', 'Monitoring strategy'],
              assessmentType: 'interview'
            }
          ]
        }
      ],
      industryInsights: [
        {
          topic: 'AI/ML Integration in Software Development',
          trend: 'Rapid adoption of AI-powered development tools and features',
          impact: 'high',
          timeframe: '2024-2026',
          recommendations: [
            'Learn machine learning fundamentals and popular frameworks',
            'Understand AI model deployment and MLOps practices',
            'Practice integrating AI APIs into applications',
            'Study prompt engineering and LLM integration'
          ],
          sources: ['Stack Overflow Developer Survey 2024', 'GitHub State of the Octoverse', 'AI Engineering Report 2024']
        },
        {
          topic: 'Cloud-Native and Serverless Architecture',
          trend: 'Continued shift towards microservices and serverless computing',
          impact: 'high',
          timeframe: '2024-2025',
          recommendations: [
            'Master containerization with Docker and Kubernetes',
            'Learn major cloud platforms (AWS, GCP, Azure)',
            'Understand serverless architectures and functions',
            'Practice Infrastructure as Code (IaC)'
          ],
          sources: ['CNCF Annual Survey', 'State of Cloud Native Development', 'Serverless Computing Report']
        },
        {
          topic: 'Developer Experience and Platform Engineering',
          trend: 'Focus on improving developer productivity through better tooling',
          impact: 'medium',
          timeframe: '2024-2025',
          recommendations: [
            'Learn about developer platform engineering',
            'Understand CI/CD best practices and automation',
            'Study developer experience metrics and optimization',
            'Practice building internal developer tools'
          ],
          sources: ['Platform Engineering Survey', 'Developer Productivity Report', 'DevOps State Report']
        }
      ]
    }
  }
}
