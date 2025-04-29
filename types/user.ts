export interface User {
  id: number;
  name: string;
  username: string;
  avatar_url: string;
  web_url: string;
  access_level: number;
  membership_state: string;
  groups: any;
  projects: number[];
}

export interface UserDetail extends User {
  bio: string;
  bot: boolean;
  created_at: string;
  discord: string;
  followers: number;
  following: number;
  is_followed: boolean;
  job_title: string;
  linkedin: string;
  local_time: string;
  location: string;
  locked: boolean;
  organization: string;
  pronouns: string;
  public_email: string;
  skype: string;
  state: string;
  twitter: string;
  website_url: string;
  work_information: string;
}
