export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Poll {
  id: string
  title: string
  description?: string
  creator_id: string
  is_public: boolean
  allow_multiple_votes: boolean
  expires_at?: string
  created_at: string
  updated_at: string
  creator?: User
  options?: PollOption[]
  vote_count?: number
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  option_order: number
  created_at: string
  vote_count?: number
  percentage?: number
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  voter_id?: string
  voter_ip?: string
  created_at: string
}

export interface PollResult {
  option_id: string
  option_text: string
  vote_count: number
  percentage: number
}

export interface CreatePollData {
  title: string
  description?: string
  options: string[]
  is_public?: boolean
  allow_multiple_votes?: boolean
  expires_at?: string
}

export interface VoteData {
  poll_id: string
  option_id: string
  voter_id?: string
}