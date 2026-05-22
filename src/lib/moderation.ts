export async function moderateContent(text: string): Promise<{ isAllowed: boolean; reason?: string }> {
  // Client-side moderation is disabled for security and Vercel compatibility.
  return { isAllowed: true };
}
