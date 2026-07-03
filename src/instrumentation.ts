export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    console.log('Server initialized');
  }
}
