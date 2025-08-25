import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbmVwb3NmeGZ1eXdlb2dtbXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MTQ5MjUsImV4cCI6MjA1Mzk5MDkyNX0.tKQmkHmGFsaXKFGCJn6tnwPkKUfmJ2DImzNApTPf9-w'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default boot(({ app }) => {
  app.config.globalProperties.$supabase = supabase
})

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $supabase: typeof supabase
  }
}
