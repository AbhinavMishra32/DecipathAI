export interface NodeReference {
    title: string;
    url: string;
    snippet: string;
    relevance: string;
}

export interface SuccessStory {
    person: string;
    achievement: string;
    summary: string;
    sourceUrl: string;
    afterNode: string;
}

interface NodeData {
    description: string;
    detailedDescription: string;
    icon: string;
    label: string;
    nextSteps: string[];
    tasks: string[];
    timeEstimate: string;
    references?: NodeReference[];
    successStories?: SuccessStory[];
}

export interface MindMapNode {
    id: string;
    type: string;
    data: NodeData;
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    animated: boolean;
    style: {
        stroke: string;
        strokeWidth: number;
    };
}
