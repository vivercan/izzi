import { projectId, publicAnonKey } from './info';

let cachedKey: string | null = null;

export async function getGoogleMapsApiKey(): Promise<string> {
  if (cachedKey) {
    return cachedKey;
  }

  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/api-keys/google-maps`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Maps API key');
    }

    const data = await response.json();
    cachedKey = data.apiKey || '';
    return cachedKey;
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
    return '';
  }
}
