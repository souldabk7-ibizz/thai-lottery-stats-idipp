import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to repo name when deploying to GitHub Pages
// e.g. if repo is github.com/user/thai-lottery-stats → base = '/thai-lottery-stats/'
// For custom domain or Netlify/Vercel leave as '/'
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
