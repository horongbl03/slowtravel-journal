export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Journal = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  location: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalImage = {
  id: string;
  journal_id: string;
  image_url: string;
  created_at: string;
}; 