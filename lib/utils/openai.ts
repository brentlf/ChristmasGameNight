/**
 * Validates a photo against a prompt using OpenAI Vision API.
 * Returns a confidence score (0-1) indicating if the photo matches the prompt.
 */
export async function validatePhotoWithAI(
  imageFile: File,
  prompt: string,
  lang: 'en' | 'cs'
): Promise<{ valid: boolean; confidence: number; reason?: string }> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  // Determine MIME type
  const mimeType = imageFile.type || 'image/jpeg';

  // Call our API route (which calls OpenAI)
  const response = await fetch('/api/validate-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      mimeType,
      prompt,
      lang,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Validation failed' }));
    throw new Error(error.message || 'Failed to validate photo');
  }

  return await response.json();
}
