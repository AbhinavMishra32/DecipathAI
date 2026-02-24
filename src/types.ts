export interface NodeReference {
  title: string
  url: string
  snippet: string
  relevance: string
}

export interface SuccessStory {
  person: string
  achievement: string
  summary: string
  sourceUrl: string
  afterNode: string
}

export interface CareerInfo {
  name: string
  description: string
}

export interface QuestionOption {
  text: string
  correct: boolean
  imagePrompt: string
}

export interface QuestionData {
  question: string
  options: QuestionOption[]
}

export interface MindMapNode {
  id: string
  type: string
  data: {
    label: string
    icon?: string
    description: string
    detailedDescription: string
    timeEstimate: string
    nextSteps?: string[]
    tasks?: string[]
    references?: NodeReference[]
    successStories?: SuccessStory[]
  }
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
  type: 'smoothstep'
  animated?: boolean
  style?: {
    stroke?: string
  }
}



export interface Scholarship {
  name: string
  amount: number
}

export interface Alternative {
  name: string
  provider: string
  cost: number
  duration: string
}

export interface Course {
  name: string
  description: string
  provider: string
  cost: number
  duration: string
  careerOutcome: string
  financialFit: string
  scholarships: Scholarship[]
  alternatives: Alternative[]
}

export interface Recommendations {
  courses: Course[]
  analysis: string
}
