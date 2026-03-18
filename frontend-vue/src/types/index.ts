export interface TypeItem {
  id: string
  name: string
  template_count?: number
}

export interface OutlineSection {
  title: string
  bullets?: string[]
  children?: OutlineSection[]
  description?: string
  word_count?: string
  granularity?: string
}

export interface OutlineMeta {
  is_system?: boolean
  is_favorite?: boolean
  created_at?: number
  title?: string
}

export interface Outline {
  type_id: string
  type_name: string
  template_id?: string
  sections: OutlineSection[]
  meta?: OutlineMeta
}

export interface TemplateItem {
  template_id: string
  meta?: OutlineMeta
  sections_summary?: string[]
}

export interface Article {
  id: string
  title: string
  type_id: string
  type_name: string
  template_id: string
  content: string
  materials: string
  created_at: number
  parent_id?: string
  trigger_query?: string
}

export interface Settings {
  system_name: string
  logo_url?: string
  copyright_text: string
  openai_api_key?: string
  openai_base_url?: string
  openai_model: string
}

export interface GenerateRequest {
  type_id: string
  outline: Outline
  materials: string
  title?: string
  knowledge_base?: Record<string, string>
}

export interface ModifyRequest {
  article_id: string
  user_query: string
  knowledge_base?: Record<string, string>
}

export interface SimilarName {
  name: string
  similarity: number
}

export interface PersonMatchResult {
  db_name: string
  material_name: string
  db_info: string
  match_type: 'exact' | 'fuzzy'
  similarity: number
  similar_names?: SimilarName[]
}

export interface ConflictCheckResult {
  has_conflict: boolean
  material_info?: string
  reason?: string
  error?: string
  confidence?: number
}

export interface MatchedPerson {
  dbName: string
  materialName: string
  dbInfo: string
  matchType: 'exact' | 'fuzzy'
  similarity: number
  similarNames?: SimilarName[]
  conflict?: {
    hasConflict: boolean
    materialInfo?: string
    reason?: string
    error?: string
    confidence?: number
  }
  userOverride?: {
    name?: string
    info?: string
  }
  selected: boolean
}

export interface ArticleVersion {
  id: string
  content: string
}

export interface UserProfile {
  userId: string
  role: 'admin' | 'user'
  name: string
  nickname: string
  email: string
  phone?: string
  avatarDataUrl?: string
  registeredAt: number
  lastLoginAt: number
  lastLoginLocation: string
}
