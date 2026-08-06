/**
 * Returns a unique, colorful 3D-styled doodle avatar URL based on a user's name or email.
 * Every unique user automatically gets their own distinct character / doodle!
 */
export function getDoodleAvatarUrl(identifier?: string | null, style: "adventurer" | "fun-emoji" | "bottts" | "notionists" | "thumbs" = "fun-emoji"): string {
  const seed = encodeURIComponent((identifier || "creator").trim().toLowerCase());
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=e0f2fe,ffedd5,fef3c7,dcfce7,f3e8ff&radius=50`;
}

/**
 * Pre-curated high quality 3D clay character avatars for profiles
 */
export const CLAY_AVATARS = [
  "/mascot_avatar.png",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix&backgroundColor=e0f2fe&radius=50",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka&backgroundColor=ffedd5&radius=50",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Zack&backgroundColor=fef3c7&radius=50",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Molly&backgroundColor=dcfce7&radius=50",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Oliver&backgroundColor=f3e8ff&radius=50",
];

export function getUserAvatar(userNameOrEmail?: string | null): string {
  if (!userNameOrEmail) return "/mascot_avatar.png";
  
  // Return unique seeded SVG avatar doodle for the specific user
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(userNameOrEmail.trim().toLowerCase())}&backgroundColor=e0f2fe,ffedd5,fef3c7,dcfce7,f3e8ff&radius=50`;
}
